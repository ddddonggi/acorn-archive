"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import {
  generateTasteProfile,
  TasteProfile as TasteProfileData,
  CategoryStats,
} from "@/lib/taste";
import type { NoteCategory } from "@/lib/notes";

type AiRec = {
  category: NoteCategory;
  title: string;
  artist: string;
  reason: string;
};

const categoryLabels: Record<NoteCategory, string> = {
  music: "음악",
  media: "미디어",
  video: "영상",
};

const categoryColors: Record<NoteCategory, string> = {
  music: "#697a4c",
  media: "#8a5a2f",
  video: "#b5705a",
};

const emptyProfile: TasteProfileData = {
  summaries: [],
  emotionTags: [],
  keywords: [],
  oneLineSummary: "",
  categoryStats: [],
  recommendations: [],
};

export default function TasteProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<TasteProfileData>(emptyProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [showRec, setShowRec] = useState(false);
  const [recentRecs, setRecentRecs] = useState<AiRec[]>([]);
  const [fullRecs, setFullRecs] = useState<AiRec[]>([]);
  const [isLoadingRecentRecs, setIsLoadingRecentRecs] = useState(false);
  const [recentRecsLoaded, setRecentRecsLoaded] = useState(false);
  const [categoryTasteTexts, setCategoryTasteTexts] = useState<Partial<Record<NoteCategory, string>>>({});

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

    async function refreshAll() {
      await refreshProfile();
      void loadCategoryTastes();
    }

    void refreshAll();
    window.addEventListener("acorn-summary-changed", refreshAll);
    return () => {
      window.removeEventListener("acorn-summary-changed", refreshAll);
    };
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadCategoryTastes() {
    const user = getCurrentUser();
    if (!user) return;
    try {
      const resp = await fetch(
        `/api/category-tastes?username=${encodeURIComponent(user.username)}`,
      );
      const data = (await resp.json()) as { tastes?: { category: NoteCategory; tasteText: string }[] };
      const map: Partial<Record<NoteCategory, string>> = {};
      for (const item of data.tastes ?? []) {
        map[item.category] = item.tasteText;
      }
      setCategoryTasteTexts(map);
    } catch {
      // leave existing state
    }
  }

  useEffect(() => {
    if (!showRec) return;
    void loadFullRecs();
    if (!recentRecsLoaded) void loadRecentRecs();
  }, [showRec]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadRecentRecs() {
    const user = getCurrentUser();
    if (!user) return;
    setIsLoadingRecentRecs(true);
    try {
      const resp = await fetch(
        `/api/recommendations?username=${encodeURIComponent(user.username)}&type=recent`,
      );
      const data = (await resp.json()) as { recommendations?: AiRec[] };
      setRecentRecs(data.recommendations ?? []);
      setRecentRecsLoaded(true);
    } catch {
      setRecentRecs([]);
    } finally {
      setIsLoadingRecentRecs(false);
    }
  }

  async function loadFullRecs() {
    const user = getCurrentUser();
    if (!user) return;
    try {
      const resp = await fetch(
        `/api/recommendations?username=${encodeURIComponent(user.username)}&type=full`,
      );
      const data = (await resp.json()) as { recommendations?: AiRec[] };
      setFullRecs(data.recommendations ?? []);
    } catch {
      setFullRecs([]);
    }
  }

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

  if (showRec) {
    return (
      <main className="page-shell flex flex-col">
        <section className="mx-auto w-full max-w-6xl flex-1 flex flex-col py-6">
          <div className="warm-panel flex flex-1 flex-col rounded-[28px] p-7 md:p-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowRec(false)}
                  aria-label="취향 리포트로 돌아가기"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#8a5a2f]/20 bg-[#fbf1dd] text-xl text-[#8a5a2f] hover:bg-[#ead7b8]"
                >
                  ‹
                </button>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#697a4c]">
                  나를 위한 추천
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRecentRecsLoaded(false);
                  void loadRecentRecs();
                }}
                disabled={isLoadingRecentRecs}
                aria-label="최근 감상 기반 추천 새로고침"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#8a5a2f]/20 bg-[#fbf1dd] text-[#8a5a2f] hover:bg-[#ead7b8] disabled:opacity-40"
              >
                <span
                  style={{ display: "inline-block" }}
                  className={isLoadingRecentRecs ? "animate-spin" : ""}
                >
                  ↻
                </span>
              </button>
            </div>

            <h2 className="mt-4 text-3xl font-black text-[#3f2a1d]">추천 콘텐츠</h2>

            {/* 최근 감상 기반 */}
            <section className="mt-6">
              <h3 className="mb-4 text-sm font-bold text-[#697a4c]">최근 감상 기반</h3>
              {isLoadingRecentRecs ? (
                <div className="flex h-32 items-center justify-center rounded-[18px] bg-[#fff8eb]">
                  <p className="text-sm text-[#6b4b35]">AI가 최근 감상을 분석하는 중이에요…</p>
                </div>
              ) : recentRecs.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-[18px] bg-[#fff8eb]">
                  <p className="text-sm text-[#6b4b35]">감상을 더 쌓으면 추천이 나타나요.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recentRecs.map((rec) => (
                    <RecCard key={`recent-${rec.category}`} rec={rec} />
                  ))}
                </div>
              )}
            </section>

            {/* 전체 감상 기반 */}
            <section className="mt-8">
              <h3 className="mb-4 text-sm font-bold text-[#697a4c]">전체 감상 기반</h3>
              {fullRecs.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-[18px] bg-[#fff8eb]">
                  <p className="text-sm text-[#6b4b35]">
                    새 감상을 저장하면 전체 데이터 기반 추천이 자동으로 생성돼요.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {fullRecs.map((rec) => (
                    <RecCard key={`full-${rec.category}`} rec={rec} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    );
  }

  const maxCategoryCount = Math.max(1, ...profile.categoryStats.map((cs) => cs.count));

  return (
    <main className="page-shell flex flex-col">
      <section className="mx-auto w-full max-w-6xl flex-1 flex flex-col py-6">
        <div className="warm-panel relative flex flex-1 flex-col rounded-[28px] p-7 md:p-10">
          <p className="text-2xl font-bold text-[#5b351f]">
            내 종합 취향 리포트
          </p>

          {/* 카테고리별 감상 수 + 총 개수 뱃지 */}
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div className="space-y-4 self-center">
              {profile.categoryStats.map((cs) => (
                <CategoryBar key={cs.category} stats={cs} max={maxCategoryCount} />
              ))}
            </div>
            <div className="flex flex-col items-start justify-center rounded-[22px] bg-[#5b351f] px-8 py-6 text-[#fff8eb]">
              <p className="text-xs font-bold text-[#ead7b8]">작성한 감상문</p>
              <p className="mt-2 text-5xl font-black">{profile.summaries.length}</p>
              <p className="mt-1 text-sm text-[#ead7b8]">지금까지 작성한 감상문의 개수예요</p>
            </div>
          </div>

          {/* 나의 문화 감상 성향 */}
          <section className="mt-5">
            <p className="mb-3 text-base font-bold text-[#5b351f]">나의 문화 감상 성향</p>
            <p className="text-lg leading-8 text-[#3f2a1d]">{profile.oneLineSummary}</p>
          </section>

          {/* 카테고리별 취향 */}
          <section className="mt-5">
            <p className="mb-4 text-base font-bold text-[#5b351f]">카테고리별 취향</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {profile.categoryStats.map((cs) => (
                <CategoryTasteBox
                  key={cs.category}
                  stats={cs}
                  tasteText={categoryTasteTexts[cs.category]}
                />
              ))}
            </div>
          </section>

          {/* 추천 콘텐츠 보기 버튼 */}
          <button
            type="button"
            onClick={() => setShowRec(true)}
            aria-label="추천 콘텐츠 보기"
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full border border-[#8a5a2f]/20 bg-[#fbf1dd] text-2xl text-[#8a5a2f] hover:bg-[#ead7b8]"
          >
            ›
          </button>
        </div>
      </section>
    </main>
  );
}

function CategoryBar({ stats, max }: { stats: CategoryStats; max: number }) {
  const pct = stats.count === 0 ? 0 : Math.max(8, (stats.count / max) * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-[#5b351f]">
          {categoryLabels[stats.category]}
        </span>
        <span className="text-sm font-bold text-[#5b351f]">
          {stats.count}권
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[#ead7b8]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: "#697a4c" }}
        />
      </div>
    </div>
  );
}

function CategoryTasteBox({
  stats,
  tasteText,
}: {
  stats: CategoryStats;
  tasteText?: string;
}) {
  return (
    <div className="rounded-[18px] bg-[#f5e8d3] p-5">
      <p className="text-sm font-black text-[#697a4c]">
        {categoryLabels[stats.category]}
      </p>
      {stats.count === 0 ? (
        <p className="mt-3 text-xs text-[#b5a090]">아직 감상이 없어요</p>
      ) : tasteText ? (
        <p className="mt-3 text-sm leading-6 text-[#3f2a1d]">{tasteText}</p>
      ) : (
        <p className="mt-3 text-xs text-[#b5a090]">분석 중이에요…</p>
      )}
    </div>
  );
}

function RecCard({ rec }: { rec: AiRec }) {
  return (
    <article className="rounded-[18px] border border-[#8a5a2f]/15 bg-[#fbf1dd] p-5">
      <p
        className="text-xs font-bold uppercase tracking-[0.14em]"
        style={{ color: categoryColors[rec.category] }}
      >
        {categoryLabels[rec.category]}
      </p>
      <p className="mt-3 text-base font-black leading-snug text-[#3f2a1d]">
        {rec.title}
      </p>
      {rec.artist && (
        <p className="mt-1 text-sm font-bold text-[#8a5a2f]">{rec.artist}</p>
      )}
      <p className="mt-3 text-sm leading-6 text-[#6b4b35]">{rec.reason}</p>
    </article>
  );
}
