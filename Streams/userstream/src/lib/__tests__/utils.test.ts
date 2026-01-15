import { describe, it, expect } from 'vitest'
import {
  cn,
  detectChainType,
  truncateAddress,
  formatTimestamp,
  parseBulkAddresses,
} from '../utils'

describe('detectChainType', () => {
  describe('EVM addresses', () => {
    it('identifies valid EVM address', () => {
      expect(
        detectChainType('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')
      ).toBe('EVM')
    })

    it('identifies lowercase EVM address', () => {
      expect(
        detectChainType('0x742d35cc6634c0532925a3b844bc454e4438f44e')
      ).toBe('EVM')
    })

    it('rejects all-uppercase EVM address (invalid checksum)', () => {
      expect(
        detectChainType('0x742D35CC6634C0532925A3B844BC454E4438F44E')
      ).toBe(null)
    })

    it('rejects EVM address with wrong length', () => {
      expect(detectChainType('0x742d35Cc6634C0532925a3b844')).toBe(null)
    })

    it('rejects EVM address without 0x prefix', () => {
      expect(
        detectChainType('742d35Cc6634C0532925a3b844Bc454e4438f44e')
      ).toBe(null)
    })
  })

  describe('Solana addresses', () => {
    it('identifies valid Solana address', () => {
      expect(
        detectChainType('7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs')
      ).toBe('SOL')
    })

    it('identifies short Solana address (32 chars)', () => {
      expect(detectChainType('11111111111111111111111111111111')).toBe(
        'SOL'
      )
    })

    it('rejects Solana with invalid characters (0, O, I, l)', () => {
      expect(
        detectChainType('0EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs')
      ).toBe(null)
    })
  })

  describe('invalid addresses', () => {
    it('returns null for empty string', () => {
      expect(detectChainType('')).toBe(null)
    })

    it('returns null for random text', () => {
      expect(detectChainType('hello world')).toBe(null)
    })

    it('returns null for partial address', () => {
      expect(detectChainType('0x123')).toBe(null)
    })
  })
})

describe('truncateAddress', () => {
  it('truncates with default length', () => {
    expect(truncateAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')).toBe(
      '0x742d...f44e'
    )
  })

  it('truncates with custom length', () => {
    expect(
      truncateAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 6)
    ).toBe('0x742d35...38f44e')
  })
})

describe('cn', () => {
  it('merges tailwind classes with conflict resolution', () => {
    expect(cn('p-2', 'p-4', 'text-sm')).toBe('p-4 text-sm')
  })
})

describe('formatTimestamp', () => {
  it('formats time in en-US format', () => {
    const date = new Date('2024-01-01T00:00:00Z')
    const expected = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date)

    expect(formatTimestamp(date)).toBe(expected)
  })
})

describe('parseBulkAddresses', () => {
  it('parses comma, newline, and space separated addresses', () => {
    const input =
      '0xabc, 0xdef\n0xghi  \n\n0xjkl,0xmn'

    expect(parseBulkAddresses(input)).toEqual([
      '0xabc',
      '0xdef',
      '0xghi',
      '0xjkl',
      '0xmn',
    ])
  })

  it('returns empty array for whitespace only', () => {
    expect(parseBulkAddresses('  \n\n\t  ')).toEqual([])
  })
})
