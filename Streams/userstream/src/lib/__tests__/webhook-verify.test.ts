import crypto from 'crypto'
import { describe, expect, it } from 'vitest'
import { isTimestampValid, verifyWebhookSignature } from '../webhook-verify'

describe('verifyWebhookSignature', () => {
  it('returns true for a valid signature', () => {
    const secret = 'test-secret'
    const payload = JSON.stringify({ ok: true })
    const nonce = 'nonce'
    const timestamp = `${Math.floor(Date.now() / 1000)}`
    const signatureData = nonce + timestamp + payload
    const signature = crypto
      .createHmac('sha256', Buffer.from(secret))
      .update(Buffer.from(signatureData))
      .digest('hex')

    expect(
      verifyWebhookSignature(payload, nonce, timestamp, signature, secret)
    ).toBe(true)
  })

  it('returns false for an invalid signature', () => {
    const secret = 'test-secret'
    const payload = JSON.stringify({ ok: true })
    const nonce = 'nonce'
    const timestamp = `${Math.floor(Date.now() / 1000)}`

    expect(
      verifyWebhookSignature(payload, nonce, timestamp, 'bad', secret)
    ).toBe(false)
  })
})

describe('isTimestampValid', () => {
  it('accepts timestamps within the window', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(isTimestampValid(`${now}`)).toBe(true)
    expect(isTimestampValid(`${now - 299}`)).toBe(true)
  })

  it('rejects stale or invalid timestamps', () => {
    const now = Math.floor(Date.now() / 1000)
    expect(isTimestampValid(`${now - 301}`)).toBe(false)
    expect(isTimestampValid('not-a-number')).toBe(false)
  })
})
