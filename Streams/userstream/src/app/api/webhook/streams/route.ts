import { NextRequest, NextResponse } from 'next/server'
import { isTimestampValid, verifyWebhookSignature } from '@/lib/webhook-verify'
import { processStreamPayload } from '@/lib/webhook-processor'
import zlib from 'zlib'
import { promisify } from 'util'

export const runtime = 'nodejs'

const gunzip = promisify(zlib.gunzip)

export async function POST(request: NextRequest) {
  const nonce = request.headers.get('x-qn-nonce')
  const timestamp = request.headers.get('x-qn-timestamp')
  const signature = request.headers.get('x-qn-signature')
  const contentEncoding = request.headers.get('content-encoding')?.toLowerCase()

  if (!nonce || !timestamp || !signature) {
    return NextResponse.json({ success: true, ping: true })
  }

  const securityTokens = [
    process.env.QN_STREAM_SECURITY_TOKEN_EVM,
    process.env.QN_STREAM_SECURITY_TOKEN_SOL,
    process.env.QN_STREAM_SECURITY_TOKEN,
  ].filter((token): token is string => typeof token === 'string' && token.length > 0)

  if (securityTokens.length === 0) {
    console.error('Missing QN stream security token')
    return NextResponse.json({ error: 'Config error' }, { status: 500 })
  }

  const rawBody = await request.arrayBuffer()
  let payload: string

  if (contentEncoding === 'gzip') {
    const decompressed = await gunzip(Buffer.from(rawBody))
    payload = decompressed.toString('utf-8')
  } else {
    payload = Buffer.from(rawBody).toString('utf-8')
  }

  const isValidSignature = securityTokens.some((token) =>
    verifyWebhookSignature(payload, nonce, timestamp, signature, token)
  )

  if (!isValidSignature) {
    console.error('Invalid webhook signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  if (!isTimestampValid(timestamp)) {
    console.error('Webhook timestamp expired')
    return NextResponse.json({ error: 'Expired' }, { status: 401 })
  }

  try {
    const data = JSON.parse(payload)
    const result = await processStreamPayload(data)
    return NextResponse.json({ success: true, processed: result.processed })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
