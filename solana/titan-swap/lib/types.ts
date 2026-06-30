export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export interface TokenBalance {
  mint: string;
  balance: number;
  decimals: number;
}

export type SwapStatus =
  | "idle"
  | "quoting"
  | "building"
  | "signing"
  | "sending"
  | "confirming"
  | "success"
  | "error";

// ---------------------------------------------------------------------------
// Titan Gateway types
// ---------------------------------------------------------------------------

/** A single instruction, normalized to base58 program id / base64 data by the
 *  server proxy (the Gateway sends raw 32-byte binary over MessagePack). */
export interface TitanInstruction {
  programId: string;
  accounts: { pubkey: string; isSigner: boolean; isWritable: boolean }[];
  data: string; // base64
}

/** One hop/leg of a route's actual venue breakdown (from route.steps). */
export interface TitanRouteStep {
  label: string; // venue name, e.g. "Quantum", "Meteora DAMM V2"
  ammKey: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  allocPct: number; // allocation of this leg, 0..100 (from allocPpb)
}

/** One provider's executable route from GET /api/v1/quote/swap. */
export interface TitanSwapRoute {
  provider: string;
  inputAmount: string;
  outAmount: string;
  slippageBps: number;
  priceImpact?: number;
  computeUnitsSafe?: number;
  steps: TitanRouteStep[];
  instructions: TitanInstruction[];
  addressLookupTables: string[];
  expiresAtMs?: number;
  expiresAfterSlot?: number;
}

/** Normalized response from our /api/titan/swap proxy. */
export interface TitanSwapResponse {
  quotes: TitanSwapRoute[]; // one per competing provider, best first
  expectedWinner: string | null;
}

/** Normalized response from our /api/titan/price proxy. */
export interface TitanPriceResponse {
  inputAmount: string;
  outputAmount: string;
  priceImpact?: number;
}

export interface TitanProvider {
  id: string;
}

export interface TitanVenues {
  labels: string[];
  programIds: string[]; // parallel to labels (may be empty)
}

export interface TitanInfo {
  protocolVersion: string;
  quoteIntervalMs?: { default: number; min: number; max: number };
}
