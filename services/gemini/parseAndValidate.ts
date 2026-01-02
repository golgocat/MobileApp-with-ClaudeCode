import { TravelRiskReportSchema, ParsedTravelRiskReport } from "./schema";

function safeJsonParse(text: string): unknown {
  // Gemini sometimes returns leading/trailing whitespace or markdown
  let trimmed = text.trim();

  // Remove markdown code fences if present
  if (trimmed.startsWith("```json")) {
    trimmed = trimmed.slice(7);
  } else if (trimmed.startsWith("```")) {
    trimmed = trimmed.slice(3);
  }
  if (trimmed.endsWith("```")) {
    trimmed = trimmed.slice(0, -3);
  }

  trimmed = trimmed.trim();

  return JSON.parse(trimmed);
}

export function parseAndValidateReport(text: string): ParsedTravelRiskReport {
  const obj = safeJsonParse(text);
  const parsed = TravelRiskReportSchema.parse(obj);
  return parsed;
}
