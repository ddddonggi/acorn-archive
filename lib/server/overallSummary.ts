import { sql } from "@/lib/server/db";
import { generateGeminiText } from "@/lib/ai/gemini";
import {
  buildOverallSummarySystemPrompt,
  buildOverallSummaryUserPrompt,
} from "@/lib/ai/overallSummaryPrompt";

export async function regenerateOverallSummary(username: string): Promise<string> {
  const result = await sql`
    SELECT s.summary_title, s.one_line_review, n.category
    FROM acorn_summaries s
    JOIN acorn_notes n ON s.note_id = n.id
    WHERE s.user_id = ${username}
    ORDER BY s.updated_at DESC
    LIMIT 20
  `;

  if (result.rows.length === 0) return "";

  const summaries = result.rows.map((r) => ({
    title: r.summary_title as string,
    oneLineReview: r.one_line_review as string,
    category: r.category as string,
  }));

  const text = await generateGeminiText({
    systemInstruction: buildOverallSummarySystemPrompt(),
    prompt: buildOverallSummaryUserPrompt(summaries),
    temperature: 0.7,
    maxOutputTokens: 200,
  });

  const summaryText = text.trim();
  if (!summaryText) return "";

  const now = new Date().toISOString();
  await sql`
    INSERT INTO acorn_overall_summary (user_id, summary_text, updated_at)
    VALUES (${username}, ${summaryText}, ${now})
    ON CONFLICT (user_id) DO UPDATE SET
      summary_text = EXCLUDED.summary_text,
      updated_at = EXCLUDED.updated_at
  `;

  return summaryText;
}
