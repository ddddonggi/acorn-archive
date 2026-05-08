import Link from "next/link";
import { notFound } from "next/navigation";

const categoryMap = {
  music: {
    label: "음악",
    prompt: "어떤 음악을 들었나요?",
    mood: "LP판 위에 마음을 올려두는 곳",
  },
  media: {
    label: "미디어",
    prompt: "어떤 책이나 콘텐츠를 봤나요?",
    mood: "책장 사이에 감상을 끼워두는 곳",
  },
  video: {
    label: "영상",
    prompt: "어떤 영화나 영상을 봤나요?",
    mood: "작은 화면에서 오래 남은 장면을 꺼내는 곳",
  },
} as const;

type CategoryKey = keyof typeof categoryMap;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categoryKey } = await params;
  const category = categoryMap[categoryKey as CategoryKey];

  if (!category) {
    notFound();
  }

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-6xl py-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#697a4c]">
              {category.label} 창고
            </p>
            <h1 className="mt-3 text-4xl font-black text-[#3f2a1d]">{category.mood}</h1>
            <p className="mt-4 text-[#6b4b35]">{category.prompt}</p>
          </div>
          <Link
            href="/notes/new"
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#8a5a2f] text-3xl font-light text-[#fff8eb] shadow-lg"
            aria-label="새 감상 노트 만들기"
          >
            +
          </Link>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {["첫 번째 감상 노트", "두 번째 감상 노트", "세 번째 감상 노트"].map((title, index) => (
            <Link
              key={title}
              href={`/notes/demo-${index + 1}`}
              className="warm-panel min-h-48 rounded-[22px] p-6 transition hover:-translate-y-1"
            >
              <p className="text-sm font-bold text-[#697a4c]">NOTE {index + 1}</p>
              <h2 className="mt-5 text-2xl font-black text-[#3f2a1d]">{title}</h2>
              <p className="mt-4 leading-7 text-[#6b4b35]">AI와 대화하며 감상을 천천히 꺼내는 자리</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
