# frozen_string_literal: true

# X402 Payment Protocol Configuration
# For more information, see: https://docs.cdp.coinbase.com/x402

X402.configure do |config|
  # Your wallet address (where payments will be received)
  # For testing, you can use a test wallet address
  config.wallet_address = ENV.fetch("X402_WALLET_ADDRESS", "YourTestWalletAddressHere")

  # Facilitator URL (default: https://x402.org/facilitator)
  # The facilitator handles payment verification and settlement
  config.facilitator = ENV.fetch("X402_FACILITATOR_URL", "https://www.x402.org/facilitator")

  # Blockchain network to use
  config.chain = ENV.fetch("X402_CHAIN", "base-sepolia")
  
  # Currency symbol
  config.currency = ENV.fetch("X402_CURRENCY", "USDC")

  # Custom Chain and Token Registration

  config.register_chain(
    name: "polygon-amoy",
    chain_id: 80002,
    standard: "eip155"
  )

  config.register_token(
    chain: "polygon-amoy",
    symbol: "USDC",
    address: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582",
    decimals: 6,
    name: "USDC",
    version: "2"
  )

  # ==========================================
  # Accept Multiple Payment Options
  # ==========================================
  # Use config.accept() to specify which chains/currencies to accept.
  # The 402 response will include all accepted options, allowing clients
  # to pay on any of the supported chains.
  #
  # If no config. accept() calls are made, the default chain/currency is used.

  config.accept(chain: "base-sepolia", currency: "USDC")
  config.accept(chain: "polygon-amoy", currency: "USDC")

  # Optimistic mode (default: true)
  # - true: Fast response, settle after (better UX, optimistic)
  # - false: Wait for settlement before response (slower, more secure)
  # NOTE: This is set to false for the test app to ensure that the payment is settled before the response is sent.
  # If set to true, the nonce will need to be tracked as if re-used it should abort the request and return a 402 Payment Required error.
  config.optimistic = ENV.fetch("X402_OPTIMISTIC", "false") == "true"
end

# Validate configuration on initialization
X402.configuration.validate!
