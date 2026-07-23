// Pure portfolio diff: passing candidates + held positions -> buy/sell/hold.

import type { Candidate, Position, Rules, TradeDecision } from "../types.ts";
import type { ScreenRejection } from "./screen.ts";

// `rejections` is optional context from the screen pass so a sell decision can
// explain exactly which gate the held asset failed. A held asset absent from
// both passing and rejections fell out of the trending universe entirely.
export function diff(
  passing: Candidate[],
  held: Position[],
  rules: Rules,
  rejections: ScreenRejection[] = [],
  cooldownAssetIds: Set<string> = new Set(),
): TradeDecision[] {
  const decisions: TradeDecision[] = [];
  const heldByAsset = new Map(held.map((p) => [p.assetId, p]));
  const passingByAsset = new Map(passing.map((c) => [c.assetId, c]));
  const rejectedByAsset = new Map(rejections.map((r) => [r.candidate.assetId, r]));

  // Sells first: held positions whose asset no longer passes the screen.
  if (rules.exit.sellWhenScreenFails) {
    for (const position of held) {
      if (passingByAsset.has(position.assetId)) continue; // hold

      const rejection = rejectedByAsset.get(position.assetId);
      const candidate: Candidate = rejection?.candidate ?? {
        // Asset left the trending universe; synthesize from the position.
        assetId: position.assetId,
        symbol: position.symbol,
        chosenMint: position.mint,
        liquidityTier: position.entryLiquidityTier,
        riskFlagCount: position.entryRiskFlagCount,
        volume24hUSD: 0,
        momentumPct: 0,
        momentumBasis: "unavailable",
      };
      const reason = rejection
        ? `screen fail: ${rejection.reasons.join("; ")}`
        : "no longer in trending universe";
      decisions.push({ action: "sell", candidate, reason });
    }
  }

  // Buys: passing candidates not already held, within maxPositions capacity.
  // Capacity is computed against current holdings only; pending sells are not
  // counted as freed slots until they actually fill.
  const capacity = Math.max(0, rules.portfolio.maxPositions - held.length);
  const buyable = passing
    .filter((c) => !heldByAsset.has(c.assetId))
    // Skip assets in the re-entry cooldown window after a recent sell.
    .filter((c) => !cooldownAssetIds.has(c.assetId))
    .sort((a, b) => b.momentumPct - a.momentumPct);

  for (const candidate of buyable.slice(0, capacity)) {
    decisions.push({
      action: "buy",
      candidate,
      reason:
        `passed screen: tier=${candidate.liquidityTier}, riskFlags=${candidate.riskFlagCount}, ` +
        `vol24h=$${candidate.volume24hUSD.toFixed(0)}, ` +
        `momentum=${candidate.momentumPct.toFixed(2)}% (${candidate.momentumBasis})`,
    });
  }

  return decisions;
}
