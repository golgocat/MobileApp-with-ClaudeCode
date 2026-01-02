import { ENV } from "../../config/env";

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

// JSON Schema type for Gemini's responseSchema
export type GeminiJsonSchema = {
  type: string;
  properties?: Record<string, GeminiJsonSchema>;
  items?: GeminiJsonSchema;
  enum?: string[];
  required?: string[];
  nullable?: boolean;
  description?: string;
};

export async function generateGeminiContent(args: {
  instruction: string;
  input: unknown;
  responseSchema?: GeminiJsonSchema;
}): Promise<string> {
  const apiKey = ENV.GEMINI_API_KEY;
  const model = ENV.GEMINI_MODEL;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  // Build generation config with schema enforcement if provided
  const generationConfig: Record<string, unknown> = {
    temperature: 0.2,
    maxOutputTokens: 4096,
  };

  // When responseSchema is provided, Gemini enforces the exact JSON structure
  if (args.responseSchema) {
    generationConfig.responseMimeType = "application/json";
    generationConfig.responseSchema = args.responseSchema;
  }

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
    generationConfig,
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
