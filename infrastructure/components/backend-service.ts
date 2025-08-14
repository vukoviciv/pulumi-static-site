import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";
import * as aws from "@pulumi/aws";

export class BackendService extends pulumi.ComponentResource {
  lb: awsx.lb.ApplicationLoadBalancer;

  constructor(name: string) {
    super("pulumi:ECS", name, {}, {});

    const repository = new awsx.ecr.Repository(`${name}-ecr-repository`, {
      forceDelete: true,
    });

    const image = new awsx.ecr.Image(`${name}-image`, {
      repositoryUrl: repository.url,
      context: "../../server",
    });

    const cluster = new aws.ecs.Cluster(`${name}-cluster`);

    this.lb = new awsx.lb.ApplicationLoadBalancer(`${name}-lb`);

    const server = new awsx.ecs.FargateService(`${name}-fargate-service`, {
      cluster: cluster.arn,
      assignPublicIp: true,
      taskDefinitionArgs: {
        container: {
          name: `${name}-container`,
          image: image.imageUri,
          cpu: 128,
          memory: 512,
          essential: true,
          portMappings: [
            {
              containerPort: 3000,
              targetGroup: this.lb.defaultTargetGroup,
            },
          ],
        },
      },
    });

    this.registerOutputs();
  }
}
