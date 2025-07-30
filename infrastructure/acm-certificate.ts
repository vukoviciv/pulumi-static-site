import * as aws from "@pulumi/aws";
import { Output } from "@pulumi/pulumi";

export class AcmCertificate {
  domainName: string;
  certificate: aws.acm.Certificate;
  hostedZoneId: Output<string>;
  validation: aws.acm.CertificateValidation;

  constructor(domainName: string, hostedZoneId: Output<string>) {
    this.domainName = domainName;
    this.hostedZoneId = hostedZoneId;

    this.certificate = new aws.acm.Certificate(
      `${this.domainName}-certificate`,
      {
        domainName: this.domainName,
        validationMethod: "DNS",
      }
    );

    const dvo = this.certificate.domainValidationOptions[0];
    const certificateValidationDomain = new aws.route53.Record(
      `${this.domainName}-cert-validation-domain`,
      {
        name: dvo.resourceRecordName,
        type: dvo.resourceRecordType,
        zoneId: this.hostedZoneId,
        records: [dvo.resourceRecordValue],
        ttl: 300,
      },
      {
        deleteBeforeReplace: true,
      }
    );

    this.validation = new aws.acm.CertificateValidation(
      `${this.domainName}-cert-validation`,
      {
        certificateArn: this.certificate.arn,
        validationRecordFqdns: [certificateValidationDomain.fqdn],
      }
    );
  }
}
