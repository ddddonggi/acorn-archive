import { StoredNote } from "@/lib/notes";

const followUpQuestions = [
  "그 장면이나 분위기가 왜 기억에 남았나요?",
  "주인공이나 화자에게 공감한 부분이 있었나요?",
  "이 작품을 한 단어로 표현하면 무엇인가요?",
  "이 작품이 지금의 나와 연결되는 부분이 있었나요?",
];

export function generateMockAiResponse(userInput: string, note: StoredNote | null) {
  const normalizedInput = userInput.trim();
  const question = followUpQuestions[normalizedInput.length % followUpQuestions.length];
  const title = note?.title ?? "이 작품";

  return `"${title}"에 대해 남겨준 생각이 좋아요. ${pickTone(
    normalizedInput,
  )} 감상이 느껴져요. ${question}`;
}

function pickTone(input: string) {
  if (input.includes("슬") || input.includes("먹먹") || input.includes("외로")) {
    return "조금 먹먹한";
  }

  if (input.includes("좋") || input.includes("따뜻") || input.includes("편안")) {
    return "따뜻하게 남는";
  }

  if (input.includes("이상") || input.includes("낯") || input.includes("궁금")) {
    return "낯설지만 오래 바라보게 되는";
  }

  return "천천히 곱씹고 싶은";
}
