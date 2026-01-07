"use client";

import type { Token, TokenBalance } from "./types";

export interface JupiterQuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: any[];
  _ultraTransaction?: string; // Ultra API: base64 encoded transaction
  _ultraRequestId?: string; // Ultra API: request ID for execute endpoint
}

export interface JupiterSwapResponse {
  swapTransaction: string; // base64 encoded transaction
  lastValidBlockHeight: number;
  priorityFeeLamports: string;
  _ultraOrder?: boolean; // Flag for Ultra API
  _ultraRequestId?: string; // Request ID for Ultra execute endpoint
}

// Jupiter Ultra API response types
export interface JupiterUltraOrderResponse {
  inAmount: string;
  outAmount: string;
  priceImpactPct?: string; // May be called priceImpact in some responses
  priceImpact?: string; // Alternative field name
  transaction: string; // base64 encoded transaction (empty if no taker or insufficient funds)
  requestId: string; // Request ID for execute endpoint
  swapMode: string;
  slippageBps: number;
  routePlan?: any[];
  error?: string; // Error message if any
  errorCode?: number; // Error code if any
}

export interface JupiterUltraExecuteResponse {
  signature: string;
  status: string;
}

/**
 * Fetch token list from Jupiter Token API v2 via API route
 * Uses the verified tag endpoint to get all verified tokens
 * Maps v2 API response format to our Token interface
 */
export async function fetchTokenList(): Promise<Token[]> {
  try {
    const response = await fetch("/api/tokens", {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tokens: ${response.statusText}`);
    }

    const tokens: Token[] = await response.json();
    console.log(`Successfully loaded ${tokens.length} verified tokens`);
    return tokens;
  } catch (error) {
    console.error("Error fetching token list:", error);
    return [];
  }
}

/**
 * Fetch token balances using Jupiter Ultra API via API route
 * Returns both SOL and SPL token balances for a wallet
 */
export async function fetchTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
  if (!walletAddress) {
    return [];
  }

  try {
    const response = await fetch(`/api/balances?walletAddress=${encodeURIComponent(walletAddress)}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const balances: TokenBalance[] = await response.json();
    return balances;
  } catch (error) {
    console.error("Error fetching token balances:", error);
    return [];
  }
}

/**
 * Get swap quote from Jupiter Ultra API via API route
 * @param inputMint - Address of the token to swap from
 * @param outputMint - Address of the token to swap to
 * @param amount - Amount in smallest units (e.g., lamports for SOL)
 * @param slippageBps - Slippage tolerance in basis points (50 = 0.5%)
 * @param taker - Optional wallet address (required for Ultra API to generate transaction)
 */
export async function getSwapQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50,
  taker?: string
): Promise<JupiterQuoteResponse> {
  // Build query parameters
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: Math.floor(amount).toString(),
    slippageBps: slippageBps.toString(),
  });

  if (taker) {
    params.append("taker", taker);
  }

  const response = await fetch(`/api/quote?${params.toString()}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Request failed: ${response.statusText}`);
  }

  const quote = await response.json();
  console.log("Jupiter Ultra API Response:", quote);

  return quote as JupiterQuoteResponse;
}

/**
 * Get swap transaction from quote
 * For Ultra API, the transaction is already included in the quote response
 */
export async function getSwapTransaction(
  quote: JupiterQuoteResponse,
  userPublicKey: string
): Promise<JupiterSwapResponse> {
  if (!(quote as any)._ultraTransaction) {
    throw new Error("Transaction not found in quote");
  }

  return {
    swapTransaction: (quote as any)._ultraTransaction,
    lastValidBlockHeight: 0,
    priorityFeeLamports: "0",
    _ultraOrder: true,
    _ultraRequestId: (quote as any)._ultraRequestId,
  } as any;
}

/**
 * Execute Ultra swap order via API route
 * Sends the signed transaction to Jupiter Ultra API for execution
 */
export async function executeUltraSwap(
  signedTransaction: string,
  requestId?: string
): Promise<JupiterUltraExecuteResponse> {
  const response = await fetch("/api/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      signedTransaction,
      requestId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Request failed: ${response.statusText}`);
  }

  return await response.json();
}

