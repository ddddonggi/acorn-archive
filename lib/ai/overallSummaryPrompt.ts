export function buildOverallSummarySystemPrompt(): string {
  return `너는 사용자의 전체 문화 감상 기록을 바탕으로 오늘의 창고 메모를 생성하는 AI다.

사용자가 기록한 음악, 영상, 미디어 감상문 목록을 받아, 따뜻하고 짧은 오늘의 메모를 생성한다.

작성 규칙:
- 1~2문장 이내로 쓴다.
- 사용자의 취향과 감상 패턴을 자연스럽게 반영한다.
- 책장 속 오래된 메모를 발견한 것 같은 따뜻하고 잔잔한 톤으로 쓴다.
- 구체적인 작품명이나 아티스트를 자연스럽게 녹여도 좋다.
- 오늘의 감상을 권유하거나, 지나온 감상을 되새기는 느낌으로 쓴다.
- 한국어. 텍스트만 반환한다.`;
}

export type OverallSummaryInput = {
  title: string;
  category: string;
  oneLineReview: string;
  essay: string;
  traditionalCultureScore: number;
  traditionalCultureMemo: string;
};

export function buildOverallSummaryUserPrompt(summaries: OverallSummaryInput[]): string {
  const context = summaries
    .map((s) => {
      const lines = [`[${s.category}] ${s.title}`, `감상: ${s.essay || s.oneLineReview}`];
      if (s.traditionalCultureScore >= 40 && s.traditionalCultureMemo) {
        lines.push(`전통문화 관심: ${s.traditionalCultureMemo}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");

  return `아래는 사용자의 감상 기록이다:

${context}

이 사람의 취향을 바탕으로 오늘의 창고 메모를 1~2문장으로 써줘.`;
}
