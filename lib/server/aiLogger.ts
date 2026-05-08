import { sql } from "@/lib/server/db";

export type AiLogInput = {
  promptType:
    | "chat"
    | "summary"
    | "category_taste"
    | "recent_rec"
    | "full_rec"
    | "traditional_culture"
    | "overall_summary"
    | "traditional_culture_summary";
  userId?: string;
  noteId?: string;
  inputSystem: string;
  inputUser: string;
  output: string;
  metadata?: Record<string, unknown>;
};

export async function logAiCall(input: AiLogInput): Promise<void> {
  const id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await sql`
    INSERT INTO acorn_ai_logs (
      id, prompt_type, user_id, note_id,
      input_system, input_user, output, metadata
    ) VALUES (
      ${id},
      ${input.promptType},
      ${input.userId ?? null},
      ${input.noteId ?? null},
      ${input.inputSystem},
      ${input.inputUser},
      ${input.output},
      ${JSON.stringify(input.metadata ?? {})}::jsonb
    )
  `;
}
