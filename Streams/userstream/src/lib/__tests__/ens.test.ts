import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  getEnsName: vi.fn(),
  prismaUpdate: vi.fn(),
}))

vi.mock('viem', async () => {
  const actual = await vi.importActual<typeof import('viem')>('viem')
  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      getEnsName: mocks.getEnsName,
    })),
    http: vi.fn(),
  }
})

vi.mock('../prisma', () => ({
  prisma: {
    user: {
      update: mocks.prismaUpdate,
    },
  },
}))

import { resolveEnsName, updateUserDisplayName } from '../ens'

describe('ENS helpers', () => {
  beforeEach(() => {
    mocks.getEnsName.mockReset()
    mocks.prismaUpdate.mockReset()
  })

  it('returns ENS name when resolved', async () => {
    mocks.getEnsName.mockResolvedValue('alice.eth')

    const result = await resolveEnsName(
      '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
    )

    expect(result).toBe('alice.eth')
  })

  it('returns null on ENS errors', async () => {
    mocks.getEnsName.mockRejectedValue(new Error('failure'))

    const result = await resolveEnsName(
      '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
    )

    expect(result).toBeNull()
  })

  it('updates user display name when ENS is found', async () => {
    mocks.getEnsName.mockResolvedValue('alice.eth')

    await updateUserDisplayName('user-id', '0xabc')

    expect(mocks.prismaUpdate).toHaveBeenCalledWith({
      where: { id: 'user-id' },
      data: { displayName: 'alice.eth' },
    })
  })

  it('does not update when ENS is missing', async () => {
    mocks.getEnsName.mockResolvedValue(null)

    await updateUserDisplayName('user-id', '0xabc')

    expect(mocks.prismaUpdate).not.toHaveBeenCalled()
  })

  it('swallows errors when ENS resolution fails', async () => {
    mocks.getEnsName.mockRejectedValue(new Error('boom'))

    await updateUserDisplayName('user-id', '0xabc')

    expect(mocks.prismaUpdate).not.toHaveBeenCalled()
  })
})
