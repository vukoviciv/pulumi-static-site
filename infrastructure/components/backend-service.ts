import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";
import * as aws from "@pulumi/aws";

export class BackendService extends pulumi.ComponentResource {
  lb: aws.lb.LoadBalancer;

  constructor(name: string) {
    super("pulumi:ECS", name, {}, {});
    // TODO: extract repo, image and cluster
    const repository = new awsx.ecr.Repository(
      `${name}-ecr-repository`,
      {
        forceDelete: true,
      },
      { parent: this }
    );

    const image = new awsx.ecr.Image(
      `${name}-image`,
      {
        repositoryUrl: repository.url,
        context: "../server",
      },
      { parent: this }
    );

    const cluster = new aws.ecs.Cluster(`${name}-cluster`);

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
        namePrefix: "lb-",
        loadBalancerType: "application",
        securityGroups: [lbSecurityGroup.id],
        subnets: vpc.publicSubnetIds,
        internal: false,
        ipAddressType: "ipv4",
      },
      { parent: this }
    );

    const lbTargetGroup = new aws.lb.TargetGroup(
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

    const listener = new aws.lb.Listener("app-listener", {
      loadBalancerArn: this.lb.arn,
      port: 80,
      protocol: "HTTP",
      defaultActions: [
        {
          type: "forward",
          targetGroupArn: lbTargetGroup.arn,
        },
      ],
    });

    const service = new awsx.ecs.FargateService(
      `${name}-fargate-service`,
      {
        cluster: cluster.arn,
        desiredCount: 2,
        taskDefinitionArgs: {
          container: {
            name: `${name}-container`,
            image: image.imageUri,
            cpu: 128,
            memory: 512,
            essential: true,
            portMappings: [
              {
                containerPort: 3000,
                hostPort: 3000,
                targetGroup: lbTargetGroup,
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
      { parent: this, dependsOn: [this.lb] }
    );

    this.registerOutputs();
  }
}
