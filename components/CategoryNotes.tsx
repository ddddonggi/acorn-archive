"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createNote, getNotesByCategory, NoteCategory, StoredNote, uploadNoteImage } from "@/lib/notes";

const NOTES_PER_PAGE = 18;
const SHELF_ROW_HEIGHT = 172; // px, height of each of the 3 shelf rows
const SHELF_DIVIDER = 13;     // px, thickness of shelf boards and vertical dividers
const SHELF_FRAME = 20;       // px, outer frame padding

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

// ─── SVG Note Templates ──────────────────────────────────────────────────────

function MusicNote({ note }: { note: StoredNote }) {
  const id = note.id.replace(/[^a-z0-9]/gi, "");
  const imageUrl = note.imageUrl;
  return (
    <svg viewBox="0 0 150 90" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <defs>
        <clipPath id={`aClip-${id}`}>
          <rect x="2" y="5" width="70" height="70" rx="3" />
        </clipPath>
      </defs>
      {/* Vinyl record — rendered first (behind sleeve) */}
      <circle cx="108" cy="45" r="42" fill="#1c1c1c" />
      {[36, 30, 24, 18, 12].map((r) => (
        <circle key={r} cx="108" cy="45" r={r} fill="none" stroke="#2e2e2e" strokeWidth="0.8" />
      ))}
      {/* Center label */}
      <circle cx="108" cy="45" r="10" fill="#d95f2b" />
      <circle cx="108" cy="45" r="5.5" fill="#6db83a" />
      <circle cx="108" cy="45" r="2" fill="#111" />
      {/* Album sleeve (in front) */}
      <rect x="2" y="5" width="70" height="70" rx="3" fill="white" stroke="#d0d0d0" strokeWidth="1.5" />
      {imageUrl && (
        <image
          href={imageUrl}
          x="2" y="5" width="70" height="70"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#aClip-${id})`}
        />
      )}
      {/* Sleeve edge shadow */}
      <rect x="2" y="5" width="70" height="70" rx="3" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="3" />
    </svg>
  );
}

function MediaNote({ note }: { note: StoredNote }) {
  const id = note.id.replace(/[^a-z0-9]/gi, "");
  const imageUrl = note.imageUrl;
  return (
    <svg viewBox="0 0 78 112" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <defs>
        <clipPath id={`bClip-${id}`}>
          <rect x="11" y="2" width="65" height="108" rx="2" />
        </clipPath>
        <linearGradient id={`bSpine-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,0.22)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      {/* Book body */}
      <rect x="11" y="2" width="65" height="108" rx="2" fill="white" stroke="#d4d4d4" strokeWidth="1.5" />
      {imageUrl && (
        <image
          href={imageUrl}
          x="11" y="2" width="65" height="108"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#bClip-${id})`}
        />
      )}
      {/* Spine */}
      <rect x="2" y="4" width="11" height="104" rx="2" fill="#ececec" stroke="#d4d4d4" strokeWidth="1" />
      {/* Spine shadow on body */}
      <rect x="11" y="4" width="7" height="104" fill={`url(#bSpine-${id})`} />
      {/* 띠지 (band) — only when image is present */}
      {imageUrl && (
        <>
          <rect x="11" y="40" width="65" height="32" fill="rgba(255,255,255,0.88)" />
          <line x1="11" y1="43" x2="76" y2="43" stroke="#aaa" strokeWidth="0.6" />
          <line x1="11" y1="69" x2="76" y2="69" stroke="#aaa" strokeWidth="0.6" />
        </>
      )}
    </svg>
  );
}

