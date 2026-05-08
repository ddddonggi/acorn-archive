import Link from "next/link";

export default async function AiChatPage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { noteId } = await params;

  return (
    <main className="page-shell">
      <section className="mx-auto grid max-w-6xl gap-6 py-8 lg:grid-cols-[1fr_320px]">
        <div className="warm-panel rounded-[24px] p-5 md:p-7">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#697a4c]">AI 대화</p>
          <h1 className="mt-3 text-3xl font-black text-[#3f2a1d]">감상 노트 {noteId}</h1>
          <div className="mt-8 space-y-4">
            <div className="max-w-[82%] rounded-[22px] bg-[#fff8eb] p-4 text-[#5b351f]">
              오늘 감상에서 제일 오래 남은 장면이나 문장은 무엇이었나요?
            </div>
            <div className="ml-auto max-w-[82%] rounded-[22px] bg-[#8a5a2f] p-4 text-[#fff8eb]">
              아직 대화 기능은 준비 중이에요. 여기에 사용자의 답변이 들어갑니다.
            </div>
          </div>
          <div className="mt-8 flex gap-3">
            <input className="min-w-0 flex-1 rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 outline-none" placeholder="감상을 적어보세요" />
            <button className="rounded-2xl bg-[#8a5a2f] px-5 py-3 font-bold text-[#fff8eb]">전송</button>
          </div>
        </div>
        <aside className="warm-panel h-fit rounded-[24px] p-6">
          <h2 className="text-xl font-black text-[#3f2a1d]">정리하기</h2>
          <p className="mt-3 leading-7 text-[#6b4b35]">대화가 쌓이면 감상문처럼 정리해 저장할 수 있어요.</p>
          <Link href="/summary" className="mt-6 block rounded-2xl bg-[#697a4c] px-5 py-3 text-center font-bold text-[#fff8eb]">
            감상문 정리 페이지로
          </Link>
        </aside>
      </section>
    </main>
  );
}
