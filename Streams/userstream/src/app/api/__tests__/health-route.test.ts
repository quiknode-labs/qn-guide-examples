import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
  getLastActivityTime: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: mocks.prisma,
}))

vi.mock('@/lib/sse', () => ({
  getLastActivityTime: mocks.getLastActivityTime,
}))

import { GET } from '../health/route'

describe('health route', () => {
  it('returns ok status when db is reachable', async () => {
    const lastActivity = new Date('2024-01-01T00:00:00.000Z')
    mocks.prisma.$queryRaw.mockResolvedValue([{ '1': 1 }])
    mocks.getLastActivityTime.mockReturnValue(lastActivity)

    const response = await GET()
    const body = await response.json()

    expect(body.status).toBe('ok')
    expect(body.db).toBe(true)
    expect(body.lastWebhook).toBe(lastActivity.toISOString())
    expect(body.timestamp).toBeTypeOf('string')
  })

  it('returns degraded status when db is unavailable', async () => {
    mocks.prisma.$queryRaw.mockRejectedValue(new Error('db down'))
    mocks.getLastActivityTime.mockReturnValue(null)

    const response = await GET()
    const body = await response.json()

    expect(body.status).toBe('degraded')
    expect(body.db).toBe(false)
    expect(body.lastWebhook).toBeNull()
  })
})
