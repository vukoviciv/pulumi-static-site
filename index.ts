import * as aws from "@pulumi/aws";
import { S3Bucket } from "./infrastructure/bucket";
import { DnsRecord } from "./infrastructure/route53";
import { AcmCertificate } from "./infrastructure/acm-certificate";
import { Cloudfront } from "./infrastructure/cloudfront";
import { StaticSite } from "./infrastructure/static-site";

const name = "pulumi-static-v7";
const customDomainName = "ivanasimic.online";

const site = new StaticSite(name, { customDomainName });

export const bucketName = sites.3bucket.bucket.id;
export const websiteUrl = site.s3bucket.siteConfig.websiteEndpoint;
