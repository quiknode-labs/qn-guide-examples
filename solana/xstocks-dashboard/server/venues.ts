import { getJson, LABELS_URL } from "./prices.ts";

// Program labels. Jupiter publishes a program-to-label map for every DEX it routes through.
// The static entries cover startup and anything the fetch misses.
const DEX_LABELS = new Map<string, string>([
  ["CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK", "Raydium CLMM"],
  ["CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C", "Raydium CP"],
  ["675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8", "Raydium"],
  ["whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc", "Whirlpool"],
  ["LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo", "Meteora DLMM"],
  ["cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG", "Meteora DAMM v2"],
  ["REALQqNEomY6cQGZJUGwywTBD2UmDT32rZcNnfxQ5N2", "Byreal"],
  ["MNFSTqtC93rEfYHB6hF82sKdZpUDFWkViLByLd1k1Ms", "Manifest"],
  ["riptK81hDxhe5pW5jSzSM9iRA8azgEgLJ4dXkPtBS7j", "Riptide"],
]);

/** Routers that forward a swap to a pool. A trade counts toward the pool it filled in. */
const AGGREGATORS = new Map<string, string>([
  ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4", "Jupiter"],
  ["DF1ow4tspfHX9JwWJsAb9epbkA8hmpSEAtxXy1V27QBH", "DFlow"],
  ["T1TANpTeScyeqVzzgNViGDNrkQ6qHz9KrSBS4aNXvGT", "Titan"],
]);

const LENDING = new Map<string, string>([
  ["KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD", "Kamino Lend"],
  ["jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9", "Jupiter Lend"],
  ["jupr81YtYssSyPt8jbnGuiWon5f6x9TcDEFxYe3Bdzi", "Jupiter Lend"],
  ["jupeiUmn818Jg1ekPURTpr4mFo29p46vygyykFJ3wZC", "Jupiter Lend"],
]);

const INFRASTRUCTURE = new Set([
  "11111111111111111111111111111111",
  "ComputeBudget111111111111111111111111111111",
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr",
  "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo",
]);

export async function loadVenueLabels(): Promise<number> {
  try {
    const labels = await getJson<Record<string, string>>(LABELS_URL);
    for (const [program, label] of Object.entries(labels)) {
      if (!LENDING.has(program) && !AGGREGATORS.has(program)) DEX_LABELS.set(program, label);
    }
  } catch (error) {
    console.warn(`[venues] could not load Jupiter's program labels, using the built-in list: ${(error as Error).message}`);
  }
  return DEX_LABELS.size;
}

export const dexLabel = (program: string) => DEX_LABELS.get(program);
export const aggregatorLabel = (program: string) => AGGREGATORS.get(program);
export const lendingLabel = (program: string) => LENDING.get(program);
export const isInfrastructure = (program: string) => INFRASTRUCTURE.has(program);
export const shortAddress = (address: string) => `${address.slice(0, 4)}…${address.slice(-4)}`;
