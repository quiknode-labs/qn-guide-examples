# x402-rails Test Application

Demo Rails application showcasing the [x402-rails](https://rubygems.org/gems/x402-rails) gem for accepting blockchain micropayments.

## Overview

This is a simple Weather API that requires USDC payments to access weather data. It demonstrates the x402 payment protocol with:

- 💰 Micropayments ($0.001 USDC per request)
- ⚡ Fast response times (~1 second with optimistic mode)
- 🔒 Cryptographic payment verification (EIP-712 signatures)
- 🌐 Blockchain settlement on Base Sepolia testnet

## Features

- Multiple API endpoints with free and paywalled access
- Returns mock weather data after payment verification
- HTTP 402 Payment Required for unpaid requests
- Payment settlement on Base Sepolia blockchain
- Configurable optimistic/non-optimistic settlement modes
- Multi-chain support (Base Sepolia and Solana Devnet)

## Quick Start

### 1. Install Dependencies

```bash
bundle install
```

The app uses the `x402-rails` gem (version 0.2.1) which will be installed automatically from [RubyGems.org](https://rubygems.org/gems/x402-rails).

### 2. Configure x402

The app is pre-configured in `config/initializers/x402.rb`:

```ruby
X402.configure do |config|
  config.wallet_address = ENV.fetch("X402_WALLET_ADDRESS", "YourWalletAddressHere")
  config.facilitator = ENV.fetch("X402_FACILITATOR_URL", "https://www.x402.org/facilitator")
  config.chain = ENV.fetch("X402_CHAIN", "base-sepolia")
  config.currency = ENV.fetch("X402_CURRENCY", "USDC")
  config.optimistic = ENV.fetch("X402_OPTIMISTIC", "true") == "true"
end
```

**Optional**: Create a `.env` file for your custom configuration:

```bash
# Copy the example file
cp .env.example .env

# Edit with your values
# X402_WALLET_ADDRESS=0xYourAddress
# X402_FACILITATOR_URL=https://www.x402.org/facilitator
# etc.
```

### 3. Start the Server

```bash
bin/rails server -p 3000
```

The API will be available at `http://localhost:3000`

## Testing the API

### Option 1: Using curl

#### Step 1: Request without payment (get 402)

```bash
curl -i http://localhost:3000/api/weather/paywalled_info
```

**Expected Response:**
```
HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "x402Version": 1,
  "error": "Payment required to access this resource",
  "accepts": [{
    "scheme": "exact",
    "network": "base-sepolia",
    "maxAmountRequired": "1000",
    "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    "payTo": "YourWalletAddressHere",
    "resource": "http://localhost:3000/api/weather/paywalled_info",
    "description": "Payment required for /api/weather/paywalled_info",
    "maxTimeoutSeconds": 600,
    "mimeType": "application/json",
    "extra": {
      "name": "USDC",
      "version": "2"
    }
  }]
}
```

#### Step 2: Generate payment signature

You can use **Ruby**, **TypeScript**, or **Python** to generate payment signatures:

##### Option A: Ruby (Recommended)

Uses QuickNode's open-source `x402-payments` gem:

```bash
# Set your test private key
# Or set it in .env
# export X402_TEST_PRIVATE_KEY=0xYourPrivateKeyHere

# Generate payment (gem auto-installs on first run)
ruby generate_payment.rb
```

##### Option B: TypeScript

```bash
# Install dependencies (first time only)
npm install viem

# Set your test private key
export X402_TEST_PRIVATE_KEY=0xYourPrivateKeyHere

# Generate payment
npx tsx generate_payment.ts
```

##### Option C: Python

```bash
# Setup Python environment (first time only)
python3 -m venv venv
source venv/bin/activate
pip install eth-account
pip install git+https://github.com/coinbase/x402.git#subdirectory=python/x402

# Set your test private key
export X402_TEST_PRIVATE_KEY=0xYourPrivateKeyHere

# Generate payment
python generate_payment.py
```

All scripts output:
- Your payer address
- Base64-encoded X-PAYMENT header
- Ready-to-use curl command
- Decoded payment header (for debugging)

#### Step 3: Make request with payment

Copy and run the curl command from the generator output:

```bash
curl -i -H "X-PAYMENT: eyJ4NDAyVmVyc2lvbiI6..." http://localhost:3000/api/weather/paywalled_info
```

**Expected Response:**
```
HTTP/1.1 200 OK
Content-Type: application/json
X-PAYMENT-RESPONSE: eyJzdWNjZXNzIjp0cnVlLCJ0cmFuc2FjdGlvbiI6IjB4Li4uIn0=

{
  "temperature": 72,
  "condition": "sunny",
  "humidity": 65,
  "paid_by": "0x63eb313AD58184F4c25F68d456e8276b77Fdce0f",
  "payment_amount": "1000",
  "network": "base-sepolia"
}
```

### Option 2: Using Postman/Paw

Import the provided collection:

```bash
# Choose one:
postman_collection.json    # Import into Postman
openapi.yaml              # Import into any OpenAPI tool
```

See `API_TEST_COMMANDS.md` for detailed instructions.

## Payment Generation

Three scripts are available for generating valid EIP-712 payment signatures for testing:
- `generate_payment.rb` (Ruby) - **Recommended** - Uses QuickNode's `x402-payments` gem
- `generate_payment.ts` (TypeScript) - Uses Viem library
- `generate_payment.py` (Python) - Uses eth-account library

### Usage

#### Ruby (Recommended)

```bash
# Default (port 3000)
ruby generate_payment.rb

# Custom port
PORT=3001 ruby generate_payment.rb

# Custom wallet and port
X402_TEST_PRIVATE_KEY=0x... PORT=3001 ruby generate_payment.rb
```

**Why Ruby?** The `x402-payments` gem is QuickNode's open-source library. It uses `bundler/inline` so the gem auto-installs on first run - no separate setup needed!

#### TypeScript

```bash
# Default (port 3000)
npx tsx generate_payment.ts

# Custom port
PORT=3001 npx tsx generate_payment.ts

# Custom wallet and port
X402_TEST_PRIVATE_KEY=0x... PORT=3001 npx tsx generate_payment.ts
```

#### Python

```bash
# Default (port 3000)
python generate_payment.py

# Custom port
PORT=3001 python generate_payment.py

# Custom wallet and port
X402_TEST_PRIVATE_KEY=0x... PORT=3001 python generate_payment.py
```

### Environment Variables

- `PORT` - Server port (default: 3000)
- `X402_TEST_PRIVATE_KEY` - Your test wallet private key
- `X402_WALLET_ADDRESS` - Payment recipient address

### How it Works

1. Uses your private key to sign an EIP-712 payment authorization
2. Constructs the X-PAYMENT header with authorization and requirements
3. Encodes the payment as base64 JSON
4. Outputs the X-PAYMENT header value
5. Generates a ready-to-use curl command

**Note**: The private key is for testing only. Get testnet USDC from the [Circle's faucet](https://faucet.circle.com/)

### Decoding Payment Headers

To inspect what's inside an X-PAYMENT header:

#### TypeScript
```bash
npx tsx decode_payment.ts "eyJ4NDAyVmVyc2lvbiI..."
```

#### Python
```bash
python decode_payment.py "eyJ4NDAyVmVyc2lvbiI..."
```

## Configuration

### Settlement Modes

#### Optimistic Mode (Default)

Fast responses with async settlement:

```bash
# In .env or terminal
X402_OPTIMISTIC=true bin/rails server -p 3000
```

- Response time: ~1 second
- Settlement happens after response is sent
- Best for: Most use cases

#### Non-Optimistic Mode

Guaranteed settlement before response:

```bash
X402_OPTIMISTIC=false bin/rails server -p 3000
```

- Response time: ~2 seconds
- Settlement confirmed before response
- Best for: High-value transactions

### Other Configuration

```bash
# Required
X402_WALLET_ADDRESS=0xYourAddress

# Optional (with defaults)
X402_FACILITATOR_URL=https://www.x402.org/facilitator
X402_CHAIN=base-sepolia
X402_CURRENCY=USDC
X402_OPTIMISTIC=true
```

## Viewing Blockchain Transactions

After successful payment, view the transaction on Base Sepolia:

1. Decode the `X-PAYMENT-RESPONSE` header (base64)
2. Extract the `transaction` field
3. View on BaseScan: https://sepolia.basescan.org/tx/TRANSACTION_HASH

Or check the Rails logs for the transaction hash:

```
x402 settlement successful: 0x...
```

## Files

### Application Files
- `app/controllers/api/weather_controller.rb` - Weather API endpoint with `x402_paywall`
- `app/controllers/api/premium_controller.rb` - Premium content endpoints
- `config/initializers/x402.rb` - x402 gem configuration
- `config/routes.rb` - API routes

### Testing Tools
- `generate_payment.rb` - Ruby payment signature generator (x402-payments gem) **[Recommended]**
- `generate_payment.ts` - TypeScript payment signature generator (Viem)
- `generate_payment.py` - Python payment signature generator
- `decode_payment.ts` - TypeScript X-PAYMENT header decoder
- `decode_payment.py` - Python X-PAYMENT header decoder
- `public/pay.html` - Browser-based payment test interface

### Documentation
- `README.md` - This file
- `API_TEST_COMMANDS.md` - Detailed testing guide
- `openapi.yaml` - OpenAPI 3.0 specification
- `postman_collection.json` - Postman collection
- `.env.example` - Environment variables template

## Troubleshooting

### "Payment required" error with payment header

**Issue**: Port mismatch between signature and server

**Solution**: Ensure you're using the same port:
```bash
# Generate for specific port (Ruby - recommended)
PORT=3000 ruby generate_payment.rb

# Or TypeScript
PORT=3000 npx tsx generate_payment.ts

# Or Python
PORT=3000 python generate_payment.py

# Start server on same port
bin/rails server -p 3000
```

### "Invalid payment" error

**Issue**: Expired signature (600 second timeout)

**Solution**: Generate a fresh payment signature

### "Facilitator error"

**Issue**: Network or facilitator connectivity

**Solution**: Check logs and retry. The facilitator URL is `https://www.x402.org/facilitator`

### Settlement fails but got 200 response

**Issue**: Optimistic mode settlement failure (rare)

**Solution**: Check Rails logs for settlement errors. In optimistic mode, the response is sent before settlement completes.

## Development

This test app uses the x402-rails gem from RubyGems:

```ruby
# Gemfile
gem "x402-rails", "~> 0.2.1"
```

To test the app:
1. Make sure you have Ruby 3.3.5+ installed
2. Run `bundle install`
3. Start the server with `bin/rails server`
4. Generate test payments with `generate_payment.rb` (recommended), `generate_payment.ts`, or `generate_payment.py`
5. Test the API endpoints as described above

## Resources

- [x402-rails Gem on RubyGems](https://rubygems.org/gems/x402-rails)
- [x402-payments Gem on RubyGems](https://rubygems.org/gems/x402-payments)
- [x402 Protocol Docs](https://docs.cdp.coinbase.com/x402)
- [x402 GitHub](https://github.com/coinbase/x402)
- [Base Sepolia Explorer](https://sepolia.basescan.org)
- [Viem Documentation](https://viem.sh) - TypeScript library used in `generate_payment.ts`

## License

MIT
