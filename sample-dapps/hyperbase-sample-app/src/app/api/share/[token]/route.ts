import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const db = await getDb();

    // Check questions first
    const question = await db.execute({
      sql: "SELECT * FROM questions WHERE public_token = ?",
      args: [token],
    });
    if (question.rows.length > 0) {
      return NextResponse.json({ type: "question", data: question.rows[0] });
    }

    // Check dashboards
    const dashboard = await db.execute({
      sql: "SELECT * FROM dashboards WHERE public_token = ?",
      args: [token],
    });
    if (dashboard.rows.length > 0) {
      const cards = await db.execute({
        sql: "SELECT * FROM dashboard_cards WHERE dashboard_id = ?",
        args: [dashboard.rows[0].id as number],
      });
      return NextResponse.json({ type: "dashboard", data: { ...dashboard.rows[0], cards: cards.rows } });
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
