"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import DebugErrorModal from "@/components/DebugErrorModal";
import { SummaryResponseBody } from "@/lib/ai/types";
import { getCurrentUser } from "@/lib/auth";
import { getMessagesByNoteId } from "@/lib/chat";
import { getNoteById, StoredNote, updateNote } from "@/lib/notes";
import { getSummaryByNoteId, saveSummary, StoredSummary } from "@/lib/summary";

type SummaryApiResponse = SummaryResponseBody & {
  debug?: unknown;
};

export default function SummaryEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteId = searchParams.get("noteId");
  const [note, setNote] = useState<StoredNote | null>(null);
  const [summaryTitle, setSummaryTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [oneLineReview, setOneLineReview] = useState("");
  const [essay, setEssay] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [emotionTags, setEmotionTags] = useState<string[]>([]);
  const [tasteHint, setTasteHint] = useState("");
  const [savedSummary, setSavedSummary] = useState<StoredSummary | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<unknown>(null);

  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace("/login");
      return;
    }

    if (!noteId) {
      return;
    }

    const targetNoteId = noteId;

    async function loadSummary() {
      const nextNote = await getNoteById(targetNoteId);
      const existingSummary = await getSummaryByNoteId(targetNoteId);
      const noteSummary = nextNote?.summary;
      const draft = existingSummary ?? noteSummary;

      setNote(nextNote);

      if (draft) {
        setSummaryTitle(draft.summaryTitle);
        setArtist(draft.artist ?? "");
        setOneLineReview(draft.oneLineReview);
        setEssay(draft.essay);
        setKeywords(draft.keywords.slice(0, 3));
        setEmotionTags(draft.emotionTags.slice(0, 3));
        setTasteHint(draft.tasteHint);
        setSavedSummary(existingSummary);
        return;
      }

      if (nextNote) {
        await requestSummary(nextNote, targetNoteId);
      }
    }

    void loadSummary();
  }, [noteId, router]);

  const keywordText = useMemo(() => keywords.join(", "), [keywords]);
  const emotionText = useMemo(() => emotionTags.join(", "), [emotionTags]);

  async function requestSummary(targetNote: StoredNote, targetNoteId: string) {
    setIsLoading(true);
    setMessage("");

    const messages = await getMessagesByNoteId(targetNoteId);
    const requestBody = {
      note: {
        id: targetNote.id,
        title: targetNote.title,
        category: targetNote.category,
      },
      messages: messages.map((chatMessage) => ({
        role: chatMessage.role,
        content: chatMessage.content,
      })),
    };

    try {
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      const summary = (await response.json()) as SummaryApiResponse;

      if (!response.ok || summary.debug) {
        setDebugInfo({
          screen: "감상문 정리 페이지",
          action: "summary generation request",
          httpStatus: response.status,
          requestBody,
          serverDebug: summary.debug,
          fallbackSummary: {
            summaryTitle: summary.summaryTitle,
            oneLineReview: summary.oneLineReview,
            essay: summary.essay,
            emotionTags: summary.emotionTags,
            keywords: summary.keywords,
            tasteHint: summary.tasteHint,
          },
        });
      }

      setSummaryTitle(summary.summaryTitle);
      setArtist(summary.artist ?? "");
      setOneLineReview(summary.oneLineReview);
      setEssay(summary.essay);
      setKeywords(summary.keywords.slice(0, 3));
      setEmotionTags(summary.emotionTags.slice(0, 3));
      setTasteHint(summary.tasteHint);
    } catch (error) {
      setDebugInfo({
        screen: "감상문 정리 페이지",
        action: "summary generation request",
        requestBody,
        clientError: error instanceof Error ? error.message : String(error),
      });
      setMessage("감상문 정리에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleTagChange(value: string, setter: (nextTags: string[]) => void) {
    setter(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 3),
    );
  }

  async function handleSave() {
    if (!noteId || !note) {
      setMessage("정리할 노트를 찾을 수 없어요.");
      return;
    }

    if (!summaryTitle.trim() || !oneLineReview.trim() || !essay.trim()) {
      setMessage("제목, 한 줄 감상, 감상문 본문을 모두 입력해 주세요.");
      return;
    }

    if (emotionTags.length !== 3) {
      setMessage("감상 태그를 3개 입력해 주세요.");
      return;
    }

    const [summary] = await Promise.all([
      saveSummary(noteId, {
        summaryTitle: summaryTitle.trim(),
        artist: artist.trim(),
        oneLineReview: oneLineReview.trim(),
        essay: essay.trim(),
        emotionTags,
        keywords,
        tasteHint: tasteHint.trim(),
      }),
      updateNote(noteId, { title: summaryTitle.trim(), artist: artist.trim() }),
    ]);

    if (!summary) {
      router.push("/login");
      return;
    }

    setSavedSummary(summary);
    router.push(`/${note.category}`);
  }

  const shelfBg: React.CSSProperties = {
    backgroundImage: "url('/bookshelf.png')",
    backgroundSize: "120% 120%",
    backgroundPosition: "50% 75%",
  };

  if (!noteId) {
    return (
      <main className="page-shell flex items-center justify-center" style={shelfBg}>
        <section className="warm-panel max-w-md rounded-[24px] p-7 text-center">
          <h1 className="text-3xl font-black text-[#3f2a1d]">정리할 노트가 없어요</h1>
          <p className="mt-3 text-[#6b4b35]">
            감상 노트에서 정리 버튼을 눌러 다시 들어와 주세요.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-2xl bg-[#8a5a2f] px-5 py-3 font-bold text-[#fff8eb]"
          >
            홈으로
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell" style={shelfBg}>
      {debugInfo ? (
        <DebugErrorModal
          title="감상문 정리 중 오류가 발생했어요"
          description="아래 정보로 Vercel 로그, 환경변수, Gemini 모델명, JSON 응답 문제를 확인할 수 있어요."
          debug={debugInfo}
          onClose={() => setDebugInfo(null)}
        />
      ) : null}

      <section className="mx-auto grid max-w-6xl gap-6 py-10 lg:grid-cols-[1fr_320px]">
        <div className="warm-panel rounded-[24px] p-7 md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#697a4c]">
            감상문 정리
          </p>
          <h1 className="mt-3 text-4xl font-black text-[#3f2a1d]">
            대화를 감상문으로 묶는 자리
          </h1>
          <p className="mt-4 text-[#6b4b35]">
            {isLoading
              ? "감상을 정리하는 중이에요..."
              : note
                ? `"${note.title}"에 대해 나눈 대화를 바탕으로 감상문을 만들었어요.`
                : "저장된 노트를 확인하고 있어요."}
          </p>

          <label className="mt-8 block text-sm font-bold text-[#5b351f]" htmlFor="summary-title">
            1. 제목
          </label>
          <input
            id="summary-title"
            className="mt-2 w-full rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 text-xl font-bold text-[#3f2a1d] outline-none disabled:opacity-60"
            value={summaryTitle}
            disabled={isLoading}
            onChange={(event) => setSummaryTitle(event.target.value)}
          />

          <label className="mt-6 block text-sm font-bold text-[#5b351f]" htmlFor="summary-artist">
            2. 아티스트
          </label>
          <input
            id="summary-artist"
            className="mt-2 w-full rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 font-medium text-[#5b351f] outline-none disabled:opacity-60"
            value={artist}
            disabled={isLoading}
            onChange={(event) => setArtist(event.target.value)}
          />

          <label className="mt-6 block text-sm font-bold text-[#5b351f]" htmlFor="summary-one-line">
            3. 한 줄 감상
          </label>
          <input
            id="summary-one-line"
            className="mt-2 w-full rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 font-medium text-[#5b351f] outline-none disabled:opacity-60"
            value={oneLineReview}
            disabled={isLoading}
            onChange={(event) => setOneLineReview(event.target.value)}
          />

          <label className="mt-6 block text-sm font-bold text-[#5b351f]" htmlFor="summary-essay">
            4. 감상문 본문
          </label>
          <textarea
            id="summary-essay"
            className="mt-2 min-h-80 w-full resize-y rounded-[22px] border border-[#8a5a2f]/20 bg-[#fff8eb] px-5 py-4 leading-8 text-[#5b351f] outline-none disabled:opacity-60"
            value={isLoading ? "감상을 정리하는 중이에요..." : essay}
            disabled={isLoading}
            onChange={(event) => setEssay(event.target.value)}
          />

          <label className="mt-6 block text-sm font-bold text-[#5b351f]" htmlFor="summary-emotions">
            5. 감상 태그 3개
            <input
              id="summary-emotions"
              className="mt-2 w-full rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 font-medium outline-none disabled:opacity-60"
              value={emotionText}
              disabled={isLoading}
              onChange={(event) => handleTagChange(event.target.value, setEmotionTags)}
            />
          </label>

          {message ? <p className="mt-5 text-sm font-bold text-[#8a5a2f]">{message}</p> : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="rounded-2xl bg-[#8a5a2f] px-5 py-3 text-center font-bold text-[#fff8eb] disabled:cursor-not-allowed disabled:opacity-60"
            >
              저장하기
            </button>
            <Link
              href={`/notes/${noteId}`}
              className="rounded-2xl border border-[#8a5a2f]/25 px-5 py-3 text-center font-bold text-[#5b351f]"
            >
              이전으로 돌아가기
            </Link>
          </div>
        </div>

        <aside className="space-y-5">
          <section className="warm-panel rounded-[24px] p-6">
            <h2 className="text-xl font-black text-[#3f2a1d]">감상 태그</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {emotionTags.map((emotion) => (
                <span key={emotion} className="rounded-full bg-[#697a4c] px-3 py-2 text-sm font-bold text-[#fff8eb]">
                  {emotion}
                </span>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
