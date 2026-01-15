# UserStream Boilerplate

A production-ready Next.js boilerplate that connects [Quicknode Streams](https://www.quicknode.com/streams) with a live activity feed. It uses [Quicknode](https://www.quicknode.com/) Streams + [KV Store](https://www.quicknode.com/docs/key-value-store) to track monitored addresses, receives webhook events, stores activity in SQLite via Prisma, and pushes updates to the UI over SSE.

## Demo

<p align="center">
  <video src="public/live-feed-video.mov" controls muted playsinline width="900"></video>
</p>
<p align="center">
  <img src="public/userstream-live-feed.png" alt="UserStream live activity feed UI" width="1000" />
</p>

## Contents

- Demo
- Overview
- Architecture
- Features
- Tech Stack
- Prerequisites
- Project Structure
- Environment Variables
- Getting Started
- Database
- Quicknode Streams Setup
- Webhook Security and Payload
- API Endpoints
- Scripts
- Testing
- Troubleshooting

## Overview

This project is a reference implementation for:
- Creating [Quicknode KV lists](https://www.quicknode.com/docs/key-value-store) for monitored users.
- Filtering EVM blocks and receipts in a Quicknode [Streams filter](https://www.quicknode.com/docs/streams/filters).
- Handling signed webhooks and emitting live UI updates.
- Maintaining a small local database of users and activity.

The project is intentionally minimal and focuses on the Streams workflow and webhook processing.

## Architecture

```
Blockchain (EVM)
  -> Quicknode Streams + KV
    -> POST /api/webhook/streams (signature verified)
      -> DB insert + SSE emit
        -> UI live feed
```

## Features

- Quicknode Streams setup scripts (create + activate)
- EVM filter for native transfers and ERC-20 Transfer logs
- Solana filter for native transfers and SPL token transfers
- Quicknode KV list backed user monitoring, enabling dynamic user monitoring without redeploying the stream
- Labeling monitored addresses
- Bulk add monitored addresses
- Webhook signature verification and timestamp checks
- SSE live updates
- ENS resolution for EVM addresses
- Prisma + SQLite local storage

## Tech Stack

- Next.js App Router (Node runtime)
- TypeScript
- Prisma (SQLite)
- [Quicknode Streams](https://www.quicknode.com/streams) + KV Store
- Vitest
- Tailwind CSS

## Prerequisites

- Node.js 20+ and pnpm.
- [Quicknode account](https://www.quicknode.com/signup) and API key: Create an account, and get your [Console API key](https://www.quicknode.com/docs/console-api) for `QN_API_KEY`.
- EVM endpoint for ENS/ERC-20 metadata: Create an Ethereum endpoint and copy the HTTPS URL for `QN_EVM_ENDPOINT`.
- Solana RPC endpoint for SPL token metadata: Create a Solana endpoint and copy the HTTPS URL for `QN_SOLANA_ENDPOINT`.
- Public webhook URL: use a tunnel like https://ngrok.com/ or deploy the app so `APP_URL` is reachable by Quicknode.
- Quicknode Streams + KV Store: Predefined scripts are provided to create the necessary resources, no need to create them manually.

## Project Structure

```
filters/
  evm-filter.js           # Quicknode Streams filter (EVM)
  solana-filter.js        # Quicknode Streams filter (Solana)
scripts/
  setup-streams.ts        # Creates KV lists + stream (paused)
  activate-streams.ts     # Activates stream by id
src/
  app/api/                # API routes (webhooks, users, SSE)
  lib/                    # Quicknode, webhook, SSE helpers
  types/                  # Stream payload types
prisma/
  schema.prisma           # SQLite schema
```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

```
QN_API_KEY=""                  # Quicknode API key
QN_STREAM_SECURITY_TOKEN_EVM="" # EVM stream security token (from setup)
QN_STREAM_SECURITY_TOKEN_SOL="" # Solana stream security token (from setup)
QN_EVM_ENDPOINT=""             # Quicknode EVM endpoint URL
QN_SOLANA_ENDPOINT=""          # Solana RPC endpoint URL
DATABASE_URL="file:./dev.db"   # SQLite DB
APP_URL="http://localhost:3000" # Public app URL (ngrok for local webhooks)
```

Notes:
- `QN_STREAM_SECURITY_TOKEN_EVM` and `QN_STREAM_SECURITY_TOKEN_SOL` are returned by `setup:streams` per chain.
- `APP_URL` must be reachable by Quicknode (use ngrok or a deployed URL).

## Getting Started

### 1. Install dependencies

```bash
npm install
# pnpm install
# yarn install
```

### 2. Create your env file

```bash
cp .env.example .env
```

### 3. Add required variables

Fill in `.env` (see [Prerequisites](#prerequisites)).
For local webhooks, expose your app with ngrok and copy the HTTPS URL into `APP_URL`:

```bash
ngrok http 3000
```

### 4. Create Quicknode Streams + KV lists

```bash
npm run setup:streams
# pnpm run setup:streams
# yarn setup:streams
```

Copy the printed security token into `.env` (`QN_STREAM_SECURITY_TOKEN_EVM` or `QN_STREAM_SECURITY_TOKEN_SOL`).
If you want Solana, run the command again with `chain=solana-mainnet` (see [Quicknode Streams Setup](#quicknode-streams-setup) for options).

### 5. Set up the database and start the app

```bash
npx prisma migrate dev --name init
# pnpm prisma migrate dev --name init
# yarn prisma migrate dev --name init
```

```bash
npm run dev
# pnpm dev
# yarn dev
```

### 6. Activate the stream

```bash
npm run activate:streams
# pnpm run activate:streams
# yarn activate:streams
```

Open `http://localhost:3000`, add wallet addresses, and you should see live events as streams deliver webhooks.


## Database

SQLite is used by default. Prisma schema is in `prisma/schema.prisma`.

Common commands:

```
pnpm prisma migrate dev --name init
pnpm prisma studio
```

## Quicknode Streams Setup

### 1. Check the filter

The EVM filter lives in `filters/evm-filter.js`. It emits:
- `nativeTransfer` events (ETH transfers with non-zero value)
- `erc20Transfer` events (ERC-20 Transfer logs)

The filter checks addresses against the `userstream_monitored_users_evm` KV list.

The Solana filter lives in `filters/solana-filter.js`. It emits:
- `solTransfer` events (native SOL transfers)
- `splTransfer` events (SPL token transfers)

The filter checks addresses against the `userstream_monitored_users_sol` KV list.

Adding addresses through UI will update the KV list automatically. However, if you need to manage KV lists manually, you can do so through the Quicknode REST API.
Check the [Key-Value Store](https://www.quicknode.com/docs/key-value-store) documentation page to learn more.

### 2. Create stream + KV lists

```
pnpm run setup:streams
```

This will:
- Create the KV list for the selected chain (`userstream_monitored_users_evm` or `userstream_monitored_users_sol`)
- Base64 encode the filter for the chosen chain
- Test the filter using the Quicknode test_filter API
- Create a stream with:
  - `status=paused`
  - `dataset=block_with_receipts` (EVM) or `dataset=block` (Solana)
  - required webhook attributes (compression, retries, timeouts)
- Save the stream id to `.quicknode/streams.json`
- Print the `security_token` for `.env` (`QN_STREAM_SECURITY_TOKEN_EVM` or `QN_STREAM_SECURITY_TOKEN_SOL`)
- Creates a single stream per run (run again with `chain=solana-mainnet` or `chain=ethereum-mainnet` to create both).

You can override options using `key=value` args, for example:

```
pnpm run setup:streams chain=ethereum-mainnet name="UserStream EVM Monitor" test_block_number=24223192
pnpm run setup:streams chain=solana-mainnet name="UserStream Solana Monitor" test_block_number=393612994
```

Common options:
- `chain=ethereum-mainnet` (alias: `network=ethereum-mainnet`)
- `dataset=block_with_receipts`
- `dataset_batch_size=1`
- `include_stream_metadata=body`
- `status=paused`
- `elastic_batch_enabled=true`
- `filter_path=filters/evm-filter.js`
- `test_block_number=24223192`
- `destination_compression=none`
- `destination_headers='{"Content-Type":"application/json"}'`
- `destination_max_retry=3`
- `destination_retry_interval_sec=1`
- `destination_post_timeout_sec=10`

Default settings when you run `pnpm run setup:streams` without options:
- `chain=ethereum-mainnet`
- `name="UserStream EVM Monitor"`
- `dataset=block_with_receipts` (EVM) or `block` (Solana)
- `dataset_batch_size=1`
- `include_stream_metadata=body`
- `status=paused`
- `elastic_batch_enabled=true`
- `filter_path=filters/evm-filter.js` (EVM) or `filters/solana-filter.js` (Solana)
- `test_block_number=24223192` (EVM) or `393612994` (Solana)
- `destination_compression=none`
- `destination_headers={}`
- `destination_max_retry=3`
- `destination_retry_interval_sec=1`
- `destination_post_timeout_sec=10`

### 3. Add security token

Add the printed token to `.env`:

```
QN_STREAM_SECURITY_TOKEN_EVM="..." # When you create an EVM stream
QN_STREAM_SECURITY_TOKEN_SOL="..." # When you create a Solana stream
```

### 4. Activate the stream

```
pnpm run activate:streams
```

This reads the stored id from `.quicknode/streams.json`. You can override it:

```
pnpm run activate:streams stream_id=YOUR_STREAM_ID
pnpm run activate:streams chain=solana-mainnet
```

## Webhook Security and Payload

- Endpoint: `POST /api/webhook/streams`
- Headers required: `x-qn-nonce`, `x-qn-timestamp`, `x-qn-signature`
- Payload can be gzip compressed; the handler auto-detects `content-encoding: gzip`
- Signature verification uses `QN_STREAM_SECURITY_TOKEN_EVM` or `QN_STREAM_SECURITY_TOKEN_SOL`

Payload contract details are documented in `docs/FILTER_CONTRACT.md`.

## API Endpoints

- `GET /api/health` - health check
- `GET /api/users` - list monitored users
- `POST /api/users` - add a single user (`walletAddress`, optional `name`)
- `PATCH /api/users?id=...` - update user name/displayName
- `DELETE /api/users?id=...` - delete a user
- `POST /api/users/bulk` - bulk add users (newline separated)
- `POST /api/webhook/streams` - Quicknode Streams webhook
- `POST /api/webhook/test` - local-only webhook test
- `GET /api/sse` - SSE stream of activity events

## Scripts

```
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm test
pnpm run setup:streams
pnpm run activate:streams
```

## Testing

- Unit tests use Vitest.
- Webhook and SSE routes have dedicated tests under `src/app/api/__tests__`.

```
pnpm test
```

## Troubleshooting

- Missing webhook events: ensure `APP_URL` is publicly reachable and the stream is active.
- 401 from webhook: verify `QN_STREAM_SECURITY_TOKEN_EVM`/`QN_STREAM_SECURITY_TOKEN_SOL` and headers.
- KV list errors: confirm `QN_API_KEY` has Streams + KV access.
- ENS resolution errors: verify `QN_EVM_ENDPOINT` is set to an Ethereum mainnet endpoint.
- SPL metadata missing: set `QN_SOLANA_ENDPOINT` to a Solana RPC endpoint.

