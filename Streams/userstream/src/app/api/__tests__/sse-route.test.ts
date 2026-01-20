import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { activityEmitter } from '@/lib/sse'
import { GET } from '../sse/route'

const decoder = new TextDecoder()

async function readChunk(
  reader: ReadableStreamDefaultReader<Uint8Array>
) {
  const { value, done } = await reader.read()
  if (done || !value) {
    return ''
  }
  return decoder.decode(value)
}

describe('SSE route', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns event stream and connected message', async () => {
    const abortController = new AbortController()
    const request = new NextRequest('http://localhost', {
      signal: abortController.signal,
    })

    const response = await GET(request)
    const reader = response.body?.getReader()

    expect(response.headers.get('Content-Type')).toBe('text/event-stream')
    expect(reader).toBeDefined()

    const chunk = await readChunk(reader!)
    expect(chunk).toContain('"type":"connected"')

    abortController.abort()
  })

  it('emits activity payloads', async () => {
    const abortController = new AbortController()
    const request = new NextRequest('http://localhost', {
      signal: abortController.signal,
    })

    const response = await GET(request)
    const reader = response.body?.getReader()

    await readChunk(reader!)

    activityEmitter.emit('activity', { id: 'activity-1' })
    const chunk = await readChunk(reader!)

    expect(chunk).toContain('"type":"activity"')
    expect(chunk).toContain('"id":"activity-1"')

    abortController.abort()
  })

  it('sends heartbeat messages every 30s', async () => {
    vi.useFakeTimers()

    const abortController = new AbortController()
    const request = new NextRequest('http://localhost', {
      signal: abortController.signal,
    })

    const response = await GET(request)
    const reader = response.body?.getReader()

    await readChunk(reader!)

    vi.advanceTimersByTime(30000)
    const chunk = await readChunk(reader!)

    expect(chunk).toContain('"type":"heartbeat"')

    abortController.abort()
  })
})
