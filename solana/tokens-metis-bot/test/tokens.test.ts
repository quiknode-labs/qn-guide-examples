import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  countRiskFlags,
  dedupeTrending,
  momentumFromSnapshot,
  type RiskSummary,
  type TrendingEntry,
} from "../src/clients/tokens.ts";

function makeRisk(overrides: Partial<RiskSummary> = {}): RiskSummary {
  return {
    score: 90,
    grade: "A",
    label: "Established",
    tone: "success",
    isTrustedLaunch: true,
    caps: [],
    hasInsufficientData: false,
    ...overrides,
  };
}

function makeEntry(assetId: string, score: number, symbol = assetId): TrendingEntry {
  return {
    rank: 1,
    assetId,
    mint: `mint-${symbol}`,
    symbol,
    name: symbol,
    decimals: 6,
    category: "crypto",
    market: {},
    trending: { score, scoringVersion: "v1" },
  };
}

describe("countRiskFlags", () => {
  it("counts caps with warning or danger tone", () => {
    const risk = makeRisk({
      caps: [
        { name: "a", tone: "success" },
        { name: "b", tone: "warning" },
        { name: "c", tone: "danger" },
        { name: "d", tone: "info" },
      ],
    });
    assert.equal(countRiskFlags(risk), 2);
  });

  it("counts insufficient data as one flag", () => {
    assert.equal(countRiskFlags(makeRisk({ caps: [], hasInsufficientData: true })), 1);
  });

  it("does not crash when caps is missing (defensive)", () => {
    // Regression: the per-asset risk endpoint returned a shape without a
    // top-level caps array, which used to throw on .filter.
    const risk = makeRisk();
    delete (risk as { caps?: unknown }).caps;
    assert.equal(countRiskFlags(risk), 0);
  });
});

describe("dedupeTrending", () => {
  it("keeps the highest-scoring entry per canonical assetId", () => {
    const entries = [
      makeEntry("bitcoin", 70, "wBTC"),
      makeEntry("bitcoin", 85, "cbBTC"),
      makeEntry("ethereum", 60, "wETH"),
    ];
    const result = dedupeTrending(entries, 10);
    assert.equal(result.length, 2);
    assert.equal(result[0]!.assetId, "bitcoin");
    assert.equal(result[0]!.symbol, "cbBTC"); // higher score wins
    assert.equal(result[1]!.assetId, "ethereum");
  });

  it("ranks by trending score and caps to the limit", () => {
    const entries = [makeEntry("a", 10), makeEntry("b", 90), makeEntry("c", 50)];
    const result = dedupeTrending(entries, 2);
    assert.deepEqual(
      result.map((e) => e.assetId),
      ["b", "c"],
    );
  });
});

describe("momentumFromSnapshot", () => {
  it("reads the 1h price change directly", () => {
    const m = momentumFromSnapshot({ priceChange1hPercent: 12.5 }, "1h");
    assert.deepEqual(m, { momentumPct: 12.5, momentumBasis: "1h" });
  });

  it("falls back to 1h-vs-24h volume pace when the window is unavailable", () => {
    const m = momentumFromSnapshot({ volume1hUSD: 200_000, volume24hUSD: 2_400_000 }, "1h");
    // pace = (200k*24)/2.4M = 2.0 -> +100%
    assert.equal(m.momentumBasis, "1h-vs-24h-pace");
    assert.equal(Math.round(m.momentumPct), 100);
  });

  it("reports unavailable when no usable fields exist", () => {
    assert.deepEqual(momentumFromSnapshot({}, "1h"), {
      momentumPct: 0,
      momentumBasis: "unavailable",
    });
  });
});
