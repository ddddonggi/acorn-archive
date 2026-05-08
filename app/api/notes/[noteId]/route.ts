import { NextResponse } from "next/server";
import { sql, ensureDatabase, normalizeDate } from "@/lib/server/db";
import type { StoredNote } from "@/lib/notes";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> },
) {
  try {
    const { noteId } = await params;
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username")?.trim();

    if (!username) {
      return NextResponse.json({ note: null }, { status: 400 });
    }

    await ensureDatabase();

    const result = await sql`
      SELECT id, user_id, category, title, artist, color, image_url, created_at, updated_at
      FROM acorn_notes
      WHERE id = ${noteId} AND user_id = ${username}
    `;
    const note = result.rows[0] ? mapNoteRow(result.rows[0]) : null;

    return NextResponse.json({ note });
  } catch (error) {
    return NextResponse.json(
      { note: null, message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

function mapNoteRow(row: any): StoredNote {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    title: row.title,
    artist: row.artist ?? "",
    color: row.color ?? "",
    imageUrl: row.image_url ?? null,
    createdAt: normalizeDate(row.created_at),
    updatedAt: normalizeDate(row.updated_at),
  };
}
