import { s3 } from "@pulumi/aws";
import * as mime from "mime";
import * as pulumi from "@pulumi/pulumi";
import * as fs from "fs";

type ComponentArgs = {
  siteDir: string;
};
export class StaticSiteBucket extends pulumi.ComponentResource {
  name: string;
  publicAccessBlock: s3.BucketPublicAccessBlock;
  siteConfig: s3.BucketWebsiteConfigurationV2;
  bucket: s3.Bucket;

  constructor(name: string, componentArgs: ComponentArgs) {
    super("pulumiS3:s3:Bucket", name, {}, {});

    this.name = name;
    this.bucket = this.createBucket();
    this.publicAccessBlock = this.createPublicAccessBlock();
    this.siteConfig = this.createSiteConfig();

    this.createBucketPolicy();
    this.deployFrontend(componentArgs.siteDir);

    this.registerOutputs();
  }

  private createBucket() {
    return new s3.Bucket(
      `${this.name}-bucket`,
      {
        website: { indexDocument: "index.html" },
      },
      { parent: this }
    );
  }

  private createPublicAccessBlock(): s3.BucketPublicAccessBlock {
    return new s3.BucketPublicAccessBlock(
      `${this.name}-bucket-access-block`,
      {
        bucket: this.bucket.id,
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      { parent: this }
    );
  }

  private createSiteConfig(): s3.BucketWebsiteConfigurationV2 {
    return new s3.BucketWebsiteConfigurationV2(
      `${this.name}-config`,
      {
        bucket: this.bucket.id,
        indexDocument: { suffix: "index.html" },
      },
      { parent: this }
    );
  }

  private createBucketPolicy() {
    new s3.BucketPolicy(
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
      { parent: this, dependsOn: this.publicAccessBlock }
    );
  }

  private deployFrontend(siteDir: string) {
    for (const item of fs.readdirSync(siteDir)) {
      const filePath = require("path").join(siteDir, item);
      new s3.BucketObject(item, {
        bucket: this.bucket,
        source: new pulumi.asset.FileAsset(filePath),
        contentType: mime.getType(filePath) || undefined,
      });
    }
  }
}
