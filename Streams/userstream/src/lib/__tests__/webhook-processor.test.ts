import { describe, expect, it, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
  },
  emitter: {
    emit: vi.fn(),
  },
  tokens: {
    getOrFetchToken: vi.fn(),
    formatTokenAmount: vi.fn(),
    formatWei: vi.fn(),
  },
  solanaTokens: {
    getOrFetchSolanaToken: vi.fn(),
    formatLamports: vi.fn(),
  },
}))

vi.mock('../prisma', () => ({
  prisma: mocks.prisma,
}))

vi.mock('../sse', () => ({
  activityEmitter: mocks.emitter,
}))

vi.mock('../tokens', () => mocks.tokens)

vi.mock('../solana-tokens', () => mocks.solanaTokens)

import { processStreamPayload } from '../webhook-processor'

describe('processStreamPayload', () => {
  beforeEach(() => {
    mocks.prisma.user.findUnique.mockReset()
    mocks.prisma.activityLog.create.mockReset()
    mocks.emitter.emit.mockReset()
    mocks.tokens.getOrFetchToken.mockReset()
    mocks.tokens.formatTokenAmount.mockReset()
    mocks.tokens.formatWei.mockReset()
    mocks.solanaTokens.getOrFetchSolanaToken.mockReset()
    mocks.solanaTokens.formatLamports.mockReset()
  })

  it('processes ERC20 events using metadata network', async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      walletAddress: '0xabc',
    })
    mocks.tokens.getOrFetchToken.mockResolvedValue({
      address: '0xtoken',
      name: 'Token',
      symbol: 'TKN',
      decimals: 6,
    })
    mocks.tokens.formatTokenAmount.mockReturnValue('12.34')
    mocks.prisma.activityLog.create.mockResolvedValue({ id: 1 })

    const payload = {
      metadata: {
        'stream-network': 'base-mainnet',
      },
      events: [
        {
          status: 1,
          eventType: 'erc20Transfer',
          matchedAddress: '0x742d35cc6634c0532925a3b844bc454e4438f44e',
          direction: 'in',
          txHash: '0xhash',
          blockTimestamp: 1710000000,
          data: {
            amountRaw: '1234',
            tokenAddress: '0xTOKEN',
            from: '0xfrom',
            to: '0xto',
          },
        },
      ],
    }

    const result = await processStreamPayload(payload)

    expect(result.processed).toBe(1)
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { walletAddress: '0x742d35cc6634c0532925a3b844bc454e4438f44e' },
    })
    expect(mocks.tokens.getOrFetchToken).toHaveBeenCalledWith(
      '0xTOKEN',
      'base-mainnet'
    )
    expect(mocks.prisma.activityLog.create).toHaveBeenCalled()

    const details = JSON.parse(
      mocks.prisma.activityLog.create.mock.calls[0][0].data.details
    )

    expect(details.token).toEqual({
      address: '0xtoken',
      name: 'Token',
      symbol: 'TKN',
      decimals: 6,
    })
    expect(details.amountFormatted).toBe('12.34')
    expect(
      mocks.prisma.activityLog.create.mock.calls[0][0].data.chain
    ).toBe('base-mainnet')
    expect(mocks.emitter.emit).toHaveBeenCalledWith('activity', { id: 1 })
  })

  it('processes native transfers and formats amount', async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: 'user-2',
      walletAddress: '0xdef',
    })
    mocks.tokens.formatWei.mockReturnValue('1.5')
    mocks.prisma.activityLog.create.mockResolvedValue({ id: 2 })

    const payload = {
      metadata: {
        'stream-network': 'ethereum-mainnet',
      },
      events: [
        {
          status: 1,
          eventType: 'nativeTransfer',
          matchedAddress: '0x742d35cc6634c0532925a3b844bc454e4438f44e',
          direction: 'out',
          txHash: '0xhash2',
          blockTimestamp: 1710000001,
          data: {
            amountWei: '1500000000000000000',
            from: '0xfrom',
            to: '0xto',
          },
        },
      ],
    }

    const result = await processStreamPayload(payload)

    expect(result.processed).toBe(1)
    const details = JSON.parse(
      mocks.prisma.activityLog.create.mock.calls[0][0].data.details
    )
    expect(details.amountFormatted).toBe('1.5')
  })

  it('processes Solana transfers without lowercasing addresses', async () => {
    mocks.prisma.user.findUnique.mockResolvedValue({
      id: 'user-3',
      walletAddress: 'SoL4naAddr',
    })
    mocks.solanaTokens.formatLamports.mockReturnValue('0.5')
    mocks.prisma.activityLog.create.mockResolvedValue({ id: 3 })

    const payload = {
      metadata: {
        'stream-network': 'solana-mainnet',
      },
      events: [
        {
          status: 1,
          eventType: 'solTransfer',
          matchedAddress: 'SoL4naAddr',
          direction: 'in',
          txHash: 'txhash',
          blockTimestamp: 1710000002,
          slot: 999,
          data: {
            amountLamports: '500000000',
            counterparty: 'Counterparty',
          },
        },
      ],
    }

    const result = await processStreamPayload(payload)

    expect(result.processed).toBe(1)
    expect(mocks.prisma.user.findUnique).toHaveBeenCalledWith({
      where: { walletAddress: 'SoL4naAddr' },
    })

    const details = JSON.parse(
      mocks.prisma.activityLog.create.mock.calls[0][0].data.details
    )
    expect(details.amountFormatted).toBe('0.5')
    expect(details.from).toBe('Counterparty')
    expect(details.to).toBe('SoL4naAddr')
  })

  it('skips invalid events', async () => {
    const payload = {
      metadata: { 'stream-network': 'base-mainnet' },
      events: [
        { status: 0 },
        { status: 1, eventType: 'nativeTransfer' },
      ],
    }

    const result = await processStreamPayload(payload)

    expect(result.processed).toBe(0)
    expect(result.skipped).toBe(2)
  })
})
