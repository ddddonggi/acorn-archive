import Link from "next/link";

export default function SummaryPage() {
  return (
    <main className="page-shell">
      <section className="mx-auto max-w-4xl py-10">
        <div className="warm-panel rounded-[24px] p-7 md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#697a4c]">감상문 정리</p>
          <h1 className="mt-3 text-4xl font-black text-[#3f2a1d]">대화를 감상문으로 묶는 자리</h1>
          <div className="mt-8 rounded-[22px] bg-[#fff8eb] p-6 leading-8 text-[#5b351f]">
            아직 실제 정리 기능은 연결되지 않았어요. 다음 단계에서 AI와 나눈 대화가 이곳에
            독후감이나 감상문처럼 정리되어 표시됩니다.
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/notes/demo-1" className="rounded-2xl border border-[#8a5a2f]/25 px-5 py-3 text-center font-bold text-[#5b351f]">
              대화로 돌아가기
            </Link>
            <Link href="/taste" className="rounded-2xl bg-[#8a5a2f] px-5 py-3 text-center font-bold text-[#fff8eb]">
              내 종합 취향 보기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
