import { getCurrentUser } from "@/lib/auth";
import { ChatMessage } from "@/lib/chat";
import { NoteCategory, updateNoteSummary } from "@/lib/notes";

export type GeneratedSummary = {
  summaryTitle: string;
  oneLineReview: string;
  essay: string;
  emotionTags: string[];
  keywords: string[];
  tasteHint: string;
};

export type SummaryInput = {
  noteTitle: string;
  category: NoteCategory;
  messages: ChatMessage[];
};

export type StoredSummary = GeneratedSummary & {
  id: string;
  noteId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

type LegacySummary = Partial<StoredSummary> & {
  title?: string;
  oneLine?: string;
  body?: string;
  emotions?: string[];
};

const SUMMARY_KEY = "acorn_summaries";

const emotionRules = [
  { tag: "따뜻함", words: ["따뜻", "좋", "편안", "위로", "포근", "고마"] },
  { tag: "먹먹함", words: ["슬", "먹먹", "외로", "그리", "눈물", "아프"] },
  { tag: "설렘", words: ["설레", "기대", "반짝", "두근", "기분"] },
  { tag: "낯섦", words: ["낯", "이상", "불편", "묘", "혼란", "어색"] },
  { tag: "사색", words: ["생각", "질문", "왜", "의미", "기억", "나와"] },
];

const fallbackKeywords = ["감상", "기억", "여운"];
const fallbackEmotions = ["사색", "여운", "호기심"];

function isBrowser() {
  return typeof window !== "undefined";
}

export function getSummaries(): StoredSummary[] {
  if (!isBrowser()) {
    return [];
  }

  const rawSummaries = window.localStorage.getItem(SUMMARY_KEY);

  if (!rawSummaries) {
    return [];
  }

  try {
    return (JSON.parse(rawSummaries) as LegacySummary[]).map(normalizeSummary);
  } catch {
    return [];
  }
}

export function getSummaryByNoteId(noteId: string) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return null;
  }

  return (
    getSummaries().find(
      (summary) => summary.noteId === noteId && summary.userId === currentUser.username,
    ) ?? null
  );
}

export function generateSummaryFromMessages({
  noteTitle,
  category,
  messages,
}: SummaryInput): GeneratedSummary {
  const userMessages = messages.filter((message) => message.role === "user");
  const userTexts = userMessages.map((message) => cleanText(message.content)).filter(Boolean);
  const joinedText = userTexts.join(" ");
  const keywords = extractKeywords(joinedText);
  const emotionTags = extractEmotions(joinedText);
  const mainEmotion = emotionTags[0];
  const firstThought = userTexts[0];
  const rememberedPart = userTexts[1] ?? userTexts[0];
  const meaningPart = userTexts[2] ?? userTexts[userTexts.length - 1];
  const categoryLabel = getCategoryLabel(category);

  if (userTexts.length === 0) {
    return {
      summaryTitle: `${noteTitle} 감상 기록`,
      oneLineReview: "아직 충분한 대화가 없어 첫 감상을 기다리고 있다.",
      essay:
        `${categoryLabel} "${noteTitle}"에 대한 대화가 아직 충분히 쌓이지 않았다.\n\n` +
        "그래서 지금은 작품에 대해 없는 내용을 덧붙이지 않고, 감상을 시작하기 전의 짧은 기록으로 남긴다.\n\n" +
        "다음 대화에서 가장 먼저 든 생각과 기억에 남은 부분이 더해지면 감상문을 자연스럽게 정리할 수 있다.",
      emotionTags,
      keywords,
      tasteHint: "아직 취향을 판단하기에는 감상 데이터가 부족합니다.",
    };
  }

  const essay = limitLength(
    [
      `${categoryLabel} "${noteTitle}"을 감상한 뒤 가장 크게 남은 감정은 ${mainEmotion}이었다. 사용자는 "${firstThought}"라고 말하며 작품이 남긴 첫 인상을 꺼냈다.`,
      rememberedPart
        ? `그 감정이 생긴 이유는 "${rememberedPart}"라는 말 속에 드러난다. 작품의 줄거리보다 사용자가 붙잡은 분위기와 생각이 더 중요하게 남아 있다.`
        : "아직 구체적인 이유가 길게 말해지지는 않았지만, 첫 감정 자체가 이 감상의 중심이 된다.",
      meaningPart
        ? `결국 이 작품은 사용자에게 "${meaningPart}"라는 생각을 남겼다. 이 감상은 작품을 설명하기보다, 사용자가 무엇에 반응하고 어떤 의미를 오래 바라보는지 보여주는 기록이다.`
        : "결국 이 작품은 사용자에게 짧지만 분명한 여운을 남겼다. 아직 많은 말은 없지만, 감정 중심의 감상 기록으로 충분히 의미가 있다.",
    ].join("\n\n"),
    500,
  );

  return {
    summaryTitle: `${noteTitle} 감상문`,
    oneLineReview: `${noteTitle}은 나에게 ${mainEmotion}과 ${keywords[0]}의 여운으로 남았다.`,
    essay,
    emotionTags,
    keywords,
    tasteHint: `사용자는 ${mainEmotion}의 감정과 "${keywords[0]}" 같은 단서에 오래 반응하는 편입니다.`,
  };
}

