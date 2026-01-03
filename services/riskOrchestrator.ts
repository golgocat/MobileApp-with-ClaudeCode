import { getDailyForecast5 } from "./forecastService";
import {
  buildRainRiskPrompt,
  generateGeminiContent,
  parseAndValidateReport,
} from "./gemini";
import { Destination, Itinerary, TravelRiskReport, DayForecast } from "../types/travel.types";
import { inRange } from "../utils/dateRange";

export interface RiskReportResult {
  forecastDays: DayForecast[];
  report: TravelRiskReport;
}

export async function generateTravelRiskReport(args: {
  destination: Destination;
  itinerary: Itinerary;
}): Promise<RiskReportResult> {
  const { destination, itinerary } = args;

  // Fetch forecasts (using 5-day forecast)
  const allForecasts = await getDailyForecast5(destination.accuweatherLocationKey);

  // Filter to trip dates
  const tripForecasts = allForecasts.filter((f) =>
    inRange(f.date, itinerary.startDate, itinerary.endDate)
  );

  if (tripForecasts.length === 0) {
    throw new Error(
      `No forecast data available for the selected dates. Forecasts are only available for the next 5 days.`
    );
  }

  // Build prompt with JSON schema for Gemini
  const { instruction, input, responseSchema } = buildRainRiskPrompt({
    destination,
    itinerary,
    forecasts: tripForecasts,
  });

  // Generate with schema enforcement - Gemini will return valid JSON
  const rawOutput = await generateGeminiContent({
    instruction,
    input,
    responseSchema,
  });

  // Parse and validate (should always succeed with schema enforcement)
  const validated = parseAndValidateReport(rawOutput);

  return {
    forecastDays: tripForecasts,
    report: {
      itineraryId: itinerary.id,
      generatedAt: new Date().toISOString(),
      modelVersion: validated.modelVersion,
      timezone: validated.timezone,
      days: validated.days,
    },
  };
}
