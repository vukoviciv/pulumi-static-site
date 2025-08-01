import { ComponentResource } from "@pulumi/pulumi";
import { route53 } from "@pulumi/aws";
import { Cloudfront } from "./cloudfront";
import { S3Bucket } from "./bucket";
import { DnsRecord } from "./route53";
import { AcmCertificate } from "./acm-certificate";
import * as aws from "@pulumi/aws";

type ComponentArgs = {
  customDomainName: string;
};

export class StaticSite extends ComponentResource {
  s3bucket: aws.s3.Bucket;

  constructor(name: string, componentArgs: ComponentArgs) {
    super("pulumiS3:StaticSite", name, {}, {});

    const bucket = new S3Bucket(name);
    const hostedZone = route53.getZoneOutput({
      name: componentArgs.customDomainName,
    });

    const certificate = new AcmCertificate(name, {
      domainName: componentArgs.customDomainName,
      hostedZoneId: hostedZone.id,
    });

    const cloudfront = new Cloudfront(name, {
      s3bucket: bucket,
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
