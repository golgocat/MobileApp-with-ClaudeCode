import { TravelRiskReportSchema, ParsedTravelRiskReport } from "./schema";

/**
 * Extract and parse JSON from a string that may contain extra text or markdown
 */
function safeJsonParse(text: string): unknown {
  let cleaned = text.trim();

  // Remove markdown code fences if present (various formats)
  // Handle ```json ... ```
  const jsonFenceMatch = cleaned.match(/```json\s*([\s\S]*?)```/);
  if (jsonFenceMatch) {
    cleaned = jsonFenceMatch[1].trim();
  } else {
    // Handle ``` ... ```
    const fenceMatch = cleaned.match(/```\s*([\s\S]*?)```/);
    if (fenceMatch) {
      cleaned = fenceMatch[1].trim();
    }
  }

  // Try to extract JSON object if there's extra text around it
  // Find the first { and last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  // Remove any trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

  // Remove any non-printable characters except whitespace
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Try parsing
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Try to fix common issues

    // Sometimes there are unescaped newlines in strings
    // Replace actual newlines inside strings with \n
    const fixedNewlines = cleaned.replace(
      /"([^"\\]|\\.)*"/g,
      (match) => match.replace(/\n/g, '\\n').replace(/\r/g, '\\r')
    );

    try {
      return JSON.parse(fixedNewlines);
    } catch (e2) {
      // Last resort: try to be more aggressive
      // Remove any text before first { and after last }
      const aggressive = cleaned.substring(
        cleaned.indexOf('{'),
        cleaned.lastIndexOf('}') + 1
      );
      return JSON.parse(aggressive);
    }
  }
}

export function parseAndValidateReport(text: string): ParsedTravelRiskReport {
  const obj = safeJsonParse(text);
  const parsed = TravelRiskReportSchema.parse(obj);
  return parsed;
}
