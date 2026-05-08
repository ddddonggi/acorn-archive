import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { ensureDatabase, normalizeDate } from "@/lib/server/db";
import type { NoteCategory, StoredNote } from "@/lib/notes";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username")?.trim();
    const category = searchParams.get("category") as NoteCategory | null;

    if (!username || !isValidCategory(category)) {
      return NextResponse.json({ notes: [] }, { status: 400 });
    }

    await ensureDatabase();

    const result = await sql`
      SELECT id, user_id, category, title, created_at, updated_at
      FROM acorn_notes
      WHERE user_id = ${username} AND category = ${category}
      ORDER BY created_at DESC
    `;

    return NextResponse.json({ notes: result.rows.map(mapNoteRow) });
  } catch (error) {
    return NextResponse.json(
      { notes: [], message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      category?: NoteCategory;
      title?: string;
    };
    const username = body.username?.trim();
    const title = body.title?.trim();
    const category = body.category;

    if (!username || !title || !isValidCategory(category)) {
      return NextResponse.json({ note: null }, { status: 400 });
    }

    await ensureDatabase();

    const now = new Date().toISOString();
    const id = `${category}-${Date.now()}`;

    const result = await sql`
      INSERT INTO acorn_notes (id, user_id, category, title, created_at, updated_at)
      VALUES (${id}, ${username}, ${category}, ${title}, ${now}, ${now})
      RETURNING id, user_id, category, title, created_at, updated_at
    `;

    return NextResponse.json({ note: mapNoteRow(result.rows[0]) });
  } catch (error) {
    return NextResponse.json(
      { note: null, message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

function isValidCategory(category: unknown): category is NoteCategory {
  return category === "music" || category === "media" || category === "video";
}

function mapNoteRow(row: any): StoredNote {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    title: row.title,
    createdAt: normalizeDate(row.created_at),
    updatedAt: normalizeDate(row.updated_at),
  };
}
