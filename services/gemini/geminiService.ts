import { ENV } from "../../config/env";

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

export async function generateGeminiContent(args: {
  instruction: string;
  input: unknown;
}): Promise<string> {
  const apiKey = ENV.GEMINI_API_KEY;
  const model = ENV.GEMINI_MODEL;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { text: args.instruction },
          { text: JSON.stringify(args.input) },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as GeminiGenerateContentResponse;

  const text =
    json?.candidates?.[0]?.content?.parts?.map((p) => p?.text).join("") ?? "";

  if (!text) {
    throw new Error("Gemini returned empty content");
  }

  return text;
}
