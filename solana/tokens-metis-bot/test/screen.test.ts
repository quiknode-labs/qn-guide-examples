import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { screen, screenWithReasons } from "../src/engine/screen.ts";
import { makeCandidate, makeRules } from "./fixtures.ts";

describe("screen", () => {
  const rules = makeRules();

  it("passes a candidate that clears every gate", () => {
    const c = makeCandidate();
    assert.deepEqual(screen([c], rules), [c]);
  });

  it("rejects on liquidity tier below the floor", () => {
    const c = makeCandidate({ liquidityTier: "tier2" });
    const { passing, rejected } = screenWithReasons([c], rules);
    assert.equal(passing.length, 0);
    assert.equal(rejected.length, 1);
    assert.match(rejected[0]!.reasons[0]!, /liquidity tier tier2 below floor tier1/);
  });

  it("allows deeper tiers when the floor is relaxed", () => {
    const relaxed = makeRules();
    relaxed.screen.minLiquidityTier = "tier2";
    const t1 = makeCandidate({ assetId: "a1", liquidityTier: "tier1" });
    const t2 = makeCandidate({ assetId: "a2", liquidityTier: "tier2" });
    const t3 = makeCandidate({ assetId: "a3", liquidityTier: "tier3" });
    assert.deepEqual(
      screen([t1, t2, t3], relaxed).map((c) => c.assetId),
      ["a1", "a2"],
    );
  });

  it("rejects on risk flags above the max", () => {
    const c = makeCandidate({ riskFlagCount: 1 });
    const { passing, rejected } = screenWithReasons([c], rules);
    assert.equal(passing.length, 0);
    assert.match(rejected[0]!.reasons[0]!, /1 risk flags exceeds max 0/);
  });

  it("rejects on 24h volume below the floor", () => {
    const c = makeCandidate({ volume24hUSD: 499_999 });
    const { rejected } = screenWithReasons([c], rules);
    assert.match(rejected[0]!.reasons[0]!, /24h volume \$499999 below floor \$500000/);
  });

  it("rejects on momentum below the threshold", () => {
    const c = makeCandidate({ momentumPct: 9.99 });
    const { rejected } = screenWithReasons([c], rules);
    assert.match(rejected[0]!.reasons[0]!, /momentum 9\.99% \(1h\) below 10%/);
  });

  it("collects every failed gate, not just the first", () => {
    const c = makeCandidate({
      liquidityTier: "tier3",
      riskFlagCount: 2,
      volume24hUSD: 0,
      momentumPct: -5,
    });
    const { rejected } = screenWithReasons([c], rules);
    assert.equal(rejected[0]!.reasons.length, 4);
  });

  it("returns an empty result for an empty universe", () => {
    assert.deepEqual(screen([], rules), []);
  });
});
