# Pulumi static site

Spin up simple static site with Pulumi.

## Prerequisites

- Pulumi CLI (>= v3): https://www.pulumi.com/docs/get-started/install/
- Node.js (>= 14): https://nodejs.org/
- AWS credentials configured (e.g., via `aws configure` or environment variables)

## Getting Started

Set your custom domain and project name in `pulumi.dev.yaml` using `customDomain` and `name` parameters, respectively. Custom domain is optional.

Client application is located in `app`.

1.  Initialize and deploy static site with:

    ```bash
      npm run deploy
    ```
