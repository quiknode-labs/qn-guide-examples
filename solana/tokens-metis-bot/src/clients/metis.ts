// Typed wrappers over the metis_* custom methods registered on the Kit
// client. Metis returns unsigned transactions only; signing and sending
// stay in clients/rpc.ts.

import type { Rules } from "../types.ts";
import type { BotRpc } from "./rpc.ts";
import type { MetisQuoteResponse, MetisSwapResponse } from "./metisTypes.ts";

export interface QuoteRequest {
  inputMint: string;
  outputMint: string;
  amountBaseUnits: string;
  dexes: string[]; // Metis venue labels from engine/dexMap
}

export interface MetisClient {
  quote(req: QuoteRequest): Promise<MetisQuoteResponse>;
  swap(quoteResponse: MetisQuoteResponse, userPublicKey: string): Promise<MetisSwapResponse>;
  programIdToLabel(): Promise<Record<string, string>>;
  // Which AMMs actually quoted, from mostReliableAmmsQuoteReport, for the
  // trade log to confirm the trade landed on the intended venue.
  reliableAmms(quote: MetisQuoteResponse): string[];
}

export function createMetisClient(rpc: BotRpc, rules: Rules): MetisClient {
  let labelMapCache: Record<string, string> | undefined;

  return {
    // Returns the full parsed quote object unmodified: /swap needs the
    // whole thing sent back.
    async quote(req: QuoteRequest): Promise<MetisQuoteResponse> {
      return rpc
        .metis_quote({
          inputMint: req.inputMint,
          outputMint: req.outputMint,
          amount: req.amountBaseUnits,
          slippageBps: rules.execution.slippageBps,
          swapMode: "ExactIn",
          dexes: req.dexes.join(","),
          onlyDirectRoutes: rules.execution.onlyDirectRoutes,
          restrictIntermediateTokens: rules.execution.restrictIntermediateTokens,
          maxAccounts: rules.execution.maxAccounts,
        })
        .send();
    },

    async swap(quoteResponse: MetisQuoteResponse, userPublicKey: string): Promise<MetisSwapResponse> {
      return rpc
        .metis_swap({
          quoteResponse,
          userPublicKey,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: {
            priorityLevelWithMaxLamports: {
              priorityLevel: "high",
              // Hard cap on the priority fee: 0.001 SOL.
              maxLamports: 1_000_000,
              global: false,
            },
          },
        })
        .send();
    },

    // Fetched once and cached; the label set changes rarely.
    async programIdToLabel(): Promise<Record<string, string>> {
      if (!labelMapCache) {
        labelMapCache = await rpc.metis_programIdToLabel({}).send();
      }
      return labelMapCache;
    },

    reliableAmms(quote: MetisQuoteResponse): string[] {
      const info = quote.mostReliableAmmsQuoteReport?.info;
      return info ? Object.keys(info) : [];
    },
  };
}
