import { createPublicClient, erc20Abi, formatUnits, http } from 'viem'
import { mainnet } from 'viem/chains'
import { prisma } from './prisma'

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.QN_EVM_ENDPOINT),
})

export async function getOrFetchToken(
  tokenAddress: string,
  chain: string = 'ethereum-mainnet'
) {
  const address = tokenAddress.toLowerCase()

  const cached = await prisma.token.findUnique({
    where: { address },
  })

  if (cached) return cached

  try {
    const [name, symbol, decimals] = await Promise.all([
      client.readContract({
        address: address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'name',
      }),
      client.readContract({
        address: address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'symbol',
      }),
      client.readContract({
        address: address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'decimals',
      }),
    ])

    return prisma.token.create({
      data: { address, name, symbol, decimals, chain },
    })
  } catch (error) {
    console.error('Token fetch failed:', error)
    return {
      address,
      name: 'Unknown Token',
      symbol: 'UNKNOWN',
      decimals: 18,
      chain,
    }
  }
}

export function formatTokenAmount(amountRaw: string, decimals: number): string {
  try {
    return formatUnits(BigInt(amountRaw), decimals)
  } catch {
    return '0'
  }
}

export function formatWei(amountWei: string): string {
  return formatTokenAmount(amountWei, 18)
}
