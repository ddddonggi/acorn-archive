"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getMessagesByNoteId } from "@/lib/chat";
import { getNoteById, StoredNote } from "@/lib/notes";
import {
  createDraftSummary,
  getSummaryByNoteId,
  saveSummary,
  StoredSummary,
} from "@/lib/summary";

export default function SummaryEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noteId = searchParams.get("noteId");
  const [note, setNote] = useState<StoredNote | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [savedSummary, setSavedSummary] = useState<StoredSummary | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace("/login");
      return;
    }

    if (!noteId) {
      return;
    }

    const nextNote = getNoteById(noteId);
    const existingSummary = getSummaryByNoteId(noteId);
    const draft = existingSummary ?? createDraftSummary(nextNote, getMessagesByNoteId(noteId));

    setNote(nextNote);
    setTitle(draft.title);
    setBody(draft.body);
    setKeywords(draft.keywords);
    setEmotions(draft.emotions);
    setSavedSummary(existingSummary);
  }, [noteId, router]);

  const keywordText = useMemo(() => keywords.join(", "), [keywords]);
  const emotionText = useMemo(() => emotions.join(", "), [emotions]);

  function handleTagChange(value: string, setter: (nextTags: string[]) => void) {
    setter(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    );
  }

  function handleSave() {
    if (!noteId) {
      setMessage("정리할 노트를 찾을 수 없어요.");
      return;
    }

    if (!title.trim() || !body.trim()) {
      setMessage("제목과 감상문 내용을 입력해 주세요.");
      return;
    }

    const summary = saveSummary(noteId, {
      title: title.trim(),
      body: body.trim(),
      keywords,
      emotions,
    });

    if (!summary) {
      router.push("/login");
      return;
    }

    setSavedSummary(summary);
    setMessage("감상문이 저장되었습니다.");
  }

  if (!noteId) {
    return (
      <main className="page-shell flex items-center justify-center">
        <section className="warm-panel max-w-md rounded-[24px] p-7 text-center">
          <h1 className="text-3xl font-black text-[#3f2a1d]">정리할 노트가 없어요</h1>
          <p className="mt-3 text-[#6b4b35]">감상 노트에서 정리 버튼을 눌러 다시 들어와 주세요.</p>
          <Link href="/" className="mt-6 inline-flex rounded-2xl bg-[#8a5a2f] px-5 py-3 font-bold text-[#fff8eb]">
            홈으로
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="mx-auto grid max-w-6xl gap-6 py-10 lg:grid-cols-[1fr_320px]">
        <div className="warm-panel rounded-[24px] p-7 md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#697a4c]">
            감상문 정리
          </p>
          <h1 className="mt-3 text-4xl font-black text-[#3f2a1d]">
            대화를 감상문으로 묶는 자리
          </h1>
          <p className="mt-4 text-[#6b4b35]">
            {note ? `"${note.title}"에 대해 나눈 대화를 바탕으로 정리했어요.` : "저장된 노트를 확인하고 있어요."}
          </p>

          <label className="mt-8 block text-sm font-bold text-[#5b351f]" htmlFor="summary-title">
            감상문 제목
          </label>
          <input
            id="summary-title"
            className="mt-2 w-full rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 text-xl font-bold text-[#3f2a1d] outline-none"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <label className="mt-6 block text-sm font-bold text-[#5b351f]" htmlFor="summary-body">
            감상문 내용
          </label>
          <textarea
            id="summary-body"
            className="mt-2 min-h-80 w-full resize-y rounded-[22px] border border-[#8a5a2f]/20 bg-[#fff8eb] px-5 py-4 leading-8 text-[#5b351f] outline-none"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-bold text-[#5b351f]" htmlFor="summary-keywords">
              핵심 키워드
              <input
                id="summary-keywords"
                className="mt-2 w-full rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 font-medium outline-none"
                value={keywordText}
                onChange={(event) => handleTagChange(event.target.value, setKeywords)}
              />
            </label>
            <label className="block text-sm font-bold text-[#5b351f]" htmlFor="summary-emotions">
              감정 태그
              <input
                id="summary-emotions"
                className="mt-2 w-full rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 font-medium outline-none"
                value={emotionText}
                onChange={(event) => handleTagChange(event.target.value, setEmotions)}
              />
            </label>
          </div>

          {message ? <p className="mt-5 text-sm font-bold text-[#8a5a2f]">{message}</p> : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-2xl bg-[#8a5a2f] px-5 py-3 text-center font-bold text-[#fff8eb]"
            >
              감상문 저장
            </button>
            <Link
              href={`/notes/${noteId}`}
              className="rounded-2xl border border-[#8a5a2f]/25 px-5 py-3 text-center font-bold text-[#5b351f]"
            >
              대화로 돌아가기
            </Link>
          </div>
        </div>

        <aside className="space-y-5">
          <section className="warm-panel rounded-[24px] p-6">
            <h2 className="text-xl font-black text-[#3f2a1d]">핵심 키워드</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <span key={keyword} className="rounded-full bg-[#fff8eb] px-3 py-2 text-sm font-bold text-[#5b351f]">
                  {keyword}
                </span>
              ))}
            </div>
          </section>
          <section className="warm-panel rounded-[24px] p-6">
            <h2 className="text-xl font-black text-[#3f2a1d]">감정 태그</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {emotions.map((emotion) => (
                <span key={emotion} className="rounded-full bg-[#697a4c] px-3 py-2 text-sm font-bold text-[#fff8eb]">
                  {emotion}
                </span>
              ))}
            </div>
          </section>
          <section className="warm-panel rounded-[24px] p-6">
            <h2 className="text-xl font-black text-[#3f2a1d]">저장 상태</h2>
            <p className="mt-3 leading-7 text-[#6b4b35]">
              {savedSummary
                ? `마지막 저장: ${new Date(savedSummary.updatedAt).toLocaleString()}`
                : "아직 저장되지 않은 정리본입니다."}
            </p>
            <Link
              href="/taste"
              className="mt-5 block rounded-2xl bg-[#697a4c] px-5 py-3 text-center font-bold text-[#fff8eb]"
            >
              내 종합 취향 보기
            </Link>
          </section>
        </aside>
      </section>
    </main>
  );
}
