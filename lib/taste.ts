import { NoteCategory } from "@/lib/notes";
import { getSummaries, StoredSummary } from "@/lib/summary";

export type TasteCount = {
  label: string;
  count: number;
};

export type CategoryStats = {
  category: NoteCategory;
  count: number;
  topEmotionTags: string[];
  topKeywords: string[];
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
  categoryStats: CategoryStats[];
  recommendations: TasteRecommendation[];
};

export async function generateTasteProfile(): Promise<TasteProfile> {
  const summaries = await getSummaries();
  const emotionTags = countItems(summaries.flatMap((summary) => summary.emotionTags));
  const keywords = countItems(summaries.flatMap((summary) => summary.keywords));
  const oneLineSummary = createOneLineSummary(summaries, emotionTags, keywords);
  const categoryStats = buildCategoryStats(summaries);

  return {
    summaries,
    emotionTags,
    keywords,
    oneLineSummary,
    categoryStats,
    recommendations: [],
  };
}

function getCategoryFromNoteId(noteId: string): NoteCategory | null {
  if (noteId.startsWith("music-")) return "music";
  if (noteId.startsWith("media-")) return "media";
  if (noteId.startsWith("video-")) return "video";
  return null;
}

function buildCategoryStats(summaries: StoredSummary[]): CategoryStats[] {
  const cats: NoteCategory[] = ["music", "media", "video"];
  return cats.map((cat) => {
    const catSummaries = summaries.filter((s) => getCategoryFromNoteId(s.noteId) === cat);
    const tags = countItems(catSummaries.flatMap((s) => s.emotionTags));
    const kws = countItems(catSummaries.flatMap((s) => s.keywords));
    return {
      category: cat,
      count: catSummaries.length,
      topEmotionTags: tags.slice(0, 5).map((t) => t.label),
      topKeywords: kws.slice(0, 3).map((k) => k.label),
    };
  });
}

export function countItems(items: string[]): TasteCount[] {
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
