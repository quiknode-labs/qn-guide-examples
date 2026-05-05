/**
 * API Script 3: Orderbook Snapshot
 * Uses Hyperliquid public info API for l2Book data.
 * hyperliquidapi.com handles trading; market data comes from api.hyperliquid.xyz/info.
 */
import { hlInfo } from "./client.js";

type Level = { px: string; sz: string; n: number };

function printBook(symbol: string, bids: Level[], asks: Level[]) {
  const bestBid     = parseFloat(bids[0]?.px ?? "0");
  const bestAsk     = parseFloat(asks[0]?.px ?? "0");
  const spread      = bestAsk - bestBid;
  const mid         = (bestBid + bestAsk) / 2;
  const totalBidSz  = bids.reduce((s, l) => s + parseFloat(l.sz), 0);
  const totalAskSz  = asks.reduce((s, l) => s + parseFloat(l.sz), 0);

  console.log(`\n── ${symbol} ─────────────────────────────────────────────`);
  console.log(`Best bid  : ${bestBid}`);
  console.log(`Best ask  : ${bestAsk}`);
  console.log(`Spread    : ${spread.toFixed(5)}  (${((spread / mid) * 100).toFixed(3)}%)`);
  console.log(`Mid       : ${mid.toFixed(5)}`);
  console.log(`Bid depth : ${totalBidSz.toFixed(0)} units / ${bids.length} levels`);
  console.log(`Ask depth : ${totalAskSz.toFixed(0)} units / ${asks.length} levels`);

  console.log(`\n${"PRICE".padStart(12)}  ${"SIZE".padStart(10)}  ${"ORDERS".padStart(6)}`);
  console.log("─".repeat(36));
  for (const a of [...asks].reverse().slice(0, 8)) {
    console.log(`\x1b[31m${a.px.padStart(12)}\x1b[0m  ${a.sz.padStart(10)}  ${String(a.n).padStart(6)}  ASK`);
  }
  console.log(`── spread ${spread.toFixed(5)} ────────────────────────`);
  for (const b of bids.slice(0, 8)) {
    console.log(`\x1b[32m${b.px.padStart(12)}\x1b[0m  ${b.sz.padStart(10)}  ${String(b.n).padStart(6)}  BID`);
  }
}

// Discover active HIP-4 symbols from allMids
const allMids = await hlInfo("allMids") as any;
const hip4Symbols = Object.keys(allMids).filter(k => k.startsWith("#"));

if (!hip4Symbols.length) {
  console.log("No active HIP-4 (#) symbols found in allMids.");
  process.exit(0);
}

console.log("=".repeat(60));
console.log("HIP-4 ORDERBOOK SNAPSHOT");
console.log("=".repeat(60));
console.log(`Active HIP-4 symbols: ${hip4Symbols.join(", ")}`);
console.log(`Time: ${new Date().toISOString()}`);

// Fetch books for all active HIP-4 symbols in parallel
const books = await Promise.all(
  hip4Symbols.map(sym => hlInfo("l2Book", { coin: sym }))
) as any[];

for (let i = 0; i < hip4Symbols.length; i++) {
  const sym  = hip4Symbols[i];
  const book = books[i];
  const bids: Level[] = book.levels?.[0] ?? [];
  const asks: Level[] = book.levels?.[1] ?? [];
  printBook(sym, bids, asks);
}

// Implied probability summary
console.log("\n── Implied Probabilities ─────────────────────────────────");
for (const sym of hip4Symbols) {
  const mid = parseFloat(allMids[sym] ?? "0");
  console.log(`  ${sym.padEnd(6)}: ${(mid * 100).toFixed(2)}%  (mid: ${mid})`);
}

// Raw
console.log("\n── Raw l2Book responses ──────────────────────────────────");
for (let i = 0; i < hip4Symbols.length; i++) {
  console.log(`\n${hip4Symbols[i]}:`);
  console.log(JSON.stringify(books[i], null, 2));
}
