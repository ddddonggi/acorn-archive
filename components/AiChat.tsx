"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { appendMessages, ChatMessage, getMessagesByNoteId } from "@/lib/chat";
import { generateMockAiResponse } from "@/lib/mockAi";
import { getNoteById, StoredNote } from "@/lib/notes";

type AiChatProps = {
  noteId: string;
};

const categoryLabels = {
  music: "음악",
  media: "미디어",
  video: "영상",
} as const;

const firstQuestion = "이 작품을 보고 가장 먼저 든 생각은 뭐였나요?";

export default function AiChat({ noteId }: AiChatProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [note, setNote] = useState<StoredNote | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace("/login");
      return;
    }

    setNote(getNoteById(noteId));
    setMessages(getMessagesByNoteId(noteId));
  }, [noteId, router]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const visibleMessages = useMemo(() => {
    if (messages.length > 0) {
      return messages;
    }

    return [
      {
        id: "welcome",
        noteId,
        userId: "system",
        role: "assistant" as const,
        content: firstQuestion,
        createdAt: new Date(0).toISOString(),
      },
    ];
  }, [messages, noteId]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = input.trim();

    if (!content) {
      return;
    }

    const aiContent = generateMockAiResponse(content, note);
    appendMessages(noteId, [
      { role: "user", content },
      { role: "assistant", content: aiContent },
    ]);
    setMessages(getMessagesByNoteId(noteId));
    setInput("");
  }

  return (
    <main className="page-shell">
      <section className="mx-auto grid max-w-6xl gap-6 py-8 lg:grid-cols-[1fr_320px]">
        <div className="warm-panel flex min-h-[680px] flex-col rounded-[24px] p-5 md:p-7">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#697a4c]">
            AI 대화
          </p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black text-[#3f2a1d]">
                {note?.title ?? "감상 노트"}
              </h1>
              <p className="mt-2 text-sm font-semibold text-[#8a5a2f]">
                카테고리: {note ? categoryLabels[note.category] : "불러오는 중"}
              </p>
            </div>
            <span className="w-fit rounded-full bg-[#fff8eb] px-4 py-2 text-sm font-bold text-[#5b351f]">
              noteId: {noteId}
            </span>
          </div>
          <p className="mt-4 text-sm font-semibold text-[#8a5a2f]">
            AI는 답을 대신 쓰기보다, 내 생각을 조금 더 잘 들여다보게 도와줘요.
          </p>

          <div
            ref={scrollRef}
            className="mt-8 flex-1 space-y-4 overflow-y-auto rounded-[22px] bg-[#f4e5c9]/70 p-4"
          >
            {visibleMessages.map((message) => {
              const isUser = message.role === "user";

              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[86%] rounded-[22px] p-4 leading-7 shadow-sm ${
                      isUser
                        ? "bg-[#8a5a2f] text-[#fff8eb]"
                        : "bg-[#fff8eb] text-[#5b351f]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
            <input
              className="min-w-0 flex-1 rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 outline-none"
              placeholder="답변을 입력해 주세요"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
            <button
              type="submit"
              className="rounded-2xl bg-[#8a5a2f] px-5 py-3 font-bold text-[#fff8eb]"
            >
              전송
            </button>
          </form>
        </div>

        <aside className="warm-panel h-fit rounded-[24px] p-6">
          <h2 className="text-xl font-black text-[#3f2a1d]">감상문 정리</h2>
          <p className="mt-3 leading-7 text-[#6b4b35]">
            대화가 충분히 쌓이면 감상문처럼 정리해 저장할 수 있어요.
          </p>
          <Link
            href={`/summary?noteId=${noteId}`}
            className="mt-6 block rounded-2xl bg-[#697a4c] px-5 py-3 text-center font-bold text-[#fff8eb]"
          >
            감상문 정리하기
          </Link>
          <Link
            href={note ? `/${note.category}` : "/"}
            className="mt-3 block rounded-2xl border border-[#8a5a2f]/25 px-5 py-3 text-center font-bold text-[#5b351f]"
          >
            목록으로 돌아가기
          </Link>
        </aside>
      </section>
    </main>
  );
}
