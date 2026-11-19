import { createPublicClient, custom, http } from 'viem'
import { baseSepolia, baseSepoliaPreconf } from 'viem/chains'

const flashblocksRpc = process.env.NEXT_PUBLIC_FLASHBLOCKS_RPC_URL;
const canonicalRpc = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL;

function historicalTransport(url: string | undefined, name: string) {
  return url ? http(url) : custom({
    request: async () => { throw new Error(`Set ${name} to a browser-facing RPC URL.`); },
  }, { retryCount: 0 });
}

export const flashblocksClient = createPublicClient({
  chain: baseSepoliaPreconf, // Auto-uses "pending" for supported actions
  transport: historicalTransport(flashblocksRpc, "NEXT_PUBLIC_FLASHBLOCKS_RPC_URL"),
})

// Traditional client with 2s polling
export const traditionalClient = createPublicClient({
  chain: baseSepolia, // Uses "latest" by default
  transport: historicalTransport(canonicalRpc, "NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL"),
});
