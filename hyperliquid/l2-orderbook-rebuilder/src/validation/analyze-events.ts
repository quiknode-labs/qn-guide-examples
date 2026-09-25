import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { endpointFromEnvironment } from "../data/endpoint.js";
import {
  fetchLatestBlockNumber,
  fetchReplayBlocks,
} from "../data/hypercore-json-rpc.js";
import { profileReplayBlocks } from "./event-profile.js";

function valueAfter(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

const endpoint = endpointFromEnvironment();
const fromArgument = valueAfter("--from");
const toArgument = valueAfter("--to");
if ((fromArgument === undefined) !== (toArgument === undefined)) {
  throw new Error("Provide --from and --to together");
}
let from: number;
let to: number;
if (fromArgument !== undefined && toArgument !== undefined) {
  from = Number(fromArgument);
  to = Number(toArgument);
} else {
  const count = Number(valueAfter("--blocks") ?? "50");
  if (!Number.isSafeInteger(count) || count <= 0 || count > 200) {
    throw new Error("--blocks must be an integer from 1 to 200");
  }
  const [latestBook, latestOrders] = await Promise.all([
    fetchLatestBlockNumber(endpoint, "book"),
    fetchLatestBlockNumber(endpoint, "orders"),
  ]);
  to = Math.min(latestBook, latestOrders);
  from = to - count + 1;
}
const count = to - from + 1;
if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from < 0 || count <= 0 || count > 200) {
  throw new Error("Event analysis range must contain 1-200 valid blocks");
}
console.error(`Profiling all book + order events across ${from}-${to}...`);
const { blocks, report } = await fetchReplayBlocks(endpoint, from, to);
const profile = profileReplayBlocks(blocks);
const output = resolve(
  valueAfter("--out") ?? `validation/runs/events-${from}-${to}.json`,
);
const artifact = {
  schemaVersion: 1,
  range: { from, to, blocks: count },
  profile,
  jsonRpc: report,
};
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ output, ...artifact }, null, 2));
