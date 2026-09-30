variable "endpoints" {
  type = map(object({
    chain   = string
    network = string
  }))
}

module "quicknode" {
  source      = "../../modules/quicknode-env"
  environment = "dev"
  endpoints   = var.endpoints
}

output "safe_http_urls" {
  value = module.quicknode.safe_http_urls
}

output "http_urls" {
  value     = module.quicknode.http_urls
  sensitive = true
}
