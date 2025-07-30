import * as aws from "@pulumi/aws";
import { S3Bucket } from "./infrastructure/bucket";
import { createRecord } from "./infrastructure/route53";
import { AcmCertificate } from "./infrastructure/acm-certificate";

const name = "pulumi-static-v4";

const s3bucket = new S3Bucket(name);

const domainName = "ivanasimic.online";
const hostedZone = aws.route53.getZoneOutput({ name: domainName });

const certificate = new AcmCertificate(domainName, hostedZone.id);

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
      acmCertificateArn: certificate.validation.certificateArn,
      sslSupportMethod: "sni-only",
      minimumProtocolVersion: "TLSv1.2_2021",
    },
    restrictions: {
      geoRestriction: { restrictionType: "none" },
    },
  },
  { deleteBeforeReplace: true, dependsOn: [certificate.validation] }
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
