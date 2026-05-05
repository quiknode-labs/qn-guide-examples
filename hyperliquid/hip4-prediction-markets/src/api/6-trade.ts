/**
 * API Script 6: Place HIP-4 Trades
 * Demonstrates all order types via hyperliquidapi.com build-sign-send:
 *   - Limit BUY  (GTC)
 *   - Limit SELL (GTC)
 *   - Market BUY  (tif: "market", no price — API auto-computes mid + 3% slippage)
 *   - Market SELL (tif: "market", no price)
 *   - Cancel resting orders
 *
 * HIP-4 rules:
 *   - Asset: "#20" (# alias) or 100000020 (native index)
 *   - grouping: "na"  (no priorityFee support)
 *   - Minimum order value: 10 USDH (size * price >= 10)
 *   - Collateral: USDH (run 5-buy-usdh first)
 *
 * Set SKIP_MARKET_ORDERS=true to skip market order examples.
 */
import { buildSignSend, hlInfo, apiGet, getAccount } from "./client.js";

const account       = getAccount();
const walletAddress = process.env.WALLET_ADDRESS ?? account.address;

// ── Discover active HIP-4 symbols ────────────────────────────
const allMids = await hlInfo("allMids") as any;
const hip4Symbols = Object.keys(allMids).filter(k => k.startsWith("#"));

if (!hip4Symbols.length) {
  console.log("No active HIP-4 (#) symbols found in allMids.");
  process.exit(0);
}

// Use the first YES-side symbol (even-numbered: #20, #30, ...)
const yesSymbol = hip4Symbols.find(s => {
  const n = parseInt(s.replace("#", ""));
  return n % 2 === 0;
}) ?? hip4Symbols[0];

const noSymbol  = `#${parseInt(yesSymbol.replace("#", "")) + 1}`;
const midPrice  = parseFloat(allMids[yesSymbol] ?? "0.5");

console.log("=".repeat(60));
console.log("HIP-4 TRADE EXAMPLES — hyperliquidapi.com");
console.log("=".repeat(60));
console.log("Wallet     :", walletAddress);
console.log("YES symbol :", yesSymbol, "| mid:", midPrice);
console.log("NO  symbol :", noSymbol,  "| mid:", allMids[noSymbol] ?? "N/A");

// ── Size calculation ──────────────────────────────────────────
// HIP-4 szDecimals=0 (integers only). size * price >= 10 USDH.
const MIN_USDH   = 10;
const buyPrice   = parseFloat((midPrice * 0.97).toFixed(4));
const sellPrice  = parseFloat((midPrice * 1.03).toFixed(4));
const limitSize  = String(Math.ceil(MIN_USDH / buyPrice) + 5);

console.log(`\nMid          : ${midPrice}`);
console.log(`Limit buy px : ${buyPrice}  (3% below mid)`);
console.log(`Limit sell px: ${sellPrice}  (3% above mid)`);
console.log(`Size         : ${limitSize} units  (notional: ${(parseInt(limitSize) * buyPrice).toFixed(2)} USDH)`);

// ── PREFLIGHT CHECK ───────────────────────────────────────────
// Validate the order without signing — catches errors before committing
console.log("\n── Preflight Check ──────────────────────────────────────");
const preflight = await fetch("https://send.hyperliquidapi.com/preflight", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: {
      type: "order",
      orders: [{ asset: yesSymbol, side: "buy", price: String(buyPrice), size: limitSize, tif: "gtc" }],
    },
  }),
}).then(r => r.json()) as any;
console.log(JSON.stringify(preflight, null, 2));

// ── LIMIT BUY (GTC) ───────────────────────────────────────────
console.log("\n── Limit BUY (GTC) ──────────────────────────────────────");
console.log(`Placing: BUY ${limitSize} ${yesSymbol} @ ${buyPrice}`);

const limitBuyResult = await buildSignSend({
  type: "order",
  orders: [{
    asset: yesSymbol,
    side: "buy",
    price: String(buyPrice),
    size: limitSize,
    tif: "gtc",
  }],
  // grouping "na" is the default and required for HIP-4 (no priorityFee)
}) as any;

console.log(JSON.stringify(limitBuyResult, null, 2));

