import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";
import * as aws from "@pulumi/aws";
import { AcmCertificate } from "./acm-certificate";
import { DnsRecord } from "./route53";

type ComponentArgs = {
  imageUri: pulumi.Output<string>;
  customDomainName?: string;
};

export class BackendService extends pulumi.ComponentResource {
  lb: aws.lb.LoadBalancer;
  apiUrl: pulumi.Output<string>;
  lbTargetGroup: any; // TODO: type
  apiDomain?: string;

  constructor(name: string, componentArgs: ComponentArgs) {
    super("pulumi:ECS", name, {}, {});

    const { customDomainName, imageUri } = componentArgs; // TODO: add others

    const cluster = new aws.ecs.Cluster(
      `${name}-cluster`,
      {},
      { parent: this }
    );

    const vpc = new awsx.ec2.Vpc(
      `${name}-vpc`,
      {
        cidrBlock: "10.10.0.0/16",
        numberOfAvailabilityZones: 2,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        subnetSpecs: [
          { type: awsx.ec2.SubnetType.Public, cidrMask: 24 },
          { type: awsx.ec2.SubnetType.Private, cidrMask: 24 },
        ],
        subnetStrategy: awsx.ec2.SubnetAllocationStrategy.Auto,
      },
      { parent: this }
    );

    const lbSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-lb-security-group`,
      {
        vpcId: vpc.vpcId,
        ingress: [
          {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"],
          },
          {
            protocol: "tcp",
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ["0.0.0.0/0"],
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: "-1",
            cidrBlocks: ["0.0.0.0/0"],
          },
        ],
      },
      { parent: this }
    );

    const serviceSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-security-group`,
      {
        vpcId: vpc.vpcId,
        ingress: [
          {
            fromPort: 3000,
            toPort: 3000,
            protocol: "tcp",
            securityGroups: [lbSecurityGroup.id],
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: "-1",
            cidrBlocks: ["0.0.0.0/0"],
          },
        ],
      },
      { parent: this }
    );

    this.lb = new aws.lb.LoadBalancer(
      `${name}-lb`,
      {
        namePrefix: "api-",
        loadBalancerType: "application",
        securityGroups: [lbSecurityGroup.id],
        subnets: vpc.publicSubnetIds,
        internal: false,
        ipAddressType: "ipv4",
      },
      { parent: this }
    );

    this.lbTargetGroup = new aws.lb.TargetGroup(
      `${name}-tg`,
      {
        port: 3000,
        protocol: "HTTP",
        targetType: "ip",
        vpcId: vpc.vpcId,
        healthCheck: {
          enabled: true,
          healthyThreshold: 3,
          unhealthyThreshold: 2,
          interval: 60,
          timeout: 10,
          path: "/healthcheck",
          matcher: "200",
          protocol: "HTTP",
          port: "traffic-port",
        },
      },
      { parent: this, dependsOn: [this.lb] }
    );

    let certificate: AcmCertificate | undefined;
    let listener: aws.lb.Listener;
    let httpListenerDefaultAction: pulumi.Input<
      pulumi.Input<aws.types.input.lb.ListenerDefaultAction>[]
    >;

    this.apiDomain = customDomainName ? `api.${customDomainName}` : undefined;

    if (this.apiDomain) {
      const hostedZone = aws.route53.getZoneOutput({
        name: customDomainName,
      });

      certificate = new AcmCertificate(
        name,
        {
          domainName: this.apiDomain,
          hostedZoneId: hostedZone.id,
        },
        { parent: this }
      );

      listener = new aws.lb.Listener(
        `${name}-https-listener`,
        {
          loadBalancerArn: this.lb.arn,
          port: 443,
          protocol: "HTTPS",
          sslPolicy: "ELBSecurityPolicy-2016-08",
          certificateArn: certificate.validation.certificateArn,
          defaultActions: [
            { type: "forward", targetGroupArn: this.lbTargetGroup.arn },
          ],
        },
        { parent: this }
      );

      new DnsRecord(
        `${name}-api-record`,
        {
          hostedZone,
          domainName: this.apiDomain,
          target: {
            dnsName: this.lb.dnsName,
            zoneId: this.lb.zoneId,
            evaluateTargetHealth: true,
          },
        },
        { parent: this, dependsOn: [this.lb] }
      );
    }

    httpListenerDefaultAction = this.getHttpListenerDefaultAction();

    listener = new aws.lb.Listener(`${name}-http-listener`, {
      loadBalancerArn: this.lb.arn,
      port: 80,
      protocol: "HTTP",
      defaultActions: httpListenerDefaultAction,
    });

    this.apiUrl = this.apiDomain
      ? pulumi.interpolate`https://${this.apiDomain}`
      : pulumi.interpolate`http://${this.lb.dnsName}`;

    const service = new awsx.ecs.FargateService(
      `${name}-fargate-service`,
      {
        cluster: cluster.arn,
        desiredCount: 2,
        taskDefinitionArgs: {
          container: {
            name: `${name}-container`,
            image: imageUri,
            cpu: 128,
            memory: 512,
            essential: true,
            portMappings: [
              {
                containerPort: 3000,
                hostPort: 3000,
                targetGroup: this.lbTargetGroup,
              },
            ],
          },
        },
        networkConfiguration: {
          subnets: vpc.privateSubnetIds,
          securityGroups: [serviceSecurityGroup.id],
          assignPublicIp: false,
        },
      },
      { parent: this, dependsOn: [listener] }
    );

    this.registerOutputs();
  }

  private getHttpListenerDefaultAction() {
    return this.apiDomain
      ? [
          {
            type: "redirect",
            redirect: {
              protocol: "HTTPS",
              port: "443",
              statusCode: "HTTP_301",
            },
          },
        ]
      : [
          {
            type: "forward",
            targetGroupArn: this.lbTargetGroup.arn,
          },
        ];
  }
}
