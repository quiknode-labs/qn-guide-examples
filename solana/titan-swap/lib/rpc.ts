import { createSolanaRpc, type Rpc, type SolanaRpcApi } from "@solana/kit";

/**
 * Same-origin RPC proxy. The Quicknode endpoint/token lives only on the server
 * (QUICKNODE_RPC_URL); the browser talks to /api/rpc. This replaces the
 * wallet-adapter `ConnectionProvider` — every client RPC call now goes through
 * a @solana/kit RPC built from this endpoint.
 */
function getRpcEndpoint(): string {
  if (typeof window !== "undefined") return `${window.location.origin}/api/rpc`;
  return "http://localhost/api/rpc"; // SSR placeholder; real calls happen client-side
}

export function createRpc(): Rpc<SolanaRpcApi> {
  return createSolanaRpc(getRpcEndpoint());
}
