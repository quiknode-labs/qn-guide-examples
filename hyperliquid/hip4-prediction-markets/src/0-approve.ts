/**
 * Step 0: Approve Builder Fee
 * Required once per wallet before trading.
 * Run this first if 1:setup shows canTradePerps/canTradeSpot: false.
 *
 * The builder fee is charged on top of Hyperliquid's exchange fees:
 *   Perps: 0.04% | Spot/HIP-4: 0.05%
 * We approve 1% as the maximum — actual fee charged is lower.
 */
import { HyperliquidSDK } from "@quicknode/hyperliquid-sdk";

const sdk = new HyperliquidSDK(process.env.QUICKNODE_ENDPOINT, {
  privateKey: process.env.PRIVATE_KEY,
  autoApprove: false, // manual so we can log each step
});

const MAX_FEE = "1%";

console.log("=".repeat(60));
console.log("BUILDER FEE APPROVAL");
console.log("=".repeat(60));

// 1. Check current status
const before = await sdk.approvalStatus() as any;
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

// 2. Approve
console.log(`\nApproving builder fee (maxFee: ${MAX_FEE})...`);
const result = await sdk.approveBuilderFee(MAX_FEE) as any;
console.log("\n── Approval Result ──────────────────────────────────────");
console.log(JSON.stringify(result, null, 2));

// 3. Verify
const after = await sdk.approvalStatus() as any;
console.log("\n── Status After Approval ────────────────────────────────");
console.log("approved     :", after.approved);
console.log("maxFeeRate   :", after.maxFeeRate);
console.log("canTradePerps:", after.canTradePerps);
console.log("canTradeSpot :", after.canTradeSpot);
console.log("status msg   :", after.feeBreakdown?.status);

if (after.canTradePerps && after.canTradeSpot) {
  console.log("\nApproval successful. You can now trade perps, spot, and HIP-4 markets.");
} else {
  console.error("\nApproval may have failed — check the result above.");
  process.exit(1);
}
