import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const db = await getDb();
    const result = await db.execute("SELECT * FROM questions ORDER BY updated_at DESC");
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
      sql: `INSERT INTO questions (name, description, collection_id, query_type, query_json, sql_text, viz_type, viz_settings)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        body.name,
        body.description || null,
        body.collection_id || 1,
        body.query_type,
        body.query_json ? JSON.stringify(body.query_json) : null,
        body.sql_text || null,
        body.viz_type || "table",
        body.viz_settings ? JSON.stringify(body.viz_settings) : null,
      ],
    });

    const question = await db.execute({
      sql: "SELECT * FROM questions WHERE id = ?",
      args: [Number(result.lastInsertRowid)],
    });
    return NextResponse.json(question.rows[0], { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
