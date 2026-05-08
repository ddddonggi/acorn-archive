import { NextResponse } from "next/server";
import { sql, ensureDatabase, normalizeDate } from "@/lib/server/db";
import { regenerateRecentRec } from "@/lib/server/recentRecs";
import { regenerateFullRec } from "@/lib/server/recommendations";
import type { NoteCategory } from "@/lib/notes";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim();
  const type = searchParams.get("type");

  if (!username || (type !== "recent" && type !== "full")) {
    return NextResponse.json({ recommendations: [] }, { status: 400 });
  }

  await ensureDatabase();

  // Find categories that have at least one summary
  const summaryResult = await sql`
    SELECT DISTINCT n.category
    FROM acorn_summaries s
    JOIN acorn_notes n ON s.note_id = n.id
    WHERE s.user_id = ${username}
  `;
  const categoriesWithData = summaryResult.rows.map((r) => r.category as NoteCategory);

  if (type === "recent") {
    return handleRecs(
      username,
      categoriesWithData,
      () => sql`SELECT category, rec_title, rec_artist, rec_reason, updated_at FROM acorn_recent_recs WHERE user_id = ${username}`,
      regenerateRecentRec,
    );
  }

  return handleRecs(
    username,
    categoriesWithData,
    () => sql`SELECT category, rec_title, rec_artist, rec_reason, updated_at FROM acorn_full_recs WHERE user_id = ${username}`,
    regenerateFullRec,
  );
}

async function handleRecs(
  username: string,
  categoriesWithData: NoteCategory[],
  fetchCache: () => ReturnType<typeof sql>,
  regenerate: (username: string, category: NoteCategory) => Promise<void>,
) {
  const cacheResult = await fetchCache();
  const cachedCategories = new Set(cacheResult.rows.map((r) => r.category as string));

  const toGenerate = categoriesWithData.filter((cat) => !cachedCategories.has(cat));

  for (const cat of toGenerate) {
    try {
      await regenerate(username, cat);
    } catch {
      // ignore individual failures
    }
  }

  const finalResult = toGenerate.length > 0 ? await fetchCache() : cacheResult;

  return NextResponse.json({
    recommendations: finalResult.rows.map((r) => ({
      category: r.category as NoteCategory,
      title: r.rec_title,
      artist: r.rec_artist ?? "",
      reason: r.rec_reason,
      updatedAt: normalizeDate(r.updated_at),
    })),
  });
}
