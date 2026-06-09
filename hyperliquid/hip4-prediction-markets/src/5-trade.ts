/**
 * Step 5: Place HIP-4 Trades
 * Demonstrates all order types:
 *   - Limit BUY  (GTC, passive maker)
 *   - Limit SELL (GTC, passive maker)
 *   - Market BUY  (IOC, fills immediately at best ask)
 *   - Market SELL (IOC, fills immediately at best bid)
 *
 * Prerequisites:
 *   - Run 0:approve first (builder fee)
 *   - 10 USDC minimum order value (size * price >= 10)
 *
 * Set WALLET_ADDRESS in .env to see order status and open orders.
 * Set SKIP_MARKET_ORDERS=true in .env to skip the market order examples.
 */
import { HyperliquidSDK } from "@quicknode/hyperliquid-sdk";

function printOrder(label: string, o: { oid: number | null; status: string; isResting: boolean; isFilled: boolean; isError: boolean; filledSize: string | null; avgPrice: string | null; price: string | null; size: string }) {
  console.log(`\n── ${label} ${"─".repeat(50 - label.length)}`);
  console.log("OID        :", o.oid);
  console.log("Status     :", o.status);
  console.log("isResting  :", o.isResting);
  console.log("isFilled   :", o.isFilled);
  console.log("isError    :", o.isError);
  console.log("price      :", o.price);
  console.log("size       :", o.size);
  console.log("filledSize :", o.filledSize);
  console.log("avgPrice   :", o.avgPrice);
}

const sdk = new HyperliquidSDK(process.env.QUICKNODE_ENDPOINT, {
  privateKey: process.env.PRIVATE_KEY,
  autoApprove: true,
});

// ── Discover market ────────────────────────────────────────────
const markets = await sdk.predictionMarkets();
if (markets.length === 0) { console.log("No active HIP-4 markets found."); process.exit(0); }

// Skip placeholder markets that have exactly 0.5 mid on both sides (no real liquidity)
const market = markets.find(m => parseFloat(m.yes.mid as string) !== 0.5) ?? markets[0];
const midPrice = await sdk.getMid(market.yes);

console.log("=".repeat(60));
console.log("HIP-4 TRADE EXAMPLES");
console.log("=".repeat(60));
console.log("Market     :", market.title);
console.log("Collateral :", market.collateral, "(min order:", market.minOrderValue, market.collateral + ")");
console.log("YES        :", market.yes.symbol, "| Mid:", market.yes.mid);
console.log("NO         :", market.no.symbol,  "| Mid:", market.no.mid);
console.log("Live mid   :", midPrice);

// ── LIMIT ORDERS ───────────────────────────────────────────────
// Passive maker orders placed away from the current mid.
// GTC = Good Till Cancel — stays on book until filled or cancelled.
// HIP-4 does NOT support priorityFee — always use grouping: "na" (SDK default).

const buyPrice  = parseFloat((midPrice * 0.97).toFixed(4)); // 3% below mid
const sellPrice = parseFloat((midPrice * 1.03).toFixed(4)); // 3% above mid

// HIP-4 szDecimals=0 (whole units only). Minimum order value is 10 USDC.
// Calculate the smallest integer size that satisfies: size * price >= 10 USDC.
const minOrderUSDC = Number(market.minOrderValue);
const limitSize = Math.ceil(minOrderUSDC / buyPrice) + 5; // +5 buffer above minimum

console.log(`\n── Limit Orders (passive, GTC) ───────────────────────────`);
console.log(`Min size at buyPrice ${buyPrice}: ${Math.ceil(minOrderUSDC / buyPrice)} units`);
console.log(`Using size ${limitSize} → notional ${(limitSize * buyPrice).toFixed(2)} USDC`);
console.log(`BUY  ${limitSize} @ ${buyPrice}  (${((1 - buyPrice / midPrice) * 100).toFixed(1)}% below mid)`);
console.log(`SELL ${limitSize} @ ${sellPrice}  (${((sellPrice / midPrice - 1) * 100).toFixed(1)}% above mid)`);

const limitBuy = await sdk.buy(market.yes, {
  size: limitSize,
  price: buyPrice,
  tif: "gtc",
});
printOrder("LIMIT BUY (YES)", limitBuy);

const limitSell = await sdk.sell(market.yes, {
  size: limitSize,
  price: sellPrice,
  tif: "gtc",
});
printOrder("LIMIT SELL (YES)", limitSell);

// ── MARKET ORDERS ──────────────────────────────────────────────
// Market orders fill immediately at the best available price.
// sdk.marketBuy / sdk.marketSell use IOC with a slippage tolerance (default 3%).
// Size must still satisfy the 10 USDC minimum: size * bestAsk >= 10.
// NOTE: market orders consume liquidity — use only when you need immediate fill.

const skipMarket = process.env.SKIP_MARKET_ORDERS === "true";

if (skipMarket) {
  console.log("\n── Market Orders (skipped — SKIP_MARKET_ORDERS=true) ────");
} else {
  // For market orders, use the ask price (worst case for a buy) to size correctly.
  // With 3% slippage the effective price could be midPrice * 1.03, so size accordingly.
  const worstCasePx = midPrice * 1.03;
  const marketSize  = Math.ceil(minOrderUSDC / worstCasePx) + 5;

  console.log(`\n── Market Orders (immediate fill, IOC, 3% slippage) ─────`);
  console.log(`Using size ${marketSize} → notional ~${(marketSize * midPrice).toFixed(2)} USDC`);
  console.log(`marketBuy  ${marketSize} units on YES side`);
  console.log(`marketSell ${marketSize} units on YES side`);

  const marketBuy = await sdk.marketBuy(market.yes, {
    size: marketSize,
    slippage: 0.03, // 3% max slippage — SDK default, shown explicitly
  });
  printOrder("MARKET BUY (YES)", marketBuy);

  const marketSell = await sdk.marketSell(market.yes, {
    size: marketSize,
    slippage: 0.03,
  });
  printOrder("MARKET SELL (YES)", marketSell);
}

// ── Open orders + account state ────────────────────────────────
const walletAddress = process.env.WALLET_ADDRESS;
if (walletAddress) {
  const openOrders = await sdk.info.openOrders(walletAddress) as any[];
  console.log(`\n── Open Orders (${openOrders?.length ?? 0}) ─────────────────────────────────`);
  if (!openOrders?.length) {
    console.log("None");
  } else {
    for (const o of openOrders) {
      console.log(`  oid=${o.oid}  coin=${o.coin}  side=${o.side}  px=${o.limitPx}  sz=${o.sz}  origSz=${o.origSz}`);
    }
  }

  if (limitBuy.oid) {
    const status = await sdk.info.orderStatus(walletAddress, limitBuy.oid) as any;
    console.log("\n── Limit BUY Order Status ────────────────────────────────");
    console.log(JSON.stringify(status, null, 2));
  }
}

// ── Cancel the resting limit orders ───────────────────────────
console.log("\n── Cancelling resting limit orders ──────────────────────");
if (limitBuy.isResting) {
  const c = await limitBuy.cancel();
  console.log("Limit BUY cancelled :", JSON.stringify(c));
} else {
  console.log("Limit BUY not resting — nothing to cancel");
}

if (limitSell.isResting) {
  const c = await limitSell.cancel();
  console.log("Limit SELL cancelled:", JSON.stringify(c));
} else {
  console.log("Limit SELL not resting — nothing to cancel");
}

console.log("\nDone. View on https://app.hyperliquid.xyz/");
