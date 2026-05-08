import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell flex items-center justify-center">
      <section className="warm-panel max-w-md rounded-[24px] p-7 text-center">
        <h1 className="text-3xl font-black text-[#3f2a1d]">페이지를 찾을 수 없어요</h1>
        <p className="mt-3 text-[#6b4b35]">창고 안쪽을 조금 더 정리해볼게요.</p>
        <Link href="/" className="mt-6 inline-flex rounded-2xl bg-[#8a5a2f] px-5 py-3 font-bold text-[#fff8eb]">
          홈으로
        </Link>
      </section>
    </main>
  );
}
