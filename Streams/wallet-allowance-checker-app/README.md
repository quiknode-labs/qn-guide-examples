# Wallet Allowance Checker (Streams + Postgres + Quicknode)

A React + Express app that surfaces ERC20 allowance states collected via Quicknode Streams and stored in PostgreSQL. Look up a wallet to see latest approvals and history, with token metadata pulled live from your Quicknode endpoint.

## Prerequisites
- Node.js 18+
- PostgreSQL with a `wallet_approval_states` table containing `wallet_address`, `latest_approvals`, and `approval_history` columns
- Quicknode EVM endpoint URL

## Setup
1. Install deps:
   ```bash
   npm install
   ```
2. Configure env:
   ```bash
   cp example.env .env
   # Set REACT_APP_QUICKNODE_ENDPOINT plus DB_USER/DB_HOST/DB_NAME/DB_PASSWORD/DB_PORT
   ```
3. Start the API server (port 3001):
   ```bash
   npm run server
   ```
4. In another terminal, start the React client:
   ```bash
   npm start
   ```

## How it works
- Express serves `/api/wallet-approval-states/:walletAddress` from Postgres.
- The React UI fetches approvals/history and enriches tokens via `REACT_APP_QUICKNODE_ENDPOINT`.
- Intended to pair with a Streams pipeline that writes wallet approvals into Postgres.
