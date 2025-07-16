import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";
import * as mime from "mime";

const name = "pulumi-static-site";

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

// Stack export
export const bucketName = bucket.id;
export const websiteUrl = siteConfig.websiteEndpoint;
