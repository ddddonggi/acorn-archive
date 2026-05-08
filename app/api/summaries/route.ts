import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import type { GeneratedSummary, StoredSummary } from "@/lib/summary";
import { ensureDatabase, normalizeDate } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username")?.trim();
    const noteId = searchParams.get("noteId")?.trim();

    if (!username) {
      return NextResponse.json({ summaries: [], summary: null }, { status: 400 });
    }

    await ensureDatabase();

    if (noteId) {
      const result = await sql`
        SELECT id, note_id, user_id, summary_title, one_line_review, essay,
               emotion_tags, keywords, taste_hint, created_at, updated_at
        FROM acorn_summaries
        WHERE user_id = ${username} AND note_id = ${noteId}
      `;
      return NextResponse.json({
        summary: result.rows[0] ? mapSummaryRow(result.rows[0]) : null,
      });
    }

    const result = await sql`
      SELECT id, note_id, user_id, summary_title, one_line_review, essay,
             emotion_tags, keywords, taste_hint, created_at, updated_at
      FROM acorn_summaries
      WHERE user_id = ${username}
      ORDER BY updated_at DESC
    `;

    return NextResponse.json({ summaries: result.rows.map(mapSummaryRow) });
  } catch (error) {
    return NextResponse.json(
      { summaries: [], summary: null, message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      noteId?: string;
      summary?: GeneratedSummary;
    };
    const username = body.username?.trim();
    const noteId = body.noteId?.trim();
    const summary = body.summary;

    if (!username || !noteId || !summary) {
      return NextResponse.json({ summary: null }, { status: 400 });
    }

    await ensureDatabase();

    const now = new Date().toISOString();
    const id = `summary-${noteId}`;
    const result = await sql`
      INSERT INTO acorn_summaries (
        id, note_id, user_id, summary_title, one_line_review, essay,
        emotion_tags, keywords, taste_hint, created_at, updated_at
      )
      VALUES (
        ${id}, ${noteId}, ${username}, ${summary.summaryTitle}, ${summary.oneLineReview},
        ${summary.essay}, ${JSON.stringify(summary.emotionTags)}::jsonb,
        ${JSON.stringify(summary.keywords)}::jsonb, ${summary.tasteHint}, ${now}, ${now}
      )
      ON CONFLICT (note_id) DO UPDATE SET
        summary_title = EXCLUDED.summary_title,
        one_line_review = EXCLUDED.one_line_review,
        essay = EXCLUDED.essay,
        emotion_tags = EXCLUDED.emotion_tags,
        keywords = EXCLUDED.keywords,
        taste_hint = EXCLUDED.taste_hint,
        updated_at = EXCLUDED.updated_at
      RETURNING id, note_id, user_id, summary_title, one_line_review, essay,
                emotion_tags, keywords, taste_hint, created_at, updated_at
    `;

    await sql`
      UPDATE acorn_notes
      SET updated_at = ${now}
      WHERE id = ${noteId} AND user_id = ${username}
    `;

    return NextResponse.json({ summary: mapSummaryRow(result.rows[0]) });
  } catch (error) {
    return NextResponse.json(
      { summary: null, message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

function mapSummaryRow(row: any): StoredSummary {
  return {
    id: row.id,
    noteId: row.note_id,
    userId: row.user_id,
    summaryTitle: row.summary_title,
    oneLineReview: row.one_line_review,
    essay: row.essay,
    emotionTags: Array.isArray(row.emotion_tags) ? row.emotion_tags : [],
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    tasteHint: row.taste_hint,
    createdAt: normalizeDate(row.created_at),
    updatedAt: normalizeDate(row.updated_at),
  };
}
