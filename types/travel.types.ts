export type DestinationId = "manila" | "dubai" | "paris" | "tokyo" | "hongkong" | "london" | "newyork" | "losangeles" | "sydney";

export interface Destination {
  id: DestinationId;
  displayName: string;
  countryCode: string;
  timezone: string;
  accuweatherLocationKey: string;
  lat: number;
  lon: number;
}

export interface Itinerary {
  id: string;
  destinationId: DestinationId;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  createdAt: string; // ISO
}

export interface HourlyForecast {
  dateTime: string; // ISO datetime
  localTime: string; // HH:mm format in local timezone
  temperature: number; // Celsius
  precipProbability: number; // 0-100
  iconPhrase: string;
  icon: number;
}

export interface DayForecast {
  date: string; // YYYY-MM-DD in destination timezone
  precipProbabilityDay: number | null;   // 0-100
  precipProbabilityNight: number | null; // 0-100
  precipAmountMmDay: number | null;
  precipAmountMmNight: number | null;
  tempMinC: number | null;
  tempMaxC: number | null;
  iconPhraseDay?: string;
  iconPhraseNight?: string;
  windSpeedKmh?: number | null; // Average wind speed
  windGustKmh?: number | null;  // Wind gusts
  windDirection?: string | null; // Wind direction (e.g., "NW")
  raw?: unknown;
}

export type DayRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "EXTREME";

export interface DayRisk {
  date: string;
  riskLevel: DayRiskLevel;
  expectedRainMmRange: { min: number; max: number } | null;
  confidence: number; // 0..1
  advice: string;
  rationale: string;
  flags: string[];
}

export interface TravelRiskReport {
  itineraryId: string;
  generatedAt: string; // ISO
  modelVersion: string;
  timezone: string;
  days: DayRisk[];
}
