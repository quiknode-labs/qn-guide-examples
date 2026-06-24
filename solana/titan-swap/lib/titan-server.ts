import "server-only";
import { decode } from "@msgpack/msgpack";
import bs58 from "bs58";
import type {
  TitanInstruction,
  TitanSwapRoute,
  TitanSwapResponse,
  TitanPriceResponse,
  TitanProvider,
  TitanVenues,
  TitanInfo,
} from "./types";

/**
 * Server-only Titan Gateway client.
 *
 * The Gateway is reached through your QuickNode endpoint. Responses are
 * MessagePack-encoded binary, and pubkeys arrive as raw 32-byte buffers — we
 * decode here, on the server, so the browser only ever sees clean JSON and the
 * auth credential never leaves the server.
 *
 * Env:
 *   TITAN_GATEWAY_URL  — base URL of the add-on (with or without trailing /api/v1)
 *   TITAN_GATEWAY_AUTH — optional bearer token (if not already in the URL)
 */
const RAW_BASE = process.env.TITAN_GATEWAY_URL;
const AUTH = process.env.TITAN_GATEWAY_AUTH;

function baseUrl(): string {
  if (!RAW_BASE) {
    throw new Error(
      "TITAN_GATEWAY_URL is not set. Add your Titan Gateway add-on URL to .env.local."
    );
  }
  let b = RAW_BASE.replace(/\/+$/, "");
  if (!b.endsWith("/api/v1")) b = `${b}/api/v1`;
  return b;
}

type QueryValue = string | number | boolean | undefined;

async function titanGet<T = unknown>(
  path: string,
  params?: Record<string, QueryValue>
): Promise<T> {
  const url = new URL(`${baseUrl()}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = { Accept: "application/vnd.msgpack" };
  if (AUTH) headers.Authorization = `Bearer ${AUTH}`;

  const res = await fetch(url.toString(), { headers, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Titan ${path} failed: ${res.status} ${text.slice(0, 300)}`);
  }

  const buf = new Uint8Array(await res.arrayBuffer());
  return decode(buf) as T;
}

// --- encoding helpers -------------------------------------------------------

function toBase58(v: unknown): string {
  if (typeof v === "string") return v;
  if (v instanceof Uint8Array) return bs58.encode(v);
  if (Array.isArray(v)) return bs58.encode(Uint8Array.from(v as number[]));
  return String(v ?? "");
}

function toBase64(v: unknown): string {
  if (typeof v === "string") return v;
  if (v instanceof Uint8Array) return Buffer.from(v).toString("base64");
  if (Array.isArray(v)) return Buffer.from(Uint8Array.from(v as number[])).toString("base64");
  return "";
}

// The Gateway uses compact keys (p/a/d, p/s/w) but we read long forms too so a
// schema tweak upstream doesn't silently break the builder.
/* eslint-disable @typescript-eslint/no-explicit-any */
function normInstruction(ix: any): TitanInstruction {
  return {
    programId: toBase58(ix.p ?? ix.programId),
    accounts: (ix.a ?? ix.accounts ?? []).map((a: any) => ({
      pubkey: toBase58(a.p ?? a.pubkey),
      isSigner: Boolean(a.s ?? a.isSigner),
      isWritable: Boolean(a.w ?? a.isWritable),
    })),
    data: toBase64(ix.d ?? ix.data),
  };
}

function normStep(s: any) {
  return {
    label: String(s.label ?? s.amm ?? "Unknown"),
    ammKey: toBase58(s.ammKey),
    inputMint: toBase58(s.inputMint),
    outputMint: toBase58(s.outputMint),
    inAmount: String(s.inAmount ?? ""),
    outAmount: String(s.outAmount ?? ""),
    // allocPpb is parts-per-billion; convert to a percentage.
    allocPct: s.allocPpb != null ? Number(s.allocPpb) / 1e7 : 0,
  };
}

