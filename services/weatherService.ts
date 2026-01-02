import Constants from 'expo-constants';
import { WeatherData, WeatherError } from './weather.types';

const WEATHER_API_KEY =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_WEATHER_API_KEY || 'demo';
const BASE_URL = 'https://api.weatherapi.com/v1';

export class WeatherService {
  /**
   * Fetch current weather and forecast for a location
   * @param location - City name (e.g., "Dubai")
   * @param days - Number of forecast days (1-10)
   */
  static async getWeather(
    location: string,
    days: number = 7
  ): Promise<WeatherData> {
    try {
      const response = await fetch(
        `${BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(
          location
        )}&days=${days}&aqi=no&alerts=no`
      );

      if (!response.ok) {
        const error: WeatherError = await response.json();
        throw new Error(error.error.message || 'Failed to fetch weather data');
      }

      const data: WeatherData = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * Get weather icon URL
   * @param iconPath - Icon path from API response
   * @param size - Icon size (64, 128)
   */
  static getIconUrl(iconPath: string, size: 64 | 128 = 64): string {
    // Remove leading slashes if present
    const cleanPath = iconPath.replace(/^\/+/, '');
    return `https://${cleanPath}`;
  }

  /**
   * Format temperature with unit
   */
  static formatTemp(temp: number, unit: 'C' | 'F' = 'C'): string {
    return `${Math.round(temp)}°${unit}`;
  }

  /**
   * Get weather emoji based on condition code
   */
  static getWeatherEmoji(code: number): string {
    const emojiMap: Record<number, string> = {
      1000: '☀️', // Sunny
      1003: '⛅', // Partly cloudy
      1006: '☁️', // Cloudy
      1009: '☁️', // Overcast
      1030: '🌫️', // Mist
      1063: '🌦️', // Patchy rain possible
      1066: '🌨️', // Patchy snow possible
      1069: '🌨️', // Patchy sleet possible
      1072: '🌨️', // Patchy freezing drizzle
      1087: '⛈️', // Thundery outbreaks
      1114: '🌨️', // Blowing snow
      1117: '❄️', // Blizzard
      1135: '🌫️', // Fog
      1147: '🌫️', // Freezing fog
      1150: '🌧️', // Patchy light drizzle
      1153: '🌧️', // Light drizzle
      1168: '🌧️', // Freezing drizzle
      1171: '🌧️', // Heavy freezing drizzle
      1180: '🌦️', // Patchy light rain
      1183: '🌧️', // Light rain
      1186: '🌧️', // Moderate rain at times
      1189: '🌧️', // Moderate rain
      1192: '⛈️', // Heavy rain at times
      1195: '⛈️', // Heavy rain
      1198: '🌧️', // Light freezing rain
      1201: '🌧️', // Moderate or heavy freezing rain
      1204: '🌨️', // Light sleet
      1207: '🌨️', // Moderate or heavy sleet
      1210: '🌨️', // Patchy light snow
      1213: '🌨️', // Light snow
      1216: '🌨️', // Patchy moderate snow
      1219: '❄️', // Moderate snow
      1222: '❄️', // Patchy heavy snow
      1225: '❄️', // Heavy snow
      1237: '🌨️', // Ice pellets
      1240: '🌦️', // Light rain shower
      1243: '⛈️', // Moderate or heavy rain shower
      1246: '⛈️', // Torrential rain shower
      1249: '🌨️', // Light sleet showers
      1252: '🌨️', // Moderate or heavy sleet showers
      1255: '🌨️', // Light snow showers
      1258: '❄️', // Moderate or heavy snow showers
      1261: '🌨️', // Light showers of ice pellets
      1264: '🌨️', // Moderate or heavy showers of ice pellets
      1273: '⛈️', // Patchy light rain with thunder
      1276: '⛈️', // Moderate or heavy rain with thunder
      1279: '⛈️', // Patchy light snow with thunder
      1282: '⛈️', // Moderate or heavy snow with thunder
    };

    return emojiMap[code] || '🌡️';
  }

  /**
   * Get time of day greeting
   */
  static getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }
}
