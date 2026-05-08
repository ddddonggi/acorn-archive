import { sql } from "@/lib/server/db";
import { generateGeminiText } from "@/lib/ai/gemini";
import {
  buildTraditionalCultureSummarySystemPrompt,
  buildTraditionalCultureSummaryUserPrompt,
} from "@/lib/ai/traditionalCultureSummaryPrompt";

export async function regenerateTraditionalCultureSummary(username: string): Promise<string> {
  const result = await sql`
    SELECT title, traditional_culture_memo
    FROM acorn_notes
    WHERE user_id = ${username}
      AND traditional_culture_memo != ''
    ORDER BY updated_at DESC
  `;

  if (result.rows.length === 0) return "";

  const memos = result.rows.map((r) => ({
    noteTitle: r.title as string,
    memo: r.traditional_culture_memo as string,
  }));

  const text = await generateGeminiText({
    systemInstruction: buildTraditionalCultureSummarySystemPrompt(),
    prompt: buildTraditionalCultureSummaryUserPrompt(memos),
    temperature: 0.4,
    maxOutputTokens: 400,
  });

  const summaryText = text.trim();
  if (!summaryText) return "";

  const now = new Date().toISOString();
  await sql`
    INSERT INTO acorn_traditional_culture_summary (user_id, summary_text, updated_at)
    VALUES (${username}, ${summaryText}, ${now})
    ON CONFLICT (user_id) DO UPDATE SET
      summary_text = EXCLUDED.summary_text,
      updated_at = EXCLUDED.updated_at
  `;

  return summaryText;
}
