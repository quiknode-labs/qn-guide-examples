import assert from "node:assert/strict";
import test from "node:test";

import { validateJsonlRows } from "../../src/validation/jsonl.js";

const valid = [
  JSON.stringify({
    blockNumber: 10,
    blockTime: "2026-07-21T00:00:00.000000001",
    coin: "BTC",
    bids: [
      { px: "100", sz: "0.3", n: 2 },
      { px: "99", sz: "1", n: 1 },
    ],
    asks: [
      { px: "101", sz: "2", n: 1 },
      { px: "102", sz: "3", n: 2 },
    ],
  }),
  JSON.stringify({
    blockNumber: 11,
    blockTime: "2026-07-21T00:00:00.080000000",
    coin: "BTC",
    bids: [{ px: "100", sz: "0.4", n: 2 }],
    asks: [{ px: "101", sz: "1", n: 1 }],
  }),
];

test("validates deterministic, continuous, uncrossed JSONL snapshots", () => {
  const report = validateJsonlRows(valid);
  assert.equal(report.snapshots, 2);
  assert.equal(report.fromBlock, 10);
  assert.equal(report.toBlock, 11);
});

test("rejects a block gap", () => {
  const second = JSON.parse(valid[1]!);
  second.blockNumber = 12;
  assert.throws(() => validateJsonlRows([valid[0]!, JSON.stringify(second)]), /block gap/);
});

test("rejects crossed or unsorted levels", () => {
  const crossed = JSON.parse(valid[0]!);
  crossed.asks[0].px = "100";
  assert.throws(() => validateJsonlRows([JSON.stringify(crossed)]), /crossed book/);

  const unsorted = JSON.parse(valid[0]!);
  unsorted.bids.reverse();
  assert.throws(() => validateJsonlRows([JSON.stringify(unsorted)]), /strictly descending/);
});

test("detects timestamp regression below millisecond precision", () => {
  const first = JSON.parse(valid[0]!);
  const second = JSON.parse(valid[1]!);
  first.blockTime = "2026-07-21T00:00:00.000000002";
  second.blockTime = "2026-07-21T00:00:00.000000001";
  assert.throws(
    () => validateJsonlRows([JSON.stringify(first), JSON.stringify(second)]),
    /blockTime regressed/,
  );
});
