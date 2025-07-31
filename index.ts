import * as aws from "@pulumi/aws";
import { S3Bucket } from "./infrastructure/bucket";
import { DnsRecord } from "./infrastructure/route53";
import { AcmCertificate } from "./infrastructure/acm-certificate";
import { Cloudfront } from "./infrastructure/cloudfront";

const name = "pulumi-static-v7";

const s3bucket = new S3Bucket(name);
const domainName = "ivanasimic.online";
const hostedZone = aws.route53.getZoneOutput({ name: domainName });

const certificate = new AcmCertificate(name, {
  domainName,
  hostedZoneId: hostedZone.id,
});
const cloudfrontDistribution = new Cloudfront(name, {
  s3bucket,
  domainName,
  certificateValidation: certificate.validation,
});

const record = new DnsRecord(name, {
  hostedZone,
  domainName,
  cloudfrontDistribution: cloudfrontDistribution.distribution,
});

export const bucketName = s3bucket.bucket.id;
export const websiteUrl = s3bucket.siteConfig.websiteEndpoint;
