import { ComponentResource } from "@pulumi/pulumi";
import { route53 } from "@pulumi/aws";
import { Cloudfront } from "./cloudfront";
import { StaticSiteBucket } from "./bucket";
import { DnsRecord } from "./route53";
import { AcmCertificate } from "./acm-certificate";

type ComponentArgs = {
  customDomainName: string;
};

export class StaticSite extends ComponentResource {
  siteBucket: StaticSiteBucket;

  constructor(name: string, componentArgs: ComponentArgs) {
    super("pulumiS3:StaticSite", name, {}, {});

    this.siteBucket = new StaticSiteBucket(name);
    const hostedZone = route53.getZoneOutput({
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

    new DnsRecord(name, {
      hostedZone,
      domainName: componentArgs.customDomainName,
      cloudfrontDistribution: cloudfront.distribution,
    });

    this.registerOutputs();
  }
}
