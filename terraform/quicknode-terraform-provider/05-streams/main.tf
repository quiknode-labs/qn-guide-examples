variable "webhook_url" {
  type = string
}

variable "status" {
  type    = string
  default = "active"
}

variable "watchlist" {
  type = set(string)
  default = [
    "0x8f6eb7870334b1fd8006fd52413f01689f4e57e9",
    "0x2bd57c3ca216f0d38b18bcfd14595f12dfb13c35",
  ]
}

resource "quicknode_kv_list" "watchlist" {
  key   = "example-stream-watchlist"
  items = var.watchlist
}

resource "quicknode_stream" "blocks" {
  name    = "example-blocks"
  network = "ethereum-sepolia"
  dataset = "block"
  region  = "usa_east"
  status  = var.status

  # The filter reads the watchlist by key. Terraform fills in the key.
  filter_function = templatefile("${path.module}/filter.js.tftpl", {
    list_key = quicknode_kv_list.watchlist.key
  })

  destination = {
    webhook = {
      url = var.webhook_url
    }
  }
}

output "stream_id" {
  value = quicknode_stream.blocks.id
}

output "state" {
  value = quicknode_stream.blocks.state
}

output "start_range" {
  value = quicknode_stream.blocks.start_range
}
