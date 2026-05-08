import { AiChatMessage, AiChatNote, AiNoteCategory, SummaryResponseBody } from "@/lib/ai/types";

const categoryGuides: Record<AiNoteCategory, string> = {
  music:
    "music: 가사, 멜로디, 음색, 분위기, 듣고 싶은 상황, 감정을 중심으로 정리한다.",
  media:
    "media: 책, 웹툰, 만화, 콘텐츠의 캐릭터, 관계성, 세계관, 문체나 그림체, 서사를 중심으로 정리한다.",
  video:
    "video: 영화나 영상의 장면, 인물, 연출, 메시지, OST, 색감을 중심으로 정리한다.",
};

export const SUMMARY_FALLBACK: SummaryResponseBody = {
  summaryTitle: "아직 정리하지 못한 감상",
  artist: "",
  oneLineReview: "조금 더 이야기를 나누면 감상이 더 선명해질 것 같아요.",
  essay:
    "아직 대화 내용이 충분하지 않아 감상문을 자세히 정리하기는 어렵지만, 사용자가 남긴 짧은 감정을 중심으로 기록을 시작할 수 있습니다.",
  emotionTags: ["기록", "감상", "시작"],
  keywords: ["작품", "생각", "기록"],
  tasteHint: "조금 더 대화를 나누면 사용자의 취향을 더 잘 발견할 수 있어요.",
};

export function buildSummarySystemPrompt(category: AiNoteCategory) {
  return `너는 사용자의 콘텐츠 감상 대화를 감상문으로 정리하는 AI다.
너의 역할은 감상문을 새로 창작하는 것이 아니라, 사용자가 대화에서 표현한 감정과 생각을 바탕으로 자연스럽게 정리하는 것이다.

반드시 지켜야 할 규칙:
1. 사용자가 말하지 않은 내용은 지어내지 않는다.
2. 작품 줄거리 요약보다 사용자의 감상, 감정, 해석을 중심으로 작성한다.
3. 사용자의 말투는 정돈하되, 사용자의 고유한 생각은 유지한다.
4. 문장은 따뜻하고 자연스럽게 작성한다.
5. 너무 과장되거나 문학적인 표현은 피한다.
6. 초등학생 독서록처럼 너무 단순하지 않게 작성한다.
7. 본문은 500자 이내로 작성한다.
8. 한국어로 작성한다.
9. 결과는 반드시 JSON 형식으로만 반환한다.

감상문 본문 구성:
- 1문단: 작품을 보고 가장 크게 느낀 감정
- 2문단: 그 감정을 느낀 이유와 기억에 남은 부분
- 3문단: 이 작품이 사용자에게 남긴 의미

카테고리별 정리 방향:
${categoryGuides[category]}

반환 JSON 형식:
{
  "summaryTitle": "감상문 제목",
  "oneLineReview": "한 줄 감상",
  "essay": "감상문 본문",
  "emotionTags": ["감정1", "감정2", "감정3"],
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "tasteHint": "사용자의 취향이나 성향을 한 문장으로 요약"
}`;
}

export function buildSummaryDeveloperPrompt(noteTitle: string, category: AiNoteCategory) {
  return `작품 제목: ${noteTitle}
카테고리: ${category}

대화에서 사용자가 직접 말한 내용만 근거로 삼아라.
대화가 부족하면 없는 내용을 만들지 말고 짧은 감상 기록 형태로 작성하라.
emotionTags와 keywords는 반드시 각각 3개씩 작성하라.`;
}

export function buildSummaryUserPrompt(note: AiChatNote, messages: AiChatMessage[]) {
  const conversation = messages
    .map((message) => `${message.role === "user" ? "사용자" : "AI"}: ${message.content}`)
    .join("\n");

  return `작품 제목: ${note.title}
카테고리: ${note.category}

감상 대화:
${conversation || "아직 대화가 없습니다."}

위 대화를 바탕으로 지정된 JSON 형식의 감상문만 반환해줘.`;
}
