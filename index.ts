import * as aws from "@pulumi/aws";
import { S3Bucket } from "./infrastructure/bucket";
import { createRecord } from "./infrastructure/route53";
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

// Cloudfront
const cloudfrontDistribution = new aws.cloudfront.Distribution(
  `${name}-cloudfront`,
  {
    origins: [
      {
        originId: s3bucket.bucket.arn,
        domainName: s3bucket.siteConfig.websiteEndpoint,
        connectionAttempts: 3,
        connectionTimeout: 10,
        customOriginConfig: {
          httpPort: 80,
          httpsPort: 443,
          originProtocolPolicy: "http-only",
          originSslProtocols: ["TLSv1.2"],
        },
      },
    ],
    enabled: true,
    isIpv6Enabled: true,
    defaultRootObject: "index.html",
    aliases: [domainName],
    defaultCacheBehavior: {
      targetOriginId: s3bucket.bucket.arn,
      viewerProtocolPolicy: "allow-all",
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      cachedMethods: ["GET", "HEAD", "OPTIONS"],
      minTtl: 0,
      defaultTtl: 3600,
      maxTtl: 86400,
      forwardedValues: {
        queryString: false,
        cookies: { forward: "none" },
      },
    },
    tags: {
      Environment: "development",
    },
    viewerCertificate: {
      acmCertificateArn: certificateValidation.certificateArn,
      sslSupportMethod: "sni-only",
      minimumProtocolVersion: "TLSv1.2_2021",
    },
    restrictions: {
      geoRestriction: { restrictionType: "none" },
    },
  }
);

// TODO: optional custom domain name
const record = createRecord(
  name,
  hostedZone,
  domainName,
  cloudfrontDistribution
);

// Stack export
export const bucketName = s3bucket.bucket.id;
export const websiteUrl = s3bucket.siteConfig.websiteEndpoint;
