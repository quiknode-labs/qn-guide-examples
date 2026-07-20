// Tokens API client. Third-party REST service (not a Quicknode product),
// so this is the one place native fetch is used. The API key travels in
// the x-api-key header only: never in a query string, never in a log line.
//
// Endpoint paths verified against docs.tokens.xyz on 2026-07-20; deltas
// against the original spec are recorded in NOTES.md.

import type { LiquidityTier, Market } from "../types.ts";
import { tierRank } from "../types.ts";

// -- raw API shapes (mapped, never leaked past this module) ------------------

export interface MarketSnapshot {
  source?: string; // data source here, NOT a venue (that is pool rows)
  metricsSource?: string | null;
  price?: number;
  volume5mUSD?: number | null;
  volume15mUSD?: number | null;
  volume1hUSD?: number | null;
  volume24hUSD?: number | null;
  priceChange1hPercent?: number | null;
  priceChange24hPercent?: number | null;
  trade24h?: number | null;
  uniqueWallet24h?: number | null;
  lastTradeAt?: number | null;
  asOf?: number | null;
}

export interface TrendingEntry {
  rank: number;
  assetId: string;
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  category: string;
  market: MarketSnapshot;
  trending: { score: number; scoringVersion: string };
}

export interface RiskCap {
  name: string;
  tone: "info" | "success" | "warning" | "danger";
  value?: unknown;
}

export interface RiskSummary {
  score: number;
  grade: string;
  label: string;
  tone: string;
  isTrustedLaunch: boolean;
  caps: RiskCap[];
  hasInsufficientData: boolean;
  insufficientDataReason?: string;
}

export interface Variant {
  mint: string;
  liquidityTier: LiquidityTier;
  trustTier?: string;
  market?: {
    liquidity?: number | null;
    metricsSource?: string | null;
    volume1hUSD?: number | null;
  } | null;
}

export interface ResolveResult {
  assetId: string;
  resolvedBy: string;
  mint: string;
  asset: { assetId: string; name: string; symbol: string; category: string };
}

// Plain /markets rows do not carry a venue label; variant-top-markets does,
// under topMarket.source (e.g. "Raydium Clamm"), which dexMap needs.
interface RawTopMarket {
  address: string;
  source: string; // venue name
  liquidity?: number;
  name?: string;
}

interface RawVariantTopMarket {
  mint: string;
  topMarket?: RawTopMarket | null;
}

// -- pure helpers (exported for tests) ---------------------------------------

// The screen's risk gate counts named risk factors with a negative tone.
// Insufficient data counts as one flag: an unratable asset should not pass
// a zero-flag gate.
export function countRiskFlags(summary: RiskSummary): number {
  const caps = summary.caps ?? [];
  const negative = caps.filter((c) => c.tone === "warning" || c.tone === "danger").length;
  return negative + (summary.hasInsufficientData ? 1 : 0);
}

// Merge trending results from multiple category queries into one universe.
// An asset can appear under several mints (for example wBTC and cbBTC both
// resolve to the canonical asset "bitcoin"); those collapse to one entry
// because they select the same chosen variant downstream. Keep the highest
// trending score per asset, then rank by score and cap to the limit.
export function dedupeTrending(entries: TrendingEntry[], limit: number): TrendingEntry[] {
  const byAsset = new Map<string, TrendingEntry>();
  for (const e of entries) {
    const existing = byAsset.get(e.assetId);
    if (!existing || (e.trending?.score ?? 0) > (existing.trending?.score ?? 0)) {
      byAsset.set(e.assetId, e);
    }
  }
  return [...byAsset.values()]
    .sort((a, b) => (b.trending?.score ?? 0) - (a.trending?.score ?? 0))
    .slice(0, limit);
}

// Momentum for the configured window. Trending snapshots only carry price
// change for 1h and 24h; when the requested window is unavailable, fall
// back to 1h-vs-24h volume pace and record the basis used.
export function momentumFromSnapshot(
  market: MarketSnapshot,
  window: string,
): { momentumPct: number; momentumBasis: string } {
  if (window === "1h" && typeof market.priceChange1hPercent === "number") {
    return { momentumPct: market.priceChange1hPercent, momentumBasis: "1h" };
  }
  if (window === "24h" && typeof market.priceChange24hPercent === "number") {
    return { momentumPct: market.priceChange24hPercent, momentumBasis: "24h" };
  }
  // Fallback: how the current 1h volume pace compares to the 24h baseline,
  // expressed as a percentage above (+) or below (-) that baseline.
  const v1h = market.volume1hUSD;
  const v24h = market.volume24hUSD;
  if (typeof v1h === "number" && typeof v24h === "number" && v24h > 0) {
    const pace = (v1h * 24) / v24h;
    return { momentumPct: (pace - 1) * 100, momentumBasis: "1h-vs-24h-pace" };
  }
  return { momentumPct: 0, momentumBasis: "unavailable" };
}

