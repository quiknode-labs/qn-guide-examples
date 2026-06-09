/**
 * Step 3: Orderbook Snapshot — comprehensive view
 * Fetches full L2 orderbook for both YES and NO sides with depth stats.
 */
import { HyperliquidSDK } from "@quicknode/hyperliquid-sdk";

type Level = { px: string; sz: string; n: number };

function printBook(symbol: string, bids: Level[], asks: Level[]) {
  const totalBidSz  = bids.reduce((s, l) => s + parseFloat(l.sz), 0);
  const totalAskSz  = asks.reduce((s, l) => s + parseFloat(l.sz), 0);
  const bestBid     = parseFloat(bids[0]?.px ?? "0");
  const bestAsk     = parseFloat(asks[0]?.px ?? "0");
  const spread      = bestAsk - bestBid;
  const midFromBook = (bestBid + bestAsk) / 2;

  console.log(`\n── ${symbol} ─────────────────────────────────────────────`);
  console.log(`Best bid    : ${bestBid}`);
  console.log(`Best ask    : ${bestAsk}`);
  console.log(`Spread      : ${spread.toFixed(5)}  (${((spread / midFromBook) * 100).toFixed(3)}%)`);
  console.log(`Mid (book)  : ${midFromBook.toFixed(5)}`);
  console.log(`Bid depth   : ${totalBidSz.toFixed(0)} units across ${bids.length} levels`);
  console.log(`Ask depth   : ${totalAskSz.toFixed(0)} units across ${asks.length} levels`);

  const colW = 10;
  const line = `${" ".repeat(colW)}  ─────────────────────────────────`;
  console.log(`\n${"PRICE".padStart(colW)}  ${"SIZE".padStart(8)}  ${"ORDERS".padStart(6)}`);
  console.log(line);
  for (const a of [...asks].reverse().slice(0, 8)) {
    console.log(`\x1b[31m${a.px.padStart(colW)}\x1b[0m  ${a.sz.padStart(8)}  ${String(a.n).padStart(6)}  ASK`);
  }
  console.log(`── SPREAD ${spread.toFixed(5)} ──────────────────────────────────`);
  for (const b of bids.slice(0, 8)) {
    console.log(`\x1b[32m${b.px.padStart(colW)}\x1b[0m  ${b.sz.padStart(8)}  ${String(b.n).padStart(6)}  BID`);
  }
  console.log(line);
}

const sdk = new HyperliquidSDK(process.env.QUICKNODE_ENDPOINT, {
  privateKey: process.env.PRIVATE_KEY,
});

const markets = await sdk.predictionMarkets();
if (markets.length === 0) { console.log("No active markets."); process.exit(0); }

const market = markets.find(m => parseFloat(m.yes.mid as string) !== 0.5) ?? markets[0];

console.log("=".repeat(60));
console.log("HIP-4 ORDERBOOK SNAPSHOT");
console.log("=".repeat(60));
console.log(`Market  : ${market.title}`);
console.log(`Expiry  : ${market.expiry}`);
console.log(`Time    : ${new Date().toISOString()}`);

// Fetch books for both YES and NO
const [yesBook, noBook] = await Promise.all([
  sdk.info.l2Book(market.yes.symbol) as Promise<any>,
  sdk.info.l2Book(market.no.symbol)  as Promise<any>,
]);

const yesBids: Level[] = yesBook.levels?.[0] ?? [];
const yesAsks: Level[] = yesBook.levels?.[1] ?? [];
const noBids:  Level[] = noBook.levels?.[0]  ?? [];
const noAsks:  Level[] = noBook.levels?.[1]  ?? [];

printBook(market.yes.symbol + " (YES)", yesBids, yesAsks);
printBook(market.no.symbol  + " (NO)",  noBids,  noAsks);

// Implied probabilities from mid prices
const yesMid = parseFloat(market.yes.mid ?? "0.5");
const noMid  = parseFloat(market.no.mid  ?? "0.5");
console.log("\n── Implied Probabilities ─────────────────────────────────");
console.log(`YES mid : ${(yesMid * 100).toFixed(2)}%`);
console.log(`NO  mid : ${(noMid  * 100).toFixed(2)}%`);
console.log(`Sum     : ${((yesMid + noMid) * 100).toFixed(2)}%  (should be ~100%)`);

// Live mid cross-check
const [yesMidLive, noMidLive] = await Promise.all([
  sdk.getMid(market.yes),
  sdk.getMid(market.no),
]);
console.log(`\nLive getMid YES: ${yesMidLive}`);
console.log(`Live getMid NO : ${noMidLive}`);

// Raw responses
console.log("\n── Raw YES book ──────────────────────────────────────────");
console.log(JSON.stringify(yesBook, null, 2));
console.log("\n── Raw NO book ───────────────────────────────────────────");
console.log(JSON.stringify(noBook, null, 2));
