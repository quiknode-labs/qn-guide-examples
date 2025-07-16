import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  // Handle invalid or extreme values
  if (!amount || !isFinite(amount) || amount === 0) {
    return "$0";
  }

  // Handle extremely large numbers (scientific notation)
  if (amount >= 1e15) {
    return "$" + amount.toExponential(2);
  }

  if (amount >= 1e12) {
    return `$${(amount / 1e12).toFixed(1)}T`;
  } else if (amount >= 1e9) {
    return `$${(amount / 1e9).toFixed(1)}B`;
  } else if (amount >= 1e6) {
    return `$${(amount / 1e6).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  } else if (amount >= 1) {
    return `$${amount.toFixed(2)}`;
  } else {
    return `$${amount.toFixed(6)}`;
  }
}

export function formatPercentage(value: number): string {
  if (!value || !isFinite(value)) {
    return "0.0%";
  }
  return `${value.toFixed(2)}%`;
}

export function formatNumber(value: number): string {
  // Handle invalid values
  if (!value || !isFinite(value) || value === 0) {
    return "0";
  }

  // Handle extremely large numbers
  if (value >= 1e15) {
    return value.toExponential(2);
  }

  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  } else if (value >= 1) {
    return value.toFixed(2);
  } else if (value >= 0.000001) {
    return value.toFixed(6);
  } else {
    return value.toExponential(2);
  }
}

export function formatTokenSymbol(symbol: string): string {
  // Handle special characters and long symbols
  if (symbol.length > 8) {
    return symbol.substring(0, 8) + "...";
  }
  return symbol;
}

export function getTokenExplorerUrl(tokenAddress: string): string {
  // Base mainnet explorer
  return `https://basescan.org/token/${tokenAddress}`;
}

export function isCBToken(tokenSymbol: string): boolean {
  // Check if token symbol starts with "cb" (case insensitive)
  return tokenSymbol.toLowerCase().startsWith("cb");
}

export function hasAnyToken(pool: any, tokenSymbols: string[]): boolean {
  const token0Symbol = pool.tokens.token0.symbol.toLowerCase();
  const token1Symbol = pool.tokens.token1.symbol.toLowerCase();

  return tokenSymbols.some(
    (symbol) =>
      token0Symbol.includes(symbol.toLowerCase()) ||
      token1Symbol.includes(symbol.toLowerCase())
  );
}
