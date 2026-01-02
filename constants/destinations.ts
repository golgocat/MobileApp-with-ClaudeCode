import { Destination, DestinationId } from "../types/travel.types";

export const DESTINATIONS: Destination[] = [
  {
    id: "dubai",
    displayName: "Dubai",
    countryCode: "AE",
    timezone: "Asia/Dubai",
    accuweatherLocationKey: "323091",
    lat: 25.2048,
    lon: 55.2708,
  },
  {
    id: "paris",
    displayName: "Paris",
    countryCode: "FR",
    timezone: "Europe/Paris",
    accuweatherLocationKey: "623",
    lat: 48.8566,
    lon: 2.3522,
  },
  {
    id: "tokyo",
    displayName: "Tokyo",
    countryCode: "JP",
    timezone: "Asia/Tokyo",
    accuweatherLocationKey: "226396",
    lat: 35.6762,
    lon: 139.6503,
  },
  {
    id: "hongkong",
    displayName: "Hong Kong",
    countryCode: "HK",
    timezone: "Asia/Hong_Kong",
    accuweatherLocationKey: "1123655",
    lat: 22.3193,
    lon: 114.1694,
  },
  {
    id: "london",
    displayName: "London",
    countryCode: "GB",
    timezone: "Europe/London",
    accuweatherLocationKey: "328328",
    lat: 51.5074,
    lon: -0.1278,
  },
  {
    id: "newyork",
    displayName: "New York",
    countryCode: "US",
    timezone: "America/New_York",
    accuweatherLocationKey: "349727",
    lat: 40.7128,
    lon: -74.006,
  },
  {
    id: "losangeles",
    displayName: "Los Angeles",
    countryCode: "US",
    timezone: "America/Los_Angeles",
    accuweatherLocationKey: "347625",
    lat: 34.0522,
    lon: -118.2437,
  },
  {
    id: "sydney",
    displayName: "Sydney",
    countryCode: "AU",
    timezone: "Australia/Sydney",
    accuweatherLocationKey: "22889",
    lat: -33.8688,
    lon: 151.2093,
  },
  {
    id: "manila",
    displayName: "Manila",
    countryCode: "PH",
    timezone: "Asia/Manila",
    accuweatherLocationKey: "264885",
    lat: 14.5995,
    lon: 120.9842,
  },
];

export function getDestination(id: DestinationId): Destination {
  const destination = DESTINATIONS.find((d) => d.id === id);
  if (!destination) {
    throw new Error(`Unknown destination: ${id}`);
  }
  return destination;
}
