# Look up valid chain and network names instead of guessing them.
data "quicknode_chains" "all" {}

locals {
  ethereum = one([for c in data.quicknode_chains.all.chains : c if c.slug == "eth"])
  sepolia  = one([for n in local.ethereum.networks : n if n.slug == "ethereum-sepolia"])
}

resource "quicknode_endpoint" "dev" {
  chain      = local.ethereum.slug
  network    = local.sepolia.slug
  label      = "example-dev"
  status     = "active"
  multichain = false
  tags       = ["example"]
}

output "endpoint_id" {
  value = quicknode_endpoint.dev.id
}

output "chain_id" {
  value = local.sepolia.chain_id
}

# Safe to print: the access token is replaced by a placeholder.
output "safe_http_url" {
  value = quicknode_endpoint.dev.safe_http_url
}

# The full URL with the access token. Terraform hides sensitive values in its output.
data "quicknode_endpoint_urls" "dev" {
  endpoint_id = quicknode_endpoint.dev.id
}

output "http_url_with_token" {
  value     = data.quicknode_endpoint_urls.dev.http_url_with_token
  sensitive = true
}