export function saveSummary(noteId: string, draft: GeneratedSummary) {
  if (!isBrowser()) {
    return null;
  }

  const currentUser = getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const existingSummaries = getSummaries();
  const existingSummary = existingSummaries.find(
    (summary) => summary.noteId === noteId && summary.userId === currentUser.username,
  );
  const now = new Date().toISOString();
  const nextSummary: StoredSummary = {
    ...draft,
    id: existingSummary?.id ?? `summary-${noteId}-${Date.now()}`,
    noteId,
    userId: currentUser.username,
    createdAt: existingSummary?.createdAt ?? now,
    updatedAt: now,
  };

  const updatedNote = updateNoteSummary(noteId, draft);

  if (!updatedNote) {
    return null;
  }

  window.localStorage.setItem(
    SUMMARY_KEY,
    JSON.stringify([
      ...existingSummaries.filter((summary) => summary.id !== nextSummary.id),
      nextSummary,
    ]),
  );
  window.dispatchEvent(new Event("acorn-summary-changed"));

  return nextSummary;
}

function normalizeSummary(summary: LegacySummary): StoredSummary {
  return {
    id: summary.id ?? `summary-${summary.noteId ?? "unknown"}`,
    noteId: summary.noteId ?? "",
    userId: summary.userId ?? "",
    summaryTitle: summary.summaryTitle ?? summary.title ?? "감상문",
    oneLineReview: summary.oneLineReview ?? summary.oneLine ?? "짧은 감상 기록",
    essay: summary.essay ?? summary.body ?? "",
    emotionTags: fillToThree(summary.emotionTags ?? summary.emotions ?? [], fallbackEmotions),
    keywords: fillToThree(summary.keywords ?? [], fallbackKeywords),
    tasteHint: summary.tasteHint ?? "감정과 키워드를 중심으로 감상하는 편입니다.",
    createdAt: summary.createdAt ?? new Date().toISOString(),
    updatedAt: summary.updatedAt ?? new Date().toISOString(),
  };
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function extractKeywords(text: string) {
  const words = text
    .replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2);
  const counts = new Map<string, number>();

  words.forEach((word) => {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  });

  const keywords = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 3);

  return fillToThree(keywords, fallbackKeywords);
}

function extractEmotions(text: string) {
  const emotionTags = emotionRules
    .filter((rule) => rule.words.some((word) => text.includes(word)))
    .map((rule) => rule.tag)
    .slice(0, 3);

  return fillToThree(emotionTags, fallbackEmotions);
}

function fillToThree(values: string[], fallbacks: string[]) {
  const result = [...values.map((value) => value.trim()).filter(Boolean)];

  fallbacks.forEach((fallback) => {
    if (result.length < 3 && !result.includes(fallback)) {
      result.push(fallback);
    }
  });

  return result.slice(0, 3);
}

function limitLength(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function getCategoryLabel(category: NoteCategory) {
  const labels: Record<NoteCategory, string> = {
    music: "음악",
    media: "미디어",
    video: "영상",
  };

  return labels[category];
}
