import { getCurrentUser } from "@/lib/auth";
import type { GeneratedSummary } from "@/lib/summary";

export type NoteCategory = "music" | "media" | "video";

export type NoteSummary = GeneratedSummary & {
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

export async function getNotesByCategory(category: NoteCategory) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return [];
  }

  const response = await fetch(
    `/api/notes?username=${encodeURIComponent(currentUser.username)}&category=${category}`,
  );
  const data = (await response.json()) as { notes?: StoredNote[] };

  return data.notes ?? [];
}

export async function getNoteById(noteId: string) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const response = await fetch(
    `/api/notes/${encodeURIComponent(noteId)}?username=${encodeURIComponent(currentUser.username)}`,
  );
  const data = (await response.json()) as { note?: StoredNote | null };

  return data.note ?? null;
}

export async function createNote(category: NoteCategory, title: string) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const response = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: currentUser.username,
      category,
      title: title.trim(),
    }),
  });
  const data = (await response.json()) as { note?: StoredNote | null };

  window.dispatchEvent(new Event("acorn-notes-changed"));

  return data.note ?? null;
}
