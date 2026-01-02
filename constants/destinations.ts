import { Destination, DestinationId } from "../types/travel.types";

export const DESTINATIONS: Destination[] = [
  {
    id: "manila",
    displayName: "Manila",
    countryCode: "PH",
    timezone: "Asia/Manila",
    accuweatherLocationKey: "264885", // Manila, Philippines
    lat: 14.5995,
    lon: 120.9842,
  },
  {
    id: "dubai",
    displayName: "Dubai",
    countryCode: "AE",
    timezone: "Asia/Dubai",
    accuweatherLocationKey: "323091", // Dubai, UAE
    lat: 25.2048,
    lon: 55.2708,
  },
];

export function getDestination(id: DestinationId): Destination {
  const destination = DESTINATIONS.find((d) => d.id === id);
  if (!destination) {
    throw new Error(`Unknown destination: ${id}`);
  }
  return destination;
}
