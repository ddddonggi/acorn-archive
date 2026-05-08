"use client";

import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";

const cards = [
  {
    href: "/video",
    title: "영상",
    description: "작은 TV 앞에서\n떠오른 마음을 기록해요.",
    style: { top: "38%", left: "30%" },
  },
  {
    href: "/media",
    title: "미디어",
    description: "책장 한 칸에 생각의\n조각을 꽂아둬요.",
    style: { top: "61%", left: "8%" },
  },
  {
    href: "/taste",
    title: "내 취향",
    description: "쌓인 감상으로\n취향을 발견해요.",
    style: { top: "19%", left: "53%" },
  },
  {
    href: "/music",
    title: "음악",
    description: "LP판처럼 오래 맴도는\n감상을 남겨요.",
    style: { top: "60%", right: "7%" },
  },
];

export default function HomeContent() {
  const router = useRouter();

  function go(href: string) {
    router.push(isLoggedIn() ? href : "/login");
  }

  return (
    <>
      {/* 데스크탑: 일러스트 배경 + 플로팅 카드 */}
      <div
        className="relative hidden w-full overflow-hidden md:block"
        style={{ aspectRatio: "2752 / 1536" }}
      >
        <img
          src="/home-bg.png"
          alt="취향 책장"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* 카테고리 카드 */}
        {cards.map((card) => (
          <button
            key={card.href}
            type="button"
            onClick={() => go(card.href)}
            style={card.style}
            className="absolute w-44 cursor-pointer rounded-2xl bg-white/88 px-5 py-4 text-left shadow-lg backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:bg-white/95 hover:shadow-xl"
          >
            <h2 className="mb-1 text-xl font-black text-[#3f2a1d]">{card.title}</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-[#6b4b35]">
              {card.description}
            </p>
          </button>
        ))}

        {/* 오늘의 창고 메모 */}
        <button
          type="button"
          onClick={() => go("/taste")}
          className="absolute w-52 cursor-pointer rounded-2xl bg-white/88 px-5 py-4 text-left shadow-lg backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:bg-white/95 hover:shadow-xl"
          style={{ top: "19%", left: "65%" }}
        >
          <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-[#697a4c]">
            <span>★</span> 오늘의 창고 메모
          </p>
          <p className="text-sm leading-relaxed text-[#3f2a1d]">
            잔잔한 여운이 남는 이야기,<br />오늘은 '리틀 포레스트'를<br />만나볼까요?
          </p>
        </button>
      </div>

      {/* 모바일: 카드 그리드 */}
      <main className="page-shell md:hidden">
        <section className="mx-auto flex max-w-6xl flex-col gap-6 py-8 px-5">
          <h1 className="text-2xl font-black text-[#3f2a1d]">취향 책장</h1>

          {/* 오늘의 창고 메모 */}
          <button
            type="button"
            onClick={() => go("/taste")}
            className="warm-panel w-full rounded-2xl p-5 text-left transition hover:-translate-y-1"
          >
            <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-[#697a4c]">
              <span>★</span> 오늘의 창고 메모
            </p>
            <p className="text-sm leading-relaxed text-[#3f2a1d]">
              잔잔한 여운이 남는 이야기, 오늘은 '리틀 포레스트'를 만나볼까요?
            </p>
          </button>

          <div className="grid grid-cols-2 gap-4">
            {cards.map((card) => (
              <button
                key={card.href}
                type="button"
                onClick={() => go(card.href)}
                className="warm-panel rounded-2xl p-5 text-left transition hover:-translate-y-1"
              >
                <h2 className="text-lg font-black text-[#3f2a1d]">{card.title}</h2>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-[#6b4b35]">
                  {card.description}
                </p>
              </button>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
