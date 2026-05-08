import Link from "next/link";

const PROMPT_META: Record<string, { label: string; desc: string; color: string }> = {
  chat:                        { label: "chat",                        desc: "채팅 대화 유도",       color: "#4ec9b0" },
  summary:                     { label: "summary",                     desc: "감상문 생성",           color: "#dcdcaa" },
  category_taste:              { label: "category_taste",              desc: "카테고리 취향 분석",    color: "#9cdcfe" },
  recent_rec:                  { label: "recent_rec",                  desc: "최근 추천",             color: "#ce9178" },
  full_rec:                    { label: "full_rec",                    desc: "전체 추천",             color: "#ce9178" },
  traditional_culture:         { label: "traditional_culture",         desc: "전통문화 스코어링",     color: "#c586c0" },
  overall_summary:             { label: "overall_summary",             desc: "창고 메모 생성",        color: "#6a9955" },
  traditional_culture_summary: { label: "traditional_culture_summary", desc: "전통문화 종합 요약",    color: "#c586c0" },
};

type SummaryRow = { prompt_type: string; count: number; last_at: string };

async function fetchSummary(): Promise<SummaryRow[]> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const adminKey = process.env.ADMIN_KEY ?? "";
  const keyParam = adminKey ? `&key=${adminKey}` : "";
  try {
    const res = await fetch(`${base}/api/admin/logs?summary=1${keyParam}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json() as { summary: SummaryRow[] };
    return data.summary ?? [];
  } catch {
    return [];
  }
}

export default async function AdminPage() {
  const summary = await fetchSummary();
  const countMap = Object.fromEntries(summary.map((r) => [r.prompt_type, r]));

  const allTypes = Object.keys(PROMPT_META);

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <p className="text-[#569cd6] text-xs tracking-widest uppercase mb-1">acorn-archive</p>
        <h1 className="text-2xl text-[#d4d4d4] font-bold">/ admin / ai-logs</h1>
        <p className="text-[#6a9955] text-sm mt-1"># AI 호출 로그 디렉터리</p>
      </header>

      <div className="border border-[#2d2d2d] rounded">
        <div className="grid grid-cols-[1.4rem_2fr_1fr_1fr_1fr] gap-0 border-b border-[#2d2d2d] px-4 py-2 text-xs text-[#569cd6]">
          <span></span>
          <span>name</span>
          <span>description</span>
          <span className="text-right">count</span>
          <span className="text-right">last call</span>
        </div>

        {allTypes.map((type) => {
          const meta = PROMPT_META[type];
          const row = countMap[type];
          return (
            <Link
              key={type}
              href={`/admin/logs?type=${type}`}
              className="grid grid-cols-[1.4rem_2fr_1fr_1fr_1fr] gap-0 px-4 py-2.5 border-b border-[#1e1e1e] hover:bg-[#1a1a1a] transition-colors items-center text-sm"
            >
              <span className="text-[#dcdcaa]">📂</span>
              <span style={{ color: meta.color }}>{meta.label}/</span>
              <span className="text-[#808080]">{meta.desc}</span>
              <span className="text-right text-[#d4d4d4]">{row?.count ?? 0}</span>
              <span className="text-right text-[#569cd6] text-xs">
                {row?.last_at ? new Date(row.last_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—"}
              </span>
            </Link>
          );
        })}

        <Link
          href="/admin/logs"
          className="grid grid-cols-[1.4rem_2fr_1fr_1fr_1fr] gap-0 px-4 py-2.5 hover:bg-[#1a1a1a] transition-colors items-center text-sm"
        >
          <span className="text-[#dcdcaa]">📋</span>
          <span className="text-[#d4d4d4]">all</span>
          <span className="text-[#808080]">전체 로그</span>
          <span className="text-right text-[#d4d4d4]">{summary.reduce((s, r) => s + r.count, 0)}</span>
          <span className="text-right text-xs text-[#808080]">—</span>
        </Link>
      </div>

      <p className="mt-4 text-xs text-[#3e3e3e]">
        ADMIN_KEY {process.env.ADMIN_KEY ? "configured" : "not set (open access)"}
      </p>
    </main>
  );
}
