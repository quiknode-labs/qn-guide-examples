import type { IncomingMessage, ServerResponse } from "node:http";

type RequestWithBody = IncomingMessage & { body?: unknown };

const ADDRESS = /^0x[a-fA-F0-9]{40}$/;

function reportParams(method: unknown, params: unknown): unknown[] | null {
  if (!Array.isArray(params)) return null;

  if (method !== "bb_getAddress") return null;
  const address = params[0];
  if (typeof address !== "string" || (!ADDRESS.test(address))) return null;

  return [address, { page: "1", size: "1000", fromHeight: "0", details: "txs" }];
}

async function readBody(req: RequestWithBody): Promise<unknown> {
  if (req.body !== undefined) return req.body;
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 8192) return null;
  }
  return JSON.parse(body);
}

function respond(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

export function createBlockbookHandler(endpoint: string | undefined, token: string | undefined) {
  return async (req: RequestWithBody, res: ServerResponse) => {
    if (req.method !== "POST") {
      res.setHeader("allow", "POST");
      return respond(res, 405, { error: "Use POST for Blockbook requests." });
    }

    const body = await readBody(req).catch(() => null);
    if (!body || typeof body !== "object" || !("method" in body) || !("params" in body)) {
      return respond(res, 400, { error: "Expected a Blockbook report request." });
    }
    const params = reportParams(body.method, body.params);
    if (!params) {
      return respond(res, 400, { error: "Unsupported Blockbook method or parameters." });
    }
    if (!endpoint) {
      return respond(res, 503, { error: "Blockbook is not configured." });
    }

    try {
      const upstream = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { "x-token": token } : {}),
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: body.method, params }),
        redirect: "error",
        signal: AbortSignal.timeout(15_000),
      });
      const data = upstream.ok ? await upstream.json() : null;
      if (!data || data.error || data.result == null) {
        return respond(res, 502, { error: "Blockbook did not return a result." });
      }
      return respond(res, 200, { jsonrpc: "2.0", id: 1, result: data.result });
    } catch {
      return respond(res, 502, { error: "Blockbook could not be reached." });
    }
  };
}

export default createBlockbookHandler(process.env.QUICKNODE_ENDPOINT_URL, process.env.QUICKNODE_ENDPOINT_TOKEN);
