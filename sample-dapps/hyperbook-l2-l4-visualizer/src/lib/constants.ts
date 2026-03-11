export const POPULAR_COINS = ["BTC", "ETH", "SOL", "HYPE"] as const;

export const ALL_COINS = [
  "BTC", "ETH", "SOL", "HYPE",
  "DOGE", "AVAX", "LINK", "ARB",
  "OP", "SUI", "APT", "SEI",
  "TIA", "INJ", "MATIC", "NEAR",
  "ATOM", "FTM", "RNDR", "WLD",
  "JUP", "JTO", "PYTH", "WIF",
  "BONK", "PEPE", "PENDLE", "STX",
  "AAVE", "MKR", "UNI", "SNX",
] as const;

export const WHALE_THRESHOLDS: Record<string, number> = {
  BTC: 1.0,
  ETH: 10.0,
  SOL: 100.0,
  HYPE: 5000.0,
  DEFAULT: 10000.0,
};

export const DEFAULT_LEVELS = 30;
export const MAX_L4_EVENTS = 200;

export function getWhaleThreshold(coin: string): number {
  return WHALE_THRESHOLDS[coin] ?? WHALE_THRESHOLDS.DEFAULT;
}
