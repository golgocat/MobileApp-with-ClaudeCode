export interface SavedLocation {
  id: string;
  displayName: string;
  countryCode: string;
  timezone: string;
  accuweatherLocationKey: string;
  lat: number;
  lon: number;
  isPinned: boolean;      // Default location to show on app open
  isPreset: boolean;      // Predefined favorite (cannot be deleted)
  addedAt: number;        // Unix timestamp
}

export interface LocationSearchResult {
  placeId: string;
  displayName: string;
  description: string;
  lat: number;
  lon: number;
}

export interface AccuWeatherGeopositionResult {
  Key: string;
  LocalizedName: string;
  Country: {
    ID: string;
    LocalizedName: string;
  };
  TimeZone: {
    Name: string;
  };
  GeoPosition: {
    Latitude: number;
    Longitude: number;
  };
}
