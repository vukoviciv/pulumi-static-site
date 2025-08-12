import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

const vpcCidrBlockAnywhere = "0.0.0.0/0";

export class BackendServer extends pulumi.ComponentResource {
  constructor(name: string) {
    super("pulumiS3:server", name, {});

    const ami = aws.ec2.getAmiOutput({
      filters: [
        {
          name: "name",
          values: [
            "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*",
          ],
        },
      ],
      owners: ["099720109477"], // Canonical
      mostRecent: true,
    });

    const securityGroup = new aws.ec2.SecurityGroup(`${name}-security-group`, {
      ingress: [
        {
          protocol: "tcp",
          fromPort: 22,
          toPort: 22,
          cidrBlocks: [vpcCidrBlockAnywhere],
        },
        {
          protocol: "tcp",
          fromPort: 443,
          toPort: 443,
          cidrBlocks: [vpcCidrBlockAnywhere],
        },
        {
          protocol: "tcp",
          fromPort: 80,
          toPort: 80,
          cidrBlocks: [vpcCidrBlockAnywhere],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: [vpcCidrBlockAnywhere],
        },
      ],
    });

    const size = "t2.micro";
    const ec2 = new aws.ec2.Instance(`${name}-ec2`, {
      ami: ami.id,
      vpcSecurityGroupIds: [securityGroup.id],
      instanceType: size,
      userData,
      tags: {
        Env: pulumi.getStack(),
        Project: pulumi.getProject(),
      },
    });
  }
}
