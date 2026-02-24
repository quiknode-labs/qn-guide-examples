import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute("SELECT * FROM collections ORDER BY name");
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
      sql: "INSERT INTO collections (name, description, parent_id) VALUES (?, ?, ?)",
      args: [body.name, body.description || null, body.parent_id || null],
    });

    const collection = await db.execute({
      sql: "SELECT * FROM collections WHERE id = ?",
      args: [Number(result.lastInsertRowid)],
    });
    return NextResponse.json(collection.rows[0], { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
