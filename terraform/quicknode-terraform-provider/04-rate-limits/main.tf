variable "heavy_reads_enabled" {
  type    = bool
  default = true
}

resource "quicknode_endpoint" "limited" {
  chain      = "eth"
  network    = "ethereum-sepolia"
  label      = "example-limits"
  status     = "active"
  multichain = false
  tags       = ["example", "limits"]
}

# Endpoint-wide cap: protects the whole quota from one runaway app.
resource "quicknode_endpoint_rate_limits" "limited" {
  endpoint_id = quicknode_endpoint.limited.id
  rps         = 5
}

# Tighter cap on expensive calls only.
resource "quicknode_endpoint_method_rate_limit" "heavy_reads" {
  endpoint_id = quicknode_endpoint.limited.id
  methods     = ["eth_getLogs"]
  rate        = 2
  interval    = "second"
  enabled     = var.heavy_reads_enabled
}

# Only these methods are accepted. Everything else is rejected.
resource "quicknode_endpoint_request_filter" "read_only" {
  endpoint_id = quicknode_endpoint.limited.id
  methods     = ["eth_blockNumber", "eth_call", "eth_getBalance", "eth_getLogs"]
}

data "quicknode_endpoint_urls" "limited" {
  endpoint_id = quicknode_endpoint.limited.id
}

output "plan_default" {
  value = quicknode_endpoint_rate_limits.limited.plan_default
}

output "url" {
  value     = data.quicknode_endpoint_urls.limited.http_url_with_token
  sensitive = true
}
