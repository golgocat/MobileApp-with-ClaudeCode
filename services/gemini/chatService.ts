import { ENV } from "../../config/env";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface GeminiChatResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

export interface DayContext {
  date: string;
  destination: string;
  riskLevel: string;
  advice: string;
  rationale: string;
  forecast: {
    precipProbDay: number | null;
    precipProbNight: number | null;
    tempMin: number | null;
    tempMax: number | null;
  } | null;
}

function buildSystemPrompt(context: DayContext): string {
  return `You are a helpful travel weather assistant. The user is asking about their trip to ${context.destination} on ${context.date}.

Current weather assessment for this date:
- Risk Level: ${context.riskLevel}
- Advice: ${context.advice}
- Rationale: ${context.rationale}
${context.forecast ? `
Weather Forecast:
- Day precipitation probability: ${context.forecast.precipProbDay ?? 'N/A'}%
- Night precipitation probability: ${context.forecast.precipProbNight ?? 'N/A'}%
- Temperature: ${context.forecast.tempMin ?? 'N/A'}°C to ${context.forecast.tempMax ?? 'N/A'}°C
` : ''}

Answer the user's questions helpfully and concisely. Focus on practical travel advice related to weather. If asked about activities, suggest weather-appropriate options. Keep responses brief and friendly.`;
}

export async function sendChatMessage(args: {
  message: string;
  context: DayContext;
  history: ChatMessage[];
}): Promise<string> {
  const { message, context, history } = args;
  const apiKey = ENV.GEMINI_API_KEY;
  const model = ENV.GEMINI_MODEL;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  // Build conversation history for context
  const contents = [
    {
      role: "user",
      parts: [{ text: buildSystemPrompt(context) }],
    },
    {
      role: "model",
      parts: [{ text: `I understand. I'm here to help you with questions about your trip to ${context.destination} on ${context.date}. What would you like to know?` }],
    },
    // Add previous messages
    ...history.slice(-10).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    })),
    // Add current message
    {
      role: "user",
      parts: [{ text: message }],
    },
  ];

  const body = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
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

  const json = (await res.json()) as GeminiChatResponse;
  const responseText =
    json?.candidates?.[0]?.content?.parts?.map((p) => p?.text).join("") ?? "";

  if (!responseText) {
    throw new Error("Gemini returned empty response");
  }

  return responseText;
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
