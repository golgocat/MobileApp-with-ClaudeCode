import { ENV } from "../config/env";
import { DayForecast, HourlyForecast } from "../types/travel.types";

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
      Wind?: {
        Speed?: { Value?: number; Unit?: string };
        Direction?: { Localized?: string; English?: string };
      };
      WindGust?: {
        Speed?: { Value?: number; Unit?: string };
      };
    };
    Night?: {
      RainProbability?: number;
      PrecipitationProbability?: number;
      TotalLiquid?: { Value?: number; Unit?: string };
      IconPhrase?: string;
      Icon?: number;
      Wind?: {
        Speed?: { Value?: number; Unit?: string };
        Direction?: { Localized?: string; English?: string };
      };
      WindGust?: {
        Speed?: { Value?: number; Unit?: string };
      };
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

export async function getDailyForecast10(locationKey: string): Promise<DayForecast[]> {
  const apiKey = ENV.ACCUWEATHER_API_KEY;

  const url = `${BASE_URL}/forecasts/v1/daily/10day/${locationKey}?apikey=${encodeURIComponent(apiKey)}&metric=true&details=true`;

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
      // If 15-day not available, fall back to 10-day
      if (res.status === 401 || res.status === 403) {
        console.warn("15-day forecast not available, falling back to 10-day");
        return getDailyForecast10(locationKey);
      }
      const text = await res.text();
      throw new Error(`AccuWeather error ${res.status}: ${text}`);
    }

    const json = (await res.json()) as AccuDailyResponse;
    return mapForecasts(json);
  } catch (error) {
    console.warn("15-day forecast failed, falling back to 10-day:", error);
    return getDailyForecast10(locationKey);
  }
}

function toKmh(value: number, unit?: string): number {
  if (!unit) return value;
  const u = unit.toLowerCase();
  if (u === "km/h") return value;
  if (u === "mi/h" || u === "mph") return value * 1.60934;
  if (u === "m/s") return value * 3.6;
  return value;
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

    // Wind data - use day values, fall back to night
    const windSpeed = d.Day?.Wind?.Speed?.Value ?? d.Night?.Wind?.Speed?.Value;
    const windSpeedUnit = d.Day?.Wind?.Speed?.Unit ?? d.Night?.Wind?.Speed?.Unit;
    const windGust = d.Day?.WindGust?.Speed?.Value ?? d.Night?.WindGust?.Speed?.Value;
    const windGustUnit = d.Day?.WindGust?.Speed?.Unit ?? d.Night?.WindGust?.Speed?.Unit;
    const windDirection = d.Day?.Wind?.Direction?.English ?? d.Night?.Wind?.Direction?.English;

    return {
      date,
      precipProbabilityDay: dayRainProb,
      precipProbabilityNight: nightRainProb,
      precipAmountMmDay: dayLiquid != null ? toMm(dayLiquid, dayLiquidUnit) : null,
      precipAmountMmNight: nightLiquid != null ? toMm(nightLiquid, nightLiquidUnit) : null,
      tempMinC: min?.Value != null ? toC(min.Value, min.Unit) : null,
      tempMaxC: max?.Value != null ? toC(max.Value, max.Unit) : null,
      iconPhraseDay: d.Day?.IconPhrase,
      iconPhraseNight: d.Night?.IconPhrase,
      windSpeedKmh: windSpeed != null ? toKmh(windSpeed, windSpeedUnit) : null,
      windGustKmh: windGust != null ? toKmh(windGust, windGustUnit) : null,
      windDirection: windDirection ?? null,
      raw: d,
    };
  });
}

// Hourly forecast types
interface AccuHourlyItem {
  DateTime: string;
  EpochDateTime: number;
  Temperature: { Value: number; Unit: string };
  PrecipitationProbability: number;
  IconPhrase: string;
  WeatherIcon: number;
}

export async function getHourlyForecast12(locationKey: string): Promise<HourlyForecast[]> {
  const apiKey = ENV.ACCUWEATHER_API_KEY;

  const url = `${BASE_URL}/forecasts/v1/hourly/12hour/${locationKey}?apikey=${encodeURIComponent(apiKey)}&metric=true&details=true`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AccuWeather hourly error ${res.status}: ${text}`);
  }

  const json = (await res.json()) as AccuHourlyItem[];

  return json.map((h) => {
    // Extract local time from DateTime (format: "2024-01-03T14:00:00+04:00")
    const dateTime = new Date(h.DateTime);
    const localTime = h.DateTime.slice(11, 16); // Extract HH:mm

    return {
      dateTime: h.DateTime,
      localTime,
      temperature: toC(h.Temperature.Value, h.Temperature.Unit),
      precipProbability: h.PrecipitationProbability ?? 0,
      iconPhrase: h.IconPhrase,
      icon: h.WeatherIcon,
    };
  });
}
