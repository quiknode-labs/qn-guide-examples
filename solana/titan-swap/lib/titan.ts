"use client";

import type {
  TitanSwapResponse,
  TitanPriceResponse,
  TitanProvider,
  TitanVenues,
  TitanInfo,
} from "./types";

/** Thin client over our own /api/titan/* proxy routes. The proxy handles the
 *  Gateway auth, MessagePack decoding and pubkey normalization server-side. */
async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Request failed: ${res.status}`);
  }
  if (!res.ok) {
    const message =
      (data as { error?: string })?.error || `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

export function getTitanInfo(): Promise<TitanInfo> {
  return getJson<TitanInfo>("/api/titan/info");
}

export function getTitanProviders(): Promise<TitanProvider[]> {
  return getJson<TitanProvider[]>("/api/titan/providers");
}

export function getTitanVenues(): Promise<TitanVenues> {
  return getJson<TitanVenues>("/api/titan/venues");
}

export function getTitanPrice(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: number
): Promise<TitanPriceResponse> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount,
    slippageBps: String(slippageBps),
  });
  return getJson<TitanPriceResponse>(`/api/titan/price?${params}`);
}

export function getTitanSwap(opts: {
  inputMint: string;
  outputMint: string;
  amount: string;
  userPublicKey: string;
  slippageBps: number;
  simulate: boolean;
}): Promise<TitanSwapResponse> {
  const params = new URLSearchParams({
    inputMint: opts.inputMint,
    outputMint: opts.outputMint,
    amount: opts.amount,
    userPublicKey: opts.userPublicKey,
    slippageBps: String(opts.slippageBps),
    simulate: String(opts.simulate),
  });
  return getJson<TitanSwapResponse>(`/api/titan/swap?${params}`);
}
