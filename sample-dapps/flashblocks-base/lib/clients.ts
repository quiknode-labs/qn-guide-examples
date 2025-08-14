import { createPublicClient, http } from 'viem'
import { baseSepolia, baseSepoliaPreconf } from 'viem/chains'

if (process.env.NEXT_PUBLIC_QUICKNODE_ENDPOINT) {
  console.log(
    "Using QuickNode endpoint",
  );
} else {
  console.log("Using default public Sepolia endpoint");
}

const QUICKNODE_ENDPOINT = process.env.NEXT_PUBLIC_QUICKNODE_ENDPOINT || "https://sepolia.base.org";

export const flashblocksClient = createPublicClient({
  chain: baseSepoliaPreconf, // Auto-uses "pending" for supported actions
  transport: http(QUICKNODE_ENDPOINT),
})

// Traditional client with 2s polling
export const traditionalClient = createPublicClient({
  chain: baseSepolia, // Uses "latest" by default
  transport: http(QUICKNODE_ENDPOINT),
});