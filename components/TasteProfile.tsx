"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { buildTasteProfile, TasteProfile as TasteProfileData } from "@/lib/taste";

const emptyProfile: TasteProfileData = {
  summaries: [],
  frequentEmotions: [],
  favoriteMood: "",
  keywords: [],
  recommendations: [],
};

export default function TasteProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<TasteProfileData>(emptyProfile);

  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace("/login");
      return;
    }

    const refreshProfile = () => setProfile(buildTasteProfile());

    refreshProfile();
    window.addEventListener("storage", refreshProfile);
    window.addEventListener("acorn-summary-changed", refreshProfile);

    return () => {
      window.removeEventListener("storage", refreshProfile);
      window.removeEventListener("acorn-summary-changed", refreshProfile);
    };
  }, [router]);

  const hasSummaries = profile.summaries.length > 0;

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-6xl py-10">
        <div className="warm-panel rounded-[24px] p-7 md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#697a4c]">
            내 종합 취향
          </p>
          <h1 className="mt-3 text-4xl font-black text-[#3f2a1d]">
            감상들이 모여 보여주는 나의 결
          </h1>
          <p className="mt-4 max-w-3xl leading-8 text-[#6b4b35]">
            저장된 감상문을 바탕으로 자주 등장한 감정, 선호하는 분위기, 다음에 만나볼 만한 콘텐츠를 정리했어요.
          </p>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-[22px] bg-[#fff8eb] p-6">
              <p className="text-sm font-bold text-[#697a4c]">선호 분위기</p>
              <h2 className="mt-4 text-2xl font-black leading-9 text-[#3f2a1d]">
                {profile.favoriteMood}
              </h2>
            </section>

            <section className="rounded-[22px] bg-[#5b351f] p-6 text-[#fff8eb]">
              <p className="text-sm font-bold text-[#ead7b8]">저장된 감상문</p>
              <p className="mt-4 text-5xl font-black">{profile.summaries.length}</p>
              <p className="mt-3 text-[#ead7b8]">
                감상문을 저장할수록 취향이 더 선명해져요.
              </p>
            </section>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <section className="rounded-[22px] bg-[#fff8eb] p-6">
              <h2 className="text-xl font-black text-[#3f2a1d]">자주 등장한 감정</h2>
              {profile.frequentEmotions.length > 0 ? (
                <div className="mt-5 space-y-3">
                  {profile.frequentEmotions.slice(0, 6).map((emotion) => (
                    <div key={emotion.label}>
                      <div className="flex items-center justify-between text-sm font-bold text-[#5b351f]">
                        <span>{emotion.label}</span>
                        <span>{emotion.count}회</span>
                      </div>
                      <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#ead7b8]">
                        <div
                          className="h-full rounded-full bg-[#697a4c]"
                          style={{
                            width: `${Math.max(
                              16,
                              (emotion.count / profile.frequentEmotions[0].count) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 leading-7 text-[#6b4b35]">
                  아직 감정 태그가 없어요. 감상문을 저장하면 이곳에 자주 남긴 감정이 표시됩니다.
                </p>
              )}
            </section>

            <section className="rounded-[22px] bg-[#fff8eb] p-6">
              <h2 className="text-xl font-black text-[#3f2a1d]">자주 남긴 키워드</h2>
              {profile.keywords.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {profile.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-[#ead7b8] px-3 py-2 text-sm font-bold text-[#5b351f]"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-5 leading-7 text-[#6b4b35]">
                  아직 키워드가 부족해요. 대화 후 감상문을 저장해 주세요.
                </p>
              )}
            </section>
          </div>

          <section className="mt-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <h2 className="text-2xl font-black text-[#3f2a1d]">추천 콘텐츠</h2>
                <p className="mt-2 text-[#6b4b35]">
                  지금까지 저장한 감상문에서 보이는 취향을 바탕으로 골랐어요.
                </p>
              </div>
              {!hasSummaries ? (
                <Link
                  href="/"
                  className="rounded-2xl border border-[#8a5a2f]/25 px-5 py-3 text-center font-bold text-[#5b351f]"
                >
                  감상 시작하기
                </Link>
              ) : null}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {profile.recommendations.map((recommendation) => (
                <article key={recommendation.title} className="rounded-[20px] bg-[#fff8eb] p-5">
                  <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#697a4c]">
                    {recommendation.category}
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
