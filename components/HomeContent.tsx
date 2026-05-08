"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
    style: { top: "39%", left: "31%" },
    tailDir: "up-right",
  },
  {
    href: "/media",
    title: "미디어",
    description: "책장 한 칸에 생각의 조각을 꽂아둬요.",
    style: { top: "62%", left: "32%" },
    tailDir: "down-right",
  },
  {
    href: "/taste",
    title: "내 취향",
    description: "쌓인 감상으로 취향을 발견해요.",
    style: { top: "5%", left: "47%" },
    tailDir: "up",
  },
  {
    href: "/music",
    title: "음악",
    description: "LP판처럼 오래 맴도는 감상을 남겨요.",
    style: { top: "67%", right: "7%" },
    tailDir: "down-left",
  },
];

function Bubble({
  children,
  style,
  tailDir = "down",
  noTail = false,
  onClick,
}: {
  children: React.ReactNode;
  style: React.CSSProperties;
  tailDir?: TailDir;
  noTail?: boolean;
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
        {!noTail && (
          <>
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
          </>
        )}
      </div>
    </button>
  );
}

const CARD_KEYS = cards.map((c) => c.href);
const DEFAULT_WIDTHS: Record<string, number> = Object.fromEntries(
  CARD_KEYS.map((k) => [k, 13])
);
DEFAULT_WIDTHS["memo"] = 22.5;

function SizePanel({
  widths,
  onChange,
  onClose,
}: {
  widths: Record<string, number>;
  onChange: (key: string, val: number) => void;
  onClose: () => void;
}) {
  const labels: Record<string, string> = {
    "/video": "영상",
    "/media": "미디어",
    "/taste": "내 취향",
    "/music": "음악",
    memo: "창고 메모",
  };

  return (
    <div className="absolute bottom-4 right-4 z-50 w-56 rounded-2xl border border-white/50 bg-white/85 p-3 shadow-xl backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#3f2a1d]">버블 너비 조절</span>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] text-[#6b4b35] hover:text-[#3f2a1d]"
        >
          닫기
        </button>
      </div>
      {[...CARD_KEYS, "memo"].map((key) => (
        <div key={key} className="mb-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#6b4b35]">{labels[key]}</span>
            <span className="font-mono text-[10px] text-[#3f2a1d]">{widths[key].toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min={6}
            max={35}
            step={0.5}
            value={widths[key]}
            onChange={(e) => onChange(key, Number(e.target.value))}
            className="mt-0.5 w-full accent-[#697a4c]"
          />
        </div>
      ))}
    </div>
  );
}

export default function HomeContent() {
  const router = useRouter();
  const [widths, setWidths] = useState(DEFAULT_WIDTHS);
  const [showPanel, setShowPanel] = useState(false);

  function go(href: string) {
    router.push(isLoggedIn() ? href : "/login");
  }

  function setWidth(key: string, val: number) {
    setWidths((prev) => ({ ...prev, [key]: val }));
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
            style={{ ...card.style, width: `${widths[card.href]}%` }}
            noTail
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
          style={{ top: "20%", left: "64%", width: `${widths["memo"]}%` }}
          tailDir="down"
          onClick={() => go("/taste")}
        >
          <p className="flex items-center gap-1 text-[0.75vw] font-semibold text-[#697a4c]">
            <span>★</span> 오늘의 창고 메모
          </p>
          <p className="mt-0.5 text-[0.8vw] leading-snug text-[#3f2a1d]" style={{ minHeight: "4.5em" }}>
            잔잔한 여운이 남는 이야기, 오늘은 '리틀 포레스트'를 만나볼까요?
          </p>
        </Bubble>

        {/* 크기 조절 토글 버튼 */}
        {!showPanel && (
          <button
            type="button"
            onClick={() => setShowPanel(true)}
            className="absolute bottom-4 right-4 z-50 rounded-full border border-white/50 bg-white/80 px-3 py-1 text-[11px] font-semibold text-[#3f2a1d] shadow backdrop-blur-sm hover:bg-white"
          >
            크기 조절
          </button>
        )}

        {showPanel && (
          <SizePanel
            widths={widths}
            onChange={setWidth}
            onClose={() => setShowPanel(false)}
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
