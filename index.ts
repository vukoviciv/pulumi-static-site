import * as aws from "@pulumi/aws";
import { S3Bucket } from "./infrastructure/bucket";
import { createRecord } from "./infrastructure/route53";
import { createCloudfrontDistribution } from "./infrastructure/cloudfront";

const name = "pulumi-static-v3";

const s3bucket = new S3Bucket(name);

///////// ACM - CERTIFICATE
// TODO: make custom domain optional
const domainName = "ivanasimic.online";
const hostedZone = aws.route53.getZoneOutput({ name: domainName });

const certificate = new aws.acm.Certificate(`${name}-certificate`, {
  domainName,
  validationMethod: "DNS",
});

// DNS validation
const validationRecords: aws.route53.Record[] = [];
const validationRecord = certificate.domainValidationOptions.apply(
  (domainValidationOpts) =>
    new aws.route53.Record(`${name}-cert-validation-record`, {
      name: domainValidationOpts[0].resourceRecordName,
      type: domainValidationOpts[0].resourceRecordType,
      ttl: 300,
      records: [domainValidationOpts[0].resourceRecordValue],
      zoneId: hostedZone.id,
      allowOverwrite: true,
    })
);

export const certificateValidation = new aws.acm.CertificateValidation(
  `${name}-cert-validation`,
  {
    certificateArn: certificate.arn,
    validationRecordFqdns: validationRecords.map((record) => record.fqdn),
  }
);

const cloudfrontDistribution = createCloudfrontDistribution(
  name,
  s3bucket,
  certificateValidation,
  domainName
);

const record = createRecord(
  name,
  hostedZone,
  domainName,
  cloudfrontDistribution
);

// Stack export
export const bucketName = s3bucket.bucket.id;
export const websiteUrl = s3bucket.siteConfig.websiteEndpoint;
