import { sql } from "@/lib/server/db";
import { generateGeminiText } from "@/lib/ai/gemini";
import {
  buildCategoryTasteSystemPrompt,
  buildCategoryTasteUserPrompt,
} from "@/lib/ai/categoryTastePrompt";
import type { RecSummaryInput } from "@/lib/ai/recommendationPrompt";
import type { NoteCategory } from "@/lib/notes";
import { logAiCall } from "@/lib/server/aiLogger";

export async function regenerateCategoryTaste(
  username: string,
  category: NoteCategory,
): Promise<void> {
  const result = await sql`
    SELECT s.summary_title, s.artist, s.one_line_review, s.essay, s.taste_hint, s.emotion_tags, s.keywords
    FROM acorn_summaries s
    JOIN acorn_notes n ON s.note_id = n.id
    WHERE s.user_id = ${username} AND n.category = ${category}
    ORDER BY s.updated_at DESC
  `;

  if (result.rows.length === 0) return;

  const summaries: RecSummaryInput[] = result.rows.map((r) => ({
    summaryTitle: r.summary_title,
    artist: r.artist ?? "",
    oneLineReview: r.one_line_review,
    essay: r.essay ?? "",
    tasteHint: r.taste_hint,
    emotionTags: Array.isArray(r.emotion_tags) ? r.emotion_tags : [],
    keywords: Array.isArray(r.keywords) ? r.keywords : [],
  }));

  const systemInstruction = buildCategoryTasteSystemPrompt(category);
  const userPrompt = buildCategoryTasteUserPrompt(category, summaries);

  const text = await generateGeminiText({
    systemInstruction,
    prompt: userPrompt,
    temperature: 0.5,
    maxOutputTokens: 200,
  });

  if (!text.trim()) return;

  void logAiCall({
    promptType: "category_taste",
    userId: username,
    inputSystem: systemInstruction,
    inputUser: userPrompt,
    output: text,
    metadata: { category, summaryCount: summaries.length },
  }).catch(() => {});

  const now = new Date().toISOString();
  await sql`
    INSERT INTO acorn_category_tastes (user_id, category, taste_text, updated_at)
    VALUES (${username}, ${category}, ${text.trim()}, ${now})
    ON CONFLICT (user_id, category) DO UPDATE SET
      taste_text = EXCLUDED.taste_text,
      updated_at = EXCLUDED.updated_at
  `;
}
