import { getCurrentUser } from "@/lib/auth";
import { ChatMessage } from "@/lib/chat";
import { NoteCategory } from "@/lib/notes";

export type GeneratedSummary = {
  summaryTitle: string;
  artist: string;
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

export async function getSummaries(): Promise<StoredSummary[]> {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return [];
  }

  const response = await fetch(`/api/summaries?username=${encodeURIComponent(currentUser.username)}`);
  const data = (await response.json()) as { summaries?: StoredSummary[] };

  return data.summaries ?? [];
}

export async function getSummaryByNoteId(noteId: string) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const response = await fetch(
    `/api/summaries?username=${encodeURIComponent(currentUser.username)}&noteId=${encodeURIComponent(noteId)}`,
  );
  const data = (await response.json()) as { summary?: StoredSummary | null };

  return data.summary ?? null;
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
      artist: "",
      oneLineReview: "아직 대화가 충분하지 않아 감상을 더 기다리고 있어요.",
      essay: `${categoryLabel} "${noteTitle}"에 대한 대화가 아직 충분히 쌓이지 않았습니다.\n\n지금은 작품을 보고 처음 떠오른 감정과 생각을 기록하기 전 단계입니다.\n\n조금 더 이야기하면 감상문을 자연스럽게 정리할 수 있습니다.`,
      emotionTags: ["기록", "감상", "시작"],
      keywords: ["작품", "생각", "기록"],
      tasteHint: "조금 더 대화를 나누면 사용자의 취향을 더 잘 발견할 수 있어요.",
    };
  }

  return {
    summaryTitle: `${noteTitle} 감상문`,
    artist: "",
    oneLineReview: `${noteTitle}은 나에게 오래 남은 감상으로 기록되었습니다.`,
    essay: userTexts.slice(0, 3).join("\n\n").slice(0, 500),
    emotionTags: ["감상", "기억", "생각"],
    keywords: ["작품", "장면", "기록"],
    tasteHint: "사용자는 감정과 장면의 여운을 중심으로 감상하는 편입니다.",
  };
}

export async function saveSummary(noteId: string, draft: GeneratedSummary) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const response = await fetch("/api/summaries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: currentUser.username,
      noteId,
      summary: draft,
    }),
  });
  const data = (await response.json()) as { summary?: StoredSummary | null };

  window.dispatchEvent(new Event("acorn-summary-changed"));

  return data.summary ?? null;
}

function getCategoryLabel(category: NoteCategory) {
  const labels: Record<NoteCategory, string> = {
    music: "음악",
    media: "미디어",
    video: "영상",
  };

  return labels[category];
}
