const { createServer } = require("node:http");

const { QUICKNODE_RPC_URL, QUICKNODE_RPC_TOKEN } = process.env;
if (!QUICKNODE_RPC_URL) throw new Error("Set QUICKNODE_RPC_URL in .env.");

function json(res, status, value) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(value));
}

createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (req.method !== "GET" || url.pathname !== "/api/tokens") {
    return json(res, 404, { error: "Route not found." });
  }

  const address = url.searchParams.get("wallet") || "";
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    return json(res, 400, { error: "Enter a valid Ethereum address." });
  }

  const params = {
    wallet: address,
    contracts: [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
      "0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72",
    ],
  };
  try {
    const upstream = await fetch(QUICKNODE_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(QUICKNODE_RPC_TOKEN ? { "x-token": QUICKNODE_RPC_TOKEN } : {}),
      },
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "qn_getWalletTokenBalance", params: [params] }),
    });
    const data = upstream.ok ? await upstream.json() : null;
    const tokens = data?.result === null ? [] : data?.result?.result;
    if (!data?.error && Array.isArray(tokens)) {
      const assets = tokens.map((token) => ({
        name: token.name,
        symbol: token.symbol,
        decimals: Number(token.decimals),
        amount: token.totalBalance,
      }));
      return json(res, 200, { assets });
    }
  } catch {
    // Keep upstream errors and credentials on the server.
  }
  return json(res, 502, { error: "Unable to load balances from Token API v2." });
}).listen(3001, "127.0.0.1");
