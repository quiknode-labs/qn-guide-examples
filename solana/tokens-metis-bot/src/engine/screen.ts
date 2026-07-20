// Pure screening logic. No network calls: the caller resolves risk and
// variant data first and passes fully mapped candidates in.

import { tierRank, type Candidate, type Rules } from "../types.ts";

export interface ScreenRejection {
  candidate: Candidate;
  reasons: string[];
}

export interface ScreenResult {
  passing: Candidate[];
  rejected: ScreenRejection[];
}

// Gates run in spec order: liquidity tier, risk flags, volume, momentum.
// All failing gates are collected so logs can show every reason at once.
export function screenWithReasons(universe: Candidate[], rules: Rules): ScreenResult {
  const passing: Candidate[] = [];
  const rejected: ScreenRejection[] = [];

  for (const c of universe) {
    const reasons: string[] = [];

    if (tierRank(c.liquidityTier) > tierRank(rules.screen.minLiquidityTier)) {
      reasons.push(
        `liquidity tier ${c.liquidityTier} below floor ${rules.screen.minLiquidityTier}`,
      );
    }
    if (c.riskFlagCount > rules.screen.maxRiskFlags) {
      reasons.push(`${c.riskFlagCount} risk flags exceeds max ${rules.screen.maxRiskFlags}`);
    }
    if (c.volume24hUSD < rules.screen.minVolume24hUSD) {
      reasons.push(
        `24h volume $${c.volume24hUSD.toFixed(0)} below floor $${rules.screen.minVolume24hUSD}`,
      );
    }
    if (c.momentumPct < rules.screen.momentum.minChangePct) {
      reasons.push(
        `momentum ${c.momentumPct.toFixed(2)}% (${c.momentumBasis}) below ${rules.screen.momentum.minChangePct}%`,
      );
    }

    if (reasons.length === 0) {
      passing.push(c);
    } else {
      rejected.push({ candidate: c, reasons });
    }
  }

  return { passing, rejected };
}

export function screen(universe: Candidate[], rules: Rules): Candidate[] {
  return screenWithReasons(universe, rules).passing;
}
