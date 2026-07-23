// Pure price-based exit logic: take-profit and stop-loss. No network calls.
// The caller fetches the executable exit value (a Metis sell quote) and the
// entry cost basis, both in quote-mint USD, and passes the numbers in.

import type { Rules } from "../types.ts";

export type PriceExit = "take-profit" | "stop-loss";

export interface ExitDecision {
  exit: PriceExit;
  pnlPct: number;
}

// Returns a price exit if one fires, else null. A threshold of 0 disables
// that leg. entryCostUSD is what the position cost; currentExitUSD is what it
// would fetch if sold right now.
export function evaluateExit(
  entryCostUSD: number,
  currentExitUSD: number,
  rules: Rules,
): ExitDecision | null {
  if (!(entryCostUSD > 0)) return null;
  const pnlPct = ((currentExitUSD - entryCostUSD) / entryCostUSD) * 100;
  const { takeProfitPct, stopLossPct } = rules.exit;
  if (takeProfitPct > 0 && pnlPct >= takeProfitPct) {
    return { exit: "take-profit", pnlPct };
  }
  if (stopLossPct > 0 && pnlPct <= -stopLossPct) {
    return { exit: "stop-loss", pnlPct };
  }
  return null;
}
