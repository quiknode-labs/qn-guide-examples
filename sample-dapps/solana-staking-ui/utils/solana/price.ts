import { address } from "@solana/kit";

export const WRAPPED_SOL_ADDRESS = address(
  "So11111111111111111111111111111111111111112"
);

export function formatUsdPrice(
  solAmount: number | string,
  solPrice: number | string
): string {
  const solAmountNum = solAmount === "" ? 0 : parseFloat(solAmount as string);
  const solPriceNum = solPrice === "" ? 0 : parseFloat(solPrice as string);
  const usdValue = solAmountNum * solPriceNum;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(usdValue);
}
