import { ENV } from "../config/env";
import { DayForecast } from "../types/travel.types";

const BASE_URL = "https://dataservice.accuweather.com";

interface AccuDailyResponse {
  DailyForecasts: Array<{
    Date: string;
    Temperature?: {
      Minimum?: { Value?: number; Unit?: string };
      Maximum?: { Value?: number; Unit?: string };
    };
    Day?: {
      RainProbability?: number;
      PrecipitationProbability?: number;
      TotalLiquid?: { Value?: number; Unit?: string };
      IconPhrase?: string;
      Icon?: number;
    };
    Night?: {
      RainProbability?: number;
      PrecipitationProbability?: number;
      TotalLiquid?: { Value?: number; Unit?: string };
      IconPhrase?: string;
      Icon?: number;
    };
  }>;
}

function toMm(value: number, unit?: string): number {
  if (!unit) return value;
  const u = unit.toLowerCase();
  if (u === "mm") return value;
  if (u === "in") return value * 25.4;
  return value;
}

function toC(value: number, unit?: string): number {
  if (!unit) return value;
  const u = unit.toLowerCase();
  if (u === "c") return value;
  if (u === "f") return (value - 32) * (5 / 9);
  return value;
}

function toYyyyMmDd(dateIso: string): string {
  return dateIso.slice(0, 10);
}

export async function getDailyForecast5(locationKey: string): Promise<DayForecast[]> {
  const apiKey = ENV.ACCUWEATHER_API_KEY;

  const url = `${BASE_URL}/forecasts/v1/daily/5day/${locationKey}?apikey=${encodeURIComponent(apiKey)}&metric=true&details=true`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AccuWeather error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as AccuDailyResponse;
  return mapForecasts(json);
}

export async function getDailyForecast15(locationKey: string): Promise<DayForecast[]> {
  const apiKey = ENV.ACCUWEATHER_API_KEY;

  // Note: 15-day forecast may require a higher tier API plan
  // Fallback to 5-day if 15-day fails
  try {
    const url = `${BASE_URL}/forecasts/v1/daily/15day/${locationKey}?apikey=${encodeURIComponent(apiKey)}&metric=true&details=true`;

    const res = await fetch(url);
    if (!res.ok) {
      // If 15-day not available, fall back to 5-day
      if (res.status === 401 || res.status === 403) {
        console.warn("15-day forecast not available, falling back to 5-day");
        return getDailyForecast5(locationKey);
      }
      const text = await res.text();
      throw new Error(`AccuWeather error ${res.status}: ${text}`);
    }

    const json = (await res.json()) as AccuDailyResponse;
    return mapForecasts(json);
  } catch (error) {
    console.warn("15-day forecast failed, falling back to 5-day:", error);
    return getDailyForecast5(locationKey);
  }
}

function mapForecasts(json: AccuDailyResponse): DayForecast[] {
  return (json.DailyForecasts ?? []).map((d) => {
    const date = toYyyyMmDd(d.Date);

    const min = d.Temperature?.Minimum;
    const max = d.Temperature?.Maximum;

    const dayRainProb = d.Day?.RainProbability ?? d.Day?.PrecipitationProbability ?? null;
    const nightRainProb = d.Night?.RainProbability ?? d.Night?.PrecipitationProbability ?? null;

    const dayLiquid = d.Day?.TotalLiquid?.Value;
    const dayLiquidUnit = d.Day?.TotalLiquid?.Unit;

    const nightLiquid = d.Night?.TotalLiquid?.Value;
    const nightLiquidUnit = d.Night?.TotalLiquid?.Unit;

    return {
      date,
      precipProbabilityDay: dayRainProb,
      precipProbabilityNight: nightRainProb,
      precipAmountMmDay: dayLiquid != null ? toMm(dayLiquid, dayLiquidUnit) : null,
      precipAmountMmNight: nightLiquid != null ? toMm(nightLiquid, nightLiquidUnit) : null,
      tempMinC: min?.Value != null ? toC(min.Value, min.Unit) : null,
      tempMaxC: max?.Value != null ? toC(max.Value, max.Unit) : null,
      raw: d,
    };
  });
}
