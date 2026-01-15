#!/usr/bin/env ruby
# frozen_string_literal: true

# Generate a valid PAYMENT-SIGNATURE header for testing the Rails app
#
# Usage:
#   bundle install
#   export X402_TEST_PRIVATE_KEY="0x..."
#   ruby generate_payment.rb
#
# Or make it executable:
#   chmod +x generate_payment.rb
#   ./generate_payment.rb

require 'bundler/inline'

gemfile do
  source 'https://rubygems.org'
  gem 'x402-payments'
  gem 'dotenv'
end

# Load .env file if it exists
require 'dotenv'
Dotenv.load

# Configuration
PRIVATE_KEY = ENV.fetch('X402_TEST_PRIVATE_KEY', '0xYourPrivateKeyHere')
PORT = ENV.fetch('PORT', '3000')
PAY_TO = ENV.fetch('X402_WALLET_ADDRESS', 'YourWalletAddressHere')
CHAIN = ENV.fetch('X402_CHAIN', 'base-sepolia')
IS_SOLANA = CHAIN.start_with?("solana")
SOL_PRIVATE_KEY = ENV['X402_SOL_PRIVATE_KEY']
SOL_PAY_TO = ENV['X402_SOL_PAY_TO']
SOLANA_FEE_PAYER = ENV['X402_SOLANA_FEE_PAYER']

# Configure x402-payments gem
X402::Payments.configure do |config|
  config.private_key = PRIVATE_KEY
  config.chain = CHAIN
  config.default_pay_to = PAY_TO
  config.max_timeout_seconds = 600

  config.register_chain(
    name: "polygon-amoy",
    chain_id: 80002,
    standard: "eip155"
  )
  config.register_token(
    chain: "polygon-amoy",
    symbol: "USDC",
    address: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582", # USDC on Polygon Amoy Testnet
    decimals: 6,
    name: "USDC",
    version: "2"
  )

  config.rpc_urls["polygon-amoy"] = "YourQuicknodePolygonAmoyRPCURLHere" # Register the RPC URL for the custom chain

  if IS_SOLANA
    config.private_key = SOL_PRIVATE_KEY if SOL_PRIVATE_KEY
    config.default_pay_to = SOL_PAY_TO if SOL_PAY_TO
  end
end

# Display configuration
effective_pay_to = IS_SOLANA ? (SOL_PAY_TO || PAY_TO) : PAY_TO
puts "Pay to: #{effective_pay_to}"
puts "Port: #{PORT}"
puts

# Generate payment header
# The gem handles all the EIP-712 signing internally
begin
  resource_path = IS_SOLANA ? "/api/weather/paywalled_info_sol" : "/api/weather/paywalled_info"
  payment_header = X402::Payments.generate_header(
    amount: 0.001,  # $0.001 in USD
    resource: "http://localhost:#{PORT}#{resource_path}",
    description: "Payment required for #{resource_path}"
  )

  puts "\nPayment Header (PAYMENT-SIGNATURE):"
  puts payment_header

  puts "\n\nCurl command:"
  puts "curl -i -H \"PAYMENT-SIGNATURE: #{payment_header}\" http://localhost:#{PORT}#{resource_path}"

  # Optionally decode and display for debugging
  require 'base64'
  require 'json'

  decoded = JSON.parse(Base64.decode64(payment_header))
  puts "\n\nDecoded Payment Header (for debugging):"
  puts JSON.pretty_generate(decoded)

rescue X402::Payments::ConfigurationError => e
  puts "Configuration error: #{e.message}"
  puts "\nMake sure to set X402_TEST_PRIVATE_KEY environment variable:"
  puts "  export X402_TEST_PRIVATE_KEY=\"0x...\""
  exit 1
rescue StandardError => e
  puts "Error generating payment header: #{e.message}"
  puts e.backtrace.join("\n")
  exit 1
end
