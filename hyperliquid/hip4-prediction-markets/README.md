# How to Trade HIP-4 Prediction Markets on Hyperliquid

Companion code for the Quicknode guide [**"How to Trade HIP-4 Prediction Markets on Hyperliquid"**](https://www.quicknode.com/guides/hyperliquid/trade-hip-4-prediction-markets-on-hyperliquid).

The repo demonstrates two ways to interact with Hyperliquid prediction markets:

| Path | Approach |
|------|----------|
| `src/` | Quicknode Hyperliquid SDK (`@quicknode/hyperliquid-sdk`) |
| `src/api/` | Direct REST + WebSocket calls to `hyperliquidapi.com` |

---

## Prerequisites

- Node.js 20+
- A funded Hyperliquid wallet
- A Quicknode Hyperliquid endpoint

## Setup

```bash
npm install
cp .env.example .env   # fill in your values
npm run build
```

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PRIVATE_KEY` | Yes | Hex private key of your trading wallet (`0x…`) |
| `QUICKNODE_ENDPOINT` | Yes | Your Quicknode Hyperliquid endpoint URL |
| `WALLET_ADDRESS` | Recommended | Public address — needed to show balances and positions |

---

## Scripts

Run each step in order. Both the SDK (`npm run <step>`) and direct-API (`npm run api:<step>`) variants are available.

| Step | Script | What it does |
|------|--------|--------------|
| 0 | `0:approve` / `api:0:approve` | Approve the Quicknode builder fee |
| 1 | `1:setup` / `api:1:setup` | Health check — exchange status, market metadata, account balances |
| 2 | `2:markets` / `api:2:markets` | List active HIP-4 prediction markets (YES/NO tokens, expiry, mid prices) |
| 3 | `3:orderbook` / `api:3:orderbook` | Snapshot the order book for a prediction market |
| 4 | `4:stream` / `api:4:stream` | Stream live order book updates over WebSocket |
| 5 | `5:trade` / `api:5:trade` | Place limit and market orders on a YES or NO outcome token |

### Example

```bash
# SDK path
npm run 1:setup
npm run 2:markets
npm run 5:trade

# Direct API path
npm run api:1:setup
npm run api:2:markets
npm run api:5:trade
```

---

## Project structure

```
src/
├── 0-approve.ts            # Builder fee approval (SDK)
├── 1-setup.ts              # Setup & health check (SDK)
├── 2-list-markets.ts       # List HIP-4 markets (SDK)
├── 3-orderbook-snapshot.ts # Order book snapshot (SDK)
├── 4-stream-orderbook.ts   # Live order book stream (SDK)
├── 5-trade.ts              # Place trade (SDK)
└── api/
    ├── client.ts           # Shared build-sign-send helpers
    ├── 0-approve.ts        # Builder fee approval (direct API)
    ├── 1-setup.ts          # Setup & health check (direct API)
    ├── 2-list-markets.ts   # List HIP-4 markets (direct API)
    ├── 3-orderbook-snapshot.ts
    ├── 4-stream-orderbook.ts
    └── 5-trade.ts          # Place trade (direct API)
```

---

## Key dependencies

- [`@quicknode/hyperliquid-sdk`](https://www.npmjs.com/package/@quicknode/hyperliquid-sdk) — Quicknode's Hyperliquid SDK
- [`viem`](https://viem.sh) — EVM wallet and signing utilities (used in the direct-API path)
