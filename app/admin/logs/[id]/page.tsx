import Link from "next/link";
import { notFound } from "next/navigation";

type LogDetail = {
  id: string;
  prompt_type: string;
  user_id: string | null;
  note_id: string | null;
  input_system: string;
  input_user: string;
  output: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

async function fetchLog(id: string): Promise<LogDetail | null> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const adminKey = process.env.ADMIN_KEY ?? "";
  const keyParam = adminKey ? `&key=${adminKey}` : "";
  try {
    const res = await fetch(`${base}/api/admin/logs?id=${id}${keyParam}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json() as { log: LogDetail | null };
    return data.log ?? null;
  } catch {
    return null;
  }
}

function Block({ label, content, color = "#d4d4d4" }: { label: string; content: string; color?: string }) {
  return (
    <section className="mb-6">
      <p className="text-xs mb-2 uppercase tracking-widest" style={{ color }}>
        ── {label}
      </p>
      <pre className="bg-[#1e1e1e] border border-[#2d2d2d] rounded p-4 text-sm text-[#d4d4d4] whitespace-pre-wrap break-words leading-6 max-h-[55vh] overflow-auto">
        {content || <span className="text-[#3e3e3e]">(empty)</span>}
      </pre>
    </section>
  );
}

export default async function AdminLogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const log = await fetchLog(id);
  if (!log) notFound();

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <header className="mb-6">
        <nav className="text-xs text-[#569cd6] mb-1 flex gap-1 flex-wrap">
          <Link href="/admin" className="hover:underline">/ admin</Link>
          <span className="text-[#3e3e3e]">/</span>
          <Link href={`/admin/logs?type=${log.prompt_type}`} className="hover:underline">logs/{log.prompt_type}</Link>
          <span className="text-[#3e3e3e]">/</span>
          <span className="text-[#d4d4d4]">{log.id}</span>
        </nav>

        <div className="flex flex-wrap gap-4 items-baseline mt-2">
          <h1 className="text-xl text-[#dcdcaa] font-bold">{log.prompt_type}</h1>
          <span className="text-[#808080] text-sm">
            {new Date(log.created_at).toLocaleString("ko-KR")}
          </span>
        </div>

        <div className="flex flex-wrap gap-4 mt-2 text-xs">
          {log.user_id && <span><span className="text-[#569cd6]">user:</span> <span className="text-[#9cdcfe]">{log.user_id}</span></span>}
          {log.note_id && <span><span className="text-[#569cd6]">note:</span> <span className="text-[#9cdcfe]">{log.note_id}</span></span>}
          {Object.entries(log.metadata ?? {}).map(([k, v]) => (
            <span key={k}><span className="text-[#569cd6]">{k}:</span> <span className="text-[#ce9178]">{String(v)}</span></span>
          ))}
        </div>
      </header>

      <Block label="system instruction" content={log.input_system} color="#4ec9b0" />
      <Block label="user prompt" content={log.input_user} color="#9cdcfe" />
      <Block label="output" content={log.output} color="#6a9955" />
    </main>
  );
}
