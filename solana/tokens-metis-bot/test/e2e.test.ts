// End-to-end dry-run test: screen -> diff -> executor with every client
// mocked. Asserts the correct decisions and trade log lines without any
// network access. No test in this suite places a live trade.

import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { screenWithReasons } from "../src/engine/screen.ts";
import { diff } from "../src/engine/diff.ts";
import { createExecutor } from "../src/exec/executor.ts";
import type { TokensClient } from "../src/clients/tokens.ts";
import type { MetisClient } from "../src/clients/metis.ts";
import type { RpcClient } from "../src/clients/rpc.ts";
import type { StateStore } from "../src/state/store.ts";
import type { Logger, TradeLogEntry } from "../src/log/logger.ts";
import type { MetisQuoteResponse, MetisSwapResponse } from "../src/clients/metisTypes.ts";
import type { Position } from "../src/types.ts";
import { LABEL_MAP, makeCandidate, makePosition, makeRules } from "./fixtures.ts";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

function makeQuote(overrides: Partial<MetisQuoteResponse> = {}): MetisQuoteResponse {
  return {
    inputMint: USDC,
    inAmount: "100000000",
    outputMint: "TESTMINT1111111111111111111111111111111",
    outAmount: "5000000",
    otherAmountThreshold: "4950000",
    swapMode: "ExactIn",
    slippageBps: 100,
    platformFee: null,
    priceImpactPct: "0.001", // 0.1%
    routePlan: [],
    mostReliableAmmsQuoteReport: { info: { whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc: "5000000" } },
    ...overrides,
  };
}

interface Harness {
  executor: ReturnType<typeof createExecutor>;
  trades: TradeLogEntry[];
  warns: string[];
  positions: Map<string, Position>;
  swapCalls: number;
  sendCalls: number;
}

function makeHarness(opts: {
  dryRun: boolean;
  quote?: MetisQuoteResponse;
  heldPositions?: Position[];
  quoteBalance?: string;
}): Harness {
  const trades: TradeLogEntry[] = [];
  const warns: string[] = [];
  const positions = new Map<string, Position>(
    (opts.heldPositions ?? []).map((p) => [p.assetId, p]),
  );
  const counters = { swapCalls: 0, sendCalls: 0 };

  const tokens: TokensClient = {
    getTrending: mock.fn(async () => []),
    resolve: mock.fn(async () => ({ assetId: "", resolvedBy: "", mint: "", asset: { assetId: "", name: "", symbol: "", category: "" } })),
    getRiskSummary: mock.fn(async () => ({ score: 0, grade: "A", label: "", tone: "success", isTrustedLaunch: true, caps: [], hasInsufficientData: false })),
    getVariants: mock.fn(async () => []),
    getMarkets: mock.fn(async () => [
      { poolId: "pool-1", venueLabel: "Orca", liquidityUSD: 2_000_000 },
      { poolId: "pool-2", venueLabel: "Raydium Clamm", liquidityUSD: 900_000 },
    ]),
  };

  const metis: MetisClient = {
    quote: mock.fn(async () => opts.quote ?? makeQuote()),
    swap: mock.fn(async (): Promise<MetisSwapResponse> => {
      counters.swapCalls++;
      return { swapTransaction: "bW9jaw==", lastValidBlockHeight: 1 };
    }),
    programIdToLabel: mock.fn(async () => LABEL_MAP),
    reliableAmms: (q) => Object.keys(q.mostReliableAmmsQuoteReport?.info ?? {}),
  };

  const rpc: RpcClient = {
    rpc: {} as RpcClient["rpc"],
    walletAddress: "WaLLetPubkey111111111111111111111111111111",
    getBalances: mock.fn(async () => ({
      solLamports: 1_000_000_000n,
      tokens: [
        { mint: USDC, amountBaseUnits: opts.quoteBalance ?? "500000000", decimals: 6 },
        ...[...positions.values()].map((p) => ({
          mint: p.mint,
          amountBaseUnits: p.amountBaseUnits,
          decimals: 6,
        })),
      ],
    })),
    signAndSend: mock.fn(async () => {
      counters.sendCalls++;
      return "mocked-signature";
    }),
    toBaseUnits: mock.fn(async (ui: number) => Math.round(ui * 1e6).toString()),
    fromBaseUnits: mock.fn(async (amount: string) => Number(amount) / 1e6),
  };

  const store: StateStore = {
    load: async () => {},
    getPositions: () => [...positions.values()],
    upsertPosition: (p) => positions.set(p.assetId, p),
    removePosition: (assetId) => positions.delete(assetId),
    save: async () => {},
  };

  const logger: Logger = {
    info: () => {},
    warn: (message) => warns.push(message),
    error: () => {},
    trade: (entry) => trades.push(entry),
  };

  const executor = createExecutor({
    tokens,
    metis,
    rpc,
    store,
    logger,
    rules: makeRules(),
    dryRun: opts.dryRun,
  });

  return {
    executor,
    trades,
    warns,
    positions,
    get swapCalls() {
      return counters.swapCalls;
    },
    get sendCalls() {
      return counters.sendCalls;
    },
  };
}