function VideoNote({ note }: { note: StoredNote }) {
  const id = note.id.replace(/[^a-z0-9]/gi, "");
  const imageUrl = note.imageUrl;
  return (
    <svg viewBox="0 0 78 112" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <defs>
        <clipPath id={`cClip-${id}`}>
          <rect x="13" y="13" width="52" height="86" />
        </clipPath>
      </defs>
      {/* Outer frame */}
      <rect x="2" y="2" width="74" height="108" rx="3" fill="white" stroke="#1c1c1c" strokeWidth="2.5" />
      {/* Inner decorative border */}
      <rect x="7" y="7" width="64" height="98" rx="1" fill="none" stroke="#2c2c2c" strokeWidth="1.2" />
      {/* Picture area */}
      <rect x="13" y="13" width="52" height="86" fill="#f2f2f2" />
      {imageUrl && (
        <image
          href={imageUrl}
          x="13" y="13" width="52" height="86"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#cClip-${id})`}
        />
      )}
      {/* Corner brackets */}
      <path d="M7,7 L15,7 M7,7 L7,15" stroke="#222" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M71,7 L63,7 M71,7 L71,15" stroke="#222" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M7,105 L15,105 M7,105 L7,97" stroke="#222" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M71,105 L63,105 M71,105 L71,97" stroke="#222" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

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
  if (!note) return <div style={{ width: "100%", height: "100%" }} />;

  return (
    <div
      className="relative flex flex-col items-center justify-end cursor-pointer group"
      style={{ width: "100%", height: "100%", paddingBottom: "2px" }}
      onClick={() => onSelect(note)}
    >
      {/* Note graphic */}
      <div
        className="transition-transform duration-150 group-hover:scale-105 group-hover:-translate-y-1"
        style={{ width: "88%", height: "88%" }}
      >
        {categoryKey === "music" && <MusicNote note={note} />}
        {categoryKey === "media" && <MediaNote note={note} />}
        {categoryKey === "video" && <VideoNote note={note} />}
      </div>
      {/* Title overlay */}
      <div
        className="absolute bottom-0.5 left-0 right-0 flex justify-center pointer-events-none px-0.5"
      >
        <span
          className="text-white font-bold text-center leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]"
          style={{
            fontSize: "clamp(7px, 0.9vw, 10px)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            maxWidth: "100%",
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

  function getSlotNote(slotIndex: number): StoredNote | null {
    return pageNotes[slotIndex] ?? null;
  }

  function openModal() {
    setTitle(""); setArtist(""); setPhotoFile(null); setPhotoPreview(null); setMessage("");
    setIsModalOpen(true);
  }
  function closeModal() {
    setIsModalOpen(false); setTitle(""); setArtist(""); setPhotoFile(null); setPhotoPreview(null); setMessage("");
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

  // Arrow vertical center = top frame + row 0 height + shelf board + half of row 1
  const arrowTop = SHELF_FRAME + SHELF_ROW_HEIGHT + SHELF_DIVIDER + SHELF_ROW_HEIGHT / 2;

  return (
    <main className="page-shell">
      <div className="mx-auto" style={{ maxWidth: "1200px" }}>

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-4 px-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#697a4c]">
              {category.label} 창고
            </p>
            <h1 className="mt-2 text-[1.9rem] font-black text-[#3f2a1d]">{category.mood}</h1>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-full bg-[#8a5a2f] text-2xl text-[#fff8eb] shadow-lg transition hover:-translate-y-0.5 hover:bg-[#754a27]"
            aria-label="새 감상 노트 만들기"
          >
            +
          </button>
        </div>

        {/* ── Bookshelf ── */}
        {isLoading ? (
          <div className="flex items-center justify-center h-56 text-[#6b4b35] font-semibold">
            노트를 불러오는 중이에요...
          </div>
        ) : (
          /* px-14 → leaves 56px on each side for nav arrows */
          <div className="relative px-14">

            {/* Outer wood frame */}
            <div
              className="relative rounded-[6px] overflow-hidden"
              style={{
                background: "linear-gradient(170deg, #8a5528 0%, #7a4820 55%, #6a3c1a 100%)",
                padding: `${SHELF_FRAME}px ${SHELF_FRAME}px 0`,
                boxShadow: "0 14px 52px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,210,130,0.28), inset 0 -2px 6px rgba(0,0,0,0.25)",
              }}
            >
              {/* Inner back wall */}
              <div
                className="rounded-t-sm overflow-hidden"
                style={{
                  background: "linear-gradient(165deg, #f6e9c2 0%, #eed9a0 55%, #e5cc8e 100%)",
                }}
              >
                {/* 3 rows */}
                {[0, 1, 2].map((rowIdx) => (
                  <div key={rowIdx}>
                    {/* Row — 3 cells, each cell has 2 slots */}
                    <div
                      className="flex"
                      style={{
                        height: `${SHELF_ROW_HEIGHT}px`,
                        background: "radial-gradient(ellipse at 50% 100%, rgba(255,200,90,0.16), transparent 68%)",
                      }}
                    >
                      {[0, 1, 2].map((cellIdx) => (
                        <div key={cellIdx} className="flex flex-1 min-w-0">
                          {/* Left slot */}
                          <div className="flex-1 min-w-0" style={{ padding: "5px 3px 0 4px" }}>
                            <NoteSlot
                              note={getSlotNote(rowIdx * 6 + cellIdx * 2)}
                              categoryKey={categoryKey}
                              onSelect={setSelectedNote}
                            />
                          </div>
                          {/* Right slot */}
                          <div className="flex-1 min-w-0" style={{ padding: "5px 4px 0 3px" }}>
                            <NoteSlot
                              note={getSlotNote(rowIdx * 6 + cellIdx * 2 + 1)}
                              categoryKey={categoryKey}
                              onSelect={setSelectedNote}
                            />
                          </div>
                          {/* Vertical divider (after cells 0 and 1) */}
                          {cellIdx < 2 && (
                            <div
                              style={{
                                width: `${SHELF_DIVIDER}px`,
                                flexShrink: 0,
                                background: "linear-gradient(90deg, #6a3c1a 0%, #7a4820 50%, #6a3c1a 100%)",
                                boxShadow: "inset 1px 0 2px rgba(255,210,130,0.12), inset -1px 0 2px rgba(0,0,0,0.18)",
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Horizontal shelf board (between rows) */}
                    {rowIdx < 2 && (
                      <div
                        style={{
                          height: `${SHELF_DIVIDER}px`,
                          background: "linear-gradient(180deg, #7a4820 0%, #8a5528 45%, #6a3c1a 100%)",
                          boxShadow: "0 3px 8px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,210,130,0.18)",
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
              {/* Bottom shelf board */}
              <div
                style={{
                  height: "18px",
                  background: "linear-gradient(180deg, #7a4820 0%, #9a6030 45%, #7a4820 100%)",
                  boxShadow: "0 5px 14px rgba(0,0,0,0.32)",
                  borderRadius: "0 0 4px 4px",
                }}
              />
            </div>

            {/* Navigation arrows (vertically centered on row 1) */}
            <button
              className="absolute flex items-center justify-center rounded-full bg-[#6a3c1a]/80 text-[#f5e8c0] hover:bg-[#6a3c1a] transition"
              style={{
                left: "8px",
                top: `${arrowTop}px`,
                transform: "translateY(-50%)",
                width: "36px",
                height: "36px",
                fontSize: "24px",
                lineHeight: 1,
                opacity: currentPage === 0 ? 0.25 : 1,
              }}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              aria-label="이전 책장"
            >
              ‹
            </button>
            <button
              className="absolute flex items-center justify-center rounded-full bg-[#6a3c1a]/80 text-[#f5e8c0] hover:bg-[#6a3c1a] transition"
              style={{
                right: "8px",
                top: `${arrowTop}px`,
                transform: "translateY(-50%)",
                width: "36px",
                height: "36px",
                fontSize: "24px",
                lineHeight: 1,
                opacity: currentPage >= totalPages - 1 ? 0.25 : 1,
              }}
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              aria-label="다음 책장"
            >
              ›
            </button>
          </div>
        )}
      </div>

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
