import { StaticSite } from "./infrastructure/static-site";

const name = "pulumi-static-v8";
const customDomainName = "ivanasimic.online";

const site = new StaticSite(name, { customDomainName });

export const bucketName = site.siteBucket.bucket.id;
export const websiteUrl = site.siteBucket.siteConfig.websiteEndpoint;
