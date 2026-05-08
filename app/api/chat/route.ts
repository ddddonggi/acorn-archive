import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  buildChatDeveloperPrompt,
  buildChatSystemPrompt,
  DEFAULT_OPENAI_MODEL,
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

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ message: FALLBACK_MESSAGE }, { status: 500 });
    }

    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL;
    const recentMessages = messages
      .filter((message) => isValidMessage(message))
      .slice(-MAX_CONTEXT_MESSAGES);

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: buildChatSystemPrompt(note.category) },
        { role: "developer", content: buildChatDeveloperPrompt(note.title, note.category) },
        ...recentMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
      temperature: 0.8,
      max_tokens: 180,
    });

    const message = completion.choices[0]?.message?.content?.trim();

    if (!message) {
      return NextResponse.json({ message: FALLBACK_MESSAGE }, { status: 500 });
    }

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
