# Titan Swap — Meta-Aggregation on Solana

A single-page Solana swap UI built on the **Titan Gateway** meta-aggregation API,
served through **Quicknode**. Instead of hiding routing behind a single number,
this app surfaces what makes meta-aggregation interesting: multiple providers
competing for the best route, the on-chain venues a route touches, and a
self-custodial build → sign → send flow you own end to end.

## What it shows off

- **Provider race** — Titan sources quotes from several providers (its own DART
  router plus other aggregators and RFQ venues). The UI shows every competing
  quote side by side, the basis points each is behind the leader, and which one
  Titan picks as the expected winner.
- **Routing venues** — lights up the on-chain venues the winning route actually
  touches, derived by intersecting the route's instruction program ids with the
  venue program ids from `GET /api/v1/venues`.
- **Composable instructions** — Titan returns instructions + address lookup
  tables, not a sealed transaction. The app builds a v0 transaction itself, the
  wallet signs it, and it's submitted and confirmed through Quicknode RPC.
- **Accurate vs. Fast** — a toggle that maps to Titan's `simulate` parameter,
  with the round-trip latency shown next to the results.
- **Price vs. swap endpoints** — an unconnected wallet uses the lightweight
  `/quote/price` endpoint for an indicative rate; a connected wallet uses
  `/quote/swap` for the full provider race and executable instructions.

## Architecture

Both credentials stay on the server. Browser code talks to local Next.js route
handlers: `/api/titan/*` calls the Gateway (decoding MessagePack and normalizing
pubkeys), and `/api/rpc` proxies Solana JSON-RPC to the QuickNode endpoint.
Neither the Gateway auth nor the RPC token ever reaches the client.

```
Browser ──> /api/titan/* ──> Titan Gateway (MessagePack decode, server-only)
        └─> /api/rpc     ──> QuickNode Solana RPC (token server-only)
```

Because the RPC proxy carries only HTTP JSON-RPC (no WebSocket), the app
confirms transactions by polling `getSignatureStatuses` rather than via a
signature subscription.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` (see `.env.local.example`). Both are server-only:
   ```bash
   QUICKNODE_RPC_URL=your_quicknode_solana_rpc_url
   TITAN_GATEWAY_URL=your_titan_gateway_addon_url
   # TITAN_GATEWAY_AUTH=optional_bearer_token
   ```
   Enable the [Titan Gateway add-on](https://marketplace.quicknode.com/add-on/titan-gateway)
   on your Quicknode endpoint to get the Gateway URL.

3. Run the dev server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Tech stack

- **Framework:** Next.js 16 (App Router, server route handlers)
- **UI:** React 19 + Tailwind CSS v4 (Quicknode dark design tokens)
- **Wallets:** Solana Wallet Adapter (Phantom, Solflare)
- **Chain:** Solana mainnet via Quicknode RPC
- **Swap API:** Titan Gateway meta-aggregation (`@msgpack/msgpack` decode)
- **Transactions:** `@solana/web3.js` v0 transaction assembly

## Project structure

```
├── app/
│   ├── api/titan/            # Server proxy: info, providers, venues, price, swap
│   ├── api/rpc/              # Server proxy: Solana JSON-RPC (hides QuickNode token)
│   ├── layout.tsx
│   ├── page.tsx              # Main swap UI
│   ├── globals.css           # Tailwind v4 + Quicknode dark design tokens
│   └── providers/WalletProvider.tsx
├── components/
│   ├── ProviderRace.tsx      # Competing-provider visualization
│   ├── VenueSplit.tsx        # Venues touched by the winning route
│   ├── SimulationToggle.tsx  # Accurate vs. Fast (simulate param)
│   ├── SlippageControl.tsx
│   ├── TokenInput.tsx / TokenSelector.tsx / SwapButton.tsx / StatusMessage.tsx
│   └── SwapCard.tsx / WalletButton.tsx
├── hooks/
│   ├── useQuote.ts           # /quote/swap (connected) or /quote/price
│   ├── useSwap.ts            # build → sign → send → confirm
│   ├── useTokenBalances.ts   # balances via Quicknode RPC
│   ├── useTokenList.ts
│   └── useTitanMeta.ts       # providers / venues / info
└── lib/
    ├── titan-server.ts       # server-only Gateway client (MessagePack)
    ├── titan.ts              # client fetchers for /api/titan/*
    ├── build-swap-tx.ts      # instructions + ALTs -> VersionedTransaction
    ├── tokens.ts             # token metadata registry
    └── types.ts
```

## Notes

- Solana mainnet only.
- Titan Gateway supports exact-in swaps; output is always estimated.
- No priority-fee or tip injection — the focus is Titan's routing, not
  transaction-landing strategy.

## License

ISC
