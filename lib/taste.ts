import { getCurrentUser } from "@/lib/auth";
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

const recommendationPool: Record<string, TasteRecommendation[]> = {
  "따뜻함": [
    {
      title: "잔잔한 어쿠스틱 플레이리스트",
      reason: "따뜻하고 오래 머무는 감정선을 더 깊게 따라갈 수 있어요.",
      category: "music",
    },
    {
      title: "일상의 작은 회복을 다룬 에세이",
      reason: "위로와 포근함을 자주 기록하는 취향과 잘 맞아요.",
      category: "media",
    },
  ],
  "먹먹함": [
    {
      title: "여운이 긴 독립 영화",
      reason: "말로 다 설명되지 않는 감정을 천천히 바라보는 데 어울려요.",
      category: "video",
    },
    {
      title: "회상과 상실을 다룬 소설",
      reason: "먹먹함을 피하지 않고 곱씹는 감상 방식과 닮아 있어요.",
      category: "media",
    },
  ],
  "설렘": [
    {
      title: "도입부가 산뜻한 시티팝",
      reason: "기대감과 움직임이 있는 감상을 이어가기 좋아요.",
      category: "music",
    },
    {
      title: "가벼운 성장 로맨스 영화",
      reason: "반짝이는 장면에 오래 반응하는 취향과 잘 맞아요.",
      category: "video",
    },
  ],
  "낯섦": [
    {
      title: "구성이 독특한 단편집",
      reason: "낯선 질문을 붙잡고 생각을 확장하기 좋아요.",
      category: "media",
    },
    {
      title: "몽환적인 사운드의 앰비언트 음악",
      reason: "이상하고 묘한 감각을 더 오래 관찰할 수 있어요.",
      category: "music",
    },
  ],
  "사색": [
    {
      title: "철학적인 질문을 던지는 다큐멘터리",
      reason: "감상 뒤에 남는 의미와 질문을 좋아하는 흐름이 보여요.",
      category: "video",
    },
    {
      title: "문장 밀도가 높은 산문집",
      reason: "오래 곱씹는 문장과 생각을 모으는 취향에 어울려요.",
      category: "media",
    },
  ],
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
    reason: "짧지만 대화로 풀어낼 감정이 남는 콘텐츠예요.",
    category: "video",
  },
];

export function generateTasteProfile(): TasteProfile {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return createEmptyProfile();
  }

  const summaries = getSummaries().filter(
    (summary) => summary.userId === currentUser.username,
  );
  const emotionTags = countItems(summaries.flatMap((summary) => summary.emotions));
  const keywords = countItems(summaries.flatMap((summary) => summary.keywords));
  const oneLineSummary = createOneLineSummary(summaries, emotionTags, keywords);
  const recommendations = createRecommendations(emotionTags);

  return {
    summaries,
    emotionTags,
    keywords,
    oneLineSummary,
    recommendations,
  };
}

function createEmptyProfile(): TasteProfile {
  return {
    summaries: [],
    emotionTags: [],
    keywords: [],
    oneLineSummary: "",
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

  const topEmotion = emotions[0]?.label ?? "사색";
  const topKeyword = keywords[0]?.label ?? "기억";

  return `나는 ${topEmotion}의 결을 오래 붙잡고, "${topKeyword}" 같은 단서에서 감상을 깊게 펼치는 편이에요.`;
}

function createRecommendations(emotions: TasteCount[]) {
  const recommendations = emotions
    .flatMap((emotion) => recommendationPool[emotion.label] ?? [])
    .slice(0, 4);

  return recommendations.length > 0 ? recommendations : defaultRecommendations;
}
