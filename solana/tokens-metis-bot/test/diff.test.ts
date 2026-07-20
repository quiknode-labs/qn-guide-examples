import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { diff } from "../src/engine/diff.ts";
import { makeCandidate, makePosition, makeRules } from "./fixtures.ts";

describe("diff", () => {
  it("buys a passing candidate that is not held", () => {
    const rules = makeRules();
    const c = makeCandidate({ assetId: "new-asset" });
    const decisions = diff([c], [], rules);
    assert.equal(decisions.length, 1);
    assert.equal(decisions[0]!.action, "buy");
    assert.equal(decisions[0]!.candidate.assetId, "new-asset");
    assert.match(decisions[0]!.reason, /passed screen/);
    assert.match(decisions[0]!.reason, /momentum=15\.00%/);
  });

  it("holds (no decision) when a passing candidate is already held", () => {
    const rules = makeRules();
    const c = makeCandidate({ assetId: "held-asset" });
    const p = makePosition({ assetId: "held-asset" });
    assert.deepEqual(diff([c], [p], rules), []);
  });

  it("sells a held position that failed the screen, with the gate reasons", () => {
    const rules = makeRules();
    const failed = makeCandidate({ assetId: "held-asset", momentumPct: 2 });
    const p = makePosition({ assetId: "held-asset" });
    const decisions = diff([], [p], rules, [
      { candidate: failed, reasons: ["momentum 2.00% (1h) below 10%"] },
    ]);
    assert.equal(decisions.length, 1);
    assert.equal(decisions[0]!.action, "sell");
    assert.equal(decisions[0]!.reason, "screen fail: momentum 2.00% (1h) below 10%");
  });

  it("sells a held position that left the universe entirely", () => {
    const rules = makeRules();
    const p = makePosition({ assetId: "gone-asset", symbol: "GONE" });
    const decisions = diff([], [p], rules);
    assert.equal(decisions.length, 1);
    assert.equal(decisions[0]!.action, "sell");
    assert.equal(decisions[0]!.reason, "no longer in trending universe");
    assert.equal(decisions[0]!.candidate.symbol, "GONE");
    assert.equal(decisions[0]!.candidate.momentumBasis, "unavailable");
  });

  it("does not sell when exit.sellWhenScreenFails is false", () => {
    const rules = makeRules({ exit: { sellWhenScreenFails: false } });
    const p = makePosition({ assetId: "gone-asset" });
    assert.deepEqual(diff([], [p], rules), []);
  });

  it("ranks capacity-limited buys by momentum", () => {
    const rules = makeRules();
    rules.portfolio.maxPositions = 2;
    const held = [makePosition({ assetId: "held-1" })];
    const candidates = [
      makeCandidate({ assetId: "held-1" }), // still passing, so it holds
      makeCandidate({ assetId: "slow", momentumPct: 12 }),
      makeCandidate({ assetId: "fast", momentumPct: 40 }),
      makeCandidate({ assetId: "medium", momentumPct: 25 }),
    ];
    const decisions = diff(candidates, held, rules);
    // One slot free: only the highest-momentum candidate buys.
    assert.equal(decisions.length, 1);
    assert.equal(decisions[0]!.candidate.assetId, "fast");
  });

  it("buys nothing at max positions, even with passing candidates", () => {
    const rules = makeRules();
    rules.portfolio.maxPositions = 1;
    const held = [makePosition({ assetId: "held-1" })];
    const stillPassing = makeCandidate({ assetId: "held-1" });
    const c = makeCandidate({ assetId: "new-asset" });
    assert.deepEqual(diff([stillPassing, c], held, rules), []);
  });

  it("does not count a pending sell as freed capacity", () => {
    const rules = makeRules();
    rules.portfolio.maxPositions = 1;
    const held = [makePosition({ assetId: "failing-held" })];
    const c = makeCandidate({ assetId: "new-asset" });
    const decisions = diff([c], held, rules);
    // The failing position sells, but the new candidate must wait a cycle.
    assert.equal(decisions.length, 1);
    assert.equal(decisions[0]!.action, "sell");
  });
});
