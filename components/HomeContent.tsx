"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";

const categories = [
  {
    href: "/categories/music",
    title: "음악",
    description: "LP판처럼 오래 맴도는 감상을 남겨요.",
    visual: "LP",
  },
  {
    href: "/categories/media",
    title: "미디어",
    description: "책장 한 칸에 생각의 조각을 꽂아둬요.",
    visual: "BOOK",
  },
  {
    href: "/categories/video",
    title: "영상",
    description: "작은 TV 앞에서 떠오른 마음을 기록해요.",
    visual: "TV",
  },
];

export default function HomeContent() {
  const router = useRouter();

  function handleCategoryClick(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    event.preventDefault();
    router.push(isLoggedIn() ? href : "/login");
  }

  return (
    <main className="page-shell">
      <section className="mx-auto flex max-w-6xl flex-col gap-10 py-10 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-[#697a4c]">
              AI와 함께 여는 감상 기록
            </p>
            <h1 className="max-w-3xl text-4xl font-black leading-tight text-[#3f2a1d] md:text-6xl">
              생각을 대신하지 않고, 생각이 나오도록 곁에 앉는 공간.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6b4b35]">
              음악, 책, 영상을 보고 난 뒤 AI와 친구처럼 대화하고 나만의 감상문으로
              차곡차곡 저장해요.
            </p>
          </div>
          <div className="warm-panel rounded-[28px] p-5">
            <div className="rounded-[22px] bg-[#5b351f] p-5 text-[#fff8eb]">
              <p className="text-sm text-[#ead7b8]">오늘의 창고 메모</p>
              <p className="mt-4 text-2xl font-bold">
                방금 본 것에서 내가 오래 붙잡은 장면은?
              </p>
              <Link
                href="/taste"
                className="mt-6 inline-flex rounded-full bg-[#fff8eb] px-5 py-3 text-sm font-bold text-[#5b351f]"
              >
                내 종합 취향 보기
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              onClick={(event) => handleCategoryClick(event, category.href)}
              className="warm-panel group rounded-[24px] p-6 transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="mb-8 flex h-40 items-center justify-center rounded-[20px] bg-[#ead7b8]">
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#3f2a1d] text-sm font-black text-[#fff8eb] shadow-inner">
                  {category.visual}
                </span>
              </div>
              <h2 className="text-2xl font-black text-[#3f2a1d]">{category.title}</h2>
              <p className="mt-3 leading-7 text-[#6b4b35]">{category.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
