import * as pulumi from "@pulumi/pulumi";
import * as awsx from "@pulumi/awsx";

export class EcrImage extends pulumi.ComponentResource {
  image: awsx.ecr.Image;

  constructor(name: string) {
    super("pulumi:ECR:image", name, {}, {});
    const repository = new awsx.ecr.Repository(
      `${name}-ecr-repository`,
      {
        forceDelete: true,
      },
      { parent: this }
    );

    this.image = new awsx.ecr.Image(
      `${name}-image`,
      {
        repositoryUrl: repository.url,
        context: "../server",
      },
      { parent: this }
    );

    this.registerOutputs();
  }
}
