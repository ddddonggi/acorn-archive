import { Suspense } from "react";
import SummaryEditor from "@/components/SummaryEditor";

export default function SummaryPage() {
  return (
    <Suspense fallback={<SummaryFallback />}>
      <SummaryEditor />
    </Suspense>
  );
}

function SummaryFallback() {
  return (
    <main className="page-shell flex items-center justify-center">
      <section className="warm-panel max-w-md rounded-[24px] p-7 text-center">
        <h1 className="text-3xl font-black text-[#3f2a1d]">감상문을 정리하고 있어요</h1>
        <p className="mt-3 text-[#6b4b35]">대화에 오래 남은 마음을 꺼내는 중입니다.</p>
      </section>
    </main>
  );
}
