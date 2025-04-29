import { createPublicClient, http } from "viem";
import { ChainId, getChain } from "./chains";

// Cache for viem clients to avoid creating duplicate clients
const clientCache = new Map<ChainId, ReturnType<typeof createPublicClient>>();

/**
 * Creates or retrieves a cached viem public client for the specified chain
 * @param chainId The chain identifier
 * @returns A viem public client configured for the specified chain
 */
export const getPublicClient = (chainId: ChainId) => {
  // Return from cache if exists
  if (clientCache.has(chainId)) {
    return clientCache.get(chainId)!;
  }

  // Get chain configuration
  const chain = getChain(chainId);

  // Create new public client
  const client = createPublicClient({
    transport: http(chain.rpc),
  });

  // Cache for future use
  clientCache.set(chainId, client);

  return client;
};
