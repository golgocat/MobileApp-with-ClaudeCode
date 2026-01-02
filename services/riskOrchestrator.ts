import { getDailyForecast5 } from "./forecastService";
import {
  buildRainRiskPrompt,
  generateGeminiContent,
  parseAndValidateReport,
  buildRepairPrompt,
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

  // Fetch forecasts (using 5-day which is available with Core Weather Standard)
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

  // Build prompt for Gemini
  const { instruction, input } = buildRainRiskPrompt({
    destination,
    itinerary,
    forecasts: tripForecasts,
  });

  // Attempt 1
  const out1 = await generateGeminiContent({ instruction, input });

  try {
    const validated = parseAndValidateReport(out1);
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
  } catch (parseError) {
    console.warn("First Gemini response failed validation, attempting repair:", parseError);

    // Attempt 2 with repair prompt
    try {
      const repairInstruction = buildRepairPrompt(out1);
      const out2 = await generateGeminiContent({
        instruction: repairInstruction,
        input: {},
      });
      const validated2 = parseAndValidateReport(out2);

      return {
        forecastDays: tripForecasts,
        report: {
          itineraryId: itinerary.id,
          generatedAt: new Date().toISOString(),
          modelVersion: validated2.modelVersion,
          timezone: validated2.timezone,
          days: validated2.days,
        },
      };
    } catch (repairError) {
      console.error("Repair attempt also failed:", repairError);
      throw new Error(
        "Failed to generate a valid risk report. Please try again."
      );
    }
  }
}
