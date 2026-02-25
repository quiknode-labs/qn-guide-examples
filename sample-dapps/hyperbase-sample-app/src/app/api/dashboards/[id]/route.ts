import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const result = await db.execute({ sql: "SELECT * FROM dashboards WHERE id = ?", args: [id] });
    if (result.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const cards = await db.execute({
      sql: "SELECT * FROM dashboard_cards WHERE dashboard_id = ? ORDER BY pos_y, pos_x",
      args: [id],
    });
    return NextResponse.json({ ...result.rows[0], cards: cards.rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    const body = await req.json();

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (body.name !== undefined) { fields.push("name = ?"); values.push(body.name); }
    if (body.description !== undefined) { fields.push("description = ?"); values.push(body.description); }
    if (body.collection_id !== undefined) { fields.push("collection_id = ?"); values.push(body.collection_id); }
    if (body.filters_json !== undefined) { fields.push("filters_json = ?"); values.push(JSON.stringify(body.filters_json)); }
    if (body.public_token !== undefined) { fields.push("public_token = ?"); values.push(body.public_token); }

    fields.push("updated_at = datetime('now')");
    values.push(id);

    await db.execute({
      sql: `UPDATE dashboards SET ${fields.join(", ")} WHERE id = ?`,
      args: values,
    });

    const dashboard = await db.execute({ sql: "SELECT * FROM dashboards WHERE id = ?", args: [id] });
    return NextResponse.json(dashboard.rows[0]);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = await getDb();
    await db.execute({ sql: "DELETE FROM dashboards WHERE id = ?", args: [id] });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
