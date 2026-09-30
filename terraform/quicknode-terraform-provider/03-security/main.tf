variable "enforce_ips" {
  type    = bool
  default = false
}

variable "allowed_ips" {
  type    = list(string)
  default = ["203.0.113.7"]
}

variable "enforce_referrers" {
  type    = bool
  default = false
}

variable "enforce_jwt" {
  type    = bool
  default = false
}

variable "extra_token" {
  type    = bool
  default = false
}

resource "quicknode_endpoint" "secure" {
  chain      = "eth"
  network    = "ethereum-sepolia"
  label      = "example-secure"
  status     = "active"
  multichain = false
  tags       = ["example", "security"]

  security_options = {
    tokens    = true
    ips       = var.enforce_ips
    referrers = var.enforce_referrers
    jwts      = var.enforce_jwt
  }
}

# A separate token for one consumer. Remove the resource to revoke only that token.
resource "quicknode_endpoint_token" "indexer" {
  count       = var.extra_token ? 1 : 0
  endpoint_id = quicknode_endpoint.secure.id
}

resource "quicknode_endpoint_ip" "allowed" {
  for_each    = toset(var.allowed_ips)
  endpoint_id = quicknode_endpoint.secure.id
  ip          = each.value
}

resource "quicknode_endpoint_referrer" "app" {
  endpoint_id = quicknode_endpoint.secure.id
  referrer    = "https://app.example.com"
}

resource "quicknode_endpoint_jwt" "signer" {
  endpoint_id = quicknode_endpoint.secure.id
  name        = "example-signer"
  kid         = "example-kid-1"
  public_key  = file("${path.module}/jwt.pub.pem")
}

data "quicknode_endpoint_urls" "secure" {
  endpoint_id = quicknode_endpoint.secure.id
  depends_on  = [quicknode_endpoint_token.indexer]
}

output "primary_url" {
  value     = data.quicknode_endpoint_urls.secure.http_url_with_token
  sensitive = true
}

output "indexer_url" {
  value     = one(quicknode_endpoint_token.indexer[*].http_url_with_token)
  sensitive = true
}
