const readMethods = new Set([
  "eth_blockNumber",
  "eth_call",
  "eth_chainId",
  "eth_estimateGas",
  "eth_feeHistory",
  "eth_gasPrice",
  "eth_getBalance",
  "eth_getBlockByNumber",
  "eth_getCode",
  "eth_getTransactionByHash",
  "eth_getTransactionCount",
  "eth_getTransactionReceipt",
  "eth_maxPriorityFeePerGas",
]);

export async function POST(request: Request) {
  const { QUICKNODE_ENDPOINT, QUICKNODE_ENDPOINT_TOKEN } = process.env;
  if (!QUICKNODE_ENDPOINT) {
    return Response.json({ error: "Base RPC is unconfigured." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !readMethods.has(body.method)) {
    return Response.json({ error: "Unsupported RPC method." }, { status: 400 });
  }

  try {
    const upstream = await fetch(QUICKNODE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(QUICKNODE_ENDPOINT_TOKEN ? { "x-token": QUICKNODE_ENDPOINT_TOKEN } : {}),
      },
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify(body),
    });
    if (upstream.ok) {
      return Response.json(await upstream.json());
    }
  } catch {
    // The response uses a generic message to keep upstream connection details private.
  }
  return Response.json({ error: "Base RPC request failed." }, { status: 502 });
}
