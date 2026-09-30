terraform {
  required_version = ">= 1.13"

  required_providers {
    quicknode = {
      source  = "quicknode/quicknode"
      version = "~> 0.4"
    }
  }
}

provider "quicknode" {}
