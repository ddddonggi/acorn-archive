import { sql } from "@/lib/server/db";
import { generateGeminiText } from "@/lib/ai/gemini";
import {
  buildTraditionalCultureSystemPrompt,
  buildTraditionalCultureUserPrompt,
} from "@/lib/ai/traditionalCulturePrompt";

export async function analyzeTraditionalCulture(
  noteId: string,
  noteTitle: string,
): Promise<void> {
  const result = await sql`
    SELECT role, content
    FROM acorn_chat_messages
    WHERE note_id = ${noteId}
    ORDER BY created_at ASC
  `;

  if (result.rows.length === 0) return;

  const messages = result.rows.map((r) => ({
    role: r.role as "user" | "assistant",
    content: r.content as string,
  }));

  const text = await generateGeminiText({
    systemInstruction: buildTraditionalCultureSystemPrompt(),
    prompt: buildTraditionalCultureUserPrompt(noteTitle, messages),
    temperature: 0.3,
    maxOutputTokens: 300,
  });

  const memo = text.trim();
  if (!memo) return;

  await sql`
    UPDATE acorn_notes
    SET traditional_culture_memo = ${memo}
    WHERE id = ${noteId}
  `;
}
