import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { captureObservedL2Window, type ObservedL2Level } from "../checkpoint/l4-grpc.js";
import { endpointFromEnvironment } from "../data/endpoint.js";
import { fetchReplayBlocks } from "../data/hypercore-json-rpc.js";
import { formatDecimal, parseDecimal } from "../replay/decimal.js";
import { OrderBook, type L2Snapshot } from "../replay/order-book.js";
import { applyBlockForward, applyBlockReverse } from "../replay/replay.js";

function valueAfter(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function positiveInteger(flag: string, fallback: number, maximum: number): number {
  const value = Number(valueAfter(flag) ?? fallback);
  if (!Number.isSafeInteger(value) || value <= 0 || value > maximum) {
    throw new Error(`${flag} must be an integer from 1 to ${maximum}`);
  }
  return value;
}

function normalizeLevels(levels: ObservedL2Level[]): ObservedL2Level[] {
  return levels.map((level) => ({
    px: formatDecimal(parseDecimal(level.px)),
    sz: formatDecimal(parseDecimal(level.sz)),
    n: level.n,
  }));
}

function normalizeObserved(snapshot: {
  bids: ObservedL2Level[];
  asks: ObservedL2Level[];
}): L2Snapshot {
  return { bids: normalizeLevels(snapshot.bids), asks: normalizeLevels(snapshot.asks) };
}

const coin = (valueAfter("--coin") ?? "BTC").toUpperCase();
const blockCount = positiveInteger("--blocks", 5, 20);
const levels = positiveInteger("--levels", 100, 100);
const endpoint = endpointFromEnvironment();

console.error(
  `Capturing ${blockCount} observed ${coin} L2 snapshots at ${levels} levels after an L4 checkpoint...`,
);
const observedWindow = await captureObservedL2Window(
  endpoint,
  coin,
  blockCount,
  levels,
);
const checkpointHeight = Number(observedWindow.checkpoint.height);
const from = checkpointHeight + 1;
const to = observedWindow.snapshots.at(-1)!.blockNumber;
console.error(`Fetching independent JSON-RPC book + orders blocks ${from}-${to}...`);
const { blocks, report } = await fetchReplayBlocks(endpoint, from, to);
const anchor = OrderBook.fromCheckpoint(observedWindow.checkpoint);
const anchorFingerprint = anchor.fingerprint();
const book = anchor.clone();
const comparisons: Array<Record<string, unknown>> = [];

for (let index = 0; index < blocks.length; index += 1) {
  const block = blocks[index]!;
  const observed = observedWindow.snapshots[index]!;
  if (block.blockNumber !== observed.blockNumber) {
    throw new Error(`Differential height mismatch: JSON-RPC ${block.blockNumber}, gRPC ${observed.blockNumber}`);
  }
  applyBlockForward(book, block, coin);
  book.assertUncrossed();
  const reconstructed = book.toL2(levels);
  const expected = normalizeObserved(observed);
  if (JSON.stringify(reconstructed) !== JSON.stringify(expected)) {
    throw new Error(`L2 differential mismatch at block ${block.blockNumber}`);
  }
  const jsonRpcTime = Date.parse(`${block.blockTime.slice(0, 23)}Z`);
  if (jsonRpcTime !== Number(observed.time)) {
    throw new Error(`Differential timestamp mismatch at block ${block.blockNumber}`);
  }
  comparisons.push({
    blockNumber: block.blockNumber,
    blockTime: block.blockTime,
    observedGrpcTime: observed.time,
    observed: expected,
    reconstructed,
    match: true,
  });
}

for (let index = blocks.length - 1; index >= 0; index -= 1) {
  applyBlockReverse(book, blocks[index]!, coin);
}
if (book.fingerprint() !== anchorFingerprint) {
  throw new Error("Differential window did not reverse exactly to its independent L4 checkpoint");
}

const output = resolve(
  valueAfter("--out") ??
    `validation/runs/${coin.toLowerCase()}-${from}-${to}-differential.json`,
);
const artifact = {
  schemaVersion: 1,
  coin,
  checkpoint: {
    height: checkpointHeight,
    time: observedWindow.checkpoint.time,
    orders: anchor.size,
  },
  range: { from, to, blocks: blocks.length, levels },
  comparisons,
  validation: {
    everyObservedGrpcL2SnapshotMatchedJsonRpcReconstruction: true,
    reversedExactlyToIndependentL4Checkpoint: true,
  },
  jsonRpc: report,
};
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify(
    {
      coin,
      checkpointHeight,
      fromBlock: from,
      toBlock: to,
      snapshotsCompared: comparisons.length,
      levelsPerSide: levels,
      output,
      validation: artifact.validation,
      jsonRpc: report,
    },
    null,
    2,
  ),
);
