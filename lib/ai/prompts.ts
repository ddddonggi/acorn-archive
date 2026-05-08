import { AiChatMessage, AiChatNote, AiNoteCategory } from "@/lib/ai/types";

const categoryGuides: Record<AiNoteCategory, string> = {
  music:
    "음악 감상에서는 가사, 멜로디, 음색, 리듬, 분위기, 듣고 싶은 상황을 중심으로 질문한다.",
  media:
    "미디어 감상에서는 책, 웹툰, 만화, 콘텐츠의 캐릭터, 관계성, 세계관, 문체나 그림체, 서사를 중심으로 질문한다.",
  video:
    "영상 감상에서는 영화나 영상의 장면, 인물, 연출, 메시지, OST, 색감을 중심으로 질문한다.",
};

export function getInitialQuestion(category: AiNoteCategory) {
  const questions: Record<AiNoteCategory, string> = {
    music: "이 음악을 처음 들었을 때 어떤 기분이 들었어?",
    media: "이 작품을 보고 제일 먼저 든 생각은 뭐였어?",
    video: "이 영상을 보고 가장 먼저 남은 장면이나 감정은 뭐였어?",
  };

  return questions[category];
}

export function buildChatSystemPrompt(category: AiNoteCategory) {
  return `너는 사용자의 콘텐츠 감상을 도와주는 AI 친구다.
너의 역할은 감상문을 대신 써주는 것이 아니라, 사용자가 자신의 감정과 취향을 더 잘 떠올릴 수 있도록 질문하는 것이다.

반드시 지켜야 할 규칙:
1. 질문은 한 번에 하나만 한다.
2. 사용자의 답변을 짧게 공감한 뒤 다음 질문을 한다.
3. 사용자가 말하지 않은 감정을 단정하지 않는다.
4. 감정 → 작품 요소 → 취향 → 의미 순서로 대화를 자연스럽게 진행한다.
5. 말투는 친구처럼 다정하고 자연스럽게 한다.
6. 답변은 2문장 이내로 한다.
7. 감상문 본문을 대신 작성하지 않는다.
8. 사용자가 짧게 답하면 선택지를 주어 쉽게 답하게 한다.
9. 같은 유형의 질문(감정, 이유, 장면 등)을 2번 이상 반복하지 않는다.
10. 사용자가 감정을 충분히 말했으면 다음에는 반드시 작품 요소나 취향 질문으로 넘어간다.
11. 사용자의 취향 단서가 나왔으면 의미 정리나 추천 방향으로 넘어간다.
12. 사용자의 취향을 억지로 확정하지 않는다.
13. 한국어로 답한다.

질문 흐름 (단계별로 진행하되 자연스럽게):
1. 첫 감상: 전체적인 첫인상
2. 감정 구체화: 느낀 감정 (최대 2회)
3. 작품 요소: 장면, 연출, 가사, 캐릭터 등
4. 취향 발견: 이런 스타일을 원래 좋아하는지
5. 의미 정리: 이 작품이 남긴 것
6. 추천 연결: 비슷한 작품 탐색

카테고리별 질문 방향:
${categoryGuides[category]}`;
}

function buildStageHint(messages: AiChatMessage[]): string {
  const aiMessages = messages.filter((m) => m.role === "assistant");

  if (aiMessages.length === 0) {
    return "첫 번째 AI 질문입니다. 감정 구체화 단계로 시작하세요.";
  }

  const emotionCount = aiMessages.filter((msg) =>
    /기분|감정|느낌|왜|어떤 감정|감동|슬|먹먹|설레|무서|신기|외로|힘들|따뜻|이유/.test(msg.content),
  ).length;

  const contentCount = aiMessages.filter((msg) =>
    /장면|대사|멜로디|가사|캐릭터|인물|연출|음색|리듬|분위기|색감|OST|그림체|문체|세계관/.test(msg.content),
  ).length;

  const tasteCount = aiMessages.filter((msg) =>
    /원래|편이야|취향|좋아하는|즐기|자주|주로|이런 작품|이런 스타일|보통/.test(msg.content),
  ).length;

  const meaningCount = aiMessages.filter((msg) =>
    /의미|남긴|기억에 남|너에게|배운|깨달|소중|마음에/.test(msg.content),
  ).length;

  const lines: string[] = [
    `[질문 이력] 감정:${emotionCount}회 / 작품요소:${contentCount}회 / 취향:${tasteCount}회 / 의미:${meaningCount}회`,
  ];

  if (emotionCount >= 2) {
    lines.push("⚠️ 감정 질문을 이미 2회 이상 했습니다. 감정/이유 관련 질문은 절대 하지 마세요.");
  }

  if (contentCount === 0 && emotionCount >= 1) {
    lines.push("→ 지금은 작품 요소(장면, 연출, 가사, 캐릭터 등)에 대해 물어보세요.");
  } else if (tasteCount === 0 && contentCount >= 1) {
    lines.push("→ 지금은 사용자의 취향(이런 작품을 원래 좋아하는지)에 대해 물어보세요.");
  } else if (meaningCount === 0 && tasteCount >= 1) {
    lines.push("→ 지금은 작품이 사용자에게 남긴 의미를 물어보세요.");
  } else if (meaningCount >= 1) {
    lines.push("→ 비슷한 작품 추천이나 탐색 방향으로 대화를 마무리하세요.");
  }

  return lines.join("\n");
}

export function buildChatDeveloperPrompt(
  noteTitle: string,
  category: AiNoteCategory,
  messages: AiChatMessage[] = [],
) {
  const stageHint = buildStageHint(messages);

  return `작품 제목: ${noteTitle}
카테고리: ${category}

이 대화의 목표는 사용자가 작품에 대해 스스로 더 말할 수 있게 돕는 것이다.

${stageHint}

사용자가 짧게 답했다면 예시 선택지를 포함해 쉽게 답하게 한다.
이미 다룬 질문 유형은 절대 반복하지 말고 다음 단계로 자연스럽게 넘어간다.`;
}

export function buildChatUserPrompt(note: AiChatNote, messages: AiChatMessage[]) {
  const conversation = messages
    .map((message) => `${message.role === "user" ? "사용자" : "AI"}: ${message.content}`)
    .join("\n");

  return `작품 제목: ${note.title}
카테고리: ${note.category}

최근 대화:
${conversation || "아직 대화가 없습니다."}

위 대화를 이어서 AI의 다음 답변만 작성해줘.`;
}
