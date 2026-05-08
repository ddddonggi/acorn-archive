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
  return `너는 사용자의 감상 대화를 짧은 감상 기록으로 정리하는 AI다.
목표는 사용자가 직접 쓴 것처럼 자연스럽게 정리하는 것이다. 잘 쓰려고 하지 않는다.

핵심 원칙:
- 사용자가 말하지 않은 내용은 절대 추가하지 않는다.
- 사용자가 짧게 말했으면 결과도 짧게 만든다.
- 사용자의 실제 표현과 말투를 최대한 유지한다.
- assistant 메시지는 참고만 하고, 사용자(user) 메시지를 중심으로 정리한다.

문체 규칙:
- 짧고 담백한 문장을 사용한다.
- "~였다", "~했다", "~것 같다" 정도의 자연스러운 표현을 쓴다.
- 문학적인 표현, 과장된 감정, 억지 교훈은 절대 쓰지 않는다.
- "인간의 고독", "삶의 의미", "깊은 울림" 같은 표현은 금지다.
- 아름답게 만들려고 하지 않는다.
- 일기처럼 담백하게 쓴다.

절대 하지 말 것:
- 사용자가 언급하지 않은 줄거리나 장면 추가
- 사용자가 말하지 않은 감정이나 해석 추가
- 과장되거나 감동적으로 보이려는 표현
- 교훈적이거나 철학적인 마무리

카테고리별 정리 방향:
${categoryGuides[category]}

본문(essay)은 사용자가 말한 내용 안에서만 작성하고, 대화가 짧으면 결과도 짧게 유지한다. 500자를 채우려고 억지로 늘리지 않는다.
한국어로 작성한다. 결과는 반드시 JSON 형식으로만 반환한다.

반환 JSON 형식:
{
  "summaryTitle": "감상 제목 (짧고 담백하게)",
  "oneLineReview": "한 줄 감상 (사용자 말투로)",
  "essay": "감상 기록 본문",
  "emotionTags": ["감정1", "감정2", "감정3"],
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "tasteHint": "사용자의 취향을 한 문장으로 (과장 없이)"
}`;
}

export function buildSummaryDeveloperPrompt(noteTitle: string, category: AiNoteCategory) {
  return `작품 제목: ${noteTitle}
카테고리: ${category}

사용자(user) 메시지에 있는 내용만 근거로 삼아라. assistant 메시지는 참고용이다.
대화가 짧으면 결과도 짧게 유지하고 없는 내용을 채우지 마라.
emotionTags와 keywords는 반드시 각각 3개씩 작성하라.
잘 쓴 글이 아니라 사용자가 직접 정리한 것처럼 만들어라.`;
}

export function buildSummaryUserPrompt(note: AiChatNote, messages: AiChatMessage[]) {
  const userMessages = messages.filter((m) => m.role === "user");
  const conversation = messages
    .map((message) => `${message.role === "user" ? "[사용자]" : "[AI]"}: ${message.content}`)
    .join("\n");

  const userOnly = userMessages.map((m) => `- ${m.content}`).join("\n");

  return `작품 제목: ${note.title}
카테고리: ${note.category}

사용자가 직접 말한 내용 (이것을 중심으로 정리):
${userOnly || "없음"}

전체 대화 (참고용):
${conversation || "아직 대화가 없습니다."}

위 내용을 바탕으로, 사용자가 직접 정리한 것처럼 지정된 JSON 형식으로만 반환해줘. 사용자가 말하지 않은 내용은 추가하지 마.`;
}