describe("end-to-end dry run", () => {
  it("produces the right decisions from screen + diff", () => {
    const rules = makeRules();
    const universe = [
      makeCandidate({ assetId: "buy-me", symbol: "BUY", momentumPct: 30 }),
      makeCandidate({ assetId: "too-risky", symbol: "RISK", riskFlagCount: 3 }),
      makeCandidate({ assetId: "held-ok", symbol: "HODL" }),
      makeCandidate({ assetId: "held-fading", symbol: "FADE", momentumPct: 1 }),
    ];
    const held = [
      makePosition({ assetId: "held-ok", symbol: "HODL" }),
      makePosition({ assetId: "held-fading", symbol: "FADE" }),
    ];

    const { passing, rejected } = screenWithReasons(universe, rules);
    const decisions = diff(passing, held, rules, rejected);

    assert.deepEqual(
      decisions.map((d) => [d.action, d.candidate.assetId]),
      [
        ["sell", "held-fading"],
        ["buy", "buy-me"],
      ],
    );
    assert.match(decisions[0]!.reason, /momentum 1\.00% \(1h\) below 10%/);
  });

  it("dry-run buy logs the intended trade and never touches state or the network", async () => {
    const h = makeHarness({ dryRun: true });
    await h.executor.run({
      action: "buy",
      candidate: makeCandidate({ assetId: "buy-me", symbol: "BUY" }),
      reason: "passed screen",
    });

    assert.equal(h.trades.length, 1);
    const entry = h.trades[0]!;
    assert.equal(entry.dryRun, true);
    assert.equal(entry.signature, null);
    assert.equal(entry.actualOutAmount, null);
    assert.equal(entry.action, "buy");
    assert.equal(entry.venue, "Orca"); // deepest market won
    assert.deepEqual(entry.dexes, ["Whirlpool", "Orca V2"]);
    assert.deepEqual(entry.reliableAmms, ["whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc"]);
    assert.equal(h.positions.size, 0); // state untouched
    assert.equal(h.swapCalls, 0); // no swap requested
    assert.equal(h.sendCalls, 0); // nothing signed or sent
  });

  it("dry-run sell logs and leaves the position in state", async () => {
    const held = makePosition({ assetId: "held-fading", symbol: "FADE" });
    const h = makeHarness({ dryRun: true, heldPositions: [held] });
    await h.executor.run({
      action: "sell",
      candidate: makeCandidate({ assetId: "held-fading", symbol: "FADE" }),
      reason: "screen fail: momentum",
    });

    assert.equal(h.trades.length, 1);
    assert.equal(h.trades[0]!.action, "sell");
    assert.equal(h.trades[0]!.dryRun, true);
    assert.equal(h.positions.size, 1); // dry run does not touch state
    assert.equal(h.swapCalls, 0);
  });

  it("refuses a swap whose price impact exceeds the ceiling", async () => {
    const h = makeHarness({
      dryRun: true,
      quote: makeQuote({ priceImpactPct: "0.05" }), // 5% > 2.5% ceiling
    });
    await h.executor.run({
      action: "buy",
      candidate: makeCandidate(),
      reason: "passed screen",
    });

    assert.equal(h.trades.length, 0);
    assert.ok(h.warns.some((w) => /price impact exceeds ceiling/.test(w)));
  });

  it("live buy (mocked) signs, sends, and records the position", async () => {
    const h = makeHarness({ dryRun: false });
    await h.executor.run({
      action: "buy",
      candidate: makeCandidate({ assetId: "buy-me", symbol: "BUY" }),
      reason: "passed screen",
    });

    assert.equal(h.swapCalls, 1);
    assert.equal(h.sendCalls, 1);
    assert.equal(h.trades.length, 1);
    assert.equal(h.trades[0]!.dryRun, false);
    assert.equal(h.trades[0]!.signature, "mocked-signature");
    assert.equal(h.positions.size, 1);
    const position = h.positions.get("buy-me")!;
    assert.equal(position.amountBaseUnits, "5000000");
    // 100 USDC in, 5 tokens out -> entry price 20 USD.
    assert.equal(position.entryPriceUSD, 20);
  });

  it("live sell (mocked) removes the position from state", async () => {
    const held = makePosition({ assetId: "held-fading", symbol: "FADE", amountBaseUnits: "5000000" });
    const h = makeHarness({ dryRun: false, heldPositions: [held] });
    await h.executor.run({
      action: "sell",
      candidate: makeCandidate({ assetId: "held-fading", symbol: "FADE" }),
      reason: "screen fail",
    });

    assert.equal(h.sendCalls, 1);
    assert.equal(h.positions.size, 0);
  });

  it("live buy is skipped when the quote-mint balance is zero", async () => {
    const h = makeHarness({ dryRun: false, quoteBalance: "0" });
    await h.executor.run({
      action: "buy",
      candidate: makeCandidate(),
      reason: "passed screen",
    });
    assert.equal(h.trades.length, 0);
    assert.equal(h.swapCalls, 0);
    assert.ok(h.warns.some((w) => /No quote-mint balance/.test(w)));
  });

  it("dry-run buy logs a hypothetical trade even with zero balance", async () => {
    // Dry run is hypothetical, so it sizes at the target and still logs the
    // intended trade without requiring the wallet to hold the quote mint.
    const h = makeHarness({ dryRun: true, quoteBalance: "0" });
    await h.executor.run({
      action: "buy",
      candidate: makeCandidate(),
      reason: "passed screen",
    });
    assert.equal(h.trades.length, 1);
    assert.equal(h.trades[0]!.dryRun, true);
    assert.equal(h.swapCalls, 0);
  });
});
