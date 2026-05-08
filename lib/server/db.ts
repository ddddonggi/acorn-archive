import { sql } from "@vercel/postgres";

export async function ensureDatabase() {
  await sql`
    CREATE TABLE IF NOT EXISTS acorn_users (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS acorn_notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES acorn_users(username) ON DELETE CASCADE,
      category TEXT NOT NULL CHECK (category IN ('music', 'media', 'video')),
      title TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS acorn_chat_messages (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL REFERENCES acorn_notes(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES acorn_users(username) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS acorn_summaries (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL UNIQUE REFERENCES acorn_notes(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES acorn_users(username) ON DELETE CASCADE,
      summary_title TEXT NOT NULL,
      one_line_review TEXT NOT NULL,
      essay TEXT NOT NULL,
      emotion_tags JSONB NOT NULL,
      keywords JSONB NOT NULL,
      taste_hint TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export function normalizeDate(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
