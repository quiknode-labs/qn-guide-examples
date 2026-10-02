variable "watchlist" {
  type = set(string)
  default = [
    "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
    "0x000000000000000000000000000000000000dead",
  ]
}

variable "partners" {
  type    = set(string)
  default = ["0x1111111111111111111111111111111111111111"]
}

variable "min_value_wei" {
  type    = string
  default = "1000000000000000000"
}

# Terraform owns the whole list. Items added elsewhere are removed on apply.
resource "quicknode_kv_list" "watchlist" {
  key   = "example-watchlist"
  items = var.watchlist
}

# Terraform adds these items and leaves other items in the list alone.
resource "quicknode_kv_list_items" "partners" {
  list_key = "example-partners"
  items    = var.partners
}

resource "quicknode_kv_value" "min_value" {
  key   = "example-min-value"
  value = var.min_value_wei
}

data "quicknode_kv_list" "watchlist" {
  key        = quicknode_kv_list.watchlist.key
  depends_on = [quicknode_kv_list.watchlist]
}

output "watchlist_items" {
  value = data.quicknode_kv_list.watchlist.items
}
