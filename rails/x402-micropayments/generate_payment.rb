#!/usr/bin/env ruby
# frozen_string_literal: true

# Generate a valid X-PAYMENT header for testing the Rails app
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

# Configure x402-payments gem
X402::Payments.configure do |config|
  config.private_key = PRIVATE_KEY
  config.chain = 'base-sepolia'
  config.default_pay_to = PAY_TO
  config.max_timeout_seconds = 600
end

# Display configuration
puts "Pay to: #{PAY_TO}"
puts "Chain: base-sepolia"
puts "Port: #{PORT}"
puts

# Generate payment header
# The gem handles all the EIP-712 signing internally
begin
  payment_header = X402::Payments.generate_header(
    amount: 0.001,  # $0.001 in USD
    resource: "http://localhost:#{PORT}/api/weather/paywalled_info",
    description: "Payment required for /api/weather/paywalled_info"
  )

  puts "\nPayment Header (X-PAYMENT):"
  puts payment_header

  puts "\n\nCurl command:"
  puts "curl -i -H \"X-PAYMENT: #{payment_header}\" http://localhost:#{PORT}/api/weather/paywalled_info"

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
