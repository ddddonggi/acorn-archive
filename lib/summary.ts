import { getCurrentUser } from "@/lib/auth";
import { ChatMessage } from "@/lib/chat";
import { StoredNote } from "@/lib/notes";

export type StoredSummary = {
  id: string;
  noteId: string;
  userId: string;
  title: string;
  body: string;
  keywords: string[];
  emotions: string[];
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
const fallbackEmotions = ["사색"];

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

export function createDraftSummary(note: StoredNote | null, messages: ChatMessage[]) {
  const userMessages = messages.filter((message) => message.role === "user");
  const joinedText = userMessages.map((message) => message.content).join(" ");
  const keywords = extractKeywords(joinedText);
  const emotions = extractEmotions(joinedText);
  const title = note ? `${note.title} 감상문` : "나의 감상문";

  if (userMessages.length === 0) {
    return {
      title,
      body:
        "아직 대화가 충분히 쌓이지 않았어요. AI와 감상에 대해 조금 더 이야기하면 이곳에 감상문이 정리됩니다.",
      keywords,
      emotions,
    };
  }

  const opening = note
    ? `"${note.title}"을 감상한 뒤 가장 먼저 남은 것은 단순한 줄거리보다 내 안에 오래 머문 감각이었다.`
    : "이 감상 뒤에 가장 먼저 남은 것은 단순한 줄거리보다 내 안에 오래 머문 감각이었다.";
  const middle = userMessages
    .slice(0, 3)
    .map((message) => message.content.trim())
    .filter(Boolean)
    .join(" ");
  const closing = `이 기록을 통해 나는 ${keywords[0]}과 ${emotions[0]}의 결을 따라가며, 내가 무엇에 오래 반응하는 사람인지 조금 더 알게 되었다.`;

  return {
    title,
    body: `${opening}\n\n${middle}\n\n${closing}`,
    keywords,
    emotions,
  };
}

export function saveSummary(noteId: string, draft: Omit<StoredSummary, "id" | "noteId" | "userId" | "createdAt" | "updatedAt">) {
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
    .slice(0, 5);

  return keywords.length > 0 ? keywords : fallbackKeywords;
}

function extractEmotions(text: string) {
  const emotions = emotionRules
    .filter((rule) => rule.words.some((word) => text.includes(word)))
    .map((rule) => rule.tag)
    .slice(0, 4);

  return emotions.length > 0 ? emotions : fallbackEmotions;
}
