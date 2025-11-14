# frozen_string_literal: true

# X402 Payment Protocol Configuration
# For more information, see: https://docs.cdp.coinbase.com/x402

X402.configure do |config|
  # Your wallet address (where payments will be received)
  # For testing, you can use a test wallet address
  config.wallet_address = ENV.fetch("X402_WALLET_ADDRESS", "YourTestWalletAddressHere")
  # config.wallet_address = ENV.fetch("X402_WALLET_ADDRESS", "EYNQARNg9gZTtj1xMMrHK7dRFAkVjAAMubxaH7Do8d9Y")

  # Facilitator URL (default: https://x402.org/facilitator)
  # The facilitator handles payment verification and settlement
  config.facilitator = ENV.fetch("X402_FACILITATOR_URL", "https://www.x402.org/facilitator")

  # Blockchain network to use
  # Options: "base-sepolia" (testnet), "base" (mainnet), "avalanche-fuji" (testnet), "avalanche" (mainnet)
  config.chain = ENV.fetch("X402_NETWORK", "base-sepolia")

  # Currency symbol (currently only USDC is supported)
  config.currency = ENV.fetch("X402_CURRENCY", "USDC")

  # config.solana_fee_payer = ENV.fetch("X402_SOLANA_FEE_PAYER", "CKPKJWNdJEqa81x7CkZ14BVPiY6y16Sxs7owznqtWYp5")
  # config.solana_fee_payer = ENV.fetch("X402_SOLANA_FEE_PAYER", "FuzoZt4zXaYLvXRguKw2T6xvKvzZqv6PkmaFjNrEG7jm")


  # Optimistic mode (default: true)
  # - true: Fast response, settle after (better UX, optimistic)
  # - false: Wait for settlement before response (slower, more secure)
  # NOTE: This is set to false for the test app to ensure that the payment is settled before the response is sent.
  # If set to true, the nonce will need to be tracked as if re-used it should abort the request and return a 402 Payment Required error.
  config.optimistic = ENV.fetch("X402_OPTIMISTIC", "false") == "true"
end

# Validate configuration on initialization
X402.configuration.validate!
