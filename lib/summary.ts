import { getCurrentUser } from "@/lib/auth";
import { ChatMessage } from "@/lib/chat";
import { StoredNote, updateNoteSummary } from "@/lib/notes";

export type GeneratedSummary = {
  title: string;
  oneLine: string;
  body: string;
  keywords: string[];
  emotions: string[];
};

export type StoredSummary = GeneratedSummary & {
  id: string;
  noteId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

const SUMMARY_KEY = "acorn_summaries";

const emotionRules = [
  { tag: "따뜻함", words: ["따뜻", "좋", "편안", "위로", "포근"] },
  { tag: "먹먹함", words: ["슬", "먹먹", "외로", "그리", "눈물"] },
  { tag: "설렘", words: ["설레", "기대", "반짝", "두근"] },
  { tag: "낯섦", words: ["낯", "이상", "불편", "묘", "혼란"] },
  { tag: "사색", words: ["생각", "질문", "왜", "의미", "기억"] },
];

const fallbackKeywords = ["감상", "기억", "장면"];
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
    return JSON.parse(rawSummaries) as StoredSummary[];
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

export function generateSummaryFromMessages(
  note: StoredNote | null,
  messages: ChatMessage[],
): GeneratedSummary {
  const userMessages = messages.filter((message) => message.role === "user");
  const joinedText = userMessages.map((message) => message.content).join(" ");
  const keywords = extractKeywords(joinedText);
  const emotions = extractEmotions(joinedText);
  const noteTitle = note?.title ?? "이 작품";
  const title = `${noteTitle} 감상문`;

  if (userMessages.length === 0) {
    return {
      title,
      oneLine: "아직 대화가 충분히 쌓이지 않아 첫 감상을 기다리고 있어요.",
      body:
        "AI와 작품에 대해 조금 더 이야기하면 이곳에 감상문이 정리됩니다. 가장 먼저 든 생각, 기억에 남은 장면, 지금의 나와 연결되는 부분을 천천히 적어보세요.",
      keywords,
      emotions,
    };
  }

  const firstThought = userMessages[0]?.content.trim();
  const middleThoughts = userMessages
    .slice(1, 4)
    .map((message) => message.content.trim())
    .filter(Boolean)
    .join(" ");
  const oneLine = `${noteTitle}은 나에게 ${keywords[0]}과 ${emotions[0]}의 여운으로 남았다.`;
  const body = [
    `"${noteTitle}"을 감상한 뒤 가장 먼저 남은 생각은 "${firstThought}"였다.`,
    middleThoughts
      ? `대화를 이어가며 ${middleThoughts} 같은 감정과 장면을 다시 바라보게 되었다.`
      : "아직 많은 말을 나누지는 않았지만, 첫 감상 안에 작품을 향한 중요한 단서가 담겨 있었다.",
    `이 감상은 단순히 작품을 설명하는 기록이라기보다, 내가 ${keywords[0]}에 반응하고 ${emotions[0]}의 분위기를 오래 붙잡는 사람이라는 것을 보여준다.`,
  ].join("\n\n");

  return {
    title,
    oneLine,
    body,
    keywords,
    emotions,
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
  const emotions = emotionRules
    .filter((rule) => rule.words.some((word) => text.includes(word)))
    .map((rule) => rule.tag)
    .slice(0, 3);

  return fillToThree(emotions, fallbackEmotions);
}

function fillToThree(values: string[], fallbacks: string[]) {
  const result = [...values];

  fallbacks.forEach((fallback) => {
    if (result.length < 3 && !result.includes(fallback)) {
      result.push(fallback);
    }
  });

  return result.slice(0, 3);
}
