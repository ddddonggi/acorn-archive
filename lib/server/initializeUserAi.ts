import { sql } from "@/lib/server/db";
import { analyzeTraditionalCulture } from "@/lib/server/traditionalCulture";
import { regenerateOverallSummary } from "@/lib/server/overallSummary";

export async function initializeUserAiIfNeeded(username: string): Promise<void> {
  const userResult = await sql`
    SELECT ai_initialized FROM acorn_users WHERE username = ${username}
  `;
  if (userResult.rows[0]?.ai_initialized) return;

  const notesResult = await sql`
    SELECT n.id, n.title
    FROM acorn_notes n
    WHERE n.user_id = ${username}
    ORDER BY n.created_at ASC
  `;

  if (notesResult.rows.length > 0) {
    // Run traditional_culture for each note that has chat messages, sequentially
    for (const note of notesResult.rows) {
      await analyzeTraditionalCulture(note.id as string, note.title as string).catch(() => {});
    }

    // Run overall_summary after all notes are analyzed
    await regenerateOverallSummary(username).catch(() => {});
  }

  await sql`
    UPDATE acorn_users SET ai_initialized = TRUE WHERE username = ${username}
  `;
}
