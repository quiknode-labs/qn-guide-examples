/**
 * API Script 0: Approve Builder Fee
 * One-time per wallet. Required before trading via hyperliquidapi.com.
 *
 * Build-sign-send: approveBuilderFee action with maxFeeRate "1%"
 */
import { buildSignSend, apiGet, getAccount } from "./client.js";

const MAX_FEE = "1%";
const account = getAccount();

console.log("=".repeat(60));
console.log("BUILDER FEE APPROVAL — hyperliquidapi.com");
console.log("=".repeat(60));
console.log("Wallet:", account.address);

// 1. Check current status
const before = await apiGet(`/approval?user=${account.address}`) as any;
console.log("\n── Current Status ───────────────────────────────────────");
console.log("approved     :", before.approved);
console.log("maxFeeRate   :", before.maxFeeRate);
console.log("canTradePerps:", before.canTradePerps);
console.log("canTradeSpot :", before.canTradeSpot);
console.log("status msg   :", before.feeBreakdown?.status);

if (before.canTradePerps && before.canTradeSpot) {
  console.log(`\nAlready approved at ${before.maxFeeRate}. Nothing to do.`);
  process.exit(0);
}

// 2. Build + sign + send approval
console.log(`\nApproving builder fee (maxFeeRate: ${MAX_FEE})...`);
const result = await buildSignSend({ type: "approveBuilderFee", maxFeeRate: MAX_FEE }) as any;
console.log("\n── Approval Result ──────────────────────────────────────");
console.log(JSON.stringify(result, null, 2));

// 3. Verify
const after = await apiGet(`/approval?user=${account.address}`) as any;
console.log("\n── Status After Approval ────────────────────────────────");
console.log("approved     :", after.approved);
console.log("maxFeeRate   :", after.maxFeeRate);
console.log("canTradePerps:", after.canTradePerps);
console.log("canTradeSpot :", after.canTradeSpot);
console.log("status msg   :", after.feeBreakdown?.status);

if (after.canTradePerps && after.canTradeSpot) {
  console.log("\nApproval successful. Ready to trade perps, spot, and HIP-4.");
} else {
  console.error("\nApproval may have failed — check result above.");
  process.exit(1);
}
