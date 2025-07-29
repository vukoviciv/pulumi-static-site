import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import * as mime from "mime";

const name = "pulumi-static-v2";

// Create an AWS resource (S3 Bucket)
const bucket = new aws.s3.Bucket(`${name}-bucket`, {
  website: {
    indexDocument: "index.html",
  },
});
const siteConfig = new aws.s3.BucketWebsiteConfigurationV2(`${name}-config`, {
  bucket: bucket.id,
  indexDocument: {
    suffix: "index.html",
  },
});
const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  `${name}-bucket-access-block`,
  {
    bucket: bucket.id,
    blockPublicAcls: false,
    blockPublicPolicy: false,
    ignorePublicAcls: false,
    restrictPublicBuckets: false,
  }
);

const siteDir = "www";
// For each file in the directory, create an S3 object stored in `siteBucket`
for (const item of fs.readdirSync(siteDir)) {
  const filePath = require("path").join(siteDir, item);
  const siteObject = new aws.s3.BucketObject(item, {
    bucket,
    source: new pulumi.asset.FileAsset(filePath),
    contentType: mime.getType(filePath) || undefined,
  });
}
const bucketPolicy = new aws.s3.BucketPolicy(
  `${name}-bucket-policy`,
  {
    bucket: bucket.id,
    policy: pulumi.jsonStringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [pulumi.interpolate`${bucket.arn}/*`],
        },
      ],
    }),
  },
  { dependsOn: bucketPublicAccessBlock }
);

///////// ACM - CERTIFICATE
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
        originId: bucket.arn,
        domainName: siteConfig.websiteEndpoint,
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
      targetOriginId: bucket.arn,
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

// Route 53 record (existing one)
const record = new aws.route53.Record(`${name}-record`, {
  zoneId: hostedZone.id,
  name: domainName,
  type: "A",
  aliases: [
    {
      name: cloudfrontDistribution.domainName,
      zoneId: cloudfrontDistribution.hostedZoneId,
      evaluateTargetHealth: false,
    },
  ],
});

// Stack export
export const bucketName = bucket.id;
export const websiteUrl = siteConfig.websiteEndpoint;
