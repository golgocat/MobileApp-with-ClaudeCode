import { ENV } from "../../config/env";
import { HourlyForecast } from "../../types/travel.types";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

export interface DaySummaryFacts {
  date: string;
  locationName: string;
  tempMin: number | null;
  tempMax: number | null;
  peakPrecipTime: string | null;
  peakPrecipProbability: number | null;
  rainWindow: string | null;
  totalPrecipMm: number | null;
  condition: string | null;
}

/**
 * Compute summary facts from hourly forecast data
 */
export function computeDaySummaryFacts(
  date: string,
  locationName: string,
  hourlyData: HourlyForecast[],
  dayForecast?: {
    tempMinC: number | null;
    tempMaxC: number | null;
    precipAmountMmDay: number | null;
    precipAmountMmNight: number | null;
    iconPhraseDay?: string;
  }
): DaySummaryFacts {
  // Calculate from hourly data
  let tempMin: number | null = null;
  let tempMax: number | null = null;
  let peakPrecipTime: string | null = null;
  let peakPrecipProbability: number | null = null;

  if (hourlyData.length > 0) {
    const temps = hourlyData.map(h => h.temperature);
    tempMin = Math.min(...temps);
    tempMax = Math.max(...temps);

    // Find peak precipitation
    const maxPrecipHour = hourlyData.reduce((max, h) =>
      h.precipProbability > (max?.precipProbability ?? 0) ? h : max
    , hourlyData[0]);

    if (maxPrecipHour.precipProbability > 0) {
      peakPrecipTime = maxPrecipHour.localTime;
      peakPrecipProbability = maxPrecipHour.precipProbability;
    }
  }

  // Override with day forecast if available
  if (dayForecast) {
    if (dayForecast.tempMinC !== null) tempMin = dayForecast.tempMinC;
    if (dayForecast.tempMaxC !== null) tempMax = dayForecast.tempMaxC;
  }

  // Calculate rain window (consecutive hours with >30% probability)
  let rainWindow: string | null = null;
  const rainyHours = hourlyData.filter(h => h.precipProbability >= 30);
  if (rainyHours.length >= 2) {
    const startTime = rainyHours[0].localTime;
    const endTime = rainyHours[rainyHours.length - 1].localTime;
    rainWindow = `${startTime} - ${endTime}`;
  } else if (rainyHours.length === 1) {
    rainWindow = `around ${rainyHours[0].localTime}`;
  }

  // Total precipitation
  let totalPrecipMm: number | null = null;
  if (dayForecast) {
    const dayMm = dayForecast.precipAmountMmDay ?? 0;
    const nightMm = dayForecast.precipAmountMmNight ?? 0;
    if (dayMm > 0 || nightMm > 0) {
      totalPrecipMm = dayMm + nightMm;
    }
  }

  return {
    date,
    locationName,
    tempMin,
    tempMax,
    peakPrecipTime,
    peakPrecipProbability,
    rainWindow,
    totalPrecipMm,
    condition: dayForecast?.iconPhraseDay ?? null,
  };
}

/**
 * Generate an AI summary for a specific day using Gemini
 */
export async function generateDaySummary(facts: DaySummaryFacts): Promise<string> {
  const apiKey = ENV.GEMINI_API_KEY;
  const model = ENV.GEMINI_MODEL;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const factsJson = JSON.stringify({
    date: facts.date,
    location: facts.locationName,
    temperatureRange: facts.tempMin !== null && facts.tempMax !== null
      ? `${Math.round(facts.tempMin)}°C to ${Math.round(facts.tempMax)}°C`
      : "unavailable",
    peakRainTime: facts.peakPrecipTime ?? "none expected",
    peakRainProbability: facts.peakPrecipProbability !== null
      ? `${facts.peakPrecipProbability}%`
      : "0%",
    rainWindow: facts.rainWindow ?? "no significant rain expected",
    totalPrecipitation: facts.totalPrecipMm !== null
      ? `${facts.totalPrecipMm.toFixed(1)} mm`
      : "minimal",
    condition: facts.condition ?? "fair",
  }, null, 2);

  const prompt = `Using the forecast facts below, write 2-3 sentences in English. Mention the temperature range and when rain is most likely or heaviest. Add one practical tip for the day. No emojis, no bullet points, no markdown formatting.

Forecast facts:
${factsJson}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 512,
      stopSequences: [],
    },
    systemInstruction: {
      parts: [{
        text: "You are a concise weather assistant for a mobile app. Write brief, practical daily forecast summaries. Never use emojis, markdown, or bullet points. Focus on temperature, rain timing, and one actionable tip. Always write complete sentences that end with proper punctuation."
      }]
    }
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

  const json = (await res.json()) as GeminiResponse;
  const responseText =
    json?.candidates?.[0]?.content?.parts?.map((p) => p?.text).join("") ?? "";

  if (!responseText) {
    throw new Error("Gemini returned empty response");
  }

  const trimmed = responseText.trim();

  // Check if response appears incomplete (doesn't end with sentence-ending punctuation)
  const endsWithPunctuation = /[.!?]$/.test(trimmed);
  if (!endsWithPunctuation && trimmed.length > 0) {
    // Try to salvage by finding the last complete sentence
    const lastSentenceEnd = Math.max(
      trimmed.lastIndexOf('. '),
      trimmed.lastIndexOf('! '),
      trimmed.lastIndexOf('? '),
      trimmed.lastIndexOf('.'),
      trimmed.lastIndexOf('!'),
      trimmed.lastIndexOf('?')
    );

    if (lastSentenceEnd > trimmed.length * 0.5) {
      // If we found a sentence end past halfway, return up to that point
      return trimmed.substring(0, lastSentenceEnd + 1);
    }
    // Otherwise return what we have - it may still be useful
  }

  return trimmed;
}
