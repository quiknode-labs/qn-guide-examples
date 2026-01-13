export const runtime = "nodejs";

const QUICKNODE_RPC_URL = process.env.QUICKNODE_RPC_URL;

export async function POST(req: Request) {
  if (!QUICKNODE_RPC_URL) {
    return new Response("Missing QUICKNODE_RPC_URL", { status: 500 });
  }

  try {
    // Read raw body to pass through JSON-RPC request as-is
    const body = await req.text();

    // Forward request to upstream RPC provider
    const res = await fetch(QUICKNODE_RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    // Pass through upstream response
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error proxying RPC request:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to proxy RPC request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

