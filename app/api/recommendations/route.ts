import { NextResponse } from "next/server";
import { sql, ensureDatabase, normalizeDate } from "@/lib/server/db";
import { generateGeminiText, extractJsonObject } from "@/lib/ai/gemini";
import {
  buildRecSystemPrompt,
  buildRecentRecUserPrompt,
  type RecOutput,
  type RecSummaryInput,
} from "@/lib/ai/recommendationPrompt";
import type { NoteCategory } from "@/lib/notes";

const CATEGORIES: NoteCategory[] = ["music", "media", "video"];

async function fetchSummariesWithCategory(username: string) {
  const result = await sql`
    SELECT s.summary_title, s.artist, s.one_line_review, s.taste_hint, s.emotion_tags, n.category
    FROM acorn_summaries s
    JOIN acorn_notes n ON s.note_id = n.id
    WHERE s.user_id = ${username}
    ORDER BY s.updated_at DESC
  `;
  return result.rows;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.trim();
  const type = searchParams.get("type");

  if (!username || (type !== "recent" && type !== "full")) {
    return NextResponse.json({ recommendations: [] }, { status: 400 });
  }

  await ensureDatabase();

  if (type === "full") {
    const result = await sql`
      SELECT category, rec_title, rec_artist, rec_reason, updated_at
      FROM acorn_full_recs
      WHERE user_id = ${username}
    `;
    return NextResponse.json({
      recommendations: result.rows.map((r) => ({
        category: r.category as NoteCategory,
        title: r.rec_title,
        artist: r.rec_artist ?? "",
        reason: r.rec_reason,
        updatedAt: normalizeDate(r.updated_at),
      })),
    });
  }

  // type === "recent": generate on-demand from last 5 per category
  const allRows = await fetchSummariesWithCategory(username);

  const results = await Promise.allSettled(
    CATEGORIES.map(async (cat) => {
      const catRows = allRows.filter((r) => r.category === cat).slice(0, 5);
      if (catRows.length === 0) return null;

      const summaries: RecSummaryInput[] = catRows.map((r) => ({
        summaryTitle: r.summary_title,
        artist: r.artist ?? "",
        oneLineReview: r.one_line_review,
        tasteHint: r.taste_hint,
        emotionTags: Array.isArray(r.emotion_tags) ? r.emotion_tags : [],
      }));

      const text = await generateGeminiText({
        systemInstruction: buildRecSystemPrompt(cat),
        prompt: buildRecentRecUserPrompt(cat, summaries),
        temperature: 0.7,
        maxOutputTokens: 300,
      });

      const parsed = JSON.parse(extractJsonObject(text)) as Partial<RecOutput>;
      if (!parsed.title) return null;

      return {
        category: cat,
        title: parsed.title,
        artist: parsed.artist ?? "",
        reason: parsed.reason ?? "",
      };
    }),
  );

  type Rec = { category: NoteCategory; title: string; artist: string; reason: string };
  const recommendations: Rec[] = [];
  for (const r of results) {
    if (r.status === "fulfilled" && r.value !== null) {
      recommendations.push(r.value);
    }
  }

  return NextResponse.json({ recommendations });
}
