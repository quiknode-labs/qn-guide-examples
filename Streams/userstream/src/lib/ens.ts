import { createPublicClient, http } from 'viem'
import { normalize as nameNormalize } from 'viem/ens'
import { mainnet } from 'viem/chains'
import { prisma } from './prisma'

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.QN_EVM_ENDPOINT),
})

export async function resolveEnsName(
  address: `0x${string}`
): Promise<string | null> {
  try {
    return await client.getEnsName({ address })
  } catch {
    return null
  }
}

export async function resolveEnsAddress(name: string): Promise<string | null> {
  try {
    return await client.getEnsAddress({ name: nameNormalize(name) })
  } catch {
    return null
  }
}

// Call after user creation (non-blocking)
export async function updateUserDisplayName(userId: string, address: string) {
  try {
    const ensName = await resolveEnsName(address as `0x${string}`)
    if (ensName) {
      await prisma.user.update({
        where: { id: userId },
        data: { displayName: ensName },
      })
    }
  } catch (error) {
    console.error('ENS resolution failed:', error)
  }
}
