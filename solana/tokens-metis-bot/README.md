# Tokens + Metis trading bot

A rules-based Solana trading bot sample. It discovers and screens tokens with the Tokens API, then executes swaps through Quicknode's Metis (Jupiter Swap) API via a `@solana/kit` custom transport.

This is a technical sample for a Quicknode guide. It is educational, not financial advice, and it ships with live trading disabled by default.

## How it works

On each cycle the bot:

1. Pulls trending Solana assets from the Tokens API `/assets/trending` endpoint, scoped to the categories in `rules.json` (`universe.categories`, for example crypto, tokenized treasuries, ETFs, commodities, and equities). Each category is queried and the results are merged and deduped by canonical asset.
2. Screens each asset against `rules.json`: liquidity tier floor, risk flag gate, 24h volume floor, and momentum threshold. Screening is pure and deterministic; the same inputs always produce the same decisions.
3. Diffs the passing set against held positions to produce buy, sell, and hold sets.
4. For each trade, asks the Tokens API for the deepest market, maps that venue to a Metis `dexes` allowlist, quotes, and swaps. Every swap simulates before sending and refuses quotes whose price impact exceeds a hard ceiling.
5. Records every action to `data/state.json` and an append-only `logs/trades.ndjson` audit log.

Discovery (Tokens API), decision (pure rules engine), and execution (Metis) are three separate layers. The engine has no network access and is fully unit-tested.

## Safety model

- `DRY_RUN=true` is the default. The bot quotes and logs intended trades but signs nothing. Live trading requires setting `DRY_RUN=false` explicitly.
- A kill-switch file (`./STOP` by default) makes the bot exit without trading, checked at startup, each loop wake, and between trades.
- Position count and size caps are enforced before every buy, clamped to the actual wallet balance.
- Every transaction is simulated before it is sent; a failed simulation aborts the trade.
- Quotes with more than 2.5% price impact are refused regardless of slippage tolerance.

**Use a dedicated dev wallet with a small balance.** The env file holds only the path to a keypair file, not the secret itself; the secret bytes stay on disk and are loaded via the `@solana/kit-plugin-signer` file loader. Still, do not point this sample at a wallet holding funds you care about.

## Prerequisites

- Node.js 22 or later
- A Quicknode Solana mainnet endpoint ([sign up here](https://www.quicknode.com))
- The Metis - Jupiter Swap API add-on enabled on your Quicknode account (the public `https://public.jupiterapi.com` endpoint works as a testing-only fallback)
- A Tokens API key from [app.tokens.xyz](https://app.tokens.xyz)
- The Solana CLI, to create a dev wallet keypair file

## Setup

```bash
npm install
cp env.example env.local
```

Create a dedicated dev wallet keypair file (do not reuse a wallet with real funds):

```bash
solana-keygen new --outfile ./dev-wallet.json
```

Fill in `env.local`:

| Variable | Value |
| --- | --- |
| `SOLANA_RPC_URL` | Your Quicknode Solana mainnet endpoint |
| `METIS_ENDPOINT` | `https://jupiter-swap-api.quiknode.pro/YOUR_KEY` (or the public fallback) |
| `TOKENS_API_BASE_URL` | `https://api.tokens.xyz/v1` |
| `TOKENS_API_KEY` | Your Tokens API key |
| `WALLET_KEYPAIR_PATH` | Path to your dev wallet keypair file, e.g. `./dev-wallet.json` or `~/.config/solana/id.json` |
| `DRY_RUN` | Keep `true` until you have watched several dry cycles |

Tune `rules.json` to taste. Unknown fields are rejected at startup.

## Run

Single cycle (recommended first run):

```bash
RUN_ONCE=true npx tsx --env-file=env.local src/index.ts
```

Continuous loop:

```bash
npm start
```

Stop a running bot without killing the process mid-trade:

```bash
touch STOP
```

## Test

```bash
npm test
```

The suite unit-tests the screen, diff, and venue-mapping engines, plus an end-to-end dry-run flow with all clients mocked. No test touches the network or places a trade.

## Project layout

```text
src/
  index.ts          entrypoint and poll loop
  config.ts         env + rules.json validation, fail fast
  types.ts          shared types
  clients/
    tokens.ts       Tokens API (discovery, risk, variants, markets)
    metis.ts        Metis quote/swap wrappers
    metisTypes.ts   verified Metis request/response shapes
    rpc.ts          @solana/kit client, custom Metis transport, wallet
  engine/           pure decision logic (no I/O)
    screen.ts       universe -> passing candidates
    diff.ts         passing + held -> buy/sell/hold
    dexMap.ts       Tokens API venue -> Metis dexes allowlist
  exec/executor.ts  sizing, quoting, swapping, state updates
  state/store.ts    atomic JSON position store
  log/logger.ts     console + NDJSON trade log
```

See `NOTES.md` for deltas found between the original spec and the live API docs.
