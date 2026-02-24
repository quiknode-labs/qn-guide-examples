import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json();

    const result = await db.execute({
      sql: `INSERT INTO dashboard_cards (dashboard_id, question_id, pos_x, pos_y, width, height, card_type, text_content, filter_mapping)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        body.dashboard_id,
        body.question_id || null,
        body.pos_x || 0,
        body.pos_y || 0,
        body.width || 6,
        body.height || 4,
        body.card_type || "question",
        body.text_content || null,
        body.filter_mapping ? JSON.stringify(body.filter_mapping) : null,
      ],
    });

    const card = await db.execute({
      sql: "SELECT * FROM dashboard_cards WHERE id = ?",
      args: [Number(result.lastInsertRowid)],
    });
    return NextResponse.json(card.rows[0], { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = await getDb();
    const body = await req.json();

    // Batch update card positions (used by react-grid-layout)
    if (Array.isArray(body.cards)) {
      const statements = body.cards.map(
        (card: { id: number; pos_x: number; pos_y: number; width: number; height: number }) => ({
          sql: "UPDATE dashboard_cards SET pos_x = ?, pos_y = ?, width = ?, height = ? WHERE id = ?",
          args: [card.pos_x, card.pos_y, card.width, card.height, card.id],
        })
      );
      await db.batch(statements, "write");
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Expected cards array" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await db.execute({ sql: "DELETE FROM dashboard_cards WHERE id = ?", args: [id] });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
