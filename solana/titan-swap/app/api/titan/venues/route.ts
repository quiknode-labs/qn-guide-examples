import { NextResponse } from "next/server";
import { fetchVenues } from "@/lib/titan-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await fetchVenues());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load venues";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
