import { NextResponse } from "next/server";
import { sql, ensureDatabase, normalizeDate } from "@/lib/server/db";
import { analyzeTraditionalCulture } from "@/lib/server/traditionalCulture";
import { regenerateRecentRec } from "@/lib/server/recentRecs";
import { regenerateFullRec } from "@/lib/server/recommendations";
import { regenerateOverallSummary } from "@/lib/server/overallSummary";
import type { NoteCategory } from "@/lib/notes";

const CATEGORIES: NoteCategory[] = ["music", "media", "video"];

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim();

  if (!username) {
    return NextResponse.json({ error: "username required" }, { status: 400 });
  }

  await ensureDatabase();

  // 1. traditional_culture: 채팅 기록이 있는 모든 작품에 대해 분석
  const notesResult = await sql`
    SELECT DISTINCT n.id, n.title
    FROM acorn_notes n
    JOIN acorn_chat_messages m ON m.note_id = n.id
    WHERE n.user_id = ${username}
  `;

  for (const note of notesResult.rows) {
    try {
      await analyzeTraditionalCulture(note.id as string, note.title as string);
    } catch {
      // 개별 실패 무시하고 계속
    }
  }

  // 2. 감상문이 있는 카테고리에 대해 recent_rec, full_rec 재생성
  const summaryResult = await sql`
    SELECT DISTINCT n.category
    FROM acorn_summaries s
    JOIN acorn_notes n ON s.note_id = n.id
    WHERE s.user_id = ${username}
  `;
  const activeCategories = CATEGORIES.filter((c) =>
    summaryResult.rows.some((r) => r.category === c),
  );

  for (const cat of activeCategories) {
    try {
      await regenerateRecentRec(username, cat);
    } catch {
      // ignore
    }
    try {
      await regenerateFullRec(username, cat);
    } catch {
      // ignore
    }
  }

  // 3. overall_summary: traditional_culture 데이터가 반영된 상태에서 실행
  try {
    await regenerateOverallSummary(username);
  } catch {
    // ignore
  }

  // 4. 업데이트된 추천 반환
  const [recentResult, fullResult] = await Promise.all([
    sql`SELECT category, rec_title, rec_artist, rec_reason, updated_at FROM acorn_recent_recs WHERE user_id = ${username}`,
    sql`SELECT category, rec_title, rec_artist, rec_reason, updated_at FROM acorn_full_recs WHERE user_id = ${username}`,
  ]);

  return NextResponse.json({
    recentRecs: recentResult.rows.map((r) => ({
      category: r.category as NoteCategory,
      title: r.rec_title as string,
      artist: (r.rec_artist as string) ?? "",
      reason: r.rec_reason as string,
      updatedAt: normalizeDate(r.updated_at),
    })),
    fullRecs: fullResult.rows.map((r) => ({
      category: r.category as NoteCategory,
      title: r.rec_title as string,
      artist: (r.rec_artist as string) ?? "",
      reason: r.rec_reason as string,
      updatedAt: normalizeDate(r.updated_at),
    })),
  });
}
