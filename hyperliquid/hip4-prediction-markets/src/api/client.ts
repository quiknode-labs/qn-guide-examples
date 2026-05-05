/**
 * Shared utilities for hyperliquidapi.com build-sign-send pattern.
 *
 * Flow:
 *   1. POST /exchange with action (no signature) → { hash, nonce, action, ... }
 *   2. Sign hash locally with viem private key account
 *   3. POST /exchange with { action, nonce, signature } → result
 */
import { privateKeyToAccount } from "viem/accounts";
import { parseSignature } from "viem";

export const API_BASE = "https://send.hyperliquidapi.com";
export const HL_INFO  = "https://api.hyperliquid.xyz/info";
export const HL_WS    = "wss://api.hyperliquid.xyz/ws";

export function getAccount() {
  const key = process.env.PRIVATE_KEY;
  if (!key) throw new Error("PRIVATE_KEY not set in .env");
  return privateKeyToAccount(key as `0x${string}`);
}

/** POST to hyperliquidapi.com /exchange */
async function exchangePost(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

/**
 * Full build-sign-send for any action.
 * Returns the final exchange response.
 */
export async function buildSignSend(action: Record<string, unknown>): Promise<Record<string, unknown>> {
  const account = getAccount();

  // 1. Build — no signature
  const built = await exchangePost({ action }) as any;
  const { hash, nonce } = built;
  if (!hash || nonce == null) {
    throw new Error(`Build step failed: ${JSON.stringify(built)}`);
  }

  // 2. Sign hash locally — account.sign() returns a 65-byte hex string (r+s+v)
  const rawSig = await account.sign({ hash: hash as `0x${string}` });
  const { r, s, v } = parseSignature(rawSig);
  const signature = { r, s, v: Number(v) };

  // 3. Send — include action (unchanged from build response), nonce, signature
  const result = await exchangePost({ action: built.action ?? action, nonce, signature });
  return result;
}

/** GET helper */
export async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

/** POST to Hyperliquid public info endpoint */
export async function hlInfo(type: string, extra?: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(HL_INFO, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, ...extra }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}
