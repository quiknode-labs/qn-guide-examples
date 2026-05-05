/**
 * API Script 2: List HIP-4 Markets
 * GET /markets from hyperliquidapi.com + recent trades + mids from public info API.
 */
import { apiGet, hlInfo } from "./client.js";

const walletAddress = process.env.WALLET_ADDRESS;

console.log("=".repeat(60));
console.log("HIP-4 PREDICTION MARKETS — hyperliquidapi.com");
console.log("=".repeat(60));

// ── GET /markets ──────────────────────────────────────────────
const markets = await apiGet("/markets") as any;
const hip4 = markets.hip4 ?? [];

console.log(`\nFound ${hip4.length} HIP-4 market(s) via GET /markets\n`);
console.log("Raw HIP-4 section:");
console.log(JSON.stringify(hip4, null, 2));

// ── Mid prices from public info API ──────────────────────────
const allMids = await hlInfo("allMids") as any;
const hip4Mids = Object.fromEntries(
  Object.entries(allMids).filter(([k]) => k.startsWith("#"))
);

console.log("\n── HIP-4 Mid Prices (from allMids) ──────────────────────");
if (!Object.keys(hip4Mids).length) {
  console.log("  No # symbols in allMids");
} else {
  for (const [sym, mid] of Object.entries(hip4Mids)) {
    console.log(`  ${sym.padEnd(6)}: ${mid}`);
  }
}

// ── Recent trades per HIP-4 symbol ───────────────────────────
// Extract unique # symbols from mid prices
const symbols = Object.keys(hip4Mids);

for (const symbol of symbols) {
  console.log(`\n── Recent Trades: ${symbol} ─────────────────────────────`);
  const trades = await hlInfo("recentTrades", { coin: symbol }) as any[];
  if (!trades?.length) {
    console.log("  No recent trades");
  } else {
    for (const t of trades.slice(0, 5)) {
      console.log(`  [${new Date(t.time).toISOString()}] ${t.side} px=${t.px}  sz=${t.sz}`);
    }
  }
}

// ── User fills for HIP-4 ─────────────────────────────────────
if (walletAddress && symbols.length > 0) {
  const fills = await hlInfo("userFills", { user: walletAddress }) as any[];
  const hip4Fills = fills?.filter((f: any) => f.coin?.startsWith("#")) ?? [];
  console.log(`\n── Your HIP-4 Fills (${hip4Fills.length}) ──────────────────────────────`);
  if (!hip4Fills.length) {
    console.log("  None");
  } else {
    for (const f of hip4Fills.slice(0, 10)) {
      console.log(`  [${new Date(f.time).toISOString()}] ${f.coin} ${f.side} px=${f.px} sz=${f.sz} fee=${f.fee}`);
    }
  }
}
