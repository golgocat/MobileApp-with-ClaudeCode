import { getDailyForecast5 } from "./forecastService";
import {
  buildRainRiskPrompt,
  generateGeminiContent,
  parseAndValidateReport,
} from "./gemini";
import { Destination, Itinerary, TravelRiskReport, DayForecast, DayRiskLevel } from "../types/travel.types";
import { inRange } from "../utils/dateRange";

export interface RiskReportResult {
  forecastDays: DayForecast[];
  report: TravelRiskReport;
}

/**
 * Calculate the correct risk level based on precipitation probability
 * This ensures the AI's response matches the actual data
 */
function calculateCorrectRiskLevel(maxPrecipProb: number): DayRiskLevel {
  if (maxPrecipProb >= 80) return "EXTREME";
  if (maxPrecipProb >= 50) return "HIGH";
  if (maxPrecipProb >= 20) return "MEDIUM";
  return "LOW";
}

/**
 * Get the correct rain intensity description based on mm
 */
function getRainIntensityWord(mm: number): string {
  if (mm < 2.5) return "light";
  if (mm < 7.5) return "moderate";
  if (mm < 15) return "heavy";
  return "very heavy";
}

/**
 * Validate and correct risk levels to match actual forecast data
 * This is a safety net for AI hallucinations
 */
function validateAndCorrectRiskLevels(
  report: { days: Array<{ date: string; riskLevel: DayRiskLevel; advice: string; rationale: string }> },
  forecasts: DayForecast[]
): void {
  for (const day of report.days) {
    const forecast = forecasts.find(f => f.date === day.date);
    if (!forecast) continue;

    const maxPrecipProb = Math.max(
      forecast.precipProbabilityDay ?? 0,
      forecast.precipProbabilityNight ?? 0
    );
    const totalMm = (forecast.precipAmountMmDay ?? 0) + (forecast.precipAmountMmNight ?? 0);
    const correctIntensity = getRainIntensityWord(totalMm);

    const correctRiskLevel = calculateCorrectRiskLevel(maxPrecipProb);

    // If AI assigned wrong risk level, correct it
    if (day.riskLevel !== correctRiskLevel) {
      console.warn(
        `Correcting risk level for ${day.date}: AI said ${day.riskLevel} but data shows ${maxPrecipProb}% precip (should be ${correctRiskLevel})`
      );
      day.riskLevel = correctRiskLevel;
    }

    // Fix advice if it mentions rain but there's none expected
    if (maxPrecipProb < 20 && /rain|wet|umbrella|shower/i.test(day.advice)) {
      day.advice = day.advice
        .replace(/expect(ing)? (heavy |light |moderate )?rain/gi, "clear skies expected")
        .replace(/bring an umbrella/gi, "enjoy the clear weather")
        .replace(/(heavy |light |moderate )?rain overnight/gi, "clear overnight");
    }

    // Fix incorrect rain intensity descriptions (e.g., "heavy rain" when it's actually light)
    if (maxPrecipProb >= 20 && totalMm < 7.5) {
      // If rain is expected but it's light/moderate, fix "heavy" descriptions
      day.advice = day.advice
        .replace(/heavy rain/gi, `${correctIntensity} rain`)
        .replace(/very heavy rain/gi, `${correctIntensity} rain`);
      day.rationale = day.rationale
        .replace(/heavy rain/gi, `${correctIntensity} rain`)
        .replace(/very heavy rain/gi, `${correctIntensity} rain`);
    }
  }
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

  // Validate and correct risk levels to match actual data
  // This prevents AI hallucinations from showing wrong risk levels
  validateAndCorrectRiskLevels(validated, tripForecasts);

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
