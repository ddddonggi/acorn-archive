import Link from "next/link";

const tasteItems = ["잔잔한 분위기", "오래 곱씹는 문장", "따뜻한 결말", "일상의 작은 변화"];

export default function TastePage() {
  return (
    <main className="page-shell">
      <section className="mx-auto max-w-6xl py-10">
        <div className="warm-panel rounded-[24px] p-7 md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#697a4c]">내 종합 취향</p>
          <h1 className="mt-3 text-4xl font-black text-[#3f2a1d]">감상들이 모여 보여주는 나의 결</h1>
          <p className="mt-4 max-w-2xl leading-8 text-[#6b4b35]">
            저장된 감상문을 바탕으로 좋아하는 분위기, 자주 떠올리는 감정, 반복되는 키워드를 보여줄 예정입니다.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tasteItems.map((item) => (
              <div key={item} className="rounded-[20px] bg-[#fff8eb] p-5">
                <p className="text-sm font-bold text-[#697a4c]">KEYWORD</p>
                <h2 className="mt-4 text-xl font-black text-[#3f2a1d]">{item}</h2>
              </div>
            ))}
          </div>
          <Link href="/" className="mt-8 inline-flex rounded-2xl bg-[#8a5a2f] px-5 py-3 font-bold text-[#fff8eb]">
            홈으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
