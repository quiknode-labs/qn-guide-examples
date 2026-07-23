import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateExit } from "../src/engine/exits.ts";
import { makeRules } from "./fixtures.ts";

describe("evaluateExit", () => {
  const rules = makeRules(); // takeProfitPct 25, stopLossPct 15

  it("fires take-profit when PnL reaches the threshold", () => {
    // entry $100 -> now $130 = +30% >= +25%
    const exit = evaluateExit(100, 130, rules);
    assert.equal(exit?.exit, "take-profit");
    assert.equal(Math.round(exit!.pnlPct), 30);
  });

  it("fires take-profit exactly at the threshold", () => {
    assert.equal(evaluateExit(100, 125, rules)?.exit, "take-profit");
  });

  it("fires stop-loss when PnL falls to the threshold", () => {
    // entry $100 -> now $80 = -20% <= -15%
    const exit = evaluateExit(100, 80, rules);
    assert.equal(exit?.exit, "stop-loss");
    assert.equal(Math.round(exit!.pnlPct), -20);
  });

  it("holds inside the band", () => {
    assert.equal(evaluateExit(100, 110, rules), null); // +10%
    assert.equal(evaluateExit(100, 90, rules), null); // -10%
  });

  it("treats a zero threshold as disabled", () => {
    const noTp = makeRules({
      exit: { sellWhenScreenFails: true, takeProfitPct: 0, stopLossPct: 15, reentryCooldownMinutes: 0 },
    });
    assert.equal(evaluateExit(100, 500, noTp), null); // +400% but TP disabled
    const noSl = makeRules({
      exit: { sellWhenScreenFails: true, takeProfitPct: 25, stopLossPct: 0, reentryCooldownMinutes: 0 },
    });
    assert.equal(evaluateExit(100, 1, noSl), null); // -99% but SL disabled
  });

  it("returns null for a non-positive entry cost", () => {
    assert.equal(evaluateExit(0, 100, rules), null);
  });

  it("prefers take-profit ordering when both could apply", () => {
    // Not physically both, but confirm TP is checked first for a gain.
    assert.equal(evaluateExit(100, 200, rules)?.exit, "take-profit");
  });
});
