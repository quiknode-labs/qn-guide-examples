# Rebuilding Hyperliquid L2 Order Book History

Companion code for the Quicknode guide on rebuilding historical Hyperliquid L2 order book snapshots.

The tool reconstructs a bounded window of **historical L2 order book snapshots** for one Hyperliquid market. It works backward from the present instead of forward from genesis:

1. Capture a complete, height-tagged live order checkpoint over gRPC (`StreamL4Book`).
2. Fetch historical `book` and `orders` blocks over JSON-RPC (`hl_getBatchBlocks`) for the requested range.
3. Walk those blocks backward from the checkpoint, emitting an aggregated L2 snapshot (price, size, order count) at every block.
4. Replay the same blocks forward again and require an exact order-state match against the original checkpoint before trusting the output.

All prices and sizes use 18-place fixed-point `bigint` arithmetic — JavaScript floating point is never used for book values.

---

## Prerequisites

- Node.js 22–24
- A Quicknode Hyperliquid endpoint with the Hypercore add-on enabled (gRPC + JSON-RPC access)

## Setup

```bash
npm install
cp .env.example .env   # fill in your endpoint
npm run typecheck
npm test
```

### Environment variables

| Variable | Required | Description |
|----------|----------|--------------|
| `QUICKNODE_ENDPOINT_URL` | Yes | Full authenticated Quicknode Hyperliquid provider URL, e.g. `https://your-endpoint.hype-mainnet.quiknode.pro/your-token` |
| `QUICKNODE_HYPERCORE_URL` | No | Alternate variable name; used if set and `QUICKNODE_ENDPOINT_URL` is not |

The CLI never prints the authenticated URL or token, and `.env*` files are gitignored by default (except `.env.example`).

All scripts run with `tsx --env-file=.env`, so a `.env` file in this directory is loaded automatically — no need to `export` variables or install `dotenv`.

---

## Scripts

| Script | What it does |
|--------|--------------|
| `npm run reconstruct -- --coin BTC --blocks 20 --levels 20 --out btc-l2.jsonl` | Main workflow: capture a checkpoint, reconstruct L2 snapshots backward, validate the round trip, write JSONL |
| `npm run checkpoint -- --coin BTC` | Capture and print a live L4 checkpoint (height, best bid/ask, resting order counts) |
| `npm run validate:jsonl -- --file btc-l2.jsonl` | Independently re-validate a previously written JSONL output |
| `npm run validate:anchor -- --coin BTC --blocks 20` | Start from an independent earlier checkpoint, replay forward then back, and confirm an exact match |
| `npm run validate:differential -- --coin BTC --blocks 5 --levels 100` | Cross-surface proof: compare observed gRPC L2 snapshots against the same blocks reconstructed from JSON-RPC |
| `npm run analyze:events -- --blocks 50` | Profile raw book/order event types across a block range (new/update/remove counts, recoverability) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run typecheck` | Type-check without emitting |
| `npm test` | Run the offline unit test suite (no network access, no secrets) |

`npm run rebuild -- ...` is an alias for `reconstruct`.

### Example

```bash
npm run reconstruct -- --coin BTC --blocks 20 --levels 20 --out btc-l2.jsonl
```

Each output line is a complete requested L2 depth snapshot at one block:

```json
{"blockNumber":1075769912,"blockTime":"2026-07-17T08:58:53.938920881","coin":"BTC","bids":[{"px":"62945","sz":"0.18012","n":4}],"asks":[{"px":"62946","sz":"26.50908","n":72}]}
```

The command also prints a run report — checkpoint order count, block range, transition counts (new/update/remove), output path, validation result, and estimated JSON-RPC credits used.

---

## Guardrails

- A single run is capped at 200 blocks and 100 output levels per side (`hl_getBatchBlocks` is inclusive at both ends and supports at most 200 blocks per call).
- Every returned `book`/`orders` block time must align exactly with the gRPC checkpoint height/time.
- Any incomplete or ambiguous source data (unrecoverable cancellation size, crossed book, missing block, checkpoint mismatch) causes a hard failure — never a best-effort snapshot.
- Perpetual symbols (`BTC`, `ETH`, `XRP`, ...) are the supported path. Native spot identifiers (e.g. `@142`) work but friendly spot-symbol resolution is not included.

## Project structure

```text
proto/orderbook.proto           Quicknode order-book gRPC service contract
src/checkpoint/l4-grpc.ts       Live L4 checkpoint + observed L2 capture over gRPC
src/checkpoint/capture.ts       CLI: print a live checkpoint
src/checkpoint/validate-anchor.ts  CLI: independent-checkpoint round-trip proof
src/data/endpoint.ts            Secret-safe Quicknode endpoint parsing
src/data/hypercore-json-rpc.ts  Bounded historical book/orders block ingestion
src/data/types.ts               Raw event types (new/update/remove diffs)
src/replay/decimal.ts           Exact fixed-point price/size parsing and formatting
src/replay/order-book.ts        Per-order book state and deterministic L2 aggregation
src/replay/replay.ts            Forward and inverse block transition logic
src/validation/                 JSONL, differential, and event-profile validators
src/cli.ts                      Main reconstruction workflow and run report
tests/fixtures/                 Secret-free transition fixtures
tests/unit/                     Offline replay and endpoint tests
```
