export function buildRepairPrompt(badOutput: string): string {
  return `
Return JSON only. Do not use markdown. Do not add extra text.
Fix the following output so it matches the required schema exactly.

The schema requires:
- modelVersion: string
- timezone: string
- days: array of objects with:
  - date: YYYY-MM-DD format
  - riskLevel: one of LOW, MEDIUM, HIGH, EXTREME
  - expectedRainMmRange: { min: number, max: number } or null
  - confidence: number between 0 and 1
  - advice: non-empty string
  - rationale: non-empty string
  - flags: array of strings

Output to fix:
${badOutput}
`.trim();
}
