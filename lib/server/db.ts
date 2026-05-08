import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.STORAGE_POSTGRES_URL!, { fullResults: true });

export type SqlRows = { rows: Record<string, any>[] };

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
    ALTER TABLE acorn_notes ADD COLUMN IF NOT EXISTS image_url TEXT
  `;

  await sql`
    ALTER TABLE acorn_notes ADD COLUMN IF NOT EXISTS artist TEXT NOT NULL DEFAULT ''
  `;

  await sql`
    ALTER TABLE acorn_notes ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT ''
  `;

  await sql`
    ALTER TABLE acorn_notes ADD COLUMN IF NOT EXISTS traditional_culture_memo TEXT NOT NULL DEFAULT ''
  `;

  await sql`
    ALTER TABLE acorn_notes ADD COLUMN IF NOT EXISTS traditional_culture_score INT NOT NULL DEFAULT 0
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
      artist TEXT NOT NULL DEFAULT '',
      one_line_review TEXT NOT NULL,
      essay TEXT NOT NULL,
      emotion_tags JSONB NOT NULL,
      keywords JSONB NOT NULL,
      taste_hint TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE acorn_summaries ADD COLUMN IF NOT EXISTS artist TEXT NOT NULL DEFAULT ''
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS acorn_full_recs (
      user_id TEXT NOT NULL REFERENCES acorn_users(username) ON DELETE CASCADE,
      category TEXT NOT NULL CHECK (category IN ('music', 'media', 'video')),
      rec_title TEXT NOT NULL DEFAULT '',
      rec_artist TEXT NOT NULL DEFAULT '',
      rec_reason TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, category)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS acorn_recent_recs (
      user_id TEXT NOT NULL REFERENCES acorn_users(username) ON DELETE CASCADE,
      category TEXT NOT NULL CHECK (category IN ('music', 'media', 'video')),
      rec_title TEXT NOT NULL DEFAULT '',
      rec_artist TEXT NOT NULL DEFAULT '',
      rec_reason TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, category)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS acorn_traditional_culture_summary (
      user_id TEXT PRIMARY KEY REFERENCES acorn_users(username) ON DELETE CASCADE,
      summary_text TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS acorn_category_tastes (
      user_id TEXT NOT NULL REFERENCES acorn_users(username) ON DELETE CASCADE,
      category TEXT NOT NULL CHECK (category IN ('music', 'media', 'video')),
      taste_text TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, category)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS acorn_overall_summary (
      user_id TEXT PRIMARY KEY REFERENCES acorn_users(username) ON DELETE CASCADE,
      summary_text TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export function normalizeDate(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
