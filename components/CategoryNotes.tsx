"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useRef } from "react";
import { getCurrentUser } from "@/lib/auth";
import { createNote, getNotesByCategory, NoteCategory, StoredNote, uploadNoteImage } from "@/lib/notes";

type CategoryCopy = {
  label: string;
  prompt: string;
  mood: string;
  placeholder: string;
};

type CategoryNotesProps = {
  categoryKey: NoteCategory;
  category: CategoryCopy;
};

export default function CategoryNotes({ categoryKey, category }: CategoryNotesProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<StoredNote[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace("/login");
      return;
    }

    void refreshNotes();

    async function refreshNotes() {
      setIsLoading(true);
      setNotes(await getNotesByCategory(categoryKey));
      setIsLoading(false);
    }

    window.addEventListener("acorn-notes-changed", refreshNotes);

    return () => {
      window.removeEventListener("acorn-notes-changed", refreshNotes);
    };
  }, [categoryKey, router]);

  function openModal() {
    setTitle("");
    setMessage("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setTitle("");
    setArtist("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setMessage("");
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setMessage("제목을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);

    const note = await createNote(categoryKey, title, artist);

    if (!note) {
      router.push("/login");
      return;
    }

    if (photoFile) {
      await uploadNoteImage(note.id, photoFile);
    }

    setNotes(await getNotesByCategory(categoryKey));
    setIsSubmitting(false);
    closeModal();
  }

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-6xl py-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#697a4c]">
              {category.label} 창고
            </p>
            <h1 className="mt-3 text-4xl font-black text-[#3f2a1d]">{category.mood}</h1>
            <p className="mt-4 text-[#6b4b35]">{category.prompt}</p>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#8a5a2f] text-3xl font-light text-[#fff8eb] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#754a27]"
            aria-label="새 감상 노트 만들기"
          >
            +
          </button>
        </div>

        {isLoading ? (
          <div className="warm-panel mt-10 rounded-[24px] p-8 text-center">
            <p className="text-xl font-black text-[#3f2a1d]">노트를 불러오는 중이에요...</p>
          </div>
        ) : notes.length > 0 ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className="warm-panel flex min-h-48 flex-col justify-between overflow-hidden rounded-[18px] transition hover:-translate-y-1"
              >
                {note.imageUrl ? (
                  <div className="h-36 w-full overflow-hidden">
                    <img
                      src={note.imageUrl}
                      alt={note.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className={note.imageUrl ? "p-6 pt-4" : "p-6"}>
                  <p className="text-sm font-bold text-[#697a4c]">{note.category}</p>
                  <h2 className="mt-2 text-2xl font-black text-[#3f2a1d]">{note.title}</h2>
                  {note.artist ? (
                    <p className="mt-1 text-sm font-semibold text-[#8a5a2f]">{note.artist}</p>
                  ) : null}
                </div>
                <div className="mx-6 mb-6 border-t border-[#8a5a2f]/15 pt-4 text-sm font-semibold text-[#6b4b35]">
                  <p>카테고리: {category.label}</p>
                  <p className="mt-1">생성 날짜: {formatDate(note.createdAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="warm-panel mt-10 rounded-[24px] p-8 text-center">
            <p className="text-xl font-black text-[#3f2a1d]">아직 감상 노트가 없어요</p>
            <p className="mt-3 text-[#6b4b35]">+ 버튼을 눌러 첫 번째 감상을 보관해 보세요.</p>
          </div>
        )}
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#3f2a1d]/40 p-5">
          <section className="warm-panel w-full max-w-md rounded-[24px] p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#697a4c]">
                  새 감상 노트
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#3f2a1d]">{category.placeholder}</h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-[#8a5a2f]/20 px-3 py-1 text-sm font-bold text-[#5b351f]"
              >
                닫기
              </button>
            </div>
            <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
              <input
                autoFocus
                className="w-full rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 outline-none"
                placeholder="제목을 입력해 주세요"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              <input
                className="w-full rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 outline-none"
                placeholder="아티스트 / 감독 (선택)"
                value={artist}
                onChange={(event) => setArtist(event.target.value)}
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-dashed border-[#8a5a2f]/30 bg-[#fff8eb] px-4 py-3 text-left transition hover:border-[#8a5a2f]/60"
              >
                {photoPreview ? (
                  <>
                    <img
                      src={photoPreview}
                      alt="미리보기"
                      className="h-14 w-14 flex-shrink-0 rounded-xl object-cover"
                    />
                    <span className="text-sm font-semibold text-[#5b351f]">
                      {photoFile?.name}
                      <br />
                      <span className="text-xs font-normal text-[#8a5a2f]">클릭해서 변경</span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-[#f4e5c9] text-[#8a5a2f]">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="3" y="3" width="18" height="18" rx="3" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    </span>
                    <span className="text-sm font-semibold text-[#8a5a2f]/60">사진 추가 (선택)</span>
                  </>
                )}
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              {message ? <p className="text-sm font-semibold text-[#8a5a2f]">{message}</p> : null}
              <button
                type="submit"
                disabled={isSubmitting}
                className="block w-full rounded-2xl bg-[#8a5a2f] px-4 py-3 text-center font-bold text-[#fff8eb] disabled:opacity-60"
              >
                {isSubmitting ? "저장 중..." : "확인"}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
