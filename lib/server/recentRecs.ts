import { sql } from "@/lib/server/db";
import { generateGeminiText, extractJsonObject } from "@/lib/ai/gemini";
import {
  buildRecSystemPrompt,
  buildRecentRecUserPrompt,
  type RecOutput,
  type RecSummaryInput,
} from "@/lib/ai/recommendationPrompt";
import type { NoteCategory } from "@/lib/notes";
import { logAiCall } from "@/lib/server/aiLogger";

export async function regenerateRecentRec(username: string, category: NoteCategory): Promise<void> {
  const result = await sql`
    SELECT s.summary_title, s.artist, s.one_line_review, s.essay, s.keywords, s.taste_hint, s.emotion_tags
    FROM acorn_summaries s
    JOIN acorn_notes n ON s.note_id = n.id
    WHERE s.user_id = ${username} AND n.category = ${category}
    ORDER BY s.updated_at DESC
    LIMIT 5
  `;

  if (result.rows.length === 0) return;

  const summaries: RecSummaryInput[] = result.rows.map((r) => ({
    summaryTitle: r.summary_title,
    artist: r.artist ?? "",
    oneLineReview: r.one_line_review,
    essay: r.essay ?? "",
    keywords: Array.isArray(r.keywords) ? r.keywords : [],
    tasteHint: r.taste_hint,
    emotionTags: Array.isArray(r.emotion_tags) ? r.emotion_tags : [],
  }));

  const systemInstruction = buildRecSystemPrompt(category);
  const userPrompt = buildRecentRecUserPrompt(category, summaries);

  const text = await generateGeminiText({
    systemInstruction,
    prompt: userPrompt,
    temperature: 0.7,
    maxOutputTokens: 300,
  });

  const parsed = JSON.parse(extractJsonObject(text)) as Partial<RecOutput>;
  const title = parsed.title ?? "";
  if (!title) return;

  void logAiCall({
    promptType: "recent_rec",
    userId: username,
    inputSystem: systemInstruction,
    inputUser: userPrompt,
    output: text,
    metadata: { category, summaryCount: summaries.length },
  }).catch(() => {});

  const now = new Date().toISOString();
  await sql`
    INSERT INTO acorn_recent_recs (user_id, category, rec_title, rec_artist, rec_reason, updated_at)
    VALUES (${username}, ${category}, ${title}, ${parsed.artist ?? ""}, ${parsed.reason ?? ""}, ${now})
    ON CONFLICT (user_id, category) DO UPDATE SET
      rec_title = EXCLUDED.rec_title,
      rec_artist = EXCLUDED.rec_artist,
      rec_reason = EXCLUDED.rec_reason,
      updated_at = EXCLUDED.updated_at
  `;
}
