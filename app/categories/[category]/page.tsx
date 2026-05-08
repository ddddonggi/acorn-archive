import { notFound } from "next/navigation";
import CategoryNotes from "@/components/CategoryNotes";
import { NoteCategory } from "@/lib/notes";

const categoryMap = {
  music: {
    label: "음악",
    prompt: "어떤 음악을 들었나요?",
    mood: "LP판 위에 마음을 올려두는 곳",
    placeholder: "어떤 음악을 들었나요?",
  },
  media: {
    label: "미디어",
    prompt: "어떤 책이나 콘텐츠를 봤나요?",
    mood: "책장 사이에 감상을 끼워두는 곳",
    placeholder: "어떤 책이나 콘텐츠를 봤나요?",
  },
  video: {
    label: "영상",
    prompt: "어떤 영화나 영상을 봤나요?",
    mood: "작은 화면에서 오래 남은 장면을 꺼내는 곳",
    placeholder: "어떤 영화나 영상을 봤나요?",
  },
} as const;

type CategoryKey = keyof typeof categoryMap;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categoryParam } = await params;
  const categoryKey = categoryParam as CategoryKey;
  const category = categoryMap[categoryKey];

  if (!category) {
    notFound();
  }

  return <CategoryNotes categoryKey={categoryKey as NoteCategory} category={category} />;
}
