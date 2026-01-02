import { ENV } from "../../config/env";

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

/**
 * Extract JSON from a string that may contain markdown code blocks
 */
function extractJson(text: string): string {
  // Remove markdown code blocks if present
  let cleaned = text.trim();

  // Handle ```json ... ``` or ``` ... ```
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  // Try to find JSON object or array
  const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    cleaned = jsonMatch[1];
  }

  return cleaned;
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
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
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

  // Extract and return clean JSON
  return extractJson(text);
}
