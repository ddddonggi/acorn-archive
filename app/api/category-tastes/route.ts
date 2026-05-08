import { NextResponse } from "next/server";
import { sql, ensureDatabase } from "@/lib/server/db";
import { regenerateCategoryTaste } from "@/lib/server/categoryTastes";
import type { NoteCategory } from "@/lib/notes";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim();

  if (!username) {
    return NextResponse.json({ tastes: [] }, { status: 400 });
  }

  await ensureDatabase();

  // Fetch cached taste texts
  const cacheResult = await sql`
    SELECT category, taste_text
    FROM acorn_category_tastes
    WHERE user_id = ${username}
  `;
  const cachedCategories = new Set(cacheResult.rows.map((r) => r.category as string));

  // Find categories that have summaries but no cached taste text
  const summaryResult = await sql`
    SELECT DISTINCT n.category
    FROM acorn_summaries s
    JOIN acorn_notes n ON s.note_id = n.id
    WHERE s.user_id = ${username}
  `;
  const categoriesWithData = summaryResult.rows.map((r) => r.category as NoteCategory);
  const toGenerate = categoriesWithData.filter((cat) => !cachedCategories.has(cat));

  // Generate synchronously for missing categories
  for (const cat of toGenerate) {
    try {
      await regenerateCategoryTaste(username, cat);
    } catch {
      // ignore individual failures
    }
  }

  // Re-fetch if we generated anything new
  const finalResult =
    toGenerate.length > 0
      ? await sql`SELECT category, taste_text FROM acorn_category_tastes WHERE user_id = ${username}`
      : cacheResult;

  return NextResponse.json({
    tastes: finalResult.rows.map((r) => ({
      category: r.category as NoteCategory,
      tasteText: r.taste_text as string,
    })),
  });
}
