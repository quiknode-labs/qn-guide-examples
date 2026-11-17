# Hyperliquid HIP-3 Market Monitor

Monitor one builder-deployed perpetual market with Quicknode. The example measures bid/ask spread and mark/oracle divergence, checks input age, and reports connection loss and recovery in the terminal.

## Requirements

- Node.js 22 or newer and npm.
- A Quicknode Hyperliquid mainnet endpoint with Build plan or higher for gRPC streaming.
- A qualified HIP-3 coin, such as `xyz:NVDA`. Market availability can change.

## Run

```sh
npm ci
cp .env.example .env
```

Set `QUICKNODE_ENDPOINT` in `.env` to your complete endpoint URL, including the authentication token. Set `COIN` to the market to monitor. Keep `.env` private.

```sh
npm start
```

Press Ctrl+C to stop the stream and context polling.

## What the monitor does

The startup request discovers builder DEXs with `perpDexs`. It then reads `metaAndAssetCtxs` for the selected DEX, matches the full coin name, and rejects missing or delisted markets. Context polling repeats ten seconds after each request finishes, with a five-second HTTP timeout and no overlapping requests.

`StreamL2Book` supplies a full snapshot with one bid and one ask level, so the example does not maintain incremental order book state. Each new snapshot replaces the previous one. The monitor emits state changes immediately and a periodic summary every ten seconds.

- `WAITING`: connected attempt, awaiting the first book snapshot.
- `OK`: required inputs passed the configured validity and age checks; thresholds are not exceeded.
- `ALERT`: spread exceeds 20 basis points or absolute mark/oracle divergence exceeds 50 basis points.
- `STALE`: the book is more than five seconds old, or the last successful context read is more than 25 seconds old.
- `DISCONNECTED`: stream ended or failed; the previous book is discarded.
- `UNKNOWN`: prices or timestamps cannot support a valid calculation.

Spread is `(ask - bid) / ((ask + bid) / 2) * 10000`. Divergence is `(mark - oracle) / oracle * 10000`; its sign is retained in output. These defaults are illustrative and configurable through `startMonitor` in `run.ts`. They do not define universal market health or identify profitable trades.

Transient stream failures retry after an exponential delay capped at 30 seconds. The new stream must supply a fresh complete snapshot before any market condition is evaluated. Authentication and permission failures stop instead of retrying indefinitely.

## Limits and API choices

This is a small monitoring example, not a trading system. `OK` means the configured checks passed; it does not prove the deployer's underlying oracle source is current or that execution is safe. The context-read age records when this process fetched the context, not an upstream oracle timestamp. The receiver clock must be synchronized.

The single gRPC stream is metered. Requesting one level avoids downloading unused depth, but the server still sends complete snapshots each block. BBO is an alternative for change-only top-of-book updates; its silence alone cannot establish staleness. Use the current pricing and stream limits when adapting this example to more markets.

## References

- [StreamL2Book](https://www.quicknode.com/docs/hyperliquid/grpc-api/StreamL2Book)
- [L2 snapshots](https://www.quicknode.com/docs/hyperliquid/datasets/l2-book)
- [Market contexts](https://www.quicknode.com/docs/hyperliquid/info-endpoints/metaAndAssetCtxs)
- [Plan access, metering, and streaming limits](https://www.quicknode.com/docs/hyperliquid/pricing)
- [Maintained HyperCore gRPC examples](https://github.com/quiknode-labs/hypercore-grpc-examples)

## Type check

```sh
npm run check
```
