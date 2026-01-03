import { DayForecast, Destination, Itinerary } from "../../types/travel.types";
import { GeminiJsonSchema } from "./geminiService";

// JSON Schema that matches our TravelRiskReportSchema
// This is passed to Gemini's responseSchema for guaranteed valid JSON
export const TravelRiskResponseSchema: GeminiJsonSchema = {
  type: "object",
  properties: {
    modelVersion: {
      type: "string",
      description: "Version identifier for the model",
    },
    timezone: {
      type: "string",
      description: "Timezone of the destination",
    },
    days: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Date in YYYY-MM-DD format",
          },
          riskLevel: {
            type: "string",
            enum: ["LOW", "MEDIUM", "HIGH", "EXTREME"],
            description: "Risk level for the day",
          },
          expectedRainMmRange: {
            type: "object",
            nullable: true,
            properties: {
              min: {
                type: "number",
                description: "Minimum expected rainfall in mm",
              },
              max: {
                type: "number",
                description: "Maximum expected rainfall in mm",
              },
            },
            required: ["min", "max"],
          },
          confidence: {
            type: "number",
            description: "Confidence level between 0 and 1",
          },
          advice: {
            type: "string",
            description: "Short practical travel advice",
          },
          rationale: {
            type: "string",
            description: "Brief explanation of the risk assessment",
          },
          flags: {
            type: "array",
            items: {
              type: "string",
            },
            description: "Weather warning flags like monsoon_season, flash_flood_risk",
          },
        },
        required: ["date", "riskLevel", "confidence", "advice", "rationale", "flags"],
      },
    },
  },
  required: ["modelVersion", "timezone", "days"],
};

export function buildRainRiskPrompt(args: {
  destination: Destination;
  itinerary: Itinerary;
  forecasts: DayForecast[];
}) {
  const { destination, itinerary, forecasts } = args;

  // Build a summary of each day's precipitation for clarity
  const forecastSummary = forecasts.map((f) => {
    const maxPrecipProb = Math.max(f.precipProbabilityDay ?? 0, f.precipProbabilityNight ?? 0);
    return `${f.date}: Day=${f.precipProbabilityDay ?? 0}%, Night=${f.precipProbabilityNight ?? 0}%, Max=${maxPrecipProb}%`;
  }).join('\n');

  const instruction = `You are a travel weather analyst. Analyze the forecast for ${destination.displayName} from ${itinerary.startDate} to ${itinerary.endDate}.

CRITICAL: Risk level MUST match the precipitation probability data provided. Use the MAXIMUM of day and night precipitation probability:
- LOW: Max precipitation probability 0-19%
- MEDIUM: Max precipitation probability 20-49%
- HIGH: Max precipitation probability 50-79%
- EXTREME: Max precipitation probability 80-100%

DO NOT assign HIGH or EXTREME risk if precipitation probabilities are low. Cold temperatures alone do NOT justify high rain risk.

Here is the precipitation summary:
${forecastSummary}

Provide practical advice based on ACTUAL data. If precipitation is 0%, do NOT mention expecting rain.
Set confidence 0.8-0.95 for near-term forecasts, lower for days further out.
Only include flags like "flash_flood_risk" when precipitation is actually high (>60%).`;

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

  return {
    instruction,
    input,
    responseSchema: TravelRiskResponseSchema,
  };
}
