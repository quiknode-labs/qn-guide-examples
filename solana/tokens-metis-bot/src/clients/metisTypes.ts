// Metis (Jupiter Swap) request and response shapes, verified against the
// live Quicknode docs. Amount fields are strings in responses; parse with
// BigInt. The full quote response must be passed back to /swap unmodified.

export interface MetisQuoteParams {
  inputMint: string;
  outputMint: string;
  amount: string; // base units of the input mint (ExactIn)
  slippageBps: number;
  swapMode: "ExactIn" | "ExactOut";
  dexes?: string; // comma-separated Metis venue labels
  excludeDexes?: string;
  onlyDirectRoutes?: boolean;
  restrictIntermediateTokens?: boolean;
  maxAccounts?: number;
}

export interface RoutePlanStep {
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
  bps?: number;
}

export interface MetisQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: { amount: string; feeBps: number } | null;
  priceImpactPct: string;
  routePlan: RoutePlanStep[];
  contextSlot?: number;
  timeTaken?: number;
  swapUsdValue?: string;
  // Present on the live response; shape is loosely documented, so treat
  // defensively. info appears to map AMM ids to quoted out amounts.
  mostReliableAmmsQuoteReport?: { info: Record<string, string> } | null;
  // The docs list more optional fields; keep them so /swap gets the
  // response back byte-for-byte.
  [key: string]: unknown;
}

export interface MetisSwapRequest {
  userPublicKey: string;
  quoteResponse: MetisQuoteResponse;
  wrapAndUnwrapSol?: boolean;
  dynamicComputeUnitLimit?: boolean;
  prioritizationFeeLamports?: {
    priorityLevelWithMaxLamports?: {
      priorityLevel: "medium" | "high" | "veryHigh";
      maxLamports: number;
      global: boolean;
    };
    jitoTipLamports?: number;
  };
}

export interface MetisSwapResponse {
  swapTransaction: string; // base64 serialized transaction, unsigned
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: number;
}
