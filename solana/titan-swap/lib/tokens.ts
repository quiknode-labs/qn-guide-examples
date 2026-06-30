"use client";

import type { Token } from "./types";

/**
 * Token metadata registry.
 *
 * Titan Gateway is a swap aggregator, not a token directory, so it doesn't ship
 * a token list. We pull verified token metadata (symbol/name/decimals/logo)
 * from a public registry purely for display and decimals — no routing or
 * pricing comes from here; that all flows through Titan.
 */
const TOKEN_REGISTRY = "https://lite-api.jup.ag/tokens/v2/tag?query=verified";

export const SOL_MINT = "So11111111111111111111111111111111111111112";
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export const COMMON_TOKENS: Token[] = [
  { address: SOL_MINT, symbol: "SOL", name: "Solana", decimals: 9 },
  { address: USDC_MINT, symbol: "USDC", name: "USD Coin", decimals: 6 },
  {
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
  },
];

export async function fetchTokenList(): Promise<Token[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(TOKEN_REGISTRY, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    /* eslint-disable @typescript-eslint/no-explicit-any */
    return data
      .filter((t: any) => t.isVerified === true)
      .map((t: any) => ({
        address: t.id || t.address,
        symbol: t.symbol || "",
        name: t.name || "",
        decimals: t.decimals ?? 9,
        logoURI: t.icon || t.logoURI,
      }));
  } catch {
    return [];
  }
}
