# How to Trade Kalshi Prediction Markets on Solana Using DFlow

This project contains the example code for the Quicknode guide: [How to Trade Kalshi Prediction Markets on Solana Using DFlow](https://www.quicknode.com/guides/solana-development/3rd-party-integrations/kalshi-prediction-markets-with-dflow)

[DFlow](https://dflow.net) enables trading of [Kalshi's](https://kalshi.com) CFTC-regulated prediction markets on Solana. This project demonstrates how to build a TypeScript CLI that interacts with DFlow's infrastructure, covering the full trading lifecycle: buying outcome tokens, tracking positions, and redeeming winnings. The example uses English Premier League (EPL) match events as the demo market, but can be adapted to work with any Kalshi prediction market.

> **Warning:** This example runs on **Solana mainnet-beta** and uses real funds. Only use a wallet loaded with the amount of SOL and USDC you are willing to spend for testing.

## Prerequisites

- Node.js 20+
- A Solana wallet keypair with SOL (for transaction fees) and USDC (to purchase contracts)
- A [Quicknode](https://www.quicknode.com) Solana mainnet RPC endpoint

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root:
   ```env
   METADATA_API_URL=https://dev-prediction-markets-api.dflow.net
   TRADE_API_URL=https://dev-quote-api.dflow.net
   QUICKNODE_RPC_URL=<your-quicknode-solana-endpoint>
   KEYPAIR_PATH=<path-to-your-wallet-keypair.json>
   SERIES_TICKER=KXEPLGAME
   USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
   DFLOW_API_KEY= # required for production endpoints, leave blank for dev
   ```

The dev API URLs in the `.env` example work without an API key. Note that despite the `dev` in the URL, these endpoints still operate on Solana mainnet-beta and use real funds. For production, you will need a DFlow API key and must integrate [Proof](https://pond.dflow.net/build/proof/introduction) for KYC/identity verification to meet Kalshi compliance requirements.

## Scripts

### List market events
Fetches active prediction market events for the configured series ticker and prints available YES/NO contracts with current ask prices.
```bash
npx tsx --env-file=.env src/events.ts
```

### Buy an outcome token
Purchases YES or NO outcome tokens using USDC. Pass the outcome mint address (from the events script) and the USDC amount to spend.
```bash
npx tsx --env-file=.env src/buy.ts <outcome-mint-address> <usdc-amount>
# Example: npx tsx --env-file=.env src/buy.ts <yes-mint> 1
```

### View open positions
Scans your wallet for outcome tokens and matches them to prediction markets. Shows each position's side (YES/NO), token balance, market status, and whether it's redeemable.
```bash
npx tsx --env-file=.env src/positions.ts
```

### Redeem winning tokens
Converts winning outcome tokens back to USDC after a market has settled. Pass the mint address of the winning outcome token.
```bash
npx tsx --env-file=.env src/redeem.ts <outcome-mint-address>
```

## Project Structure

```
src/
├── events.ts     # Fetches and displays active market events
├── buy.ts        # Buys YES/NO outcome tokens with USDC
├── positions.ts  # Lists open positions in the connected wallet
├── redeem.ts     # Redeems winning tokens for USDC post-settlement
├── utils.ts      # Shared helpers (wallet loading, RPC calls, signing)
└── types.ts      # TypeScript type definitions
```

## Notes

- Outcome token mint addresses are printed by the events script. Copy the `YES mint` or `NO mint` value to use with the buy and redeem scripts.
- USDC uses 6 decimal places. Pass whole dollar amounts to the buy script (e.g. `1` = $1.00 USDC). The script handles the conversion automatically.
- The redeem script redeems your entire balance for the given mint. Losing positions cannot be redeemed. The script will print a warning if the outcome token is not a winner or if the redemption window is not yet open.
- This project uses [`@solana/kit`](https://github.com/anza-xyz/kit) for all RPC and transaction handling.
