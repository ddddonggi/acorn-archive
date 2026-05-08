import type { NoteCategory } from "@/lib/notes";

export type RecSummaryInput = {
  summaryTitle: string;
  artist: string;
  oneLineReview: string;
  tasteHint: string;
  emotionTags: string[];
};

export type RecOutput = {
  title: string;
  artist: string;
  reason: string;
};

const catLabels: Record<NoteCategory, string> = {
  music: "음악",
  media: "미디어",
  video: "영상",
};

const authorLabels: Record<NoteCategory, string> = {
  music: "아티스트",
  media: "작가",
  video: "감독",
};

function toContext(summaries: RecSummaryInput[]): string {
  return summaries
    .map(
      (s) =>
        `- ${s.summaryTitle}${s.artist ? ` (${s.artist})` : ""}: ${s.oneLineReview} / 힌트: ${s.tasteHint} / 태그: ${s.emotionTags.join(", ")}`,
    )
    .join("\n");
}

export function buildRecSystemPrompt(category: NoteCategory): string {
  const authorLabel = authorLabels[category];
  return `너는 사용자의 ${catLabels[category]} 취향을 분석해 새 작품을 추천하는 AI다.
사용자가 아직 보지 않았을 만한 작품 1개를 추천한다.
추천 이유는 사용자 취향과 연결된 구체적인 1문장으로 쓴다.
한국어. 반드시 JSON만 반환한다.
{"title":"작품 제목","artist":"${authorLabel} 이름","reason":"추천 이유 한 문장"}`;
}

export function buildRecentRecUserPrompt(
  category: NoteCategory,
  summaries: RecSummaryInput[],
): string {
  return `사용자의 최근 ${catLabels[category]} 감상 (최대 5개):
${toContext(summaries)}

위 최근 취향을 바탕으로 비슷한 새 작품 1개를 JSON으로 추천해줘.`;
}

export function buildFullRecUserPrompt(
  category: NoteCategory,
  summaries: RecSummaryInput[],
): string {
  return `사용자의 전체 ${catLabels[category]} 감상 데이터:
${toContext(summaries)}

전반적인 취향을 바탕으로 가장 잘 맞는 새 작품 1개를 JSON으로 추천해줘.`;
}
