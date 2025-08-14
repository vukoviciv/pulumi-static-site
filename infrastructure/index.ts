import { StaticSite } from "./components/static-site";
import { BackendService } from "./components/backend-service";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();
const siteDir = config.require("siteDir");
const name = config.require("name");
const customDomainName = config.get("customDomain");

const site = new StaticSite(name, { customDomainName, siteDir });
const backend = new BackendService(name);

export const bucketName = site.siteBucket.bucket.id;
export const websiteUrl = site.siteBucket.siteConfig.websiteEndpoint;
export const cdnDistributionId = site.cloudfrontDistribution.id;
export const cdnDomainName = site.cloudfrontDistribution.domainName;
export const url = pulumi.interpolate`http://${backend.lb.loadBalancer.dnsName}`;
