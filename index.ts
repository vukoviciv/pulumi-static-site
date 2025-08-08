import { StaticSite } from "./infrastructure/static-site";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();
const siteDir = config.require("siteDir");
const name = config.require("name");
const customDomainName = config.get("customDomain");

const site = new StaticSite(name, { customDomainName, siteDir });

export const bucketName = site.siteBucket.bucket.id;
export const websiteUrl = site.siteBucket.siteConfig.websiteEndpoint;
export const cdnDistributionId = site.cloudfrontDistribution.id;
export const cdnDomainName = site.cloudfrontDistribution.domainName;
