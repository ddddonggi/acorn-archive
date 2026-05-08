import { NextResponse } from "next/server";
import { sql, ensureDatabase } from "@/lib/server/db";

function checkAdminKey(request: Request): boolean {
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey) return true;
  const { searchParams } = new URL(request.url);
  return searchParams.get("key") === adminKey;
}

export async function GET(request: Request) {
  if (!checkAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureDatabase();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const type = searchParams.get("type");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);

  if (id) {
    const result = await sql`
      SELECT * FROM acorn_ai_logs WHERE id = ${id}
    `;
    if (result.rows.length === 0) {
      return NextResponse.json({ log: null }, { status: 404 });
    }
    return NextResponse.json({ log: result.rows[0] });
  }

  // Directory-style counts per type
  if (searchParams.get("summary") === "1") {
    const result = await sql`
      SELECT prompt_type,
             COUNT(*)::int AS count,
             MAX(created_at) AS last_at
      FROM acorn_ai_logs
      GROUP BY prompt_type
      ORDER BY last_at DESC
    `;
    return NextResponse.json({ summary: result.rows });
  }

  const result = type
    ? await sql`
        SELECT id, prompt_type, user_id, note_id, metadata, created_at
        FROM acorn_ai_logs
        WHERE prompt_type = ${type}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `
    : await sql`
        SELECT id, prompt_type, user_id, note_id, metadata, created_at
        FROM acorn_ai_logs
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

  return NextResponse.json({ logs: result.rows });
}
