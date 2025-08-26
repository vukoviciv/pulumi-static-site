import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";
import { ComponentResource, Output } from "@pulumi/pulumi";

type ComponentArgs = {
  domainName: string;
  hostedZoneId: Output<string>;
};
export class AcmCertificate extends ComponentResource {
  certificate: aws.acm.Certificate;
  validation: aws.acm.CertificateValidation;

  constructor(
    name: string,
    componentArgs: ComponentArgs,
    opts: pulumi.ComponentResourceOptions = {}
  ) {
    super("pulumiS3:acm:Certificate", name, {}, opts);

    this.certificate = new aws.acm.Certificate(
      `${componentArgs.domainName}-certificate`,
      {
        domainName: componentArgs.domainName,
        validationMethod: "DNS",
      },
      { parent: this }
    );

    const dvo = this.certificate.domainValidationOptions[0];
    const certificateValidationDomain = new aws.route53.Record(
      `${componentArgs.domainName}-cert-validation-domain`,
      {
        name: dvo.resourceRecordName,
        type: dvo.resourceRecordType,
        zoneId: componentArgs.hostedZoneId,
        records: [dvo.resourceRecordValue],
        ttl: 300,
      },
      {
        parent: this,
        deleteBeforeReplace: true,
      }
    );

    this.validation = new aws.acm.CertificateValidation(
      `${componentArgs.domainName}-cert-validation`,
      {
        certificateArn: this.certificate.arn,
        validationRecordFqdns: [certificateValidationDomain.fqdn],
      },
      { parent: this }
    );

    this.registerOutputs();
  }
}
