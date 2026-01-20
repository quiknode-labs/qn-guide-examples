import { prisma } from '@/lib/prisma'
import { activityEmitter } from '@/lib/sse'
import { formatTokenAmount, formatWei, getOrFetchToken } from '@/lib/tokens'
import { formatLamports, getOrFetchSolanaToken } from '@/lib/solana-tokens'
import { detectChainType, normalizeAddress } from '@/lib/utils'

const allowedEventTypes = new Set([
  'erc20Transfer',
  'nativeTransfer',
  'solTransfer',
  'splTransfer',
])

type StreamMetadata = Record<string, unknown>

type StreamEventInput = {
  blockNumber?: number
  blockTimestamp?: number
  matchedAddress?: string
  direction?: 'in' | 'out'
  eventType?: 'erc20Transfer' | 'nativeTransfer' | 'solTransfer' | 'splTransfer'
  txHash?: string
  eventId?: string
  status?: number
  network?: string
  data?: Record<string, unknown>
  logIndex?: number
  slot?: number
}

type StreamPayloadInput = {
  events?: StreamEventInput[]
  metadata?: StreamMetadata
}

type ProcessOptions = {
  defaultNetwork?: string
  allowTestDefaults?: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getMetadataNetwork(metadata: StreamMetadata | undefined): string | undefined {
  if (!metadata) return undefined
  const streamNetwork = metadata['stream-network']
  if (typeof streamNetwork === 'string') return streamNetwork
  const network = metadata.network
  if (typeof network === 'string') return network
  return undefined
}

export async function processStreamPayload(
  payload: StreamPayloadInput,
  options: ProcessOptions = {}
): Promise<{ processed: number; skipped: number }> {
  const events = Array.isArray(payload?.events) ? payload.events : []
  const metadataNetwork = getMetadataNetwork(
    isRecord(payload?.metadata) ? payload.metadata : undefined
  )

  let processed = 0
  let skipped = 0

  for (const event of events) {
    if (!event || event.status !== 1) {
      skipped += 1
      continue
    }

    if (!event.eventType || !allowedEventTypes.has(event.eventType)) {
      skipped += 1
      continue
    }

    if (!event.matchedAddress || typeof event.matchedAddress !== 'string') {
      skipped += 1
      continue
    }

    if (!event.direction || (event.direction !== 'in' && event.direction !== 'out')) {
      if (options.allowTestDefaults) {
        event.direction = 'in'
      } else {
        skipped += 1
        continue
      }
    }

    if (!event.txHash || typeof event.txHash !== 'string') {
      if (options.allowTestDefaults) {
        event.txHash = `test_${Date.now()}`
      } else {
        skipped += 1
        continue
      }
    }

    if (!isRecord(event.data)) {
      skipped += 1
      continue
    }

    const chainType = detectChainType(event.matchedAddress)
    if (!chainType) {
      skipped += 1
      continue
    }

    const normalizedAddress = normalizeAddress(event.matchedAddress, chainType)
    const network = metadataNetwork ?? event.network ?? options.defaultNetwork
    if (!network) {
      skipped += 1
      continue
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    })

    if (!user) {
      skipped += 1
      continue
    }

    let details: Record<string, unknown> = { ...event.data }

    if (event.eventType === 'erc20Transfer') {
      const tokenAddress = event.data.tokenAddress
      const amountRaw = event.data.amountRaw
      if (typeof tokenAddress !== 'string' || typeof amountRaw !== 'string') {
        skipped += 1
        continue
      }

      const token = await getOrFetchToken(tokenAddress, network)

      details = {
        ...event.data,
        blockNumber: event.blockNumber,
        token: {
          address: token.address,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
        },
        amountFormatted: formatTokenAmount(amountRaw, token.decimals),
      }
    }

    if (event.eventType === 'nativeTransfer') {
      const amountWei = event.data.amountWei
      if (typeof amountWei !== 'string') {
        skipped += 1
        continue
      }

      details = {
        ...event.data,
        blockNumber: event.blockNumber,
        amountFormatted: formatWei(amountWei),
      }
    }

    if (event.eventType === 'solTransfer') {
      const amountLamports = event.data.amountLamports
      if (typeof amountLamports !== 'string') {
        skipped += 1
        continue
      }

      const counterparty =
        typeof event.data.counterparty === 'string'
          ? event.data.counterparty
          : null
      const from = event.direction === 'in' ? counterparty : event.matchedAddress
      const to = event.direction === 'in' ? event.matchedAddress : counterparty

      details = {
        ...event.data,
        slot: event.slot,
        from,
        to,
        amountFormatted: formatLamports(amountLamports),
      }
    }

    if (event.eventType === 'splTransfer') {
      const mint = event.data.mint
      const amountRaw = event.data.amountRaw
      if (typeof mint !== 'string' || typeof amountRaw !== 'string') {
        skipped += 1
        continue
      }

      const token = await getOrFetchSolanaToken(mint, network)
      const counterparty =
        typeof event.data.counterparty === 'string'
          ? event.data.counterparty
          : null
      const from = event.direction === 'in' ? counterparty : event.matchedAddress
      const to = event.direction === 'in' ? event.matchedAddress : counterparty

      details = {
        ...event.data,
        slot: event.slot,
        from,
        to,
        token: {
          address: token.address,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
        },
        amountFormatted: formatTokenAmount(amountRaw, token.decimals),
      }
    }

    const timestampSeconds =
      typeof event.blockTimestamp === 'number'
        ? event.blockTimestamp
        : options.allowTestDefaults
          ? Math.floor(Date.now() / 1000)
          : null

    if (!timestampSeconds) {
      skipped += 1
      continue
    }

    const activity = await prisma.activityLog.create({
      data: {
        userId: user.id,
        txHash: event.txHash,
        activityType: event.eventType.toUpperCase(),
        chain: network,
        direction: event.direction,
        details: JSON.stringify(details),
        timestamp: new Date(timestampSeconds * 1000),
      },
      include: { user: true },
    })

    activityEmitter.emit('activity', activity)
    processed += 1
  }

  return { processed, skipped }
}
