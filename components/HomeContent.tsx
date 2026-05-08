"use client";

import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";

type TailDir = "down" | "down-left" | "down-right" | "up" | "up-left" | "up-right";

type Card = {
  href: string;
  title: string;
  description: string;
  style: React.CSSProperties;
  tailDir?: TailDir;
};

const cards: Card[] = [
  {
    href: "/video",
    title: "영상",
    description: "작은 TV 앞에서 떠오른 마음을 기록해요.",
    style: { top: "43%", left: "26%" },
    tailDir: "up-right",
  },
  {
    href: "/media",
    title: "미디어",
    description: "책장 한 칸에 생각의 조각을 꽂아둬요.",
    style: { top: "64%", left: "7%" },
    tailDir: "down-right",
  },
  {
    href: "/taste",
    title: "내 취향",
    description: "쌓인 감상으로 취향을 발견해요.",
    style: { top: "27%", left: "52%" },
    tailDir: "up",
  },
  {
    href: "/music",
    title: "음악",
    description: "LP판처럼 오래 맴도는 감상을 남겨요.",
    style: { top: "63%", right: "5%" },
    tailDir: "down-left",
  },
];

function Bubble({
  children,
  style,
  tailDir = "down",
  onClick,
}: {
  children: React.ReactNode;
  style: React.CSSProperties;
  tailDir?: TailDir;
  onClick: () => void;
}) {
  const isUp = tailDir.startsWith("up");
  const tailX =
    tailDir === "down" || tailDir === "up"
      ? "50%"
      : tailDir === "down-left" || tailDir === "up-left"
        ? "30%"
        : "70%";

  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className="absolute cursor-pointer text-left transition duration-200 hover:-translate-y-1 hover:scale-[1.02]"
    >
      {/* 말풍선 본체 */}
      <div className="relative rounded-2xl border border-white/50 bg-white/68 px-5 py-3 shadow-lg backdrop-blur-md">
        {children}
        {/* 말풍선 꼬리 */}
        <span
          className="pointer-events-none absolute"
          style={{
            ...(isUp ? { top: "-12px" } : { bottom: "-12px" }),
            left: tailX,
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "9px solid transparent",
            borderRight: "9px solid transparent",
            ...(isUp
              ? { borderBottom: "12px solid rgba(255,255,255,0.68)" }
              : { borderTop: "12px solid rgba(255,255,255,0.68)" }),
          }}
        />
        {/* 꼬리 테두리 (살짝 안쪽) */}
        <span
          className="pointer-events-none absolute"
          style={{
            ...(isUp ? { top: "-10px" } : { bottom: "-10px" }),
            left: tailX,
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            ...(isUp
              ? { borderBottom: "10px solid rgba(255,255,255,0.68)" }
              : { borderTop: "10px solid rgba(255,255,255,0.68)" }),
          }}
        />
      </div>
    </button>
  );
}

export default function HomeContent() {
  const router = useRouter();

  function go(href: string) {
    router.push(isLoggedIn() ? href : "/login");
  }

  return (
    <>
      {/* 데스크탑 */}
      <div
        className="relative hidden w-full overflow-hidden md:block"
        style={{ aspectRatio: "2752 / 1536", maxHeight: "calc(100vh - 64px)" }}
      >
        <img
          src="/home-bg.png"
          alt="취향 책장"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* 카테고리 말풍선 */}
        {cards.map((card) => (
          <Bubble
            key={card.href}
            style={{ ...card.style, width: "13%" }}
            tailDir={card.tailDir}
            onClick={() => go(card.href)}
          >
            <p className="text-[1.1vw] font-black leading-tight text-[#3f2a1d]">
              {card.title}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[0.8vw] leading-snug text-[#6b4b35]">
              {card.description}
            </p>
          </Bubble>
        ))}

        {/* 오늘의 창고 메모 말풍선 */}
        <Bubble
          style={{ top: "27%", left: "64%", width: "15%" }}
          tailDir="up"
          onClick={() => go("/taste")}
        >
          <p className="flex items-center gap-1 text-[0.75vw] font-semibold text-[#697a4c]">
            <span>★</span> 오늘의 창고 메모
          </p>
          <p className="mt-0.5 line-clamp-2 text-[0.8vw] leading-snug text-[#3f2a1d]">
            잔잔한 여운이 남는 이야기, 오늘은 '리틀 포레스트'를 만나볼까요?
          </p>
        </Bubble>
      </div>

      {/* 모바일 */}
      <main className="page-shell md:hidden">
        <section className="mx-auto flex max-w-lg flex-col gap-4 px-5 py-8">
          <div className="warm-panel rounded-2xl p-4">
            <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-[#697a4c]">
              <span>★</span> 오늘의 창고 메모
            </p>
            <p className="text-sm leading-relaxed text-[#3f2a1d]">
              잔잔한 여운이 남는 이야기, 오늘은 '리틀 포레스트'를 만나볼까요?
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {cards.map((card) => (
              <button
                key={card.href}
                type="button"
                onClick={() => go(card.href)}
                className="warm-panel rounded-2xl p-4 text-left transition hover:-translate-y-0.5"
              >
                <p className="font-black text-[#3f2a1d]">{card.title}</p>
                <p className="mt-1 text-sm leading-snug text-[#6b4b35]">
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
