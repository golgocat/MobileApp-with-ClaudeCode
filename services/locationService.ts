import * as Location from "expo-location";
import { weatherService } from "./weatherService";
import { locationStorage } from "./locationStorage";
import { SavedLocation, AccuWeatherGeopositionResult } from "../types/location.types";

const GOOGLE_PLACES_API_KEY = "AIzaSyAI9YXMp5-ZDHNYDNoM42ZDV-tw2aWmzTI";

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceDetails {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name: string;
  formatted_address: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
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

  // Search places using Google Places API (Autocomplete)
  async searchPlaces(query: string): Promise<PlacePrediction[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      query
    )}&types=(cities)&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places error:", data.status, data.error_message);
      throw new Error(`Places search failed: ${data.status}`);
    }

    return data.predictions || [];
  }

  // Get place details (coordinates) from place_id
  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name,formatted_address,address_components&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Google Places details error:", data.status);
      throw new Error(`Place details failed: ${data.status}`);
    }

    return data.result;
  }

  // Add a place from Google Places search
  async addPlaceToSaved(placeId: string): Promise<SavedLocation> {
    // Get place details from Google
    const placeDetails = await this.getPlaceDetails(placeId);
    const { lat, lng } = placeDetails.geometry.location;

    // Get AccuWeather location key
    const accuLocation = await weatherService.getLocationByCoordinates(lat, lng);

    // Extract country code from address components
    const countryComponent = placeDetails.address_components.find((c) =>
      c.types.includes("country")
    );
    const countryCode = countryComponent?.short_name || accuLocation.Country.ID;

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
