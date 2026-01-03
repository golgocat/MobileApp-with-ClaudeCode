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

  // Search places using NEW Google Places API (Autocomplete)
  async searchPlaces(query: string): Promise<PlacePrediction[]> {
    if (!query || query.length < 2) {
      return [];
    }

    // Temporarily hardcode for debugging - will revert once working
    const apiKey = "AIzaSyDiTrqiMEONi5F3BiVmlsB5HidG4FimLwA";
    console.log("Google Places API Key (hardcoded):", apiKey.substring(0, 10) + "...");

    const url = "https://places.googleapis.com/v1/places:autocomplete";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify({
        input: query,
        includedPrimaryTypes: ["locality", "administrative_area_level_1", "administrative_area_level_2"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Places error:", response.status, errorText);
      throw new Error(`Places search failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.suggestions) {
      return [];
    }

    // Transform to simplified format
    return data.suggestions
      .filter((s: PlaceSuggestion) => s.placePrediction)
      .map((s: PlaceSuggestion) => ({
        placeId: s.placePrediction.placeId,
        description: s.placePrediction.text.text,
        mainText: s.placePrediction.structuredFormat?.mainText?.text || s.placePrediction.text.text,
        secondaryText: s.placePrediction.structuredFormat?.secondaryText?.text || "",
      }));
  }

  // Get place details (coordinates) from place_id using NEW API
  async getPlaceDetails(placeId: string): Promise<PlaceDetailsResponse> {
    const url = `https://places.googleapis.com/v1/places/${placeId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": ENV.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "location,displayName,formattedAddress,addressComponents",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Places details error:", response.status, errorText);
      throw new Error(`Place details failed: ${response.status}`);
    }

    return response.json();
  }

  // Add a place from Google Places search
  async addPlaceToSaved(placeId: string): Promise<SavedLocation> {
    // Get place details from Google
    const placeDetails = await this.getPlaceDetails(placeId);
    const { latitude, longitude } = placeDetails.location;

    // Get AccuWeather location key
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
