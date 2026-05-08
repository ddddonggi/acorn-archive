import { NextResponse } from "next/server";
import { extractJsonObject, generateGeminiText } from "@/lib/ai/gemini";
import {
  buildSummaryDeveloperPrompt,
  buildSummarySystemPrompt,
  buildSummaryUserPrompt,
  SUMMARY_FALLBACK,
} from "@/lib/ai/summaryPrompt";
import { SummaryRequestBody, SummaryResponseBody } from "@/lib/ai/types";

const MAX_CONTEXT_MESSAGES = 20;

export async function POST(request: Request) {
  let debugContext: Record<string, unknown> = {
    endpoint: "POST /api/summary",
    timestamp: new Date().toISOString(),
    geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
  };

  try {
    const body = (await request.json()) as Partial<SummaryRequestBody>;
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
          ...SUMMARY_FALLBACK,
          debug: {
            ...debugContext,
            status: 400,
            reason: "요청 body의 note 또는 messages 형식이 올바르지 않습니다.",
          },
        },
        { status: 400 },
      );
    }

    const recentMessages = messages
      .filter((message) => isValidMessage(message))
      .filter((message) => isUsefulContextMessage(message))
      .slice(-MAX_CONTEXT_MESSAGES);
    debugContext = {
      ...debugContext,
      recentMessages,
    };
    const content = await generateGeminiText({
      systemInstruction: [
        buildSummarySystemPrompt(note.category),
        buildSummaryDeveloperPrompt(note.title, note.category),
      ].join("\n\n"),
      prompt: buildSummaryUserPrompt(note, recentMessages),
      temperature: 0.4,
      maxOutputTokens: 900,
    });

    const summary = normalizeSummary(JSON.parse(extractJsonObject(content)));

    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      {
        ...SUMMARY_FALLBACK,
        debug: {
          ...debugContext,
          status: 500,
          reason: "Gemini API 호출, JSON 파싱, 또는 감상문 정리 중 오류가 발생했습니다.",
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

  if (!content || content === "지금은 AI가 잠시 쉬고 있어요. 다시 시도해주세요.") {
    return false;
  }

  if (message.role === "assistant") {
    return /[.?!。！？]$|[요까어죠다]$/.test(content);
  }

  return true;
}

function normalizeSummary(value: unknown): SummaryResponseBody {
  const candidate = value as Partial<SummaryResponseBody>;

  return {
    summaryTitle: readString(candidate.summaryTitle, SUMMARY_FALLBACK.summaryTitle),
    artist: readString(candidate.artist, SUMMARY_FALLBACK.artist),
    oneLineReview: readString(candidate.oneLineReview, SUMMARY_FALLBACK.oneLineReview),
    essay: readString(candidate.essay, SUMMARY_FALLBACK.essay).slice(0, 500),
    emotionTags: readStringArray(candidate.emotionTags, SUMMARY_FALLBACK.emotionTags),
    keywords: readStringArray(candidate.keywords, SUMMARY_FALLBACK.keywords),
    tasteHint: readString(candidate.tasteHint, SUMMARY_FALLBACK.tasteHint),
  };
}

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const strings = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);

  return strings.length === 3 ? strings : fallback;
}
