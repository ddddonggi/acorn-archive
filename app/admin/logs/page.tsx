import Link from "next/link";

const TYPE_COLOR: Record<string, string> = {
  chat:                        "#4ec9b0",
  summary:                     "#dcdcaa",
  category_taste:              "#9cdcfe",
  recent_rec:                  "#ce9178",
  full_rec:                    "#ce9178",
  traditional_culture:         "#c586c0",
  overall_summary:             "#6a9955",
  traditional_culture_summary: "#c586c0",
};

type LogRow = {
  id: string;
  prompt_type: string;
  user_id: string | null;
  note_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

async function fetchLogs(type?: string): Promise<LogRow[]> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const adminKey = process.env.ADMIN_KEY ?? "";
  const keyParam = adminKey ? `&key=${adminKey}` : "";
  const typeParam = type ? `&type=${type}` : "";
  try {
    const res = await fetch(`${base}/api/admin/logs?limit=100${typeParam}${keyParam}`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json() as { logs: LogRow[] };
    return data.logs ?? [];
  } catch {
    return [];
  }
}

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const logs = await fetchLogs(type);

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <header className="mb-6">
        <nav className="text-xs text-[#569cd6] mb-1 flex gap-1">
          <Link href="/admin" className="hover:underline">/ admin</Link>
          <span className="text-[#3e3e3e]">/</span>
          <span>logs{type ? `/${type}` : ""}</span>
        </nav>
        <h1 className="text-xl text-[#d4d4d4] font-bold">
          {type ?? "all"} <span className="text-[#808080] font-normal text-sm">({logs.length}건)</span>
        </h1>
      </header>

      {logs.length === 0 ? (
        <p className="text-[#3e3e3e] text-sm">로그가 없습니다.</p>
      ) : (
        <div className="border border-[#2d2d2d] rounded overflow-hidden">
          <div className="grid grid-cols-[1.4rem_1fr_auto_auto_auto] gap-0 border-b border-[#2d2d2d] px-4 py-2 text-xs text-[#569cd6]">
            <span></span>
            <span>id / metadata</span>
            <span>user</span>
            <span>type</span>
            <span className="text-right">time</span>
          </div>

          {logs.map((log) => (
            <Link
              key={log.id}
              href={`/admin/logs/${log.id}`}
              className="grid grid-cols-[1.4rem_1fr_auto_auto_auto] gap-0 px-4 py-2.5 border-b border-[#1e1e1e] hover:bg-[#1a1a1a] transition-colors items-start text-sm"
            >
              <span className="text-[#dcdcaa] pt-0.5">📄</span>
              <span className="min-w-0">
                <span className="text-[#d4d4d4] block truncate text-xs font-light">{log.id}</span>
                <span className="text-[#808080] text-xs block truncate">
                  {Object.entries(log.metadata ?? {})
                    .filter(([, v]) => v !== null && v !== undefined && v !== "")
                    .map(([k, v]) => `${k}: ${v}`)
                    .join("  ·  ")}
                </span>
              </span>
              <span className="text-[#9cdcfe] text-xs px-3 pt-0.5">{log.user_id ?? "—"}</span>
              <span className="text-xs px-3 pt-0.5" style={{ color: TYPE_COLOR[log.prompt_type] ?? "#d4d4d4" }}>
                {log.prompt_type}
              </span>
              <span className="text-right text-[#569cd6] text-xs pt-0.5 pl-3">
                {new Date(log.created_at).toLocaleString("ko-KR", {
                  month: "2-digit", day: "2-digit",
                  hour: "2-digit", minute: "2-digit", second: "2-digit",
                })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
