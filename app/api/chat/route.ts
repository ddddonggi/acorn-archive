import { NextResponse } from "next/server";
import { generateGeminiText } from "@/lib/ai/gemini";
import {
  buildChatDeveloperPrompt,
  buildChatSystemPrompt,
  buildChatUserPrompt,
  getInitialQuestion,
} from "@/lib/ai/prompts";
import { ChatRequestBody } from "@/lib/ai/types";

const FALLBACK_MESSAGE = "지금은 AI가 잠시 쉬고 있어요. 다시 시도해주세요.";
const MAX_CONTEXT_MESSAGES = 10;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ChatRequestBody>;
    const note = body.note;
    const messages = body.messages ?? [];

    if (!note?.id || !note.title || !isValidCategory(note.category) || !Array.isArray(messages)) {
      return NextResponse.json({ message: FALLBACK_MESSAGE }, { status: 400 });
    }

    if (messages.length === 0) {
      return NextResponse.json({ message: getInitialQuestion(note.category) });
    }

    const recentMessages = messages
      .filter((message) => isValidMessage(message))
      .slice(-MAX_CONTEXT_MESSAGES);
    const message = await generateGeminiText({
      systemInstruction: [
        buildChatSystemPrompt(note.category),
        buildChatDeveloperPrompt(note.title, note.category),
      ].join("\n\n"),
      prompt: buildChatUserPrompt(note, recentMessages),
      temperature: 0.8,
      maxOutputTokens: 180,
    });

    return NextResponse.json({ message });
  } catch {
    return NextResponse.json({ message: FALLBACK_MESSAGE }, { status: 500 });
  }
}

function isValidCategory(category: unknown) {
  return category === "music" || category === "media" || category === "video";
}

function isValidMessage(message: unknown): message is { role: "user" | "assistant"; content: string } {
  if (!message || typeof message !== "object") {
    return false;
  }

  const candidate = message as { role?: unknown; content?: unknown };

  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string" &&
    candidate.content.trim().length > 0
  );
}
