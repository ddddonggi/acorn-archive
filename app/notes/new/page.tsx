import Link from "next/link";

export default function NewNotePage() {
  return (
    <main className="page-shell flex items-center justify-center">
      <section className="warm-panel w-full max-w-lg rounded-[24px] p-7">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#697a4c]">새 감상 노트</p>
        <h1 className="mt-3 text-3xl font-black text-[#3f2a1d]">무엇을 감상했나요?</h1>
        <input
          className="mt-8 w-full rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 outline-none"
          placeholder="제목을 입력해 주세요"
        />
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/notes/demo-1" className="rounded-2xl bg-[#8a5a2f] px-5 py-3 text-center font-bold text-[#fff8eb]">
            노트 만들기
          </Link>
          <Link href="/" className="rounded-2xl border border-[#8a5a2f]/25 px-5 py-3 text-center font-bold text-[#5b351f]">
            돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
