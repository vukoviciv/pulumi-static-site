import { s3 } from "@pulumi/aws";
import * as mime from "mime";
import * as pulumi from "@pulumi/pulumi";
import * as fs from "fs";

const SITE_DIR = "www";

export class S3Bucket {
  name: string;
  publicAccessBlock: s3.BucketPublicAccessBlock;
  siteConfig: s3.BucketWebsiteConfigurationV2;
  bucket: s3.Bucket;
  bucketPolicy: s3.BucketPolicy;

  constructor(name: string, siteDir?: string) {
    this.name = name;
    this.bucket = this.createBucket();
    this.bucketPolicy = this.createBucketPolicy();
    this.publicAccessBlock = this.createPublicAccessBlock();
    this.siteConfig = this.createSiteConfig();
    this.deployFrontend(siteDir);
  }

  private createBucket() {
    return new s3.Bucket(`${this.name}-bucket`, {
      website: { indexDocument: "index.html" },
    });
  }

  private createPublicAccessBlock(): s3.BucketPublicAccessBlock {
    return new s3.BucketPublicAccessBlock(`${this.name}-bucket-access-block`, {
      bucket: this.bucket.id,
      blockPublicAcls: false,
      blockPublicPolicy: false,
      ignorePublicAcls: false,
      restrictPublicBuckets: false,
    });
  }

  private createSiteConfig(): s3.BucketWebsiteConfigurationV2 {
    return new s3.BucketWebsiteConfigurationV2(`${this.name}-config`, {
      bucket: this.bucket.id,
      indexDocument: { suffix: "index.html" },
    });
  }

  private createBucketPolicy(): s3.BucketPolicy {
    return new s3.BucketPolicy(
      `${this.name}-bucket-policy`,
      {
        bucket: this.bucket.id,
        policy: pulumi.jsonStringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: "*",
              Action: ["s3:GetObject"],
              Resource: [pulumi.interpolate`${this.bucket.arn}/*`],
            },
          ],
        }),
      },
      { dependsOn: this.publicAccessBlock }
    );
  }

  private deployFrontend(siteDir: string = SITE_DIR) {
    for (const item of fs.readdirSync(siteDir)) {
      const filePath = require("path").join(siteDir, item);
      const siteObject = new s3.BucketObject(item, {
        bucket: this.bucket,
        source: new pulumi.asset.FileAsset(filePath),
        contentType: mime.getType(filePath) || undefined,
      });
    }
  }
}
