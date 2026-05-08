import { NoteCategory } from "@/lib/notes";
import { getSummaries, StoredSummary } from "@/lib/summary";

export type TasteCount = {
  label: string;
  count: number;
};

export type TasteRecommendation = {
  title: string;
  reason: string;
  category: NoteCategory;
};

export type TasteProfile = {
  summaries: StoredSummary[];
  emotionTags: TasteCount[];
  keywords: TasteCount[];
  oneLineSummary: string;
  recommendations: TasteRecommendation[];
};

const defaultRecommendations: TasteRecommendation[] = [
  {
    title: "감정을 천천히 기록할 수 있는 에세이",
    reason: "아직 취향 데이터가 적을 때 부담 없이 시작하기 좋아요.",
    category: "media",
  },
  {
    title: "밤에 듣기 좋은 잔잔한 플레이리스트",
    reason: "첫 감상 노트를 남기기 좋은 부드러운 분위기예요.",
    category: "music",
  },
  {
    title: "여운이 선명한 단편 영화",
    reason: "짧지만 대화로 꺼낼 감정이 남는 콘텐츠예요.",
    category: "video",
  },
];

export async function generateTasteProfile(): Promise<TasteProfile> {
  const summaries = await getSummaries();
  const emotionTags = countItems(summaries.flatMap((summary) => summary.emotionTags));
  const keywords = countItems(summaries.flatMap((summary) => summary.keywords));
  const oneLineSummary = createOneLineSummary(summaries, emotionTags, keywords);

  return {
    summaries,
    emotionTags,
    keywords,
    oneLineSummary,
    recommendations: defaultRecommendations,
  };
}

function countItems(items: string[]): TasteCount[] {
  const counts = new Map<string, number>();

  items
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      counts.set(item, (counts.get(item) ?? 0) + 1);
    });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }));
}

function createOneLineSummary(
  summaries: StoredSummary[],
  emotions: TasteCount[],
  keywords: TasteCount[],
) {
  if (summaries.length === 0) {
    return "";
  }

  const latestTasteHint = summaries
    .slice()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.tasteHint;

  if (latestTasteHint) {
    return latestTasteHint;
  }

  const topEmotion = emotions[0]?.label ?? "감상";
  const topKeyword = keywords[0]?.label ?? "기억";

  return `나는 ${topEmotion}의 결을 오래 붙잡고, "${topKeyword}" 같은 단서에서 감상을 깊게 이어가는 편이에요.`;
}
