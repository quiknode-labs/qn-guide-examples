import crypto from 'crypto'

export function verifyWebhookSignature(
  payload: string,
  nonce: string,
  timestamp: string,
  signature: string,
  securityToken: string
): boolean {
  const data = nonce + timestamp + payload
  const hmac = crypto.createHmac('sha256', Buffer.from(securityToken))
  hmac.update(Buffer.from(data))
  const computed = hmac.digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed, 'hex'),
      Buffer.from(signature, 'hex')
    )
  } catch {
    return false
  }
}

export function isTimestampValid(
  timestamp: string,
  maxAgeSeconds: number = 300
): boolean {
  const messageTime = Number.parseInt(timestamp, 10)
  if (Number.isNaN(messageTime)) return false
  const currentTime = Math.floor(Date.now() / 1000)
  return Math.abs(currentTime - messageTime) <= maxAgeSeconds
}
