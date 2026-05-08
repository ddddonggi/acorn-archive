"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createNote, getNotesByCategory, NoteCategory, StoredNote, uploadNoteImage } from "@/lib/notes";

const NOTES_PER_PAGE = 18;

const TEMPLATE: Record<NoteCategory, string> = {
  music: "/image_music.png",
  media: "/back_media.png",
  video: "/image_poster.png",
};

// Shelf overlay geometry — recalculated for 1.2× scale, 15% top / 5% bottom crop
// Formula: container_% = image_% × 1.2 + offset  (x_offset=-10%, y_offset=-15%)
const SHELF = {
  left: "14%",
  top: "29%",
  right: "16%",
  bottom: "6%",
  columnGap: "1.4%",
  rowGap: "1.4%",
  row1CenterTop: "43%",
  arrowInset: "1.5%",
  arrowSize: "3.2%",
} as const;

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

// ─── Note Slot ───────────────────────────────────────────────────────────────

function NoteSlot({
  note,
  categoryKey,
  onSelect,
}: {
  note: StoredNote | null;
  categoryKey: NoteCategory;
  onSelect: (n: StoredNote) => void;
}) {
  if (!note) return <div style={{ flex: 1, height: "100%" }} />;

  const templateSrc = TEMPLATE[categoryKey];
  const hasImage = !!note.imageUrl;

  // CSS mask aligns with object-fit: contain + object-position: bottom center
  const maskStyle: React.CSSProperties = hasImage
    ? {
      maskImage: `url(${templateSrc})`,
      maskSize: "contain",
      maskPosition: "bottom center",
      maskRepeat: "no-repeat",
      WebkitMaskImage: `url(${templateSrc})`,
      WebkitMaskSize: "contain",
      WebkitMaskPosition: "bottom center",
      WebkitMaskRepeat: "no-repeat",
    }
    : {};

  return (
    <div
      className="group relative flex items-end justify-center cursor-pointer"
      style={{ flex: 1, height: "100%", paddingBottom: "2px" }}
      onClick={() => onSelect(note)}
    >
      {/* Card — isolation prevents shelf from polluting the multiply blend */}
      <div
        className="relative transition-transform duration-150 group-hover:scale-105 group-hover:-translate-y-1"
        style={{ width: "88%", height: "90%", isolation: "isolate" }}
      >
        {/* User image masked to the note's transparent-background shape */}
        {hasImage && (
          <img
            src={note.imageUrl!}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              ...maskStyle,
            }}
          />
        )}

        {/* Template — multiply blend: light areas reveal user image, dark areas show template detail */}
        <img
          src={templateSrc}
          alt=""
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "bottom center",
            mixBlendMode: "multiply",
          }}
        />

        {/* 띠지 (band) — media category, only when user image is present */}
        {categoryKey === "media" && hasImage && (
          <img
            src="/bookmark.png"
            alt=""
            style={{
              position: "absolute",
              width: "83.33%",        // 5/6 길이
              right: 0,               // 오른쪽 끝 기준 (왼쪽이면 left: 0)
              top: "8%",              // 세로 시작 위치 (조정 가능)
              transform: "rotate(90deg)",
              transformOrigin: "right top",  // 오른쪽 상단을 pivot으로 회전
              zIndex: 2,
            }}
          />
        )}
      </div>

      {/* Title overlay */}
      <div className="absolute top-8 left-0 right-0 flex justify-center pointer-events-none px-0.5">
        <span
          style={{
            color: "white",
            fontWeight: 800,
            fontSize: "clamp(17px, 1.7vw, 18px)",
            textAlign: "center",
            lineHeight: 1.2,
            textShadow: "0 1px 3px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.8)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            maxWidth: "95%",
            wordBreak: "break-word",
          }}
        >
          {note.title}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function CategoryNotes({ categoryKey, category }: CategoryNotesProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<StoredNote[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedNote, setSelectedNote] = useState<StoredNote | null>(null);
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
    loadNotes();
    async function loadNotes() {
      setIsLoading(true);
      setNotes(await getNotesByCategory(categoryKey));
      setIsLoading(false);
    }
    window.addEventListener("acorn-notes-changed", loadNotes);
    return () => window.removeEventListener("acorn-notes-changed", loadNotes);
  }, [categoryKey, router]);

  const totalPages = Math.max(1, Math.ceil(notes.length / NOTES_PER_PAGE));
  const pageNotes = notes.slice(currentPage * NOTES_PER_PAGE, (currentPage + 1) * NOTES_PER_PAGE);

  function getSlotNote(i: number): StoredNote | null {
    return pageNotes[i] ?? null;
  }

  function openModal() {
    setTitle(""); setArtist(""); setPhotoFile(null); setPhotoPreview(null); setMessage("");
    setIsModalOpen(true);
  }
  function closeModal() {
    setIsModalOpen(false);
    setTitle(""); setArtist(""); setPhotoFile(null); setPhotoPreview(null); setMessage("");
  }
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) { setMessage("제목을 입력해 주세요."); return; }
    setIsSubmitting(true);
    const note = await createNote(categoryKey, title, artist, "");
    if (!note) { router.push("/login"); return; }
    if (photoFile) await uploadNoteImage(note.id, photoFile);
    setNotes(await getNotesByCategory(categoryKey));
    setIsSubmitting(false);
    closeModal();
  }

  return (
    <main className="page-shell" style={{ padding: "0px" }}>

      {/* ── Bookshelf (full-page background) ── */}
      {isLoading ? (
        <div className="flex items-center justify-center h-56 text-[#6b4b35] font-semibold">
          노트를 불러오는 중이에요...
        </div>
      ) : (
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: "2752 / 1536",
            maxHeight: "calc(100vh - 73px)",
            backgroundImage: "url('/bookshelf.png')",
            backgroundSize: "140% 140%",
            backgroundPosition: "50% 75%",
          }}
        >
          {/* Header overlaid on background */}
          <div
            className="flex items-start justify-between"
            style={{ position: "absolute", top: "3%", left: "2%", right: "2%", zIndex: 10 }}
          >
            <div>
              <p className="text-[1.7rem] font-bold uppercase tracking-[0.15em] text-[#3f2a1d]">
                {category.label} 창고
              </p>
              <h1 className="mt-0 text-[2.7rem] font-black text-[#3f2a1d]">{category.mood}</h1>
            </div>
            <button
              type="button"
              onClick={openModal}
              className="flex-shrink-0 h-11 w-11 flex items-center justify-center rounded-full bg-[#8a5a2f] text-2xl text-[#fff8eb] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#754a27]"
              aria-label="새 감상 노트 만들기"
            >
              +
            </button>
          </div>

          {/* Note grid overlay — sits over the 3×3 cell area */}
          <div
            style={{
              position: "absolute",
              left: SHELF.left,
              top: SHELF.top,
              right: SHELF.right,
              bottom: SHELF.bottom,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gridTemplateRows: "repeat(3, 1fr)",
              columnGap: SHELF.columnGap,
              rowGap: SHELF.rowGap,
            }}
          >
            {[0, 1, 2].map((row) =>
              [0, 1, 2].map((col) => (
                <div
                  key={`${row}-${col}`}
                  style={{ display: "flex", gap: "3%" }}
                >
                  <NoteSlot
                    note={getSlotNote(row * 6 + col * 2)}
                    categoryKey={categoryKey}
                    onSelect={setSelectedNote}
                  />
                  <NoteSlot
                    note={getSlotNote(row * 6 + col * 2 + 1)}
                    categoryKey={categoryKey}
                    onSelect={setSelectedNote}
                  />
                </div>
              ))
            )}
          </div>

          {/* Navigation arrows — flanking row 1, inside the outer wooden frame */}
          <button
            aria-label="이전 책장"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            style={{
              position: "absolute",
              left: SHELF.arrowInset,
              top: SHELF.row1CenterTop,
              transform: "translateY(-50%)",
              width: SHELF.arrowSize,
              aspectRatio: "1 / 1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              background: "rgba(80,40,10,0.72)",
              color: "#f5e8c0",
              fontSize: "clamp(12px, 1.8vw, 22px)",
              lineHeight: 1,
              border: "none",
              cursor: currentPage === 0 ? "default" : "pointer",
              opacity: currentPage === 0 ? 0.25 : 1,
              transition: "background 0.15s",
            }}
          >
            ‹
          </button>
          <button
            aria-label="다음 책장"
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            style={{
              position: "absolute",
              right: SHELF.arrowInset,
              top: SHELF.row1CenterTop,
              transform: "translateY(-50%)",
              width: SHELF.arrowSize,
              aspectRatio: "1 / 1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              background: "rgba(80,40,10,0.72)",
              color: "#f5e8c0",
              fontSize: "clamp(12px, 1.8vw, 22px)",
              lineHeight: 1,
              border: "none",
              cursor: currentPage >= totalPages - 1 ? "default" : "pointer",
              opacity: currentPage >= totalPages - 1 ? 0.25 : 1,
              transition: "background 0.15s",
            }}
          >
            ›
          </button>
        </div>
      )}

      {/* ── Note Detail Popup ── */}
      {selectedNote && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-[#3f2a1d]/40 p-5"
          onClick={() => setSelectedNote(null)}
        >
          <section
            className="warm-panel w-full max-w-md rounded-[24px] p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#697a4c]">{category.label}</p>
                <h2 className="mt-2 text-2xl font-black text-[#3f2a1d]">{selectedNote.title}</h2>
                {selectedNote.artist && (
                  <p className="mt-1 text-sm font-semibold text-[#8a5a2f]">{selectedNote.artist}</p>
                )}
                <p className="mt-3 text-sm text-[#6b4b35]">생성 날짜: {formatDate(selectedNote.createdAt)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNote(null)}
                className="flex-shrink-0 rounded-full border border-[#8a5a2f]/20 px-3 py-1 text-sm font-bold text-[#5b351f]"
              >
                닫기
              </button>
            </div>
            {selectedNote.imageUrl && (
              <img
                src={selectedNote.imageUrl}
                alt={selectedNote.title}
                className="mt-4 w-full rounded-xl object-cover max-h-48"
              />
            )}
            <a
              href={`/notes/${selectedNote.id}`}
              className="mt-4 block w-full rounded-2xl bg-[#8a5a2f] px-4 py-3 text-center font-bold text-[#fff8eb]"
            >
              노트 상세 보기
            </a>
          </section>
        </div>
      )}

      {/* ── New Note Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-[#3f2a1d]/40 p-5">
          <section className="warm-panel w-full max-w-md rounded-[24px] p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#697a4c]">새 감상 노트</p>
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
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                className="w-full rounded-2xl border border-[#8a5a2f]/20 bg-[#fff8eb] px-4 py-3 outline-none"
                placeholder="아티스트 / 감독 (선택)"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-dashed border-[#8a5a2f]/30 bg-[#fff8eb] px-4 py-3 text-left transition hover:border-[#8a5a2f]/60"
              >
                {photoPreview ? (
                  <>
                    <img src={photoPreview} alt="미리보기" className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />
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
              {message && <p className="text-sm font-semibold text-[#8a5a2f]">{message}</p>}
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
      )}
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
