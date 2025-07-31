import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

type ComponentArgs = {
  hostedZone: pulumi.Output<aws.route53.GetZoneResult>;
  domainName: string;
  cloudfrontDistribution: aws.cloudfront.Distribution;
};

export class DnsRecord extends pulumi.ComponentResource {
  constructor(name: string, componentArgs: ComponentArgs) {
    super("pulumiS3:route53:Record", name, {}, {});

    new aws.route53.Record(
      `${name}-record`,
      {
        zoneId: componentArgs.hostedZone.id,
        name: componentArgs.domainName,
        type: "A",
        aliases: [
          {
            name: componentArgs.cloudfrontDistribution.domainName,
            zoneId: componentArgs.cloudfrontDistribution.hostedZoneId,
            evaluateTargetHealth: false,
          },
        ],
      },
      { parent: this, deleteBeforeReplace: true }
    );
  }
}
