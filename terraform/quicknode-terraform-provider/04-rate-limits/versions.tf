terraform {
  required_version = ">= 1.13"

  required_providers {
    quicknode = {
      source  = "quicknode/quicknode"
      version = "~> 0.4"
    }
  }
}

# Reads the API key from the QUICKNODE_API_KEY environment variable.
provider "quicknode" {}
