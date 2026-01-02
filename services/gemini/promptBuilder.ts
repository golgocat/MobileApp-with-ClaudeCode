import { DayForecast, Destination, Itinerary } from "../../types/travel.types";

export function buildRainRiskPrompt(args: {
  destination: Destination;
  itinerary: Itinerary;
  forecasts: DayForecast[];
}) {
  const { destination, itinerary, forecasts } = args;

  const instruction = `You are a travel rain-risk analyst. Analyze the weather forecast and return a JSON risk assessment.

IMPORTANT: Return ONLY valid JSON. No markdown, no code fences, no extra text.

Analyze dates from ${itinerary.startDate} to ${itinerary.endDate} for ${destination.displayName}.

Risk levels based on precipitation probability:
- LOW: <20%
- MEDIUM: 20-50%
- HIGH: 50-80%
- EXTREME: >80%

Return this exact JSON structure:
{
  "modelVersion": "travel_rain_risk_v1",
  "timezone": "${destination.timezone}",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "riskLevel": "LOW",
      "expectedRainMmRange": {"min": 0, "max": 0},
      "confidence": 0.95,
      "advice": "Short practical advice",
      "rationale": "Brief explanation",
      "flags": []
    }
  ]
}

Rules:
- One entry per day in the trip range
- riskLevel must be: LOW, MEDIUM, HIGH, or EXTREME
- confidence: number between 0 and 1
- expectedRainMmRange: object with min/max or null if unknown
- flags: array of strings like "monsoon_season", "flash_flood_risk"
- Keep advice and rationale concise`;

  const input = {
    destination: {
      name: destination.displayName,
      countryCode: destination.countryCode,
      timezone: destination.timezone,
    },
    tripDates: {
      start: itinerary.startDate,
      end: itinerary.endDate,
    },
    forecasts: forecasts.map((f) => ({
      date: f.date,
      precipProbDay: f.precipProbabilityDay,
      precipProbNight: f.precipProbabilityNight,
      precipMmDay: f.precipAmountMmDay,
      precipMmNight: f.precipAmountMmNight,
      tempMin: f.tempMinC,
      tempMax: f.tempMaxC,
    })),
  };

  return { instruction, input };
}
