import { ComponentResource } from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { Cloudfront } from "./cloudfront";
import { StaticSiteBucket } from "./bucket";
import { DnsRecord } from "./route53";
import { AcmCertificate } from "./acm-certificate";

type ComponentArgs = {
  customDomainName: string;
  siteDir: string;
};

export class StaticSite extends ComponentResource {
  siteBucket: StaticSiteBucket;
  cloudfrontDistribution: aws.cloudfront.Distribution;

  constructor(name: string, componentArgs: ComponentArgs) {
    super("pulumiS3:StaticSite", name, {}, {});

    this.siteBucket = new StaticSiteBucket(name);
    const hostedZone = aws.route53.getZoneOutput({
      name: componentArgs.customDomainName,
    });

    const certificate = new AcmCertificate(name, {
      domainName: componentArgs.customDomainName,
      hostedZoneId: hostedZone.id,
    });

    const cloudfront = new Cloudfront(name, {
      siteBucket: this.siteBucket,
      domainName: componentArgs.customDomainName,
      certificateValidation: certificate.validation,
    });
    this.cloudfrontDistribution = cloudfront.distribution;

    new DnsRecord(name, {
      hostedZone,
      domainName: componentArgs.customDomainName,
      cloudfrontDistribution: cloudfront.distribution,
    });

    this.registerOutputs();
  }
}
