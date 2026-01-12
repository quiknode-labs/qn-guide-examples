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

  # Register Base Sepolia for CAIP-2 usage (eip155:84532) with USDC
  config.register_chain(
    name: "eip155:84532",
    chain_id: 84_532,
    standard: "eip155"
  )
  config.register_token(
    chain: "eip155:84532",
    symbol: "USDC",
    address: ENV.fetch("X402_ASSET", "0x036CbD53842c5426634e7929541eC2318f3dCF7e"),
    decimals: 6,
    name: "USDC",
    version: "2"
  )

  # Blockchain network to use (v2 uses CAIP-2 identifiers, e.g. "eip155:84532")
  # Examples: "eip155:84532" (Base Sepolia), "eip155:8453" (Base Mainnet)
  config.chain = ENV.fetch("X402_CHAIN", ENV.fetch("X402_NETWORK", "eip155:84532"))

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
