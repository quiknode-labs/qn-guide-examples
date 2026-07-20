// Shared test fixtures.

import type { Candidate, Position, Rules } from "../src/types.ts";

export function makeRules(overrides: Partial<Rules> = {}): Rules {
  return {
    universe: { limit: 50, categories: ["crypto"] },
    screen: {
      minLiquidityTier: "tier1",
      maxRiskFlags: 0,
      minVolume24hUSD: 500_000,
      momentum: { window: "1h", minChangePct: 10 },
    },
    portfolio: {
      quoteMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      maxPositions: 5,
      targetPositionSizeUSD: 100,
      maxPositionSizeUSD: 150,
    },
    exit: { sellWhenScreenFails: true },
    execution: {
      slippageBps: 100,
      onlyDirectRoutes: false,
      restrictIntermediateTokens: true,
      maxAccounts: 64,
    },
    ...overrides,
  };
}

export function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  return {
    assetId: "solana-TESTMINT1111111111111111111111111111111",
    symbol: "TEST",
    chosenMint: "TESTMINT1111111111111111111111111111111",
    liquidityTier: "tier1",
    riskFlagCount: 0,
    volume24hUSD: 1_000_000,
    momentumPct: 15,
    momentumBasis: "1h",
    ...overrides,
  };
}

export function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    assetId: "solana-TESTMINT1111111111111111111111111111111",
    symbol: "TEST",
    mint: "TESTMINT1111111111111111111111111111111",
    amountBaseUnits: "1000000",
    entryPriceUSD: 1.0,
    entryTs: 1_752_000_000_000,
    entryVenue: "Orca",
    entryLiquidityTier: "tier1",
    entryRiskFlagCount: 0,
    ...overrides,
  };
}

// A realistic slice of the Metis program-id-to-label response.
export const LABEL_MAP: Record<string, string> = {
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": "Raydium",
  CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK: "Raydium CLMM",
  CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C: "Raydium CP",
  whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc: "Whirlpool",
  "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP": "Orca V2",
  LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo: "Meteora DLMM",
  Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB: "Meteora",
  PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY: "Phoenix",
  pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA: "Pump.fun Amm",
  SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ: "Saber",
};
