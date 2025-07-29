import { acm, cloudfront, s3 } from "@pulumi/aws";
import { S3Bucket } from "./bucket";

export const createCloudfrontDistribution = (
  name: string,
  s3bucket: S3Bucket,
  certificateValidation: acm.CertificateValidation,
  domainName: string
) => {
  return new cloudfront.Distribution(`${name}-cloudfront`, {
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
  });
};
