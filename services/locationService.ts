import * as Location from "expo-location";
import { weatherService } from "./weatherService";
import { locationStorage } from "./locationStorage";
import { SavedLocation } from "../types/location.types";
import { ENV } from "../config/env";

// New Places API response types
interface PlaceSuggestion {
  placePrediction: {
    placeId: string;
    text: {
      text: string;
    };
    structuredFormat: {
      mainText: {
        text: string;
      };
      secondaryText: {
        text: string;
      };
    };
  };
}

interface PlaceDetailsResponse {
  location: {
    latitude: number;
    longitude: number;
  };
  displayName: {
    text: string;
  };
  formattedAddress: string;
  addressComponents: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
}

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

  // Search places using Google Places API (legacy)
  async searchPlaces(query: string): Promise<PlacePrediction[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const apiKey = ENV.GOOGLE_PLACES_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Places error:", response.status, errorText);
      throw new Error(`Places search failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places API error:", data.status, data.error_message);
      throw new Error(`Places API error: ${data.status}`);
    }

    if (!data.predictions) {
      return [];
    }

    return data.predictions.map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || p.description,
      secondaryText: p.structured_formatting?.secondary_text || "",
    }));
  }

  // Get place details from Google Places API (legacy)
  async getPlaceDetails(placeId: string): Promise<PlaceDetailsResponse> {
    const apiKey = ENV.GOOGLE_PLACES_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name,formatted_address,address_components&key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Places details error:", response.status, errorText);
      throw new Error(`Place details failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Google Places details API error:", data.status, data.error_message);
      throw new Error(`Place details API error: ${data.status}`);
    }

    return {
      location: {
        latitude: data.result.geometry.location.lat,
        longitude: data.result.geometry.location.lng,
      },
      displayName: {
        text: data.result.name,
      },
      formattedAddress: data.result.formatted_address,
      addressComponents: data.result.address_components?.map((c: any) => ({
        longText: c.long_name,
        shortText: c.short_name,
        types: c.types,
      })) || [],
    };
  }

  // Add a place from Google Places search
  async addPlaceToSaved(placeId: string): Promise<SavedLocation> {
    // Get place details from Google
    const placeDetails = await this.getPlaceDetails(placeId);
    const { latitude, longitude } = placeDetails.location;

    // Get AccuWeather location key for weather data
    const accuLocation = await weatherService.getLocationByCoordinates(latitude, longitude);

    // Extract country code from address components
    const countryComponent = placeDetails.addressComponents?.find((c) =>
      c.types.includes("country")
    );
    const countryCode = countryComponent?.shortText || accuLocation.Country.ID;

    const savedLocation = await locationStorage.addLocation({
      displayName: accuLocation.LocalizedName,
      countryCode,
      timezone: accuLocation.TimeZone.Name,
      accuweatherLocationKey: accuLocation.Key,
      lat: accuLocation.GeoPosition.Latitude,
      lon: accuLocation.GeoPosition.Longitude,
    });

    return savedLocation;
  }
}

export const locationService = new LocationService();
