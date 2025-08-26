import { ComponentResource, Output } from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { Cloudfront } from "./cloudfront";
import { StaticSiteBucket } from "./bucket";
import { DnsRecord } from "./route53";
import { AcmCertificate } from "./acm-certificate";

type ComponentArgs = {
  customDomainName?: string;
  siteDir: string;
};

export class StaticSite extends ComponentResource {
  siteBucket: StaticSiteBucket;
  cloudfrontDistribution: aws.cloudfront.Distribution;

  constructor(name: string, componentArgs: ComponentArgs) {
    super("pulumiS3:StaticSite", name, {}, {});

    this.siteBucket = new StaticSiteBucket(name);

    const { customDomainName } = componentArgs;
    let hostedZone: Output<aws.route53.GetZoneResult> | undefined;
    let certificate: AcmCertificate | undefined;

    if (customDomainName) {
      hostedZone = aws.route53.getZoneOutput({
        name: customDomainName,
      });

      certificate = new AcmCertificate(name, {
        domainName: customDomainName,
        hostedZoneId: hostedZone.id,
      });
    }

    const cloudfront = new Cloudfront(name, {
      siteBucket: this.siteBucket,
      domainName: customDomainName,
      certificateValidation: certificate?.validation,
    });
    this.cloudfrontDistribution = cloudfront.distribution;

    if (customDomainName && hostedZone)
      new DnsRecord(name, {
        hostedZone,
        domainName: customDomainName,
        target: {
          dnsName: cloudfront.distribution.domainName,
          zoneId: cloudfront.distribution.hostedZoneId,
          evaluateTargetHealth: false,
        },
      });

    this.registerOutputs();
  }
}
