export type AiNoteCategory = "music" | "media" | "video";

export type AiChatNote = {
  id: string;
  title: string;
  category: AiNoteCategory;
};

export type AiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatRequestBody = {
  note: AiChatNote;
  messages: AiChatMessage[];
};

export type ChatResponseBody = {
  message: string;
};
