import { NextResponse } from "next/server";
import { fetchInfo } from "@/lib/titan-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await fetchInfo());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load info";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
