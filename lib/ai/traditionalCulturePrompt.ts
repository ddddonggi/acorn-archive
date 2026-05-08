export function buildTraditionalCultureSystemPrompt(): string {
  return `너는 대화에서 전통문화 관련 내용을 추출하는 AI다.

전통문화의 범위: 국악, 판소리, 민요, 전통무용, 한복, 한옥, 도자기, 한지, 민화, 제례, 세시풍속, 전통 놀이, 사극/역사 콘텐츠의 전통 요소 등.

판단 기준:
- 사용자가 스스로 전통문화에 관심을 보이거나, AI가 그 흐름을 유도했을 때 사용자가 호응한 경우에만 기록한다.
- 단순히 제목이나 배경에 전통 요소가 있다는 이유만으로는 기록하지 않는다.
- 사용자의 반응이 한 마디 이하인 경우 기록하지 않는다.

출력 규칙:
- 전통문화 관련 내용이 충분하다면: 구체적으로 어떤 전통 요소에 반응했는지 2~4문장으로 담백하게 기록한다.
- 내용이 없거나 미미하다면: 빈 문자열("")만 반환한다.
- 한국어. 텍스트만 반환한다. JSON 금지.`;
}

export function buildTraditionalCultureUserPrompt(
  noteTitle: string,
  messages: { role: "user" | "assistant"; content: string }[],
): string {
  const conversation = messages
    .map((m) => `[${m.role === "user" ? "사용자" : "AI"}]: ${m.content}`)
    .join("\n");

  return `작품 제목: ${noteTitle}

전체 대화:
${conversation || "대화 없음"}

이 대화에서 전통문화 관련 내용을 추출해줘. 없으면 빈 문자열만 반환해.`;
}
