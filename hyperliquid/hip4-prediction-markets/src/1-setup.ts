/**
 * Step 1: Setup & Health Check
 * Comprehensive dump of exchange state, account state, and HIP-4 market info.
 */
import { HyperliquidSDK } from "@quicknode/hyperliquid-sdk";

const endpoint = process.env.QUICKNODE_ENDPOINT;
const privateKey = process.env.PRIVATE_KEY;
const walletAddress = process.env.WALLET_ADDRESS;

if (!privateKey) { console.error("PRIVATE_KEY not set"); process.exit(1); }

const sdk = new HyperliquidSDK(endpoint, { privateKey, autoApprove: true, maxFee: "1%" });

console.log("=".repeat(60));
console.log("HYPERLIQUID SDK — HIP-4 SETUP");
console.log("=".repeat(60));
console.log("Endpoint :", endpoint ?? "(default public)");
console.log("Wallet   :", walletAddress ?? "(not set — set WALLET_ADDRESS in .env)");

// ── Exchange health ──────────────────────────────────────────
const status = await sdk.info.exchangeStatus() as any;
console.log("\n── Exchange Status ─────────────────────────────────────");
console.log("Time             :", new Date(status.time).toISOString());
console.log("Special statuses :", JSON.stringify(status.specialStatuses));

// ── Market metadata ──────────────────────────────────────────
const meta     = await sdk.info.meta()     as any;
const spotMeta = await sdk.info.spotMeta() as any;
console.log("\n── Market Metadata ──────────────────────────────────────");
console.log("Perp markets     :", meta.universe?.length ?? "N/A");
console.log("Spot tokens      :", spotMeta.tokens?.length ?? "N/A");
console.log("Spot markets     :", spotMeta.universe?.length ?? "N/A");

// ── HIP-4 prediction markets ─────────────────────────────────
const markets = await sdk.predictionMarkets();
console.log("\n── HIP-4 Prediction Markets ─────────────────────────────");
console.log("Active markets   :", markets.length);
for (const m of markets) {
  console.log(`\n  Title     : ${m.title}`);
  console.log(`  Expiry    : ${m.expiry ?? "N/A"}`);
  console.log(`  Collateral: ${m.collateral}`);
  console.log(`  Min order : ${m.minOrderValue} USDH`);
  console.log(`  YES       : ${m.yes.symbol} (assetId: ${m.yes.assetId}) | mid: ${m.yes.mid}`);
  console.log(`  NO        : ${m.no.symbol}  (assetId: ${m.no.assetId}) | mid: ${m.no.mid}`);
}

// ── All mid prices (filter HIP-4 # assets) ───────────────────
const allMids = await sdk.info.allMids() as any;
const hip4Mids = Object.entries(allMids).filter(([k]) => k.startsWith("#"));
console.log("\n── HIP-4 Mid Prices (from allMids) ──────────────────────");
if (hip4Mids.length === 0) {
  console.log("  None found");
} else {
  for (const [symbol, mid] of hip4Mids) {
    console.log(`  ${symbol.padEnd(6)}: ${mid}`);
  }
}

// ── Max market order notionals ────────────────────────────────
const maxNtls = await sdk.info.maxMarketOrderNtls() as any;
console.log("\n── Max Market Order Notionals ───────────────────────────");
console.log(JSON.stringify(maxNtls, null, 2));

// ── Builder fee approval ─────────────────────────────────────
const approval = await sdk.approvalStatus() as any;
console.log("\n── Builder Fee Approval ─────────────────────────────────");
console.log("approved     :", approval.approved);
console.log("maxFeeRate   :", approval.maxFeeRate);
console.log("canTradePerps:", approval.canTradePerps);
console.log("canTradeSpot :", approval.canTradeSpot);
console.log("status msg   :", approval.feeBreakdown?.status);

if (!approval.canTradePerps || !approval.canTradeSpot) {
  console.log("\n⚠  Builder fee not approved or too low.");
  console.log("   Run: pnpm run 0:approve");
} else {
  console.log("\n✓  Builder fee approved — ready to trade.");
}

// ── Account state (requires WALLET_ADDRESS) ───────────────────
if (walletAddress) {
  const spotState = await sdk.info.spotClearinghouseState(walletAddress) as any;
  console.log("\n── Spot Balances ────────────────────────────────────────");
  for (const b of spotState.balances ?? []) {
    if (parseFloat(b.hold ?? "0") > 0 || parseFloat(b.total ?? "0") > 0) {
      console.log(`  ${b.coin.padEnd(10)}: total=${b.total}  hold=${b.hold}  entryNtl=${b.entryNtl}`);
    }
  }

  const perpState = await sdk.info.clearinghouseState(walletAddress) as any;
  console.log("\n── Perp/Outcome Positions ───────────────────────────────");
  const positions = (perpState.assetPositions ?? []).filter((p: any) => parseFloat(p.position?.szi ?? "0") !== 0);
  if (positions.length === 0) {
    console.log("  No open positions");
  } else {
    for (const { position: p } of positions) {
      console.log(`  ${p.coin.padEnd(8)}: szi=${p.szi}  entryPx=${p.entryPx}  unrealPnl=${p.unrealizedPnl}`);
    }
  }

  const openOrders = await sdk.info.openOrders(walletAddress) as any;
  console.log("\n── Open Orders ──────────────────────────────────────────");
  if (!openOrders?.length) {
    console.log("  No open orders");
  } else {
    for (const o of openOrders) {
      console.log(`  oid=${o.oid}  coin=${o.coin}  side=${o.side}  px=${o.limitPx}  sz=${o.sz}  origSz=${o.origSz}`);
    }
  }
} else {
  console.log("\n(Set WALLET_ADDRESS in .env to see balances and positions)");
}

console.log("\n" + "=".repeat(60));
console.log("Setup complete.");
