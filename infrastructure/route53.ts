import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export const createRecord = (
  projectName: string,
  hostedZone: pulumi.Output<aws.route53.GetZoneResult>,
  domainName: string,
  cloudfrontDistribution: aws.cloudfront.Distribution
) => {
  return new aws.route53.Record(`${projectName}-record`, {
    zoneId: hostedZone.id,
    name: domainName,
    type: "A",
    aliases: [
      {
        name: cloudfrontDistribution.domainName,
        zoneId: cloudfrontDistribution.hostedZoneId,
        evaluateTargetHealth: false,
      },
    ],
  });
};
