/**
 * API Script 1: Setup & Health Check
 * Uses hyperliquidapi.com endpoints + Hyperliquid public info API.
 */
import { apiGet, hlInfo, getAccount } from "./client.js";

const account = getAccount();
const walletAddress = process.env.WALLET_ADDRESS ?? account.address;

console.log("=".repeat(60));
console.log("HYPERLIQUID API — HIP-4 SETUP");
console.log("=".repeat(60));
console.log("API base :", "https://send.hyperliquidapi.com");
console.log("Wallet   :", walletAddress);

// ── Health check ─────────────────────────────────────────────
const health = await apiGet("/health") as any;
console.log("\n── Health ───────────────────────────────────────────────");
console.log(JSON.stringify(health, null, 2));

// ── Approval status ───────────────────────────────────────────
const approval = await apiGet(`/approval?user=${walletAddress}`) as any;
console.log("\n── Builder Fee Approval ─────────────────────────────────");
console.log("approved     :", approval.approved);
console.log("maxFeeRate   :", approval.maxFeeRate);
console.log("canTradePerps:", approval.canTradePerps);
console.log("canTradeSpot :", approval.canTradeSpot);
console.log("status msg   :", approval.feeBreakdown?.status);

if (!approval.canTradePerps || !approval.canTradeSpot) {
  console.log("\n⚠  Run: pnpm run api:0:approve");
} else {
  console.log("\n✓  Ready to trade.");
}

// ── Markets (HIP-4 section) ───────────────────────────────────
const markets = await apiGet("/markets") as any;
console.log("\n── Markets Summary ──────────────────────────────────────");
console.log("perps :", markets.perps?.length ?? "N/A");
console.log("spot  :", markets.spot?.length  ?? "N/A");
console.log("hip3  :", markets.hip3?.length  ?? "N/A");
console.log("hip4  :", markets.hip4?.length  ?? "N/A");

if (markets.hip4?.length) {
  console.log("\nHIP-4 markets:");
  for (const m of markets.hip4) {
    console.log(`  ${m.symbol ?? m.name ?? JSON.stringify(m)}`);
  }
}

// ── Exchange status via Hyperliquid public API ────────────────
const exchangeStatus = await hlInfo("exchangeStatus") as any;
console.log("\n── Exchange Status (Hyperliquid info API) ───────────────");
console.log("Time            :", new Date(exchangeStatus.time).toISOString());
console.log("Special statuses:", JSON.stringify(exchangeStatus.specialStatuses));

// ── HIP-4 mid prices from public info API ────────────────────
const allMids = await hlInfo("allMids") as any;
const hip4Mids = Object.entries(allMids).filter(([k]) => k.startsWith("#"));
console.log("\n── HIP-4 Mid Prices (allMids) ───────────────────────────");
if (!hip4Mids.length) {
  console.log("  None found");
} else {
  for (const [sym, mid] of hip4Mids) {
    console.log(`  ${sym.padEnd(6)}: ${mid}`);
  }
}

// ── Spot balances (Hyperliquid public info API) ───────────────
const spotState = await hlInfo("spotClearinghouseState", { user: walletAddress }) as any;
console.log("\n── Spot Balances ────────────────────────────────────────");
const nonZero = (spotState.balances ?? []).filter((b: any) => parseFloat(b.total ?? "0") > 0);
if (!nonZero.length) {
  console.log("  No non-zero balances");
} else {
  for (const b of nonZero) {
    console.log(`  ${b.coin.padEnd(10)}: total=${b.total}  hold=${b.hold}`);
  }
}

// ── Open orders ───────────────────────────────────────────────
const openOrders = await fetch("https://send.hyperliquidapi.com/openOrders", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ user: walletAddress }),
}).then(r => r.json()) as any[];

console.log(`\n── Open Orders (${openOrders?.length ?? 0}) ─────────────────────────────────`);
if (!openOrders?.length) {
  console.log("  None");
} else {
  for (const o of openOrders) {
    console.log(`  oid=${o.oid}  coin=${o.coin}  side=${o.side}  px=${o.limitPx}  sz=${o.sz}`);
  }
}
