import { NextRequest } from "next/server";
import { Worker } from "worker_threads";
import path from "path";

export const dynamic = "force-dynamic";

let activeWorker: Worker | null = null;

export async function GET(request: NextRequest) {
  const coin = request.nextUrl.searchParams.get("coin") || "BTC";
  const levels = parseInt(request.nextUrl.searchParams.get("levels") || "30", 10);

  if (activeWorker) {
    try {
      activeWorker.postMessage("stop");
      activeWorker.terminate();
    } catch {}
    activeWorker = null;
  }

  const encoder = new TextEncoder();
  let closed = false;
  let worker: Worker | null = null;

  const stream = new ReadableStream({
    start(controller) {
      function sendSSE(event: string, data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          closed = true;
        }
      }

      const keepalive = setInterval(() => {
        if (closed) { clearInterval(keepalive); return; }
        try {
          controller.enqueue(encoder.encode(":keepalive\n\n"));
        } catch {
          closed = true;
          clearInterval(keepalive);
        }
      }, 15_000);

      const workerPath = path.join(process.cwd(), "src", "lib", "grpc", "l2-worker.js");

      worker = new Worker(workerPath, {
        workerData: {
          endpoint: process.env.QUICKNODE_ENDPOINT_L2,
          coin,
          levels,
        },
      });
      activeWorker = worker;

      worker.on("message", (msg) => {
        if (closed) return;

        switch (msg.type) {
          case "l2update":
            sendSSE("l2update", msg.data);
            break;

          case "error":
            console.error("[L2 Worker Error]", msg.code, msg.message);
            break;

          case "reconnecting":
            sendSSE("reconnecting", { attempt: msg.attempt });
            break;

          case "log":
            console.log(msg.text);
            break;
        }
      });

      worker.on("error", (err: Error) => {
        console.error("[L2 Worker Crash]", err.message);
        sendSSE("error", { message: "Worker crashed" });
      });

      worker.on("exit", (code) => {
        if (code !== 0 && !closed) {
          console.error("[L2 Worker Exit]", code);
        }
      });

      function cleanup() {
        closed = true;
        clearInterval(keepalive);
        if (worker) {
          try {
            worker.postMessage("stop");
            worker.terminate();
          } catch {}
          if (activeWorker === worker) activeWorker = null;
          worker = null;
        }
      }

      request.signal.addEventListener("abort", cleanup);
    },
    cancel() {
      closed = true;
      if (worker) {
        try {
          worker.postMessage("stop");
          worker.terminate();
        } catch {}
        if (activeWorker === worker) activeWorker = null;
        worker = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
