export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

type GeminiGenerateOptions = {
  systemInstruction: string;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
};

type GeminiResponse = {
  candidates?: Array<{
    finishReason?: string;
    finishMessage?: string;
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

export async function generateGeminiText({
  systemInstruction,
  prompt,
  temperature = 0.7,
  maxOutputTokens = 512,
}: GeminiGenerateOptions) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model = process.env.GEMINI_MODEL ?? DEFAULT_GEMINI_MODEL;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemInstruction}\n\n${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API request failed: ${response.status} ${errorText}`);
  }

  const data = (await response.json()) as GeminiResponse;
  const candidate = data.candidates?.[0];
  const finishReason = candidate?.finishReason;
  const text = candidate?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (finishReason && finishReason !== "STOP") {
    throw new Error(
      [
        `Gemini response ended with finishReason=${finishReason}.`,
        candidate?.finishMessage ? `finishMessage=${candidate.finishMessage}` : "",
        text ? `partialResponse=${text}` : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  if (!text) {
    throw new Error("Gemini API returned an empty response.");
  }

  return text;
}

export function extractJsonObject(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  const match = cleaned.match(/\{[\s\S]*\}/);

  return match ? match[0] : cleaned;
}
