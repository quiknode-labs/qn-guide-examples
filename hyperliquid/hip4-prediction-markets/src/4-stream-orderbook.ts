/**
 * Step 4: Stream Outcome Market Orderbook via WebSocket
 *
 * Streams:
 *  - bookUpdates: order book deltas (fires on every change)
 *  - l2Book:      full L2 snapshot (periodic)
 *  - allMids:     mid price ticks (canary + price tracking)
 *
 * Event structure (bookUpdates):
 *   type: "data"
 *   stream: "hl.book_updates"
 *   block.events[]: { user, oid, coin, side ("A"=ask/"B"=bid), px, raw_book_diff ("remove" | {new:{sz}} | {update:{ori
    +gSz,newSz}}) }
 *
 * Runs for 30 seconds then exits.
 */
import { HyperliquidSDK } from "@quicknode/hyperliquid-sdk";

const sdk = new HyperliquidSDK(process.env.QUICKNODE_ENDPOINT, {
  privateKey: process.env.PRIVATE_KEY,
});

const markets = await sdk.predictionMarkets();
if (markets.length === 0) { console.log("No active markets."); process.exit(0); }

const market = markets[0];
const symbol = market.yes.symbol; // e.g. "#20"

console.log("=".repeat(60));
console.log("HIP-4 ORDERBOOK STREAM");
console.log("=".repeat(60));
console.log(`Market : ${market.title}`);
console.log(`Symbol : ${symbol}  |  YES mid: ${market.yes.mid}  |  NO mid: ${market.no.mid}`);
console.log("Streaming for 30 seconds...\n");

let midUpdates   = 0;
let bookDeltaCount = 0;
let snapshotCount  = 0;
const hip4Mids: Record<string, string> = {};

// ── allMids ──────────────────────────────────────────────────
sdk.stream.allMids((data: Record<string, unknown>) => {
  midUpdates++;
  const mids = data as Record<string, string>;
  // Track only HIP-4 #N prices
  for (const [k, v] of Object.entries(mids)) {
    if (k.startsWith("#")) hip4Mids[k] = v;
  }
  if (midUpdates === 1) {
    console.log("[allMids] Stream live ✓");
    if (Object.keys(hip4Mids).length > 0) {
      console.log("[allMids] HIP-4 mids:", JSON.stringify(hip4Mids));
    } else {
      console.log("[allMids] No HIP-4 (#) symbols in mids response");
    }
  }
  if (midUpdates % 10 === 0) {
    console.log(`[allMids] tick #${midUpdates} | HIP-4:`, JSON.stringify(hip4Mids));
  }
});

// ── bookUpdates (deltas) ─────────────────────────────────────
sdk.stream.bookUpdates([symbol], (data: Record<string, unknown>) => {
  bookDeltaCount++;
  const block = (data as any).block as {
    local_time: string;
    block_time: string;
    block_number: number;
    events: Array<{
      user: string;
      oid: number;
      coin: string;
      side: string; // "A" = ask, "B" = bid
      px: string;
      raw_book_diff:
        | string
        | { new: { sz: string } }
        | { update: { origSz: string; newSz: string } };
    }>;
  };

  if (!block) {
    console.log(`[bookUpdates #${bookDeltaCount}] unexpected shape:`, JSON.stringify(data));
    return;
  }

  for (const ev of block.events ?? []) {
    const sideLabel = ev.side === "A" ? "ASK" : "BID";
    const action    = ev.raw_book_diff === "add" ? "+" : "-";
    console.log(
      `[bookUpdate #${bookDeltaCount}] block=${block.block_number}` +
      `  ${action}${sideLabel.padEnd(3)} px=${ev.px.padEnd(10)} oid=${ev.oid}` +
      `  user=${ev.user.slice(0, 10)}...` +
      `  t=${block.block_time.slice(11, 23)}`
    );
  }
});

// ── l2Book (full snapshots) ───────────────────────────────────
sdk.stream.l2Book(symbol, (data: Record<string, unknown>) => {
  snapshotCount++;
  const levels = (data as any).levels as Array<Array<{ px: string; sz: string; n: number }>>;
  if (!levels) {
    console.log(`[l2Book #${snapshotCount}] raw:`, JSON.stringify(data));
    return;
  }
  const bids = levels[0]?.slice(0, 5) ?? [];
  const asks = levels[1]?.slice(0, 5) ?? [];
  const bestBid = bids[0]?.px ?? "N/A";
  const bestAsk = asks[0]?.px ?? "N/A";
  console.log(`\n[l2Book #${snapshotCount}] snapshot — bestBid=${bestBid}  bestAsk=${bestAsk}`);
  console.log("  asks (top 5):", asks.map((a) => `${a.px}x${a.sz}`).join("  "));
  console.log("  bids (top 5):", bids.map((b) => `${b.px}x${b.sz}`).join("  "));
});

sdk.stream.start();

await new Promise((resolve) => setTimeout(resolve, 30_000));
sdk.stream.stop();

console.log(`\n${"=".repeat(60)}`);
console.log("STREAM SUMMARY");
console.log(`allMids ticks     : ${midUpdates}`);
console.log(`bookUpdate deltas : ${bookDeltaCount}`);
console.log(`l2Book snapshots  : ${snapshotCount}`);
console.log(`Final HIP-4 mids  :`, JSON.stringify(hip4Mids));
process.exit(0);
