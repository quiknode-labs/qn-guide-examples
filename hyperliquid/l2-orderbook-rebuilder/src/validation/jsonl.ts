import { readFile, stat } from "node:fs/promises";

import { parseDecimal } from "../replay/decimal.js";

interface JsonL2Level {
  px: string;
  sz: string;
  n: number;
}

interface JsonL2Snapshot {
  blockNumber: number;
  blockTime: string;
  coin: string;
  bids: JsonL2Level[];
  asks: JsonL2Level[];
}

export interface JsonlValidationReport {
  file: string;
  bytes: number;
  coin: string;
  snapshots: number;
  fromBlock: number;
  toBlock: number;
  firstBlockTime: string;
  lastBlockTime: string;
  maximumBidLevels: number;
  maximumAskLevels: number;
  validation: string;
}

function fail(line: number, message: string): never {
  throw new Error(`JSONL line ${line}: ${message}`);
}

function blockTimeNanoseconds(value: string, line: number): bigint {
  const match = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?$/.exec(value);
  if (!match) fail(line, `invalid UTC blockTime ${JSON.stringify(value)}`);
  const seconds = Date.parse(`${match[1]}Z`);
  if (!Number.isFinite(seconds)) fail(line, `invalid blockTime ${JSON.stringify(value)}`);
  const fraction = BigInt((match[2] ?? "").padEnd(9, "0"));
  return BigInt(seconds) * 1_000_000n + fraction;
}

function levelArray(
  value: unknown,
  side: "bids" | "asks",
  line: number,
): JsonL2Level[] {
  if (!Array.isArray(value)) fail(line, `${side} must be an array`);
  let previousPrice: bigint | undefined;
  const seen = new Set<bigint>();
  return value.map((raw, index) => {
    if (!raw || typeof raw !== "object") fail(line, `${side}[${index}] must be an object`);
    const level = raw as Partial<JsonL2Level>;
    if (typeof level.px !== "string") fail(line, `${side}[${index}].px must be a string`);
    if (typeof level.sz !== "string") fail(line, `${side}[${index}].sz must be a string`);
    if (!Number.isSafeInteger(level.n) || level.n! <= 0) {
      fail(line, `${side}[${index}].n must be a positive integer`);
    }
    const price = parseDecimal(level.px);
    const size = parseDecimal(level.sz);
    if (price <= 0n) fail(line, `${side}[${index}] has a non-positive price`);
    if (size <= 0n) fail(line, `${side}[${index}] has a non-positive size`);
    if (seen.has(price)) fail(line, `${side} contains duplicate price ${level.px}`);
    seen.add(price);
    if (previousPrice !== undefined) {
      const sorted = side === "bids" ? previousPrice > price : previousPrice < price;
      if (!sorted) fail(line, `${side} prices are not strictly ${side === "bids" ? "descending" : "ascending"}`);
    }
    previousPrice = price;
    return { px: level.px, sz: level.sz, n: level.n! };
  });
}

export function validateJsonlRows(lines: string[]): Omit<JsonlValidationReport, "file" | "bytes"> {
  if (lines.length === 0) throw new Error("JSONL file contains no snapshots");
  const snapshots: JsonL2Snapshot[] = [];
  let previousTime: bigint | undefined;
  let expectedCoin: string | undefined;
  let expectedBlock: number | undefined;

  lines.forEach((text, index) => {
    const line = index + 1;
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch (error) {
      fail(line, `invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (!raw || typeof raw !== "object") fail(line, "snapshot must be an object");
    const snapshot = raw as Partial<JsonL2Snapshot>;
    if (!Number.isSafeInteger(snapshot.blockNumber) || snapshot.blockNumber! < 0) {
      fail(line, "blockNumber must be a non-negative safe integer");
    }
    if (expectedBlock !== undefined && snapshot.blockNumber !== expectedBlock) {
      fail(line, `block gap/order error: expected ${expectedBlock}, got ${snapshot.blockNumber}`);
    }
    expectedBlock = snapshot.blockNumber! + 1;
    if (typeof snapshot.blockTime !== "string") fail(line, "blockTime must be a string");
    const time = blockTimeNanoseconds(snapshot.blockTime, line);
    if (previousTime !== undefined && time < previousTime) {
      fail(line, "blockTime regressed");
    }
    previousTime = time;
    if (typeof snapshot.coin !== "string" || snapshot.coin.length === 0) {
      fail(line, "coin must be a non-empty string");
    }
    expectedCoin ??= snapshot.coin;
    if (snapshot.coin !== expectedCoin) {
      fail(line, `coin mismatch: expected ${expectedCoin}, got ${snapshot.coin}`);
    }
    const bids = levelArray(snapshot.bids, "bids", line);
    const asks = levelArray(snapshot.asks, "asks", line);
    if (bids[0] && asks[0] && parseDecimal(bids[0].px) >= parseDecimal(asks[0].px)) {
      fail(line, `crossed book: best bid ${bids[0].px}, best ask ${asks[0].px}`);
    }
    snapshots.push({
      blockNumber: snapshot.blockNumber!,
      blockTime: snapshot.blockTime,
      coin: snapshot.coin,
      bids,
      asks,
    });
  });

  const first = snapshots[0]!;
  const last = snapshots.at(-1)!;
  return {
    coin: first.coin,
    snapshots: snapshots.length,
    fromBlock: first.blockNumber,
    toBlock: last.blockNumber,
    firstBlockTime: first.blockTime,
    lastBlockTime: last.blockTime,
    maximumBidLevels: Math.max(...snapshots.map((snapshot) => snapshot.bids.length)),
    maximumAskLevels: Math.max(...snapshots.map((snapshot) => snapshot.asks.length)),
    validation:
      "JSON parsed; blocks continuous; timestamps monotonic; levels exact, positive, unique, sorted, and uncrossed",
  };
}

export async function validateJsonlFile(file: string): Promise<JsonlValidationReport> {
  const [contents, metadata] = await Promise.all([readFile(file, "utf8"), stat(file)]);
  const lines = contents.split(/\r?\n/).filter((line) => line.trim().length > 0);
  return { file, bytes: metadata.size, ...validateJsonlRows(lines) };
}
