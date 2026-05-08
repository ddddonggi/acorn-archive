import { StoredNote } from "@/lib/notes";

const followUpQuestions = [
  "그 감정이 특히 선명해진 순간은 어디였나요?",
  "그 장면이나 문장을 떠올리면 몸의 감각은 어떤 쪽에 가까웠나요?",
  "처음 기대했던 감상과 다르게 남은 부분이 있었나요?",
  "이 감상이 지금의 나와 연결된다면 어떤 이유일까요?",
];

export function generateMockAiResponse(userInput: string, note: StoredNote | null) {
  const normalizedInput = userInput.trim();
  const question = followUpQuestions[normalizedInput.length % followUpQuestions.length];
  const title = note?.title ?? "이 감상";

  return `"${title}"에서 꺼내준 생각이 좋아요. 지금 말에는 ${pickTone(
    normalizedInput,
  )} 결이 느껴져요. ${question}`;
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
