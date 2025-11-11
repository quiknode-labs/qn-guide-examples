export const contractAddresses = {
  84532: {
    // Base Sepolia
    rwa721: process.env.NEXT_PUBLIC_RWA721_ADDRESS_BASE_SEPOLIA as `0x${string}`,
    marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS_BASE_SEPOLIA as `0x${string}`,
    usdc: process.env.NEXT_PUBLIC_USDC_BASE_SEPOLIA as `0x${string}`,
    lzChainId: Number(process.env.NEXT_PUBLIC_LZ_CHAIN_ID_BASE_SEPOLIA),
  },
  11155111: {
    // Ethereum Sepolia
    rwa721: process.env.NEXT_PUBLIC_RWA721_ADDRESS_SEPOLIA as `0x${string}`,
    marketplace: process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS_SEPOLIA as `0x${string}`,
    usdc: process.env.NEXT_PUBLIC_USDC_SEPOLIA as `0x${string}`,
    lzChainId: Number(process.env.NEXT_PUBLIC_LZ_CHAIN_ID_SEPOLIA),
  },
} as const

export const permit2Address = process.env.NEXT_PUBLIC_PERMIT2_ADDRESS as `0x${string}`

export function getContractAddress(chainId: number, contract: 'rwa721' | 'marketplace' | 'usdc') {
  const addresses = contractAddresses[chainId as keyof typeof contractAddresses]
  if (!addresses) throw new Error(`Unsupported chain ID: ${chainId}`)
  return addresses[contract]
}
