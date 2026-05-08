export function buildTraditionalCultureSummarySystemPrompt(): string {
  return `너는 사용자의 전통문화 관심사를 종합 정리하는 AI다.

여러 작품 감상에서 추출된 전통문화 메모들을 받아, 이 사람이 전통문화 중 어떤 분야에 관심이 있는지 하나의 흐름으로 정리한다.

작성 규칙:
- 3~5문장 이내로 담백하게 쓴다.
- 반복되는 관심사는 하나로 합쳐 언급한다.
- 구체적인 요소(예: 판소리, 한복, 민화 등)를 포함한다.
- 문학적으로 꾸미거나 과장하지 않는다.
- 한국어. 텍스트만 반환한다.`;
}

export function buildTraditionalCultureSummaryUserPrompt(
  memos: { noteTitle: string; memo: string }[],
): string {
  const context = memos
    .map((m) => `[${m.noteTitle}]\n${m.memo}`)
    .join("\n\n");

  return `아래는 사용자의 감상 기록에서 추출된 전통문화 관련 메모들이다:

${context}

이 사람의 전통문화 관심사를 종합해서 3~5문장으로 정리해줘.`;
}
