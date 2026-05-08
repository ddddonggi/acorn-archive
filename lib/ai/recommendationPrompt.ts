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

function toWatchedList(summaries: RecSummaryInput[]): string {
  return summaries
    .map((s) => `- ${s.summaryTitle}${s.artist ? ` (${s.artist})` : ""}`)
    .join("\n");
}

export function buildRecSystemPrompt(category: NoteCategory): string {
  const authorLabel = authorLabels[category];

  return `너는 사용자의 ${catLabels[category]} 취향을 분석해 새 작품을 추천하는 AI다.

역할:
- 사용자의 감상 기록을 바탕으로 아직 감상하지 않은 새 작품 1개를 추천한다.
- 추천 이유는 사용자 취향과 연결된 구체적인 1문장으로 쓴다.

반드시 지켜야 할 규칙:
1. 사용자가 이미 감상한 작품은 절대 추천하지 않는다.
2. 입력으로 제공된 감상 목록의 title 또는 artist가 같은 작품은 추천하지 않는다.
3. 너무 유명한 작품만 반복적으로 추천하지 않는다.
4. 그렇다고 덜 알려진 작품만 추천하지도 않는다.
5. 대중적으로 어느 정도 알려진 작품과 숨은 추천작 사이의 균형을 맞춘다.
6. 사용자의 취향과 가장 잘 맞는다면 유명작도 추천할 수 있다.
7. 사용자의 취향과 잘 맞는다면 비교적 덜 알려진 작품도 추천할 수 있다.
8. 존재하지 않는 작품명, ${authorLabel} 이름을 지어내지 않는다.
9. 추천 이유는 1문장으로 짧고 자연스럽게 작성한다.
10. 한국어로 작성한다.
11. 반드시 JSON만 반환한다.
12. JSON 밖에 설명 문장을 붙이지 않는다.

출력 형식:
{"title":"작품 제목","artist":"${authorLabel} 이름","reason":"추천 이유 한 문장"}`;
}

export function buildRecentRecUserPrompt(
  category: NoteCategory,
  summaries: RecSummaryInput[],
): string {
  return `사용자의 최근 ${catLabels[category]} 감상 기록:
${toContext(summaries)}

이미 감상한 작품 목록이므로 아래 작품은 절대 추천하지 마:
${toWatchedList(summaries)}

추천 기준:
- 최근 감상에서 드러난 분위기, 감정 태그, tasteHint를 우선 반영해.
- 너무 유명한 대표작만 고르지 말고, 적당히 신선한 추천도 고려해.
- 단, 덜 알려진 작품만 억지로 고르지 말고 사용자의 취향 적합도를 가장 중요하게 봐.
- 실제 존재하는 작품 1개만 추천해.

위 최근 취향을 바탕으로 새 작품 1개를 JSON으로 추천해줘.`;
}

export function buildFullRecUserPrompt(
  category: NoteCategory,
  summaries: RecSummaryInput[],
): string {
  return `사용자의 전체 ${catLabels[category]} 감상 데이터:
${toContext(summaries)}

이미 감상한 작품 목록이므로 아래 작품은 절대 추천하지 마:
${toWatchedList(summaries)}

추천 기준:
- 전체 감상에서 반복적으로 나타난 취향, 감정, 분위기를 우선 반영해.
- 너무 유명한 대표작만 고르지 말고, 적당히 신선한 추천도 고려해.
- 단, 덜 알려진 작품만 억지로 고르지 말고 사용자의 장기 취향과의 적합도를 가장 중요하게 봐.
- 실제 존재하는 작품 1개만 추천해.

전반적인 취향을 바탕으로 가장 잘 맞는 새 작품 1개를 JSON으로 추천해줘.`;
}