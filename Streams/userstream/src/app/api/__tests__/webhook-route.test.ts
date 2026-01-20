import crypto from 'crypto'
import zlib from 'zlib'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({
  processStreamPayload: vi.fn(),
}))

vi.mock('@/lib/webhook-processor', () => ({
  processStreamPayload: mocks.processStreamPayload,
}))

import { POST as streamsPost } from '../webhook/streams/route'
import { POST as testPost } from '../webhook/test/route'

describe('webhook routes', () => {
  beforeEach(() => {
    mocks.processStreamPayload.mockReset()
  })

  it('accepts missing headers as a ping on streams route', async () => {
    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: '{}',
    })

    const response = await streamsPost(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ping).toBe(true)
  })

  it('accepts valid gzip payload and signature', async () => {
    const payload = { events: [] }
    const payloadString = JSON.stringify(payload)
    const nonce = 'nonce'
    const timestamp = `${Math.floor(Date.now() / 1000)}`
    const secret = 'secret'
    const signature = crypto
      .createHmac('sha256', Buffer.from(secret))
      .update(Buffer.from(nonce + timestamp + payloadString))
      .digest('hex')

    process.env.QN_STREAM_SECURITY_TOKEN_EVM = secret
    mocks.processStreamPayload.mockResolvedValue({ processed: 2, skipped: 0 })

    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: zlib.gzipSync(Buffer.from(payloadString)),
      headers: {
        'x-qn-nonce': nonce,
        'x-qn-timestamp': timestamp,
        'x-qn-signature': signature,
        'content-encoding': 'gzip',
      },
    })

    const response = await streamsPost(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.processed).toBe(2)
    expect(mocks.processStreamPayload).toHaveBeenCalledWith(payload)
  })

  it('passes payload through test route with defaults', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'test'

    const payload = { events: [] }
    mocks.processStreamPayload.mockResolvedValue({ processed: 0, skipped: 0 })

    const request = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'content-type': 'application/json' },
    })

    const response = await testPost(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(mocks.processStreamPayload).toHaveBeenCalledWith(payload, {
      defaultNetwork: 'ethereum-mainnet',
      allowTestDefaults: true,
    })

    process.env.NODE_ENV = originalEnv
  })
})
