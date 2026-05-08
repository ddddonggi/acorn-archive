import type { NoteCategory } from "@/lib/notes";
import type { RecSummaryInput } from "@/lib/ai/recommendationPrompt";

const catLabels: Record<NoteCategory, string> = {
  music: "음악",
  media: "미디어",
  video: "영상",
};

export function buildCategoryTasteSystemPrompt(category: NoteCategory): string {
  return `너는 사용자의 ${catLabels[category]} 취향을 분석하는 AI다.
감상 기록을 보고 이 사람이 ${catLabels[category]}에서 어떤 것을 좋아하는지 2문장 이내로 담백하게 설명한다.
구체적인 장르/분위기/특징(예: J-POP, 스릴러, 잔잔함)을 포함해 쓴다.
과장하거나 문학적으로 꾸미지 않는다. 한국어. 텍스트만 반환한다.`;
}

export function buildCategoryTasteUserPrompt(
  category: NoteCategory,
  summaries: RecSummaryInput[],
): string {
  const context = summaries
    .map(
      (s) =>
        `- ${s.summaryTitle}${s.artist ? ` (${s.artist})` : ""}: ${s.oneLineReview} / 힌트: ${s.tasteHint} / 태그: ${s.emotionTags.join(", ")}`,
    )
    .join("\n");

  return `${catLabels[category]} 감상 데이터:
${context}

이 사람의 ${catLabels[category]} 취향을 2문장 이내로 설명해줘.`;
}
