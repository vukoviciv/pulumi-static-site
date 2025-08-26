import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

type DnsTarget = {
  dnsName: pulumi.Output<string> | string;
  zoneId: pulumi.Output<string>;
  evaluateTargetHealth: boolean;
};

type ComponentArgs = {
  hostedZone: pulumi.Output<aws.route53.GetZoneResult>;
  domainName: string;
  target: DnsTarget;
};

export class DnsRecord extends pulumi.ComponentResource {
  constructor(
    name: string,
    componentArgs: ComponentArgs,
    opts: pulumi.ComponentResourceOptions = {}
  ) {
    super("pulumiS3:route53:Record", name, {}, opts);

    const { hostedZone, domainName, target } = componentArgs;

    new aws.route53.Record(
      `${name}-record`,
      {
        zoneId: hostedZone.id,
        name: domainName,
        type: "A",
        aliases: [
          {
            name: target.dnsName,
            zoneId: target.zoneId,
            evaluateTargetHealth: target.evaluateTargetHealth,
          },
        ],
      },
      { parent: this, deleteBeforeReplace: true }
    );

    this.registerOutputs();
  }
}
