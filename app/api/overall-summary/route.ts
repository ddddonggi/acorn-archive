import { NextResponse } from "next/server";
import { sql, ensureDatabase, normalizeDate } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username")?.trim();

    if (!username) {
      return NextResponse.json({ summaryText: null }, { status: 400 });
    }

    await ensureDatabase();

    const result = await sql`
      SELECT summary_text, updated_at
      FROM acorn_overall_summary
      WHERE user_id = ${username}
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ summaryText: null });
    }

    return NextResponse.json({
      summaryText: result.rows[0].summary_text as string,
      updatedAt: normalizeDate(result.rows[0].updated_at),
    });
  } catch (error) {
    return NextResponse.json(
      { summaryText: null, message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
