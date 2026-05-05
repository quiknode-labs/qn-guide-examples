/**
 * API Script 5: Buy USDH
 * HIP-4 requires USDH collateral. Swap USDC → USDH via spot market @230.
 * Uses the build-sign-send pattern with a spot IOC buy.
 *
 * Set USDH_AMOUNT in .env (default: 11 — safely above 10 USDH minimum).
 */
import { buildSignSend, hlInfo, getAccount } from "./client.js";

const account       = getAccount();
const usdcAmount    = process.env.USDH_AMOUNT ? parseFloat(process.env.USDH_AMOUNT) : 11;

// Get current mid for @230 (USDH/USDC) to compute a market price
const allMids = await hlInfo("allMids") as any;
const usdhMid = parseFloat(allMids["@230"] ?? "1.0");

// IOC with 1% slippage above mid to ensure fill
const buyPrice = (usdhMid * 1.01).toFixed(6);

console.log("=".repeat(60));
console.log("BUY USDH — hyperliquidapi.com");
console.log("=".repeat(60));
console.log("Wallet     :", account.address);
console.log("Spot market: @230 (USDH/USDC)");
console.log("USDH mid   :", usdhMid);
console.log("Buy price  :", buyPrice, "(mid + 1% slippage, IOC)");
console.log("USDC size  :", usdcAmount);

// Build-sign-send: spot IOC buy on @230
// For spot markets, size is in the base token (USDH here).
// At ~1:1 parity, buying usdcAmount units of USDH costs ~usdcAmount USDC.
const result = await buildSignSend({
  type: "order",
  orders: [{
    asset: "@230",
    side: "buy",
    price: buyPrice,
    size: String(usdcAmount),
    tif: "ioc",
  }],
}) as any;

console.log("\n── Swap Result ──────────────────────────────────────────");
console.log(JSON.stringify(result, null, 2));

// Check updated spot balance
const spotState = await hlInfo("spotClearinghouseState", { user: account.address }) as any;
const usdhBal = spotState.balances?.find((b: any) => b.coin === "USDH" || b.coin === "@230");
console.log("\n── Spot Balance After Swap ───────────────────────────────");
if (usdhBal) {
  console.log(`USDH: total=${usdhBal.total}  hold=${usdhBal.hold}`);
} else {
  console.log("Full balances:");
  const nonZero = spotState.balances?.filter((b: any) => parseFloat(b.total ?? "0") > 0);
  console.log(JSON.stringify(nonZero, null, 2));
}
