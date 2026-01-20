import { NextRequest } from 'next/server'
import { activityEmitter } from '@/lib/sse'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      )

      const onActivity = (data: unknown) => {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'activity', data })}\n\n`
          )
        )
      }

      activityEmitter.on('activity', onActivity)

      const heartbeat = setInterval(() => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`)
        )
      }, 30000)

      request.signal.addEventListener('abort', () => {
        activityEmitter.off('activity', onActivity)
        clearInterval(heartbeat)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
