/**
 * Step 5: Buy USDH
 * HIP-4 markets settle in USDH (not USDC). You must swap USDC → USDH first.
 * The SDK handles this via sdk.buyUsdh() — uses spot market @230 internally.
 * Per Hyperliquid: must be executed from the staking account (cStaking / cWithdrawal).
 *
 * Set USDH_AMOUNT in .env, defaults to 11 (min order is 10 USDH).
 */
import { HyperliquidSDK } from "@quicknode/hyperliquid-sdk";

const sdk = new HyperliquidSDK(process.env.QUICKNODE_ENDPOINT, {
  privateKey: process.env.PRIVATE_KEY,
  autoApprove: true,
});

const amount = process.env.USDH_AMOUNT ? parseFloat(process.env.USDH_AMOUNT) : 11;

console.log(`Swapping ${amount} USDC → USDH via spot market @230...`);
console.log("(SDK routes through staking account as required by Hyperliquid)\n");

const result = await sdk.buyUsdh(amount);

console.log("=== USDH Swap Result ===");
console.log("Status     :", result.status);
console.log("isFilled   :", result.isFilled);
console.log("avgPrice   :", result.avgPrice);
console.log("filledSize :", result.filledSize);
console.log("Raw        :", JSON.stringify(result.rawResponse, null, 2));
