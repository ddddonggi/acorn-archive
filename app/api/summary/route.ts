import { NextResponse } from "next/server";
import OpenAI from "openai";
import { DEFAULT_OPENAI_MODEL } from "@/lib/ai/prompts";
import {
  buildSummaryDeveloperPrompt,
  buildSummarySystemPrompt,
  SUMMARY_FALLBACK,
} from "@/lib/ai/summaryPrompt";
import { SummaryRequestBody, SummaryResponseBody } from "@/lib/ai/types";

const MAX_CONTEXT_MESSAGES = 20;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<SummaryRequestBody>;
    const note = body.note;
    const messages = body.messages ?? [];

    if (!note?.id || !note.title || !isValidCategory(note.category) || !Array.isArray(messages)) {
      return NextResponse.json(SUMMARY_FALLBACK, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(SUMMARY_FALLBACK, { status: 500 });
    }

    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL;
    const recentMessages = messages
      .filter((message) => isValidMessage(message))
      .slice(-MAX_CONTEXT_MESSAGES);

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: buildSummarySystemPrompt(note.category) },
        { role: "developer", content: buildSummaryDeveloperPrompt(note.title, note.category) },
        ...recentMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
      temperature: 0.5,
      max_tokens: 700,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(SUMMARY_FALLBACK, { status: 500 });
    }

    const summary = normalizeSummary(JSON.parse(content));

    return NextResponse.json(summary);
  } catch {
    return NextResponse.json(SUMMARY_FALLBACK, { status: 500 });
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

function normalizeSummary(value: unknown): SummaryResponseBody {
  const candidate = value as Partial<SummaryResponseBody>;

  return {
    summaryTitle: readString(candidate.summaryTitle, SUMMARY_FALLBACK.summaryTitle),
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
