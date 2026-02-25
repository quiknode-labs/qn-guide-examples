import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/quicknode";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sql, max_rows } = body;

    if (!sql || typeof sql !== "string") {
      return NextResponse.json({ error: "sql field is required" }, { status: 400 });
    }

    const result = await executeQuery(sql, max_rows || 1000);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
