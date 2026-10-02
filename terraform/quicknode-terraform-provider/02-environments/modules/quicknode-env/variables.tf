variable "environment" {
  type        = string
  description = "Environment name, used in labels and tags."
}

variable "endpoints" {
  type = map(object({
    chain   = string
    network = string
  }))
  description = "Endpoints to create, keyed by a short name such as eth or base."
}
