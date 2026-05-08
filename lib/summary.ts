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
const fallbackKeywords = ["작품", "생각", "기록"];
const fallbackEmotions = ["기록", "감상", "시작"];

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
  const userTexts = messages
    .filter((message) => message.role === "user")
    .map((message) => message.content.trim())
    .filter(Boolean);
  const categoryLabel = getCategoryLabel(category);

  if (userTexts.length === 0) {
    return {
      summaryTitle: `${noteTitle} 감상 기록`,
      oneLineReview: "아직 대화가 충분하지 않아 감상을 더 기다리고 있어요.",
      essay: `${categoryLabel} "${noteTitle}"에 대한 대화가 아직 충분히 쌓이지 않았습니다.\n\n지금은 작품을 보고 처음 떠오른 감정과 생각을 기록하기 전 단계입니다.\n\n조금 더 이야기하면 감상문을 자연스럽게 정리할 수 있습니다.`,
      emotionTags: fallbackEmotions,
      keywords: fallbackKeywords,
      tasteHint: "조금 더 대화를 나누면 사용자의 취향을 더 잘 발견할 수 있어요.",
    };
  }

  const joinedText = userTexts.join(" ");
  const keywords = fillToThree(extractKeywords(joinedText), fallbackKeywords);
  const emotionTags = fillToThree(extractEmotions(joinedText), fallbackEmotions);
  const essay = [
    `${categoryLabel} "${noteTitle}"을 보고 가장 먼저 남은 감상은 "${userTexts[0]}"였습니다.`,
    userTexts[1]
      ? `그 감정은 "${userTexts[1]}"라는 말에서 더 구체적으로 드러납니다. 작품의 줄거리보다 사용자가 어떤 부분에 반응했는지가 중심이 되는 기록입니다.`
      : "아직 이유가 길게 말해지지는 않았지만, 첫 감정 자체가 이 감상의 중심이 됩니다.",
    userTexts[2]
      ? `이 작품은 사용자에게 "${userTexts[2]}"라는 생각을 남겼습니다. 그래서 이 기록은 작품 설명보다 사용자의 마음이 어디에 머물렀는지를 보여줍니다.`
      : "아직 작품이 남긴 의미는 더 이야기해볼 수 있지만, 지금의 짧은 감정만으로도 감상 기록을 시작할 수 있습니다.",
  ].join("\n\n");

  return {
    summaryTitle: `${noteTitle} 감상문`,
    oneLineReview: `${noteTitle}은 나에게 ${keywords[0]}의 감상으로 남았습니다.`,
    essay: essay.slice(0, 500),
    emotionTags,
    keywords,
    tasteHint: `사용자는 ${emotionTags[0]} 같은 감정과 ${keywords[0]} 같은 단서에 오래 반응하는 편입니다.`,
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

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 3);
}

function extractEmotions(text: string) {
  const rules = [
    { tag: "먹먹함", words: ["먹먹", "슬픔", "슬펐", "아픔", "그리움"] },
    { tag: "따뜻함", words: ["따뜻", "편안", "위로", "좋았", "고마"] },
    { tag: "설렘", words: ["설렘", "기대", "반짝", "두근"] },
    { tag: "사색", words: ["생각", "질문", "의미", "기억", "나"] },
  ];

  return rules
    .filter((rule) => rule.words.some((word) => text.includes(word)))
    .map((rule) => rule.tag)
    .slice(0, 3);
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

function getCategoryLabel(category: NoteCategory) {
  const labels: Record<NoteCategory, string> = {
    music: "음악",
    media: "미디어",
    video: "영상",
  };

  return labels[category];
}
