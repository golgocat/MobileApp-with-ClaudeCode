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

  // Simplified instruction - schema enforcement handles JSON structure
  const instruction = `You are a travel rain-risk analyst. Analyze the weather forecast data for ${destination.displayName} from ${itinerary.startDate} to ${itinerary.endDate}.

For each day in the trip range, assess the rain risk based on precipitation probability:
- LOW: <20% chance of rain
- MEDIUM: 20-50% chance
- HIGH: 50-80% chance
- EXTREME: >80% chance

Set confidence based on forecast reliability (typically 0.7-0.95).
Include relevant flags like "monsoon_season" or "flash_flood_risk" when applicable.
Provide concise, practical travel advice and rationale for each day.
Set expectedRainMmRange to null if precipitation amount data is unavailable.`;

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
