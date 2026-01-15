# x402-rails Test Application

Demo Rails application showcasing the [x402-rails](https://rubygems.org/gems/x402-rails) gem for accepting blockchain micropayments.

## Overview

This is a simple Weather API that requires USDC payments to access some endpoints. It demonstrates the x402 payment protocol with:

- Micropayments ($0.001 USDC per request)
- HTTP 402 Payment Required flows
- Cryptographic payment verification (EIP-712 on EVM chains)
- Optional optimistic or confirmed settlement
- Multi-chain support (Base Sepolia, Polygon Amoy, and Solana Devnet examples)

## How the x402 Flow Works

1. **Request without payment** - Server returns `402 Payment Required` and payment requirements.
2. **Generate payment signature** - Client signs the requirements using x402-compatible tooling.
3. **Request with payment** - Client sends `PAYMENT-SIGNATURE` header with the signed payload.
4. **Receive response** - Server returns data plus `PAYMENT-RESPONSE` header with settlement info.

## What’s Included

- Paywalled endpoints with `x402_paywall` (`app/controllers/api/weather_controller.rb`)
- Paywalled endpoints with a `before_action` (`app/controllers/api/premium_controller.rb`)
- x402 configuration (`config/initializers/x402.rb`)
- Payment header generators (Ruby/TypeScript/Python)
- Header decoders (TypeScript/Python)
- OpenAPI spec and Postman collection

## Prerequisites

- Ruby 3.2+ and Bundler
- SQLite3
- Optional for scripts:
  - Node.js 18+ (TypeScript generator/decoder)
  - Python 3.9+ (Python generator/decoder)

## Quick Start

### 1. Install Dependencies

```bash
bundle install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

At minimum set:

- `X402_WALLET_ADDRESS` (recipient)
- `X402_TEST_PRIVATE_KEY` (test payer key for generators)

### 3. Start the Server

```bash
bin/rails server -p 3000
```

API base URL: `http://localhost:3000`

## Endpoints

Free:
- `GET /api/weather/public`
- `GET /api/premium/free`

Paywalled (EVM defaults):
- `GET /api/weather/paywalled_info` ($0.001)
- `GET /api/premium` ($0.005)
- `GET /api/premium/:id` ($0.005)

Paywalled (Solana example):
- `GET /api/weather/paywalled_info_sol` ($0.001, Solana Devnet)

## Test the Payment Flow (EVM or Solana)

### 1. Make a request without payment

```bash
curl -i http://localhost:3000/api/weather/paywalled_info
```

You should see `402 Payment Required` with a `PAYMENT-REQUIRED` header and an `accepts` array in the response body.

### 2. Generate a payment signature

Use one of the provided generators:

**Ruby (recommended, supports EVM + Solana):**

```bash
ruby generate_payment.rb
```

**TypeScript:**

```bash
npm install viem
npx tsx generate_payment.ts
```

**Python:**

```bash
python3 -m venv venv
source venv/bin/activate
pip install eth-account
pip install git+https://github.com/coinbase/x402.git#subdirectory=python/x402
python generate_payment.py
```

Each script prints:
- the payer address
- a `PAYMENT-SIGNATURE` header value
- a ready-to-use curl command

### 3. Make a paid request

Copy the curl command from the script output, or:

```bash
curl -i -H "PAYMENT-SIGNATURE: <BASE64_HEADER>" \
  http://localhost:3000/api/weather/paywalled_info
```

You should see `200 OK` and a `PAYMENT-RESPONSE` header.

## Multi-Chain Usage

### Base Sepolia (default)

This app defaults to Base Sepolia:

- `X402_CHAIN=base-sepolia`
- USDC: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

The initializer also calls `config.accept` for Base Sepolia and Polygon Amoy, so the `402` response can include multiple payment options. Remove or adjust those `config.accept` calls if you want a single option.

### Polygon Amoy (custom EVM chain)

This app registers a custom chain and USDC token in:

- `config/initializers/x402.rb`
- `generate_payment.rb`

To use Polygon Amoy end-to-end:

1. Set the chain in `.env`:
   ```bash
   X402_CHAIN=polygon-amoy
   ```
2. Update the RPC URL used by the Ruby generator in `generate_payment.rb`.
3. Re-run the generator and call the paywalled endpoint.

If you want the generator to be configurable without edits, use an env var and wire it into `generate_payment.rb`.

The TypeScript and Python generators are Base Sepolia-focused. To use them on Polygon Amoy (or any other EVM chain), update the chain, asset address, and EIP-712 domain values in those scripts.

### Solana Devnet

The Solana example endpoint is:

- `GET /api/weather/paywalled_info_sol`

Key details:

- `x402_paywall` is called with `chain: "solana-devnet"` and `currency: "USDC"`.
- The controller reads `X402_SOLANA_FEE_PAYER` (optional) and `X402_SOL_PAY_TO` (see `.env.example`).
- Solana configuration values can be set in `.env` (see `.env.example`).

To generate a Solana payment header with the Ruby script, set these env vars before running:

```bash
X402_CHAIN=solana-devnet \
ruby generate_payment.rb
```

To test end-to-end:

```bash
# 1) Get 402 requirements
curl -i http://localhost:3000/api/weather/paywalled_info_sol

# 2) Generate a Solana payment header (uses the Solana resource path)
X402_CHAIN=solana-devnet \
X402_SOL_PRIVATE_KEY=<BASE58_OR_JSON_PRIVATE_KEY> \
X402_SOL_PAY_TO=<SOLANA_RECIPIENT_ADDRESS> \
ruby generate_payment.rb

# 3) Call the paid endpoint with the header from the script output
curl -i -H "PAYMENT-SIGNATURE: <BASE64_HEADER>" \
  http://localhost:3000/api/weather/paywalled_info_sol
```

Solana notes:
- Sender and recipient must have USDC Associated Token Accounts (ATAs).
- The sender must have USDC on the selected network.
- Transactions are partially signed by the sender; the facilitator adds the fee payer signature.

Note: The TypeScript and Python generators are EVM-focused. For Solana, use the Ruby generator.

## Configuration Reference

Core settings (used by `config/initializers/x402.rb`):

- `X402_WALLET_ADDRESS` - Recipient address
- `X402_FACILITATOR_URL` - Settlement facilitator URL (default `https://www.x402.org/facilitator`)
- `X402_CHAIN` - Default chain (e.g. `base-sepolia`)
- `X402_CURRENCY` - Currency symbol (e.g. `USDC`)
- `X402_OPTIMISTIC` - `true` to respond before settlement, `false` to wait

Testing settings:

- `X402_TEST_PRIVATE_KEY` - Test payer private key for generators
- `PORT` - Server port (default `3000`)

Solana settings:

- `X402_SOL_PRIVATE_KEY`
- `X402_SOL_PAY_TO`

## Decoding Payment Headers

Use the decoders to inspect a `PAYMENT-SIGNATURE` header:

```bash
npx tsx decode_payment.ts "<BASE64_HEADER>"
# or
python decode_payment.py "<BASE64_HEADER>"
```

## Settlement Mode

This app sets `X402_OPTIMISTIC=false` by default in `config/initializers/x402.rb` to ensure settlement happens before the response is sent.

- Optimistic mode (`true`): faster responses, settlement happens after response
- Non-optimistic (`false`): slower, but settlement is confirmed before response

## Viewing Transactions

After a successful payment:

1. Decode the `PAYMENT-RESPONSE` header (base64)
2. Extract the `transaction` field
3. View the transaction on a block explorer

Example (Base Sepolia):

```
https://sepolia.basescan.org/tx/<TRANSACTION_HASH>
```

You can also check Rails logs for settlement output:

```
x402 settlement successful: 0x...
```

## Files

Application:
- `app/controllers/api/weather_controller.rb`
- `app/controllers/api/premium_controller.rb`
- `config/initializers/x402.rb`
- `config/routes.rb`

Tools:
- `generate_payment.rb` (Ruby, recommended)
- `generate_payment.ts` (TypeScript)
- `generate_payment.py` (Python)
- `decode_payment.ts`
- `decode_payment.py`

Docs and API specs:
- `README.md`
- `openapi.yaml`
- `postman_collection.json`
- `.env.example`

## Troubleshooting

### "Payment required" even with a header

Cause: The `resource` in the signature includes the full URL. If the port or host changes, the signature is invalid.

Fix:
```bash
PORT=3000 ruby generate_payment.rb
bin/rails server -p 3000
```

### "Invalid payment" error

Cause: Signature expired (default 600 seconds).

Fix: Regenerate the signature and retry.

### "Facilitator error"

Cause: Network issues or invalid facilitator URL.

Fix: Verify `X402_FACILITATOR_URL` and check logs.

### "Could not open library 'sodium' / 'libsodium'"

The `x402-payments` gem may load Solana dependencies that require `libsodium`.

macOS fix:
```bash
brew install libsodium
brew link --force libsodium
```

### Settlement fails but response is 200

Cause: Optimistic settlement failure.

Fix: Check Rails logs for settlement errors.

## Development

This app uses the x402-rails gem from RubyGems:

```ruby
gem "x402-rails", "~> 1.0.0"
```

## Security Notes

- Never commit real private keys.
- Use testnet USDC for demo flows (Circle faucet: https://faucet.circle.com/).
