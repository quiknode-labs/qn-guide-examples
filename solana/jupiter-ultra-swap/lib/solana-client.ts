"use client";

import { createSolanaRpc } from "@solana/kit";

// Default RPC URL - will be updated when RPC endpoint is fetched
// For now, use public Solana RPC as fallback
const DEFAULT_RPC_URL = "https://api.mainnet-beta.solana.com";

// Note: This RPC client may need to be updated to use the proxied RPC endpoint
// For now, using default public RPC
export const rpc = createSolanaRpc(DEFAULT_RPC_URL);

