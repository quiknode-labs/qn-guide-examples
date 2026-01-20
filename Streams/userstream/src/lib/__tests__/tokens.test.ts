import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  readContract: vi.fn(),
  prisma: {
    token: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('viem', async () => {
  const actual = await vi.importActual<typeof import('viem')>('viem')
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      readContract: mocks.readContract,
    })),
    http: vi.fn(),
  }
})

vi.mock('../prisma', () => ({
  prisma: mocks.prisma,
}))

import { getOrFetchToken, formatTokenAmount, formatWei } from '../tokens'

describe('token helpers', () => {
  const consoleErrorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation(() => undefined)

  beforeEach(() => {
    mocks.readContract.mockReset()
    mocks.prisma.token.findUnique.mockReset()
    mocks.prisma.token.create.mockReset()
    consoleErrorSpy.mockClear()
  })

  it('returns cached token when present', async () => {
    const cached = {
      address: '0xabc',
      name: 'Token',
      symbol: 'TKN',
      decimals: 18,
      chain: 'ethereum-mainnet',
    }
    mocks.prisma.token.findUnique.mockResolvedValue(cached)

    const result = await getOrFetchToken('0xAbC')

    expect(result).toEqual(cached)
    expect(mocks.prisma.token.create).not.toHaveBeenCalled()
  })

  it('fetches token metadata and caches it', async () => {
    mocks.prisma.token.findUnique.mockResolvedValue(null)
    mocks.readContract
      .mockResolvedValueOnce('USD Coin')
      .mockResolvedValueOnce('USDC')
      .mockResolvedValueOnce(6)

    const created = {
      address: '0xabc',
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
      chain: 'base-mainnet',
    }
    mocks.prisma.token.create.mockResolvedValue(created)

    const result = await getOrFetchToken('0xAbC', 'base-mainnet')

    expect(mocks.prisma.token.create).toHaveBeenCalledWith({
      data: {
        address: '0xabc',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        chain: 'base-mainnet',
      },
    })
    expect(result).toEqual(created)
  })

  it('returns fallback metadata on fetch failure', async () => {
    mocks.prisma.token.findUnique.mockResolvedValue(null)
    mocks.readContract.mockRejectedValue(new Error('rpc error'))

    const result = await getOrFetchToken('0xAbC', 'ethereum-mainnet')

    expect(result).toEqual({
      address: '0xabc',
      name: 'Unknown Token',
      symbol: 'UNKNOWN',
      decimals: 18,
      chain: 'ethereum-mainnet',
    })
    expect(consoleErrorSpy).toHaveBeenCalled()
  })
})

describe('formatting helpers', () => {
  it('formats token amounts with decimals', () => {
    expect(formatTokenAmount('1000000', 6)).toBe('1')
  })

  it('formats wei amounts as ether', () => {
    expect(formatWei('1000000000000000000')).toBe('1')
  })

  it('returns 0 for invalid values', () => {
    expect(formatTokenAmount('not-a-number', 18)).toBe('0')
  })
})
