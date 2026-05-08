"use client";

type DebugErrorModalProps = {
  title: string;
  description?: string;
  debug: unknown;
  onClose: () => void;
};

export default function DebugErrorModal({
  title,
  description,
  debug,
  onClose,
}: DebugErrorModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b1b12]/55 p-4">
      <section className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-[24px] bg-[#fff8eb] shadow-2xl">
        <div className="border-b border-[#8a5a2f]/20 p-5">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#8a5a2f]">
            API Debug
          </p>
          <h2 className="mt-2 text-2xl font-black text-[#3f2a1d]">{title}</h2>
          {description ? (
            <p className="mt-2 leading-7 text-[#6b4b35]">{description}</p>
          ) : null}
        </div>

        <div className="max-h-[56vh] overflow-auto bg-[#2b1b12] p-4">
          <pre className="whitespace-pre-wrap break-words text-sm leading-6 text-[#fff8eb]">
            {formatDebug(debug)}
          </pre>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#8a5a2f]/20 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-[#6b4b35]">
            API 키 값은 표시하지 않고, 키 존재 여부와 요청 맥락만 표시합니다.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-[#8a5a2f] px-5 py-3 font-bold text-[#fff8eb]"
          >
            닫기
          </button>
        </div>
      </section>
    </div>
  );
}

function formatDebug(debug: unknown) {
  if (!debug) {
    return "디버그 정보가 없습니다.";
  }

  try {
    return JSON.stringify(debug, null, 2);
  } catch {
    return String(debug);
  }
}
