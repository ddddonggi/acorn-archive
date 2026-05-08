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

const CHAT_KEY = "acorn_chat_messages";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getAllMessages(): ChatMessage[] {
  if (!isBrowser()) {
    return [];
  }

  const rawMessages = window.localStorage.getItem(CHAT_KEY);

  if (!rawMessages) {
    return [];
  }

  try {
    return JSON.parse(rawMessages) as ChatMessage[];
  } catch {
    return [];
  }
}

export function getMessagesByNoteId(noteId: string) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return [];
  }

  return getAllMessages()
    .filter((message) => message.noteId === noteId && message.userId === currentUser.username)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function saveMessages(nextMessages: ChatMessage[]) {
  window.localStorage.setItem(CHAT_KEY, JSON.stringify(nextMessages));
  window.dispatchEvent(new Event("acorn-chat-changed"));
}

export function appendMessages(noteId: string, messages: Pick<ChatMessage, "role" | "content">[]) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return [];
  }

  const now = Date.now();
  const nextMessages: ChatMessage[] = messages.map((message, index) => ({
    id: `${noteId}-${now}-${index}`,
    noteId,
    userId: currentUser.username,
    role: message.role,
    content: message.content,
    createdAt: new Date(now + index).toISOString(),
  }));

  const allMessages = getAllMessages();
  saveMessages([...allMessages, ...nextMessages]);

  return nextMessages;
}
