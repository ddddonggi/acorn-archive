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
  let debugContext: Record<string, unknown> = {
    endpoint: "POST /api/chat",
    timestamp: new Date().toISOString(),
    geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
  };

  try {
    const body = (await request.json()) as Partial<ChatRequestBody>;
    const note = body.note;
    const messages = body.messages ?? [];

    debugContext = {
      ...debugContext,
      note,
      messagesCount: Array.isArray(messages) ? messages.length : "invalid",
    };

    if (!note?.id || !note.title || !isValidCategory(note.category) || !Array.isArray(messages)) {
      return NextResponse.json(
        {
          message: FALLBACK_MESSAGE,
          debug: {
            ...debugContext,
            status: 400,
            reason: "요청 body의 note 또는 messages 형식이 올바르지 않습니다.",
          },
        },
        { status: 400 },
      );
    }

    if (messages.length === 0) {
      return NextResponse.json({ message: getInitialQuestion(note.category) });
    }

    const recentMessages = messages
      .filter((message) => isValidMessage(message))
      .filter((message) => isUsefulContextMessage(message))
      .slice(-MAX_CONTEXT_MESSAGES);
    debugContext = {
      ...debugContext,
      recentMessages,
    };
    const message = await generateGeminiText({
      systemInstruction: [
        buildChatSystemPrompt(note.category),
        buildChatDeveloperPrompt(note.title, note.category),
      ].join("\n\n"),
      prompt: buildChatUserPrompt(note, recentMessages),
      temperature: 0.8,
      maxOutputTokens: 420,
    });

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json(
      {
        message: FALLBACK_MESSAGE,
        debug: {
          ...debugContext,
          status: 500,
          reason: "Gemini API 호출 또는 응답 처리 중 오류가 발생했습니다.",
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    );
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

function isUsefulContextMessage(message: { role: "user" | "assistant"; content: string }) {
  const content = message.content.trim();

  if (!content || content === FALLBACK_MESSAGE || content.replace(/[.\s]/g, "").length === 0) {
    return false;
  }

  if (message.role === "assistant") {
    return /[.?!。！？]$|[요까어죠다]$/.test(content);
  }

  return true;
}
