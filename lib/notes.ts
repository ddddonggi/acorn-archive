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
  artist: string;
  color: string;
  imageUrl: string | null;
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

export async function createNote(category: NoteCategory, title: string, artist: string = "", color: string = "") {
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
      artist: artist.trim(),
      color,
    }),
  });
  const data = (await response.json()) as { note?: StoredNote | null };

  window.dispatchEvent(new Event("acorn-notes-changed"));

  return data.note ?? null;
}

export async function uploadNoteImage(noteId: string, file: File) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const formData = new FormData();
  formData.append("image", file);
  formData.append("noteId", noteId);
  formData.append("username", currentUser.username);

  const response = await fetch("/api/images", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as { url?: string; note?: StoredNote; error?: string };

  if (!response.ok || !data.note) {
    return null;
  }

  return data.note;
}
