import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { sql } = await request.json();

  const key = process.env.QUICKNODE_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "QUICKNODE_API_KEY environment variable is not set. See .env.example." },
      { status: 401 }
    );
  }

  if (!sql || typeof sql !== "string") {
    return NextResponse.json(
      { error: "SQL query is required." },
      { status: 400 }
    );
  }

  const endpoint =
    process.env.QUICKNODE_SQL_ENDPOINT ||
    "https://api.quicknode.com/sql/rest/v1/query";

  const clusterId =
    process.env.QUICKNODE_CLUSTER_ID || "hyperliquid-core-mainnet";

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "x-api-key": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql, clusterId }),
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: text || "Query execution failed" },
        { status: response.status }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || data.message || "Query execution failed" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to reach SQL Explorer API: ${message}` },
      { status: 502 }
    );
  }
}
