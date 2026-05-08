import { put, del } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { ensureDatabase, sql, normalizeDate } from "@/lib/server/db";
import type { StoredNote } from "@/lib/notes";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const noteId = (formData.get("noteId") as string | null)?.trim();
    const username = (formData.get("username") as string | null)?.trim();

    if (!file || !noteId || !username) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "이미지 파일만 업로드할 수 있습니다." }, { status: 400 });
    }

    await ensureDatabase();

    const existing = await sql`
      SELECT image_url FROM acorn_notes
      WHERE id = ${noteId} AND user_id = ${username}
    `;

    if (!existing.rows[0]) {
      return NextResponse.json({ error: "노트를 찾을 수 없습니다." }, { status: 404 });
    }

    const oldUrl = existing.rows[0].image_url as string | null;

    const ext = file.name.split(".").pop() ?? "jpg";
    const blob = await put(`notes/${noteId}/cover.${ext}`, file, {
      access: "public",
      addRandomSuffix: false,
    });

    await sql`
      UPDATE acorn_notes
      SET image_url = ${blob.url}, updated_at = NOW()
      WHERE id = ${noteId} AND user_id = ${username}
    `;

    if (oldUrl) {
      try {
        await del(oldUrl);
      } catch {
        // 이전 파일 삭제 실패는 무시
      }
    }

    const result = await sql`
      SELECT id, user_id, category, title, artist, image_url, created_at, updated_at
      FROM acorn_notes
      WHERE id = ${noteId} AND user_id = ${username}
    `;

    return NextResponse.json({ url: blob.url, note: mapNoteRow(result.rows[0]) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
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
    imageUrl: row.image_url ?? null,
    createdAt: normalizeDate(row.created_at),
    updatedAt: normalizeDate(row.updated_at),
  };
}
