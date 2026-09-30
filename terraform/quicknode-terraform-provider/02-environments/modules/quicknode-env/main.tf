resource "quicknode_endpoint" "this" {
  for_each = var.endpoints

  chain      = each.value.chain
  network    = each.value.network
  label      = "${var.environment}-${each.key}"
  status     = "active"
  multichain = false
  tags       = ["example", var.environment]
}

data "quicknode_endpoint_urls" "this" {
  for_each    = quicknode_endpoint.this
  endpoint_id = each.value.id
}
