import { NextResponse } from "next/server";
import { fetchSchema } from "@/lib/quicknode";
import { TABLE_DESCRIPTIONS } from "@/lib/constants";

export async function GET() {
  try {
    const schema = await fetchSchema();

    // Enrich with descriptions
    const enriched = {
      tables: schema.tables.map((t) => ({
        ...t,
        description: TABLE_DESCRIPTIONS[t.name] || "",
      })),
    };

    return NextResponse.json(enriched);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
