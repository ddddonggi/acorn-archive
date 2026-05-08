"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { generateTasteProfile, TasteProfile as TasteProfileData } from "@/lib/taste";

const emptyProfile: TasteProfileData = {
  summaries: [],
  emotionTags: [],
  keywords: [],
  oneLineSummary: "",
  recommendations: [],
};

const categoryLabels = {
  music: "음악",
  media: "미디어",
  video: "영상",
};

export default function TasteProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<TasteProfileData>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const recRef = useRef<HTMLDivElement>(null);

  function scrollRec(dir: "prev" | "next") {
    const el = recRef.current;
    if (!el) return;
    const card = el.querySelector("article");
    if (!card) return;
    const step = card.offsetWidth + 16;
    el.scrollBy({ left: dir === "next" ? step : -step, behavior: "smooth" });
  }

  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace("/login");
      return;
    }

    async function refreshProfile() {
      setIsLoading(true);
      setProfile(await generateTasteProfile());
      setIsLoading(false);
    }

    void refreshProfile();
    window.addEventListener("acorn-summary-changed", refreshProfile);

    return () => {
      window.removeEventListener("acorn-summary-changed", refreshProfile);
    };
  }, [router]);

  if (isLoading) {
    return (
      <main className="page-shell flex items-center justify-center">
        <section className="warm-panel w-full max-w-xl rounded-[24px] p-8 text-center md:p-10">
          <h1 className="text-4xl font-black text-[#3f2a1d]">취향 리포트를 불러오는 중이에요</h1>
        </section>
      </main>
    );
  }

  if (profile.summaries.length === 0) {
    return (
      <main className="page-shell flex items-center justify-center">
        <section className="warm-panel w-full max-w-xl rounded-[24px] p-8 text-center md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#697a4c]">
            내 종합 취향
          </p>
          <h1 className="mt-4 text-4xl font-black text-[#3f2a1d]">
            아직 쌓인 도토리가 없어요
          </h1>
          <p className="mt-4 leading-8 text-[#6b4b35]">
            AI와 나눈 대화를 감상문으로 저장하면 나만의 취향 리포트가 차곡차곡 쌓입니다.
          </p>
          <Link
            href="/"
            className="mt-7 inline-flex rounded-2xl bg-[#8a5a2f] px-5 py-3 font-bold text-[#fff8eb]"
          >
            감상 시작하기
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-6xl py-10">
        <div className="warm-panel rounded-[28px] p-7 md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#697a4c]">
            내 종합 취향 리포트
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-black leading-tight text-[#3f2a1d]">
                감상들이 모여 보여주는 나의 결
              </h1>
              <p className="mt-4 max-w-3xl leading-8 text-[#6b4b35]">
                Vercel Postgres에 저장된 감상문을 바탕으로 만든 취향 리포트입니다.
              </p>
            </div>
            <section className="rounded-[22px] bg-[#5b351f] p-6 text-[#fff8eb]">
              <p className="text-sm font-bold text-[#ead7b8]">감상문 도토리</p>
              <p className="mt-4 text-5xl font-black">{profile.summaries.length}</p>
              <p className="mt-3 text-[#ead7b8]">저장된 감상문이 만든 리포트예요.</p>
            </section>
          </div>

          <section className="mt-6 rounded-[22px] bg-[#fff8eb] p-6">
            <p className="text-sm font-bold text-[#697a4c]">나의 감상 성향 한 줄 요약</p>
            <h2 className="mt-4 text-2xl font-black leading-9 text-[#3f2a1d]">
              {profile.oneLineSummary}
            </h2>
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <ReportCard title="내가 많이 남긴 감정 태그">
              <div className="space-y-3">
                {profile.emotionTags.slice(0, 6).map((emotion) => (
                  <Meter key={emotion.label} label={emotion.label} count={emotion.count} max={profile.emotionTags[0].count} />
                ))}
              </div>
            </ReportCard>

            <ReportCard title="자주 등장한 키워드">
              <div className="flex flex-wrap gap-2">
                {profile.keywords.slice(0, 10).map((keyword) => (
                  <span
                    key={keyword.label}
                    className="rounded-full bg-[#ead7b8] px-3 py-2 text-sm font-bold text-[#5b351f]"
                  >
                    {keyword.label} · {keyword.count}
                  </span>
                ))}
              </div>
            </ReportCard>
          </div>

          <section className="mt-5 rounded-[22px] bg-[#fff8eb] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-[#3f2a1d]">추천 콘텐츠</h2>
                <p className="mt-2 text-[#6b4b35]">
                  지금은 저장된 감상 분위기를 바탕으로 한 간단한 추천이에요.
                </p>
              </div>
              <div className="flex shrink-0 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => scrollRec("prev")}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#8a5a2f]/20 bg-[#fbf1dd] text-[#8a5a2f] transition hover:bg-[#ead7b8]"
                  aria-label="이전"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => scrollRec("next")}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#8a5a2f]/20 bg-[#fbf1dd] text-[#8a5a2f] transition hover:bg-[#ead7b8]"
                  aria-label="다음"
                >
                  ›
                </button>
              </div>
            </div>

            <div
              ref={recRef}
              className="mt-5 flex gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {profile.recommendations.map((recommendation) => (
                <article
                  key={recommendation.title}
                  className="min-w-[260px] flex-shrink-0 rounded-[18px] border border-[#8a5a2f]/15 bg-[#fbf1dd] p-5"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#697a4c]">
                    {categoryLabels[recommendation.category]}
                  </p>
                  <h3 className="mt-4 text-xl font-black text-[#3f2a1d]">
                    {recommendation.title}
                  </h3>
                  <p className="mt-3 leading-7 text-[#6b4b35]">{recommendation.reason}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function ReportCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[22px] bg-[#fff8eb] p-6">
      <h2 className="text-xl font-black text-[#3f2a1d]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Meter({ label, count, max }: { label: string; count: number; max: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm font-bold text-[#5b351f]">
        <span>{label}</span>
        <span>{count}회</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#ead7b8]">
        <div
          className="h-full rounded-full bg-[#697a4c]"
          style={{ width: `${Math.max(16, (count / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}
