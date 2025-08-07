import { StaticSite } from "./infrastructure/static-site";
import * as pulumi from "@pulumi/pulumi";

const name = "pulumi-static-v9";

const config = new pulumi.Config();
const siteDir = config.require("siteDir");
// TODO: convert to get when custom domain becomes optional
const customDomainName = config.require("customDomain");

const site = new StaticSite(name, { customDomainName, siteDir });

export const bucketName = site.siteBucket.bucket.id;
export const websiteUrl = site.siteBucket.siteConfig.websiteEndpoint;
export const cdnDistributionId = site.cloudfrontDistribution.id;
