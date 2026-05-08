import { NextResponse } from "next/server";
import type { ChatMessage, ChatRole } from "@/lib/chat";
import { sql, ensureDatabase, normalizeDate } from "@/lib/server/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username")?.trim();
    const noteId = searchParams.get("noteId")?.trim();

    if (!username || !noteId) {
      return NextResponse.json({ messages: [] }, { status: 400 });
    }

    await ensureDatabase();

    const result = await sql`
      SELECT id, note_id, user_id, role, content, created_at
      FROM acorn_chat_messages
      WHERE user_id = ${username} AND note_id = ${noteId}
      ORDER BY created_at ASC
    `;

    return NextResponse.json({ messages: result.rows.map(mapMessageRow) });
  } catch (error) {
    return NextResponse.json(
      { messages: [], message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      noteId?: string;
      messages?: Array<{ role: ChatRole; content: string }>;
    };
    const username = body.username?.trim();
    const noteId = body.noteId?.trim();
    const messages = body.messages ?? [];

    if (!username || !noteId || !Array.isArray(messages)) {
      return NextResponse.json({ messages: [] }, { status: 400 });
    }

    await ensureDatabase();

    const now = Date.now();
    const savedMessages: ChatMessage[] = [];

    for (const [index, message] of messages.entries()) {
      if (!isValidRole(message.role) || !message.content.trim()) {
        continue;
      }

      const id = `${noteId}-${now}-${index}`;
      const createdAt = new Date(now + index).toISOString();
      const result = await sql`
        INSERT INTO acorn_chat_messages (id, note_id, user_id, role, content, created_at)
        VALUES (${id}, ${noteId}, ${username}, ${message.role}, ${message.content.trim()}, ${createdAt})
        RETURNING id, note_id, user_id, role, content, created_at
      `;
      savedMessages.push(mapMessageRow(result.rows[0]));
    }

    return NextResponse.json({ messages: savedMessages });
  } catch (error) {
    return NextResponse.json(
      { messages: [], message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

function isValidRole(role: unknown): role is ChatRole {
  return role === "user" || role === "assistant";
}

function mapMessageRow(row: any): ChatMessage {
  return {
    id: row.id,
    noteId: row.note_id,
    userId: row.user_id,
    role: row.role,
    content: row.content,
    createdAt: normalizeDate(row.created_at),
  };
}
