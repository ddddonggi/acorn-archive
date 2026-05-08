import { getCurrentUser } from "@/lib/auth";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  noteId: string;
  userId: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export async function getMessagesByNoteId(noteId: string) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return [];
  }

  const response = await fetch(
    `/api/messages?username=${encodeURIComponent(currentUser.username)}&noteId=${encodeURIComponent(noteId)}`,
  );
  const data = (await response.json()) as { messages?: ChatMessage[] };

  return data.messages ?? [];
}

export async function appendMessages(
  noteId: string,
  messages: Pick<ChatMessage, "role" | "content">[],
) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return [];
  }

  const response = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: currentUser.username,
      noteId,
      messages,
    }),
  });
  const data = (await response.json()) as { messages?: ChatMessage[] };

  window.dispatchEvent(new Event("acorn-chat-changed"));

  return data.messages ?? [];
}
