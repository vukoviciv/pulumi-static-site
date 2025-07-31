import * as aws from "@pulumi/aws";
import { S3Bucket } from "./infrastructure/bucket";
import { createRecord } from "./infrastructure/route53";
import { AcmCertificate } from "./infrastructure/acm-certificate";
import { createCloudfrontDistribution } from "./infrastructure/cloudfront";

const name = "pulumi-static-v5";

const s3bucket = new S3Bucket(name);
const domainName = "ivanasimic.online";
const hostedZone = aws.route53.getZoneOutput({ name: domainName });

const certificate = new AcmCertificate(domainName, hostedZone.id);
const cloudfrontDistribution = createCloudfrontDistribution(
  name,
  s3bucket,
  certificate.validation,
  domainName
);

const record = createRecord(
  name,
  hostedZone,
  domainName,
  cloudfrontDistribution
);

export const bucketName = s3bucket.bucket.id;
export const websiteUrl = s3bucket.siteConfig.websiteEndpoint;
