import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format Gwei to USD (assuming 1 gwei = $0.00002)
export function formatGweiToUSD(gwei: number): string {
  const usdValue = gwei * 0.00002;
  return `${usdValue.toFixed(6)}`;
}
