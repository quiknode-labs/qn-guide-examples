import { config } from "./config.ts";

let nextId = 1;

/** One JSON-RPC call against the Quicknode HTTP endpoint. Errors never include the URL. */
export async function rpc<T>(method: string, params: unknown[], timeoutMs = 20_000): Promise<T> {
  const response = await fetch(config.rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
    signal: AbortSignal.timeout(timeoutMs),
  }).catch((error: Error) => {
    throw new Error(`${method} request failed: ${error.name}`);
  });
  const body = (await response.json().catch(() => null)) as { result?: T; error?: { code: number; message: string } } | null;
  if (!body) throw new Error(`${method} returned HTTP ${response.status} with a non-JSON body`);
  if (body.error) throw new Error(`${method} failed: ${body.error.code} ${body.error.message}`);
  return body.result as T;
}

export async function withRetry<T>(label: string, attempts: number, run: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      console.warn(`[rpc] ${label} attempt ${attempt}/${attempts} failed: ${(error as Error).message}`);
      if (attempt < attempts) await new Promise((r) => setTimeout(r, 1000 * 2 ** (attempt - 1)));
    }
  }
  throw lastError;
}
