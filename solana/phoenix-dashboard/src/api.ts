import type { Candle, MarketConfig, Timeframe } from "./types";

const REST_BASE = "https://perp-api.phoenix.trade";

export async function fetchMarketConfig(symbol: string): Promise<MarketConfig> {
  const res = await fetch(`${REST_BASE}/exchange/market/${symbol}`);
  if (!res.ok) throw new Error(`fetchMarketConfig ${symbol}: ${res.status}`);
  return res.json();
}

export async function fetchCandles(
  symbol: string,
  timeframe: Timeframe,
  limit = 500,
): Promise<Candle[]> {
  const url = new URL(`${REST_BASE}/candles`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("timeframe", timeframe);
  url.searchParams.set("limit", String(limit));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetchCandles ${symbol} ${timeframe}: ${res.status}`);
  const json = (await res.json()) as Candle[];
  return Array.isArray(json) ? json.sort((a, b) => a.time - b.time) : [];
}
