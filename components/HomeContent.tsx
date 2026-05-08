"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { isLoggedIn, getCurrentUser } from "@/lib/auth";

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
    style: { top: "39%", left: "31%", width: "16.0%" },
    tailDir: "up-right",
  },
  {
    href: "/media",
    title: "미디어",
    description: "책장 한 칸에 생각의 조각을 꽂아둬요.",
    style: { top: "62%", left: "32%", width: "15.0%" },
    tailDir: "down-right",
  },
  {
    href: "/taste",
    title: "내 취향",
    description: "쌓인 감상으로 취향을 발견해요.",
    style: { top: "5%", left: "47%", width: "13.0%" },
    tailDir: "up",
  },
  {
    href: "/music",
    title: "음악",
    description: "LP판처럼 오래 맴도는 감상을 남겨요.",
    style: { top: "67%", right: "7%", width: "15.0%" },
    tailDir: "down-left",
  },
];

const BUBBLE_LABELS: Record<string, string> = {
  "/video": "영상",
  "/media": "미디어",
  "/taste": "내 취향",
  "/music": "음악",
  memo: "창고 메모",
};

function Bubble({
  children,
  style,
  tailDir = "down",
  noTail = false,
  minHeight,
  onClick,
}: {
  children: React.ReactNode;
  style: React.CSSProperties;
  tailDir?: TailDir;
  noTail?: boolean;
  minHeight?: number;
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
      <div
        className="relative rounded-2xl border border-white/50 bg-white/68 px-5 py-3 shadow-lg backdrop-blur-md"
        style={minHeight ? { minHeight: `${minHeight}vh` } : undefined}
      >
        {children}
        {!noTail && (
          <>
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
          </>
        )}
      </div>
    </button>
  );
}

const DEFAULT_HEIGHTS: Record<string, number> = {
  "/video": 0,
  "/media": 0,
  "/taste": 0,
  "/music": 0,
  memo: 0,
};

function HeightSidebar({
  heights,
  onChange,
  onClose,
}: {
  heights: Record<string, number>;
  onChange: (key: string, val: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-0 z-50 flex h-full w-56 flex-col border-l border-white/40 bg-white/95 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-[#e8ddd4] px-4 py-3">
        <span className="text-xs font-bold text-[#3f2a1d]">말풍선 높이 조절</span>
        <button
          type="button"
          onClick={onClose}
          className="text-sm leading-none text-[#6b4b35] hover:text-[#3f2a1d]"
        >
          ✕
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
        {Object.entries(BUBBLE_LABELS).map(([key, label]) => {
          const val = heights[key];
          return (
            <div key={key}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#3f2a1d]">{label}</span>
                <span className="rounded bg-[#f5efe8] px-1.5 py-0.5 font-mono text-[10px] text-[#6b4b35]">
                  {val === 0 ? "auto" : `${val}vh`}
                </span>
              </div>
              {/* 높이 시각 바 */}
              <div className="mb-1.5 flex h-3 w-full overflow-hidden rounded-full bg-[#e8ddd4]">
                <div
                  className="rounded-full bg-[#697a4c] transition-all"
                  style={{ width: val === 0 ? "4px" : `${(val / 20) * 100}%` }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={val}
                onChange={(e) => onChange(key, Number(e.target.value))}
                className="w-full accent-[#697a4c]"
              />
              <div className="mt-0.5 flex justify-between text-[9px] text-[#a08060]">
                <span>auto</span>
                <span>20%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function HomeContent() {
  const router = useRouter();
  const [heights, setHeights] = useState(DEFAULT_HEIGHTS);
  const [showSidebar, setShowSidebar] = useState(false);
  const [overallSummary, setOverallSummary] = useState<string | null>(undefined as unknown as null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setOverallSummary(null);
      return;
    }
    fetch(`/api/overall-summary?username=${encodeURIComponent(user.username)}`)
      .then((r) => r.json())
      .then((data: { summaryText: string | null }) => setOverallSummary(data.summaryText ?? null))
      .catch(() => setOverallSummary(null));
  }, []);

  function go(href: string) {
    router.push(isLoggedIn() ? href : "/login");
  }

  function setHeight(key: string, val: number) {
    setHeights((prev) => ({ ...prev, [key]: val }));
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
            style={card.style}
            noTail
            minHeight={heights[card.href] || undefined}
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
          style={{ bottom: "60%", left: "64%", width: "32.5%" }}
          tailDir="down-left"
          onClick={() => {}}
        >
          <p className="flex items-center gap-1 text-[0.75vw] font-semibold text-[#697a4c]">
            <span>★</span> 오늘의 창고 메모
          </p>
          <p className="mt-0.5 text-[0.8vw] leading-snug text-[#3f2a1d]" style={{ minHeight: "4.5em" }}>
            {overallSummary ?? "아직 AI 요약이 없어요. 감상문을 작성하면 생성됩니다."}
          </p>
        </Bubble>

        {/* 높이 조절 사이드바 토글 탭 */}
        <button
          type="button"
          onClick={() => setShowSidebar((v) => !v)}
          className="absolute right-0 top-1/2 z-50 -translate-y-1/2 rounded-l-lg border border-r-0 border-white/40 bg-white/80 px-1.5 py-3 text-[10px] font-bold text-[#3f2a1d] shadow backdrop-blur-sm hover:bg-white"
          style={{ writingMode: "vertical-rl" }}
        >
          높이 조절
        </button>

        {showSidebar && (
          <HeightSidebar
            heights={heights}
            onChange={setHeight}
            onClose={() => setShowSidebar(false)}
          />
        )}
      </div>

      {/* 모바일 */}
      <main className="page-shell md:hidden">
        <section className="mx-auto flex max-w-lg flex-col gap-4 px-5 py-8">
          <div className="warm-panel rounded-2xl p-4">
            <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-[#697a4c]">
              <span>★</span> 오늘의 창고 메모
            </p>
            <p className="text-sm leading-relaxed text-[#3f2a1d]">
              {overallSummary ?? "아직 AI 요약이 없어요. 감상문을 작성하면 생성됩니다."}
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