function normRoute(provider: string, r: any): TitanSwapRoute {
  return {
    provider,
    inputAmount: String(r.inputAmount ?? r.inAmount ?? ""),
    outAmount: String(r.outAmount ?? r.outputAmount ?? ""),
    slippageBps: Number(r.slippageBps ?? 0),
    priceImpact: r.priceImpact != null ? Number(r.priceImpact) : undefined,
    computeUnitsSafe:
      r.computeUnitsSafe != null ? Number(r.computeUnitsSafe) : undefined,
    steps: (r.steps ?? []).map(normStep),
    instructions: (r.instructions ?? []).map(normInstruction),
    addressLookupTables: (r.addressLookupTables ?? []).map(toBase58),
    expiresAtMs: r.expiresAtMs != null ? Number(r.expiresAtMs) : undefined,
    expiresAfterSlot:
      r.expiresAfterSlot != null ? Number(r.expiresAfterSlot) : undefined,
  };
}

// --- public API -------------------------------------------------------------

export async function fetchInfo(): Promise<TitanInfo> {
  const raw = await titanGet<any>("/info");
  const iv = raw?.settings?.quoteUpdate?.intervalMs;
  const pv = raw?.protocolVersion;
  const protocolVersion =
    pv && typeof pv === "object"
      ? [pv.major, pv.minor, pv.patch].filter((x) => x != null).join(".")
      : String(pv ?? "unknown");
  return {
    protocolVersion,
    quoteIntervalMs: iv
      ? { default: Number(iv.default), min: Number(iv.min), max: Number(iv.max) }
      : undefined,
  };
}

export async function fetchProviders(): Promise<TitanProvider[]> {
  const raw = await titanGet<any>("/providers");
  const arr = Array.isArray(raw) ? raw : raw?.providers ?? [];
  return arr.map((p: any) => ({ id: String(typeof p === "string" ? p : p.id) }));
}

export async function fetchVenues(): Promise<TitanVenues> {
  const raw = await titanGet<any>("/venues", { includeProgramIds: true });
  return {
    labels: (raw?.labels ?? []).map((l: any) => String(l)),
    programIds: (raw?.programIds ?? []).map(toBase58),
  };
}

export async function fetchPrice(params: {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
}): Promise<TitanPriceResponse> {
  const raw = await titanGet<any>("/quote/price", {
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount,
    slippageBps: params.slippageBps,
  });
  return {
    inputAmount: String(raw?.inputAmount ?? params.amount),
    outputAmount: String(raw?.outputAmount ?? raw?.outAmount ?? "0"),
    priceImpact: raw?.priceImpact != null ? Number(raw.priceImpact) : undefined,
  };
}

export async function fetchSwap(params: {
  inputMint: string;
  outputMint: string;
  amount: string;
  userPublicKey: string;
  slippageBps?: number;
  simulate?: boolean;
}): Promise<TitanSwapResponse> {
  const raw = await titanGet<any>("/quote/swap", {
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    amount: params.amount,
    userPublicKey: params.userPublicKey,
    slippageBps: params.slippageBps,
    simulate: params.simulate,
    // Ask every provider to quote so the race is populated (server max is 10).
    numQuotes: 10,
  });

  const quotesMap = raw?.quotes ?? {};
  const expectedWinner: string | null = raw?.metadata?.ExpectedWinner ?? null;

  const quotes: TitanSwapRoute[] = Object.entries(quotesMap)
    .map(([provider, route]) => normRoute(provider, route))
    // Drop providers that failed to produce a usable route.
    .filter((q) => Number(q.outAmount) > 0);

  // Sort best output first; keep the expected winner on top if present.
  quotes.sort((a, b) => {
    if (expectedWinner) {
      if (a.provider === expectedWinner) return -1;
      if (b.provider === expectedWinner) return 1;
    }
    return Number(b.outAmount) - Number(a.outAmount);
  });

  return { quotes, expectedWinner };
}
