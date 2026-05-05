/**
 * API Script 4: Stream Outcome Market Orderbook via WebSocket
 * Uses Hyperliquid native WebSocket (wss://api.hyperliquid.xyz/ws) directly.
 * hyperliquidapi.com is REST-only; streaming uses the native HL WebSocket.
 *
 * Subscribes to:
 *   - l2Book: full snapshots for HIP-4 YES/NO symbols
 *   - allMids: mid price ticks (canary)
 *
 * Runs for 30 seconds then exits.
 */
import WebSocket from "ws";
import { hlInfo, HL_WS } from "./client.js";

// Discover active HIP-4 symbols
const allMids = await hlInfo("allMids") as any;
const hip4Symbols = Object.keys(allMids).filter(k => k.startsWith("#"));

if (!hip4Symbols.length) {
  console.log("No active HIP-4 (#) symbols found.");
  process.exit(0);
}

console.log("=".repeat(60));
console.log("HIP-4 ORDERBOOK STREAM — native WebSocket");
console.log("=".repeat(60));
console.log(`Symbols : ${hip4Symbols.join(", ")}`);
console.log(`WS URL  : ${HL_WS}`);
console.log("Streaming for 30 seconds...\n");

const ws = new WebSocket(HL_WS);

let midTicks  = 0;
let bookTicks: Record<string, number> = {};
const hip4MidsCurrent: Record<string, string> = {};

ws.on("open", () => {
  console.log("[ws] Connected ✓");

  // Subscribe to allMids
  ws.send(JSON.stringify({
    method: "subscribe",
    subscription: { type: "allMids" },
  }));

  // Subscribe to l2Book for each HIP-4 symbol
  for (const sym of hip4Symbols) {
    ws.send(JSON.stringify({
      method: "subscribe",
      subscription: { type: "l2Book", coin: sym },
    }));
    bookTicks[sym] = 0;
    console.log(`[ws] Subscribed to l2Book: ${sym}`);
  }
});

ws.on("message", (raw: Buffer) => {
  const msg = JSON.parse(raw.toString()) as any;

  // allMids tick
  if (msg.channel === "allMids") {
    midTicks++;
    const mids = msg.data?.mids ?? msg.data ?? {};
    for (const sym of hip4Symbols) {
      if (mids[sym]) hip4MidsCurrent[sym] = mids[sym];
    }
    if (midTicks === 1) {
      console.log("[allMids] Stream live ✓  HIP-4 mids:", JSON.stringify(hip4MidsCurrent));
    }
    if (midTicks % 10 === 0) {
      console.log(`[allMids] tick #${midTicks}  HIP-4:`, JSON.stringify(hip4MidsCurrent));
    }
    return;
  }

  // l2Book snapshot
  if (msg.channel === "l2Book") {
    const data = msg.data;
    const sym  = data?.coin;
    if (!sym) return;
    bookTicks[sym] = (bookTicks[sym] ?? 0) + 1;

    const levels = data.levels as Array<Array<{ px: string; sz: string; n: number }>>;
    const bids   = levels?.[0]?.slice(0, 3) ?? [];
    const asks   = levels?.[1]?.slice(0, 3) ?? [];
    const bestBid = bids[0]?.px ?? "N/A";
    const bestAsk = asks[0]?.px ?? "N/A";

    console.log(`\n[l2Book #${bookTicks[sym]}] ${sym}  bestBid=${bestBid}  bestAsk=${bestAsk}  t=${data.time}`);
    console.log("  asks:", asks.map(a => `${a.px}x${a.sz}`).join("  "));
    console.log("  bids:", bids.map(b => `${b.px}x${b.sz}`).join("  "));
    return;
  }

  // Log any other message type
  if (msg.channel) {
    console.log(`[ws] ${msg.channel}:`, JSON.stringify(msg.data).slice(0, 120));
  }
});

ws.on("error", (err: Error) => console.error("[ws] Error:", err.message));
ws.on("close", () => console.log("[ws] Closed"));

await new Promise((resolve) => setTimeout(resolve, 30_000));
ws.close();

console.log("\n" + "=".repeat(60));
console.log("STREAM SUMMARY");
console.log(`allMids ticks  : ${midTicks}`);
for (const sym of hip4Symbols) {
  console.log(`l2Book ${sym.padEnd(5)}: ${bookTicks[sym] ?? 0} snapshots`);
}
console.log("Final mids     :", JSON.stringify(hip4MidsCurrent));
process.exit(0);