// -- client ------------------------------------------------------------------

export class TokensApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId: string | null,
    readonly tag?: string,
  ) {
    super(message);
    this.name = "TokensApiError";
  }
}

export interface TokensClient {
  getTrending(opts: { limit: number; categories?: string[] }): Promise<TrendingEntry[]>;
  resolve(ref: { mint: string } | { ref: string }): Promise<ResolveResult>;
  getRiskSummary(mint: string): Promise<RiskSummary>;
  getVariants(assetId: string, opts: { minLiquidityTier: LiquidityTier }): Promise<Variant[]>;
  getMarkets(assetId: string, opts: { mint: string }): Promise<Market[]>;
}

const MAX_ATTEMPTS = 4;

export function createTokensClient(baseUrl: string): TokensClient {
  const apiKey = process.env.TOKENS_API_KEY;
  if (!apiKey) throw new Error("TOKENS_API_KEY is not set");

  async function get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
    const url = new URL(`${baseUrl}${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    let lastError: Error = new Error("unreachable");
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        // Exponential backoff with jitter: 250ms * 2^attempt + up to 150ms.
        const delay = 250 * 2 ** attempt + Math.random() * 150;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const response = await fetch(url, { headers: { "x-api-key": apiKey } });
      const requestId = response.headers.get("x-request-id");

      if (response.ok) {
        return (await response.json()) as T;
      }

      let tag: string | undefined;
      let message = response.statusText;
      try {
        const body = (await response.json()) as {
          error?: { _tag?: string; message?: string; details?: string };
        };
        tag = body.error?._tag;
        message = body.error?.message ?? message;
      } catch {
        // non-JSON error body; keep statusText
      }
      lastError = new TokensApiError(
        `Tokens API ${path} failed: ${response.status} ${message}` +
          (requestId ? ` (x-request-id: ${requestId})` : ""),
        response.status,
        requestId,
        tag,
      );

      // Retry 429 and transient 5xx; never retry client errors unchanged.
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable) throw lastError;
    }
    throw lastError;
  }

  return {
    // The /trending endpoint takes a single category, so scope the universe
    // by querying each configured category and merging. Niche categories
    // (equity, commodity, etf) return few assets, so the cap mostly trims
    // the crypto tail.
    async getTrending({ limit, categories }): Promise<TrendingEntry[]> {
      if (!categories || categories.length === 0) {
        const data = await get<{ trending: TrendingEntry[] }>("/assets/trending", { limit });
        return data.trending.slice(0, limit);
      }
      const perCategory = await Promise.all(
        categories.map((category) =>
          get<{ trending: TrendingEntry[] }>("/assets/trending", { limit, category }).then(
            (d) => d.trending,
          ),
        ),
      );
      return dedupeTrending(perCategory.flat(), limit);
    },

    async resolve(ref): Promise<ResolveResult> {
      return get<ResolveResult>("/assets/resolve", ref);
    },

    // Use the top-level risk endpoint: it returns the flat summary shape
    // (score, caps, hasInsufficientData) that RiskSummary models. The
    // per-asset path /assets/:id/risk-summary nests the data under
    // risk.marketScore, a different shape, so it is not used here.
    async getRiskSummary(mint): Promise<RiskSummary> {
      return get<RiskSummary>("/assets/risk-summary", { mint });
    },

    // Variants sorted by liquidity, filtered to the tier floor. The caller
    // takes the first entry as the chosen mint.
    async getVariants(assetId, { minLiquidityTier }): Promise<Variant[]> {
      const data = await get<{ variants?: Variant[] }>(
        `/assets/${encodeURIComponent(assetId)}/variants`,
        { sortBy: "liquidity" },
      );
      // Defensive: an asset with no variant list (or an unexpected shape)
      // yields no candidate rather than crashing the whole cycle.
      return (data.variants ?? [])
        .filter((v) => tierRank(v.liquidityTier) <= tierRank(minLiquidityTier))
        .sort((a, b) => (b.market?.liquidity ?? 0) - (a.market?.liquidity ?? 0));
    },

    // The deepest market for the chosen variant, including its venue. Uses
    // variant-top-markets because the plain /markets endpoint omits the venue
    // label that dexMap needs. Returns the single top pool as the execution
    // target (the executor uses only the best market).
    async getMarkets(assetId, { mint }): Promise<Market[]> {
      const data = await get<{ variants?: RawVariantTopMarket[] }>(
        `/assets/${encodeURIComponent(assetId)}/variant-top-markets`,
        { limit: 50 },
      );
      const tm = (data.variants ?? []).find((v) => v.mint === mint)?.topMarket;
      if (!tm?.source || !tm.address) return [];
      return [{ poolId: tm.address, venueLabel: tm.source, liquidityUSD: tm.liquidity ?? 0 }];
    },
  };
}
