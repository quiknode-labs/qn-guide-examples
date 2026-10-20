import { createHmac, timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';

export function verifyWebhookSignature(
  payload: Buffer,
  nonce: string,
  timestamp: string,
  signature: string,
  secret: string,
): boolean {
  const value = signature.replace(/^sha256=/, '');
  if (!secret.trim() || !nonce || !/^\d+$/.test(timestamp) || !/^[a-f\d]{64}$/i.test(value)) {
    return false;
  }
  const expected = createHmac('sha256', secret.trim()).update(nonce + timestamp).update(payload).digest();
  return timingSafeEqual(expected, Buffer.from(value, 'hex'));
}

export function webhookSignatureMiddleware(secret: string): RequestHandler {
  if (!secret.trim()) throw new Error('WEBHOOK_SECRET_KEY is required');
  return (req, res, next) => {
    const nonce = req.headers['x-qn-nonce'];
    const timestamp = req.headers['x-qn-timestamp'];
    const signature = req.headers['x-qn-signature'];
    if (!Buffer.isBuffer(req.body) || typeof nonce !== 'string' ||
        typeof timestamp !== 'string' || typeof signature !== 'string' ||
        !verifyWebhookSignature(req.body, nonce, timestamp, signature, secret)) {
      res.status(401).json({ error: 'Missing or invalid webhook signature' });
      return;
    }
    next();
  };
}
