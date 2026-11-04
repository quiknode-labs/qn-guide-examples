import { writeFile } from "node:fs/promises";

import { captureL4Checkpoint } from "./checkpoint/l4-grpc.js";
import { endpointFromEnvironment } from "./data/endpoint.js";
import { fetchReplayBlocks } from "./data/hypercore-json-rpc.js";
import { isNewDiff, isUpdateDiff } from "./data/types.js";
import { OrderBook } from "./replay/order-book.js";
import { applyBlockForward, applyBlockReverse } from "./replay/replay.js";
import { validateJsonlFile } from "./validation/jsonl.js";

interface Options {
  coin: string;
  blocks: number;
  levels: number;
  out: string;
}

function flagValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

function integerFlag(flag: string, fallback: number): number {
  const raw = flagValue(flag);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return value;
}

function parseOptions(): Options {
  const blocks = integerFlag("--blocks", 20);
  if (blocks > 200) {
    throw new Error("--blocks is capped at 200 for the MVP cost/safety guardrail");
  }
  const levels = integerFlag("--levels", 20);
  if (levels > 100) throw new Error("--levels cannot exceed 100");
  return {
    coin: (flagValue("--coin") ?? "BTC").toUpperCase(),
    blocks,
    levels,
    out: flagValue("--out") ?? "snapshots.jsonl",
  };
}

const options = parseOptions();
const endpoint = endpointFromEnvironment();
console.error(`Capturing complete ${options.coin} checkpoint...`);
const checkpoint = await captureL4Checkpoint(endpoint, options.coin);
const anchorHeight = Number(checkpoint.height);
if (!Number.isSafeInteger(anchorHeight)) {
  throw new Error(`Unsafe checkpoint height: ${checkpoint.height}`);
}
const from = anchorHeight - options.blocks + 1;
console.error(`Fetching book + orders blocks ${from}-${anchorHeight}...`);
const { blocks, report } = await fetchReplayBlocks(endpoint, from, anchorHeight);
const anchorBlock = blocks.at(-1)!;
const checkpointTime = Number(checkpoint.time);
const blockTime = Date.parse(
  `${anchorBlock.blockTime.slice(0, 23).padEnd(23, "0")}Z`,
);
if (blockTime !== checkpointTime) {
  throw new Error(
    `Checkpoint alignment failed at ${anchorHeight}: gRPC ${checkpoint.time}, JSON-RPC ${anchorBlock.blockTime}`,
  );
}
const anchor = OrderBook.fromCheckpoint(checkpoint);
anchor.assertUncrossed();
const book = anchor.clone();
const snapshots: Array<Record<string, unknown>> = [];

for (let index = blocks.length - 1; index >= 0; index -= 1) {
  const block = blocks[index]!;
  snapshots.push({
    blockNumber: block.blockNumber,
    blockTime: block.blockTime,
    coin: options.coin,
    ...book.toL2(options.levels),
  });
  applyBlockReverse(book, block, options.coin);
  book.assertUncrossed();
}

const preRange = book.clone();
for (const block of blocks) applyBlockForward(book, block, options.coin);
if (book.fingerprint() !== anchor.fingerprint()) {
  throw new Error("Round-trip validation failed: replay did not reproduce checkpoint");
}

const transitionCounts = { new: 0, update: 0, remove: 0 };
for (const block of blocks) {
  for (const event of block.bookEvents) {
    if (event.coin !== options.coin) continue;
    if (isNewDiff(event.raw_book_diff)) transitionCounts.new += 1;
    else if (isUpdateDiff(event.raw_book_diff)) transitionCounts.update += 1;
    else transitionCounts.remove += 1;
  }
}

snapshots.reverse();
await writeFile(
  options.out,
  `${snapshots.map((snapshot) => JSON.stringify(snapshot)).join("\n")}\n`,
  "utf8",
);
const outputValidation = await validateJsonlFile(options.out);

console.log(
  JSON.stringify(
    {
      coin: options.coin,
      fromBlock: from,
      toBlock: anchorHeight,
      snapshots: snapshots.length,
      checkpointOrders: anchor.size,
      preRangeOrders: preRange.size,
      output: options.out,
      outputValidation: outputValidation.validation,
      validation: "exact order-state round trip passed",
      checkpointAlignedToJsonRpcBlock: true,
      transitions: transitionCounts,
      jsonRpc: report,
      note: "JSON-RPC credits are estimated from documented batch-block pricing; gRPC checkpoint usage is data-metered separately.",
    },
    null,
    2,
  ),
);
