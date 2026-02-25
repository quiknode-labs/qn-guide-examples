import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute("SELECT * FROM dashboards ORDER BY updated_at DESC");
    return NextResponse.json(result.rows);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json();

    const result = await db.execute({
      sql: `INSERT INTO dashboards (name, description, collection_id, filters_json)
            VALUES (?, ?, ?, ?)`,
      args: [
        body.name,
        body.description || null,
        body.collection_id || 1,
        body.filters_json ? JSON.stringify(body.filters_json) : null,
      ],
    });

    const dashboard = await db.execute({
      sql: "SELECT * FROM dashboards WHERE id = ?",
      args: [Number(result.lastInsertRowid)],
    });
    return NextResponse.json(dashboard.rows[0], { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
