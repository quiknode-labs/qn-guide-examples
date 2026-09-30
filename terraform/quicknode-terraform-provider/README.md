# Quicknode Terraform provider examples

Terraform examples for the guide "Manage Quicknode infrastructure as code with Terraform". Every endpoint in these examples uses a testnet.

## Features

- `01-first-endpoint`: Create a Sepolia endpoint and retrieve its URL.
- `02-environments`: Reuse one module for separate dev and staging environments.
- `03-security`: Manage a token, IP allowlist, referrer, and JWT key.
- `04-rate-limits`: Set endpoint and method rate limits and a request filter.
- `05-streams`: Send filtered Sepolia blocks to a webhook using a KV watchlist.
- `06-kv`: Manage KV lists, list items, and a value.
- `07-import`: Example blocks for adopting and releasing existing resources.
- `08-remote-state`: Example S3 backend configuration.
- `09-ci`: GitHub Actions workflow for plans on pull requests.

## Prerequisites

- Terraform 1.13 or later, or OpenTofu.
- A Quicknode account and an API key exported as `QUICKNODE_API_KEY`.
- `openssl` for the JWT key pair in `03-security`.

The same files run with OpenTofu. Replace `terraform` with `tofu` in the commands below.

## Setup

Clone the repository and enter an example with `.tf` files, such as `01-first-endpoint` or `02-environments/envs/dev`. Each environment under `02-environments/envs/` has its own state. Set your API key without putting it in your shell history:

```bash
read -rs QUICKNODE_API_KEY
printf '\n'
export QUICKNODE_API_KEY
terraform init
terraform plan
terraform apply
```

Read the plan before applying it. `apply` creates real Quicknode endpoints and other resources. When you finish, run `terraform plan -destroy` and then `terraform destroy` in each folder you applied. Terraform state files hold access tokens, so keep them private and use protected remote state for team use. The `.gitignore` excludes local state and generated secrets. The `terraform.tfvars` files in the environment examples are tracked.

For `03-security`, create the JWT key pair in that folder before `terraform plan`:

```bash
openssl genpkey -algorithm RSA -out jwt.key -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in jwt.key -out jwt.pub.pem
```

Keep `jwt.key` private. The example reads only `jwt.pub.pem`. Review the security variables before enabling an IP allowlist, referrer check, or JWT enforcement.

For `05-streams`, get a test receiver URL from [webhook.site](https://webhook.site), then set `TF_VAR_webhook_url` before planning and applying:

```bash
export TF_VAR_webhook_url="https://webhook.site/YOUR_UNIQUE_ID"
```

The files in `07-import` end in `.example`, so Terraform ignores them. Copy the blocks you need into `.tf` files in a folder with a provider `versions.tf`, then replace the placeholders with your own IDs. The `08-remote-state/backend.tf.example` file is a starting point for an S3 backend. Copy it into an environment folder, replace its bucket and region placeholders, and configure your AWS credentials. These two folders are snippets to copy into an existing Terraform root, so they have no `versions.tf` of their own. The S3 backend was tested on an S3-compatible mock, not on real AWS.

Copy `09-ci/terraform-plan.yml` to `.github/workflows/terraform-plan.yml` in your repository and configure the `QUICKNODE_API_KEY` repository secret. The workflow paths refer to the `02-environments` layout here. If your layout differs, update every path in the workflow, including the trigger, working directory, `hashFiles`, and plan file reader. Run this secret-backed workflow only for pull requests from contributors you trust.

## Support & Feedback

- [Repository issues](https://github.com/quiknode-labs/qn-guide-examples/issues)
- [Quicknode support](https://support.quicknode.com/)
