import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";
import * as aws from "@pulumi/aws";

export class BackendService extends pulumi.ComponentResource {
  lb: awsx.lb.ApplicationLoadBalancer;

  constructor(name: string) {
    super("pulumi:ECS", name, {}, {});

    // TODO: extract repo, image and cluster
    const repository = new awsx.ecr.Repository(
      `${name}-ecr-repository`,
      {
        forceDelete: true,
      },
      { parent: this }
    );

    const image = new awsx.ecr.Image(
      `${name}-image`,
      {
        repositoryUrl: repository.url,
        context: "../server",
      },
      { parent: this }
    );

    const cluster = new aws.ecs.Cluster(`${name}-cluster`);
    this.lb = new awsx.lb.ApplicationLoadBalancer(
      `${name}-lb`,
      {},
      { parent: this }
    );

    const service = new awsx.ecs.FargateService(
      `${name}-fargate-service`,
      {
        cluster: cluster.arn,
        assignPublicIp: true,
        desiredCount: 2,
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
                hostPort: 3000,
                targetGroup: this.lb.defaultTargetGroup,
              },
            ],
          },
        },
      },
      { parent: this, dependsOn: [this.lb] }
    );

    this.registerOutputs();
  }
}
