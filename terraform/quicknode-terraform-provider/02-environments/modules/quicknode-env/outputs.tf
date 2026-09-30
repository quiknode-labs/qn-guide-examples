output "endpoint_ids" {
  value = { for k, e in quicknode_endpoint.this : k => e.id }
}

output "safe_http_urls" {
  value = { for k, e in quicknode_endpoint.this : k => e.safe_http_url }
}

output "http_urls" {
  value     = { for k, u in data.quicknode_endpoint_urls.this : k => u.http_url_with_token }
  sensitive = true
}
