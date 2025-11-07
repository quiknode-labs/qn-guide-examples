import * as crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

interface WebhookRequest extends Request {
  rawBody?: string;
}

// Trim whitespace - keep the key exactly as provided (including qnsec_ prefix if present)
const SECRET_KEY = process.env.WEBHOOK_SECRET_KEY?.trim();

/**
 * Verify webhook signature using HMAC-SHA256
 * QuickNode concatenates: nonce + timestamp + payload
 * @param payload - The raw request body as string
 * @param nonce - The nonce from x-qn-nonce header
 * @param timestamp - The timestamp from x-qn-timestamp header
 * @param signature - The signature from x-qn-signature header
 * @returns boolean indicating if signature is valid
 */
export function verifyWebhookSignature(
  payload: string,
  nonce: string,
  timestamp: string,
  signature: string
): boolean {
  if (!SECRET_KEY) {
    console.warn('SECRET_KEY not configured - skipping verification');
    return true; // Allow requests if no key is configured
  }

  if (!nonce || !timestamp || !signature) {
    console.warn('Missing required signature parameters');
    return false;
  }

  try {
    // Concatenate nonce + timestamp + payload as per QuickNode spec
    const signatureData = nonce + timestamp + payload;
    const signatureBytes = Buffer.from(signatureData);

    // Create HMAC with secret key as bytes (UTF-8 encoding, not base64)
    const secretKeyBytes = Buffer.from(SECRET_KEY);
    const hmac = crypto.createHmac('sha256', secretKeyBytes);
    hmac.update(signatureBytes);
    const computedSignature = hmac.digest('hex');

    // Support both "sha256=" prefix and plain hex
    const signatureValue = signature.startsWith('sha256=')
      ? signature.slice(7)
      : signature;

    const isValid = crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(signatureValue)
    );

    return isValid;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Middleware to verify webhook signatures from QuickNode
 * Checks for WEBHOOK_SECRET_KEY and validates if configured
 */
export function webhookSignatureMiddleware(
  req: WebhookRequest,
  res: Response,
  next: NextFunction
): void {
  // Skip verification if no secret key is configured
  if (!SECRET_KEY) {
    return next();
  }

  // Extract QuickNode headers
  const signature = req.headers['x-qn-signature'] as string;
  const nonce = req.headers['x-qn-nonce'] as string;
  const timestamp = req.headers['x-qn-timestamp'] as string;

  // If headers are present, validate them
  if (signature && nonce && timestamp) {
    // Use raw body string (as received) for signature verification
    const payloadString = req.rawBody || '';

    const isValid = verifyWebhookSignature(
      payloadString,
      nonce,
      timestamp,
      signature
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }
  }

  next();
}
