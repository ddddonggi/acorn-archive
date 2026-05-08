"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import DebugErrorModal from "@/components/DebugErrorModal";
import { ChatResponseBody } from "@/lib/ai/types";
import { getCurrentUser } from "@/lib/auth";
import { appendMessages, ChatMessage, getMessagesByNoteId } from "@/lib/chat";
import { getNoteById, StoredNote } from "@/lib/notes";

type AiChatProps = {
  noteId: string;
};

type ChatApiResponse = ChatResponseBody & {
  debug?: unknown;
};

const categoryLabels = {
  music: "음악",
  media: "미디어",
  video: "영상",
} as const;

const fallbackMessage = "지금은 AI가 잠시 쉬고 있어요. 다시 시도해주세요.";

export default function AiChat({ noteId }: AiChatProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const didRequestInitialQuestion = useRef(false);
  const [note, setNote] = useState<StoredNote | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<unknown>(null);

  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace("/login");
      return;
    }

    async function loadChat() {
      const nextNote = await getNoteById(noteId);
      const savedMessages = await getMessagesByNoteId(noteId);

      setNote(nextNote);
      setMessages(savedMessages);
    }

    void loadChat();
  }, [noteId, router]);

  useEffect(() => {
    if (!note || messages.length > 0 || didRequestInitialQuestion.current) {
      return;
    }

    didRequestInitialQuestion.current = true;
    void requestAssistantMessage([]);
  }, [note, messages.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function requestAssistantMessage(nextMessages: Pick<ChatMessage, "role" | "content">[]) {
    if (!note) {
      return;
    }

    setIsLoading(true);

    const requestBody = {
      note: {
        id: note.id,
        title: note.title,
        category: note.category,
      },
      messages: nextMessages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      const data = (await response.json()) as ChatApiResponse;

      if (!response.ok || data.debug) {
        setDebugInfo({
          screen: "AI 대화 페이지",
          action: "assistant message request",
          httpStatus: response.status,
          requestBody,
          serverDebug: data.debug,
          serverMessage: data.message,
        });
        return;
      }

      const assistantMessage = data.message || fallbackMessage;
      await appendMessages(noteId, [{ role: "assistant", content: assistantMessage }]);
      setMessages(await getMessagesByNoteId(noteId));
    } catch (error) {
      setDebugInfo({
        screen: "AI 대화 페이지",
        action: "assistant message request",
        requestBody,
        clientError: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = input.trim();

    if (!content || !note || isLoading) {
      return;
    }

    const userMessages = await appendMessages(noteId, [{ role: "user", content }]);
    const nextMessages = [...messages, ...userMessages];

    setMessages(nextMessages);
    setInput("");
    await requestAssistantMessage(nextMessages);
  }

  return (
    <main className="page-shell">
      {debugInfo ? (
        <DebugErrorModal
          title="AI 응답 생성 중 오류가 발생했어요"
          description="아래 정보로 Vercel 로그, 환경변수, Gemini 모델명 문제를 함께 확인할 수 있어요."
          debug={debugInfo}
          onClose={() => setDebugInfo(null)}
        />
      ) : null}

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
            AI는 감상문을 대신 쓰지 않고, 네 생각을 더 잘 꺼낼 수 있게 질문해요.
          </p>

          <div
            ref={scrollRef}
            className="mt-8 flex-1 space-y-4 overflow-y-auto rounded-[22px] bg-[#f4e5c9]/70 p-4"
          >
            {messages.map((message) => {
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
            {isLoading ? (
              <div className="flex justify-start">
                <div className="rounded-[22px] bg-[#fff8eb] p-4 text-[#5b351f] shadow-sm">
                  생각을 고르는 중이에요...
                </div>
              </div>
            ) : null}
          </div>

          <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
            <input
              className="min-w-0 flex-1 rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 outline-none"
              placeholder="답변을 입력해 주세요"
              value={input}
              disabled={isLoading}
              onChange={(event) => setInput(event.target.value)}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="rounded-2xl bg-[#8a5a2f] px-5 py-3 font-bold text-[#fff8eb] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "대기" : "전송"}
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
