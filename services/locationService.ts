import * as Location from "expo-location";
import { weatherService } from "./weatherService";
import { locationStorage } from "./locationStorage";
import { SavedLocation, AccuWeatherGeopositionResult } from "../types/location.types";
import { ENV } from "../config/env";

// Simplified type for UI
export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

class LocationService {
  // Request location permissions
  async requestPermissions(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  }

  // Check if permissions are granted
  async hasPermissions(): Promise<boolean> {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === "granted";
  }

  // Get current GPS location
  async getCurrentPosition(): Promise<{ lat: number; lon: number }> {
    const hasPermission = await this.hasPermissions();
    if (!hasPermission) {
      const granted = await this.requestPermissions();
      if (!granted) {
        throw new Error("Location permission denied");
      }
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      lat: location.coords.latitude,
      lon: location.coords.longitude,
    };
  }

  // Convert coordinates to AccuWeather location and save
  async addCurrentLocationToSaved(): Promise<SavedLocation> {
    const coords = await this.getCurrentPosition();
    const accuLocation = await weatherService.getLocationByCoordinates(coords.lat, coords.lon);

    const savedLocation = await locationStorage.addLocation({
      displayName: accuLocation.LocalizedName,
      countryCode: accuLocation.Country.ID,
      timezone: accuLocation.TimeZone.Name,
      accuweatherLocationKey: accuLocation.Key,
      lat: accuLocation.GeoPosition.Latitude,
      lon: accuLocation.GeoPosition.Longitude,
    });

    return savedLocation;
  }

  // Search places using AccuWeather Location Autocomplete API
  async searchPlaces(query: string): Promise<PlacePrediction[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const apiKey = ENV.ACCUWEATHER_API_KEY;
    const url = `https://dataservice.accuweather.com/locations/v1/cities/autocomplete?apikey=${apiKey}&q=${encodeURIComponent(query)}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AccuWeather location search error:", response.status, errorText);
      throw new Error(`Location search failed: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    // Transform AccuWeather response to our format
    // Store the AccuWeather location key in placeId for later use
    return data.map((loc: AccuWeatherGeopositionResult) => ({
      placeId: loc.Key, // This is the AccuWeather location key
      description: `${loc.LocalizedName}, ${loc.Country.LocalizedName}`,
      mainText: loc.LocalizedName,
      secondaryText: `${loc.AdministrativeArea?.LocalizedName || ""}, ${loc.Country.LocalizedName}`.replace(/^, /, ""),
    }));
  }

  // Get location details from AccuWeather using location key
  async getLocationDetails(locationKey: string): Promise<AccuWeatherGeopositionResult> {
    const apiKey = ENV.ACCUWEATHER_API_KEY;
    const url = `https://dataservice.accuweather.com/locations/v1/${locationKey}?apikey=${apiKey}&details=true`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AccuWeather location details error:", response.status, errorText);
      throw new Error(`Location details failed: ${response.status}`);
    }

    return response.json();
  }

  // Add a place from AccuWeather search (placeId is the AccuWeather location key)
  async addPlaceToSaved(locationKey: string): Promise<SavedLocation> {
    // Get full location details from AccuWeather
    const accuLocation = await this.getLocationDetails(locationKey);

    const savedLocation = await locationStorage.addLocation({
      displayName: accuLocation.LocalizedName,
      countryCode: accuLocation.Country.ID,
      timezone: accuLocation.TimeZone.Name,
      accuweatherLocationKey: accuLocation.Key,
      lat: accuLocation.GeoPosition.Latitude,
      lon: accuLocation.GeoPosition.Longitude,
    });

    return savedLocation;
  }
}

export const locationService = new LocationService();