// Extract OID from response
const limitBuyOid: number | null =
  limitBuyResult?.exchangeResponse?.data?.statuses?.[0]?.resting?.oid ??
  limitBuyResult?.exchangeResponse?.data?.statuses?.[0]?.filled?.oid ??
  null;
console.log("OID:", limitBuyOid);

// ── LIMIT SELL (GTC) ──────────────────────────────────────────
console.log("\n── Limit SELL (GTC) ─────────────────────────────────────");
console.log(`Placing: SELL ${limitSize} ${yesSymbol} @ ${sellPrice}`);

const limitSellResult = await buildSignSend({
  type: "order",
  orders: [{
    asset: yesSymbol,
    side: "sell",
    price: String(sellPrice),
    size: limitSize,
    tif: "gtc",
  }],
}) as any;

console.log(JSON.stringify(limitSellResult, null, 2));

const limitSellOid: number | null =
  limitSellResult?.exchangeResponse?.data?.statuses?.[0]?.resting?.oid ??
  limitSellResult?.exchangeResponse?.data?.statuses?.[0]?.filled?.oid ??
  null;
console.log("OID:", limitSellOid);

// ── ORDER STATUS ──────────────────────────────────────────────
if (limitBuyOid) {
  const status = await fetch("https://send.hyperliquidapi.com/orderStatus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user: walletAddress, oid: limitBuyOid }),
  }).then(r => r.json()) as any;
  console.log("\n── BUY Order Status ─────────────────────────────────────");
  console.log(JSON.stringify(status, null, 2));
}

// ── OPEN ORDERS ───────────────────────────────────────────────
const openOrders = await fetch("https://send.hyperliquidapi.com/openOrders", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user: walletAddress }),
}).then(r => r.json()) as any[];

console.log(`\n── Open Orders (${openOrders?.length ?? 0}) ─────────────────────────────────`);
for (const o of openOrders ?? []) {
  console.log(`  oid=${o.oid}  coin=${o.coin}  side=${o.side}  px=${o.limitPx}  sz=${o.sz}`);
}

// ── MARKET ORDERS ─────────────────────────────────────────────
// tif: "market" + no price → API auto-computes mid ± 3% slippage
const skipMarket = process.env.SKIP_MARKET_ORDERS === "true";

if (skipMarket) {
  console.log("\n── Market Orders (skipped — SKIP_MARKET_ORDERS=true) ────");
} else {
  const marketSize = String(Math.ceil(MIN_USDH / (midPrice * 1.03)) + 5);

  console.log("\n── Market BUY (IOC, auto-slippage) ──────────────────────");
  console.log(`Placing: marketBuy ${marketSize} ${yesSymbol} (no price — API computes slippage)`);

  const mktBuyResult = await buildSignSend({
    type: "order",
    orders: [{
      asset: yesSymbol,
      side: "buy",
      size: marketSize,
      tif: "market",  // no price field for market orders
    }],
  }) as any;
  console.log(JSON.stringify(mktBuyResult, null, 2));

  console.log("\n── Market SELL (IOC, auto-slippage) ─────────────────────");
  console.log(`Placing: marketSell ${marketSize} ${yesSymbol}`);

  const mktSellResult = await buildSignSend({
    type: "order",
    orders: [{
      asset: yesSymbol,
      side: "sell",
      size: marketSize,
      tif: "market",
    }],
  }) as any;
  console.log(JSON.stringify(mktSellResult, null, 2));
}

// ── CANCEL resting limit orders ───────────────────────────────
console.log("\n── Cancel Resting Limit Orders ──────────────────────────");
const toCancel = [limitBuyOid, limitSellOid].filter(Boolean) as number[];

if (!toCancel.length) {
  console.log("No OIDs to cancel (orders may have already filled).");
} else {
  // openOrders response includes pre-built cancel actions — use them directly
  const cancelResult = await buildSignSend({
    type: "cancel",
    cancels: toCancel.map(oid => ({ a: yesSymbol, o: oid })),
  }) as any;
  console.log(JSON.stringify(cancelResult, null, 2));
}

console.log("\nDone. View on https://app.hyperliquid.xyz/");
