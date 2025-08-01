import { acm, cloudfront, s3 } from "@pulumi/aws";
import { StaticSiteBucket } from "./bucket";
import * as pulumi from "@pulumi/pulumi";

type ComponentArgs = {
  siteBucket: StaticSiteBucket;
  certificateValidation: acm.CertificateValidation;
  domainName: string;
};

export class Cloudfront extends pulumi.ComponentResource {
  distribution: cloudfront.Distribution;

  constructor(name: string, componentArgs: ComponentArgs) {
    super("pulumiS3:cloudfront:Distribution", name, {}, {});

    this.distribution = new cloudfront.Distribution(
      `${name}-cloudfront`,
      {
        origins: [
          {
            originId: componentArgs.siteBucket.bucket.arn,
            domainName: componentArgs.siteBucket.siteConfig.websiteEndpoint,
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
        aliases: [componentArgs.domainName],
        defaultCacheBehavior: {
          targetOriginId: componentArgs.siteBucket.bucket.arn,
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
          acmCertificateArn: componentArgs.certificateValidation.certificateArn,
          sslSupportMethod: "sni-only",
          minimumProtocolVersion: "TLSv1.2_2021",
        },
        restrictions: {
          geoRestriction: { restrictionType: "none" },
        },
      },
      {
        parent: this,
        deleteBeforeReplace: true,
        dependsOn: [componentArgs.certificateValidation],
      }
    );

    this.registerOutputs();
  }
}
