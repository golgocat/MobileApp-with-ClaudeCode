import { DayForecast, Destination, Itinerary } from "../../types/travel.types";

export function buildRainRiskPrompt(args: {
  destination: Destination;
  itinerary: Itinerary;
  forecasts: DayForecast[];
}) {
  const { destination, itinerary, forecasts } = args;

  const schemaHint = {
    modelVersion: "travel_rain_risk_v1",
    timezone: destination.timezone,
    days: [
      {
        date: "YYYY-MM-DD",
        riskLevel: "LOW|MEDIUM|HIGH|EXTREME",
        expectedRainMmRange: { min: 0, max: 0 },
        confidence: 0.0,
        advice: "string",
        rationale: "string",
        flags: ["string"],
      },
    ],
  };

  const instruction = `
You are a travel rain-risk analyst.
Return JSON only. Do not use markdown. Do not wrap in code fences. Do not add any extra text.

Rules:
- Evaluate only dates between ${itinerary.startDate} and ${itinerary.endDate} inclusive.
- Use destination timezone: ${destination.timezone}.
- If rainfall amount cannot be inferred from the input forecast fields, set expectedRainMmRange to null. Do not guess.
- riskLevel must be one of: LOW, MEDIUM, HIGH, EXTREME.
  - LOW: <20% precipitation probability
  - MEDIUM: 20-50% precipitation probability
  - HIGH: 50-80% precipitation probability
  - EXTREME: >80% precipitation probability or heavy rain expected
- confidence must be between 0 and 1.
- Keep advice and rationale short, practical, and specific.
- flags should include relevant warnings like "monsoon_season", "flash_flood_risk", "outdoor_activities_affected", etc.

Output must match this shape exactly:
${JSON.stringify(schemaHint, null, 2)}
`.trim();

  const input = {
    destination: {
      name: destination.displayName,
      countryCode: destination.countryCode,
      timezone: destination.timezone,
    },
    itinerary: {
      startDate: itinerary.startDate,
      endDate: itinerary.endDate,
    },
    forecastDays: forecasts.map((f) => ({
      date: f.date,
      precipProbabilityDay: f.precipProbabilityDay,
      precipProbabilityNight: f.precipProbabilityNight,
      precipAmountMmDay: f.precipAmountMmDay,
      precipAmountMmNight: f.precipAmountMmNight,
      tempMinC: f.tempMinC,
      tempMaxC: f.tempMaxC,
    })),
  };

  return { instruction, input };
}
