import { NextRequest } from "next/server";
import { Worker } from "worker_threads";
import path from "path";
import { parseL4Diffs } from "@/lib/parsers/l4-parser";

export const dynamic = "force-dynamic";

let activeWorker: Worker | null = null;

export async function GET(request: NextRequest) {
  const coin = request.nextUrl.searchParams.get("coin") || "BTC";

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

      const workerPath = path.join(process.cwd(), "src", "lib", "grpc", "l4-worker.js");

      worker = new Worker(workerPath, {
        workerData: {
          endpoint: process.env.QUICKNODE_ENDPOINT_L4,
          coin,
        },
      });
      activeWorker = worker;

      worker.on("message", (msg) => {
        if (closed) return;

        switch (msg.type) {
          case "l4snapshot":
            sendSSE("l4snapshot", msg.data);
            break;

          case "l4diff":
            try {
              const events = parseL4Diffs(
                msg.data.diffData,
                msg.data.height,
                msg.data.time
              );
              if (events.length > 0) {
                sendSSE("l4diff", { events, height: msg.data.height });
              }
            } catch (parseErr: any) {
              console.error("[L4 Parse Error]", parseErr.message);
            }
            break;

          case "error":
            console.error("[L4 Worker Error]", msg.code, msg.message);
            break;

          case "reconnecting":
            sendSSE("reconnecting", { attempt: msg.attempt });
            break;

          case "max_retries":
            sendSSE("error", { message: "Max reconnection attempts reached" });
            clearInterval(keepalive);
            if (!closed) { controller.close(); closed = true; }
            break;

          case "log":
            console.log(msg.text);
            break;
        }
      });

      worker.on("error", (err: Error) => {
        console.error("[L4 Worker Crash]", err.message);
        sendSSE("error", { message: "Worker crashed" });
      });

      worker.on("exit", (code) => {
        if (code !== 0 && !closed) {
          console.error("[L4 Worker Exit]", code);
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
