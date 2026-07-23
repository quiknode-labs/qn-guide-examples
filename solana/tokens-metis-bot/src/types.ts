// Shared types for the bot. Internal shapes are decoupled from raw API
// responses; the clients map raw payloads into these.

export type LiquidityTier = "tier1" | "tier2" | "tier3";

export const LIQUIDITY_TIERS: readonly LiquidityTier[] = [
  "tier1",
  "tier2",
  "tier3",
];

// Lower index = deeper liquidity. tier1 is the floor-friendliest.
export function tierRank(tier: LiquidityTier): number {
  return LIQUIDITY_TIERS.indexOf(tier);
}

export interface Candidate {
  assetId: string; // canonical Tokens API asset id
  symbol: string;
  chosenMint: string; // selected variant mint
  liquidityTier: LiquidityTier;
  riskFlagCount: number;
  volume24hUSD: number;
  momentumPct: number; // change over the configured window
  momentumBasis: string; // e.g. "1h" or "1h-vs-24h-fallback"
}

export interface Market {
  poolId: string;
  venueLabel: string; // Tokens API venue/DEX name
  liquidityUSD: number;
}

export interface Position {
  assetId: string;
  symbol: string;
  mint: string;
  amountBaseUnits: string; // string to avoid float loss
  entryPriceUSD: number;
  entryTs: number;
  entryVenue: string;
  entryLiquidityTier: LiquidityTier;
  entryRiskFlagCount: number;
}

export interface TradeDecision {
  action: "buy" | "sell";
  candidate: Candidate;
  reason: string; // human-readable, used in the log
}

// rules.json shape, validated strictly in config.ts.
export interface Rules {
  universe: { limit: number; categories: string[] };
  screen: {
    minLiquidityTier: LiquidityTier;
    maxRiskFlags: number;
    minVolume24hUSD: number;
    momentum: { window: string; minChangePct: number };
  };
  portfolio: {
    quoteMint: string;
    maxPositions: number;
    targetPositionSizeUSD: number;
    maxPositionSizeUSD: number;
  };
  exit: {
    sellWhenScreenFails: boolean;
    takeProfitPct: number; // sell when PnL >= this percent; 0 disables
    stopLossPct: number; // sell when PnL <= -this percent; 0 disables
    reentryCooldownMinutes: number; // block re-buying a sold asset for this long; 0 disables
  };
  execution: {
    slippageBps: number;
    onlyDirectRoutes: boolean;
    restrictIntermediateTokens: boolean;
    maxAccounts: number;
  };
}

// Validated environment configuration. walletKeypairPath is the path to a
// keypair file, not a secret; the secret bytes are read from that file by
// rpc.ts and never stored on any serializable object.
export interface EnvConfig {
  solanaRpcUrl: string;
  metisEndpoint: string;
  tokensApiBaseUrl: string;
  walletKeypairPath: string;
  dryRun: boolean;
  killSwitchFile: string;
  pollIntervalSeconds: number;
  runOnce: boolean;
}
