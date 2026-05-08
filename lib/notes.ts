import { getCurrentUser } from "@/lib/auth";

export type NoteCategory = "music" | "media" | "video";

export type NoteSummary = {
  title: string;
  oneLine: string;
  body: string;
  keywords: string[];
  emotions: string[];
  savedAt: string;
};

export type StoredNote = {
  id: string;
  userId: string;
  category: NoteCategory;
  title: string;
  createdAt: string;
  updatedAt: string;
  summary?: NoteSummary;
};

const NOTES_KEY = "acorn_notes";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getNotes(): StoredNote[] {
  if (!isBrowser()) {
    return [];
  }

  const rawNotes = window.localStorage.getItem(NOTES_KEY);

  if (!rawNotes) {
    return [];
  }

  try {
    return JSON.parse(rawNotes) as StoredNote[];
  } catch {
    return [];
  }
}

export function getNotesByCategory(category: NoteCategory) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return [];
  }

  return getNotes()
    .filter((note) => note.userId === currentUser.username && note.category === category)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getNoteById(noteId: string) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return null;
  }

  return (
    getNotes().find((note) => note.id === noteId && note.userId === currentUser.username) ??
    null
  );
}

export function createNote(category: NoteCategory, title: string) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const now = new Date().toISOString();
  const note: StoredNote = {
    id: `${category}-${Date.now()}`,
    userId: currentUser.username,
    category,
    title: title.trim(),
    createdAt: now,
    updatedAt: now,
  };

  window.localStorage.setItem(NOTES_KEY, JSON.stringify([...getNotes(), note]));
  window.dispatchEvent(new Event("acorn-notes-changed"));

  return note;
}

export function updateNoteSummary(noteId: string, summary: Omit<NoteSummary, "savedAt">) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const notes = getNotes();
  const targetNote = notes.find(
    (note) => note.id === noteId && note.userId === currentUser.username,
  );

  if (!targetNote) {
    return null;
  }

  const now = new Date().toISOString();
  const nextNote: StoredNote = {
    ...targetNote,
    updatedAt: now,
    summary: {
      ...summary,
      savedAt: now,
    },
  };

  window.localStorage.setItem(
    NOTES_KEY,
    JSON.stringify(notes.map((note) => (note.id === noteId ? nextNote : note))),
  );
  window.dispatchEvent(new Event("acorn-notes-changed"));

  return nextNote;
}
