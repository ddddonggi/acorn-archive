import { NextResponse } from "next/server";
import { sql, ensureDatabase } from "@/lib/server/db";
import { regenerateTraditionalCultureSummary } from "@/lib/server/traditionalCultureSummary";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim();

  if (!username) {
    return NextResponse.json({ summaryText: null }, { status: 400 });
  }

  await ensureDatabase();

  const cached = await sql`
    SELECT summary_text
    FROM acorn_traditional_culture_summary
    WHERE user_id = ${username}
  `;

  if (cached.rows.length > 0) {
    return NextResponse.json({ summaryText: cached.rows[0].summary_text as string });
  }

  try {
    const summaryText = await regenerateTraditionalCultureSummary(username);
    return NextResponse.json({ summaryText: summaryText || null });
  } catch {
    return NextResponse.json({ summaryText: null }, { status: 500 });
  }
}
