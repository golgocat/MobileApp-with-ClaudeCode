import Constants from 'expo-constants';
import {
  WeatherData,
  WeatherLocation,
  CurrentWeather,
  ForecastDay,
  AccuWeatherLocation,
  AccuWeatherCurrentConditions,
  AccuWeatherDailyForecast,
  AccuWeatherHourlyForecast,
} from './weather.types';

// Try multiple ways to get the API key
const ACCUWEATHER_API_KEY =
  process.env.EXPO_PUBLIC_ACCUWEATHER_API_KEY ||
  Constants.expoConfig?.extra?.EXPO_PUBLIC_ACCUWEATHER_API_KEY ||
  '';
const BASE_URL = 'https://dataservice.accuweather.com';

// Debug: Log API key status at module load
console.log('🔧 WeatherService loaded');
console.log('🔧 process.env.EXPO_PUBLIC_ACCUWEATHER_API_KEY:', process.env.EXPO_PUBLIC_ACCUWEATHER_API_KEY ? 'SET via process.env' : 'NOT SET');
console.log('🔧 Constants.expoConfig:', Constants.expoConfig ? 'exists' : 'undefined');
console.log('🔧 Constants.expoConfig.extra:', Constants.expoConfig?.extra ? 'exists' : 'undefined');
console.log('🔧 Final API Key:', ACCUWEATHER_API_KEY ? `${ACCUWEATHER_API_KEY.substring(0, 10)}...` : 'NOT SET');

// AccuWeather uses a fixed location key for Dubai
const DUBAI_LOCATION_KEY = '323091'; // Dubai, AE

// Fetch with timeout helper
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  }
}

export class WeatherService {
  /**
   * Search for a location and get its key
   * @param cityName - City name to search for
   */
  private static async searchLocation(
    cityName: string
  ): Promise<AccuWeatherLocation> {
    try {
      // Support both query parameter and header authentication
      const headers: HeadersInit = {};
      let url = `${BASE_URL}/locations/v1/cities/search?q=${encodeURIComponent(cityName)}`;

      if (ACCUWEATHER_API_KEY.startsWith('zpka_')) {
        // Use header authentication for zpka_ format keys
        headers['Authorization'] = `Bearer ${ACCUWEATHER_API_KEY}`;
      } else {
        // Use query parameter for traditional keys
        url += `&apikey=${ACCUWEATHER_API_KEY}`;
      }

      console.log('🔍 Searching location:', cityName);
      const response = await fetchWithTimeout(url, { headers }, 15000);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Location search failed:', response.status, errorText);
        throw new Error(`Location search failed (${response.status}): ${errorText}`);
      }

      console.log('✅ Location found');

      const locations: AccuWeatherLocation[] = await response.json();
      if (!locations || locations.length === 0) {
        throw new Error(`Location "${cityName}" not found`);
      }

      return locations[0];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to search location');
    }
  }

  /**
   * Get current weather conditions
   * @param locationKey - AccuWeather location key
   */
  private static async getCurrentConditions(
    locationKey: string
  ): Promise<AccuWeatherCurrentConditions> {
    try {
      // Support both query parameter and header authentication
      const headers: HeadersInit = {};
      let url = `${BASE_URL}/currentconditions/v1/${locationKey}?details=true`;

      if (ACCUWEATHER_API_KEY.startsWith('zpka_')) {
        // Use header authentication for zpka_ format keys
        headers['Authorization'] = `Bearer ${ACCUWEATHER_API_KEY}`;
      } else {
        // Use query parameter for traditional keys
        url += `&apikey=${ACCUWEATHER_API_KEY}`;
      }

      console.log('🌡️ Fetching current conditions:', url.substring(0, 80) + '...');
      const response = await fetchWithTimeout(url, { headers }, 15000);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Current conditions failed:', response.status, errorText);
        throw new Error(
          `Current conditions fetch failed (${response.status}): ${errorText}`
        );
      }

      console.log('✅ Current conditions fetched successfully');

      const conditions: AccuWeatherCurrentConditions[] = await response.json();
      if (!conditions || conditions.length === 0) {
        throw new Error('No current conditions data available');
      }

      return conditions[0];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch current conditions');
    }
  }

  /**
   * Get daily forecast
   * @param locationKey - AccuWeather location key
   * @param days - Number of days (1, 5, 10, or 15)
   */
  private static async getDailyForecast(
    locationKey: string,
    days: number = 7
  ): Promise<AccuWeatherDailyForecast[]> {
    try {
      // AccuWeather supports 1day, 5day, 10day, 15day endpoints
      let endpoint = '5day';
      if (days <= 1) endpoint = '1day';
      else if (days <= 5) endpoint = '5day';
      else if (days <= 10) endpoint = '10day';
      else endpoint = '15day';

      // Support both query parameter and header authentication
      const headers: HeadersInit = {};
      let url = `${BASE_URL}/forecasts/v1/daily/${endpoint}/${locationKey}?details=true&metric=true`;

      if (ACCUWEATHER_API_KEY.startsWith('zpka_')) {
        // Use header authentication for zpka_ format keys
        headers['Authorization'] = `Bearer ${ACCUWEATHER_API_KEY}`;
      } else {
        // Use query parameter for traditional keys
        url += `&apikey=${ACCUWEATHER_API_KEY}`;
      }

      console.log('📅 Fetching daily forecast:', endpoint);
      const response = await fetchWithTimeout(url, { headers }, 15000);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Daily forecast failed:', response.status, errorText);
        throw new Error(`Daily forecast fetch failed (${response.status}): ${errorText}`);
      }

      console.log('✅ Daily forecast fetched successfully');

      const forecast = await response.json();
      return forecast.DailyForecasts || [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch daily forecast');
    }
  }

  /**
   * Get hourly forecast
   * @param locationKey - AccuWeather location key
   * @param hours - Number of hours (12 or 24)
   */
  private static async getHourlyForecast(
    locationKey: string,
    hours: number = 12
  ): Promise<AccuWeatherHourlyForecast[]> {
    try {
      const endpoint = hours <= 12 ? '12hour' : '24hour';

      // Support both query parameter and header authentication
      const headers: HeadersInit = {};
      let url = `${BASE_URL}/forecasts/v1/hourly/${endpoint}/${locationKey}?details=true&metric=true`;

      if (ACCUWEATHER_API_KEY.startsWith('zpka_')) {
        // Use header authentication for zpka_ format keys
        headers['Authorization'] = `Bearer ${ACCUWEATHER_API_KEY}`;
      } else {
        // Use query parameter for traditional keys
        url += `&apikey=${ACCUWEATHER_API_KEY}`;
      }

      console.log('⏰ Fetching hourly forecast:', endpoint);
      const response = await fetchWithTimeout(url, { headers }, 15000);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Hourly forecast failed:', response.status, errorText);
        throw new Error(`Hourly forecast fetch failed (${response.status}): ${errorText}`);
      }

      console.log('✅ Hourly forecast fetched successfully');

      const forecast: AccuWeatherHourlyForecast[] = await response.json();
      return forecast || [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch hourly forecast');
    }
  }

  /**
   * Normalize AccuWeather location to our format
   */
  private static normalizeLocation(
    location: AccuWeatherLocation
  ): WeatherLocation {
    return {
      name: location.LocalizedName,
      region: location.AdministrativeArea.LocalizedName,
      country: location.Country.LocalizedName,
      lat: location.GeoPosition.Latitude,
      lon: location.GeoPosition.Longitude,
      tz_id: location.TimeZone.Name,
      localtime: new Date().toISOString(),
    };
  }

  /**
   * Normalize AccuWeather current conditions to our format
   */
  private static normalizeCurrentWeather(
    current: AccuWeatherCurrentConditions
  ): CurrentWeather {
    return {
      temp_c: current.Temperature.Metric.Value,
      temp_f: current.Temperature.Imperial.Value,
      is_day: current.IsDayTime ? 1 : 0,
      condition: {
        text: current.WeatherText,
        icon: current.WeatherIcon.toString(),
        code: current.WeatherIcon,
      },
      wind_kph: current.Wind.Speed.Metric.Value,
      wind_mph: current.Wind.Speed.Imperial.Value,
      wind_dir: current.Wind.Direction.Localized,
      pressure_mb: current.Pressure.Metric.Value,
      humidity: current.RelativeHumidity,
      cloud: current.CloudCover,
      feelslike_c: current.RealFeelTemperature.Metric.Value,
      feelslike_f: current.RealFeelTemperature.Imperial.Value,
      vis_km: current.Visibility.Metric.Value,
      uv: current.UVIndex,
      gust_kph: current.Wind.Speed.Metric.Value, // AccuWeather doesn't have gust in current
    };
  }

  /**
   * Normalize AccuWeather daily forecast to our format
   */
  private static normalizeDailyForecast(
    dailyForecasts: AccuWeatherDailyForecast[],
    hourlyForecasts: AccuWeatherHourlyForecast[]
  ): ForecastDay[] {
    return dailyForecasts.map((day, index) => {
      // Get hourly data for this day
      const dayDate = new Date(day.Date);
      const dayHours = hourlyForecasts.filter((hour) => {
        const hourDate = new Date(hour.DateTime);
        return hourDate.toDateString() === dayDate.toDateString();
      });

      // Calculate average values from hourly data
      const avgTemp =
        dayHours.length > 0
          ? dayHours.reduce((sum, h) => sum + h.Temperature.Value, 0) /
            dayHours.length
          : (day.Temperature.Minimum.Value + day.Temperature.Maximum.Value) / 2;

      const avgHumidity =
        dayHours.length > 0
          ? dayHours.reduce((sum, h) => sum + h.RelativeHumidity, 0) /
            dayHours.length
          : 50;

      const rainChance =
        dayHours.length > 0
          ? Math.max(...dayHours.map((h) => h.PrecipitationProbability))
          : day.Day.HasPrecipitation
          ? 80
          : 0;

      return {
        date: day.Date.split('T')[0],
        date_epoch: day.EpochDate,
        day: {
          maxtemp_c: day.Temperature.Maximum.Value,
          maxtemp_f: ((day.Temperature.Maximum.Value * 9) / 5 + 32),
          mintemp_c: day.Temperature.Minimum.Value,
          mintemp_f: ((day.Temperature.Minimum.Value * 9) / 5 + 32),
          avgtemp_c: avgTemp,
          avgtemp_f: ((avgTemp * 9) / 5 + 32),
          maxwind_kph:
            dayHours.length > 0
              ? Math.max(...dayHours.map((h) => h.Wind.Speed.Value))
              : 20,
          totalprecip_mm: day.Day.HasPrecipitation ? 5 : 0,
          avgvis_km: 10,
          avghumidity: avgHumidity,
          daily_chance_of_rain: rainChance,
          daily_chance_of_snow: 0,
          condition: {
            text: day.Day.IconPhrase,
            icon: day.Day.Icon.toString(),
            code: day.Day.Icon,
          },
          uv: dayHours.length > 0 ? Math.max(...dayHours.map((h) => h.UVIndex)) : 5,
        },
        astro: {
          sunrise: new Date(day.Sun.Rise).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          sunset: new Date(day.Sun.Set).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          moonrise: new Date(day.Moon.Rise).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          moonset: new Date(day.Moon.Set).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          moon_phase: day.Moon.Phase,
        },
        hour: dayHours.slice(0, 24).map((hour) => ({
          time: hour.DateTime,
          temp_c: hour.Temperature.Value,
          temp_f: ((hour.Temperature.Value * 9) / 5 + 32),
          condition: {
            text: hour.IconPhrase,
            icon: hour.WeatherIcon.toString(),
            code: hour.WeatherIcon,
          },
          wind_kph: hour.Wind.Speed.Value,
          humidity: hour.RelativeHumidity,
          chance_of_rain: hour.PrecipitationProbability,
        })),
      };
    });
  }

  /**
   * Fetch current weather and forecast for a location
   * @param location - City name (e.g., "Dubai")
   * @param days - Number of forecast days (1-15)
   */
  static async getWeather(
    location: string,
    days: number = 7
  ): Promise<WeatherData> {
    try {
      console.log('🔑 API Key loaded:', ACCUWEATHER_API_KEY ? `${ACCUWEATHER_API_KEY.substring(0, 10)}...` : 'NOT SET');
      console.log('🌍 Fetching weather for:', location);

      if (!ACCUWEATHER_API_KEY || ACCUWEATHER_API_KEY === '') {
        throw new Error(
          'AccuWeather API key is not configured. Please add EXPO_PUBLIC_ACCUWEATHER_API_KEY to your .env file'
        );
      }

      // For Dubai, we can use the hardcoded location key for better performance
      let locationKey = DUBAI_LOCATION_KEY;
      let locationData: AccuWeatherLocation;

      if (location.toLowerCase() !== 'dubai') {
        // Search for other locations
        locationData = await this.searchLocation(location);
        locationKey = locationData.Key;
      } else {
        // Use Dubai's data directly
        locationData = {
          Key: DUBAI_LOCATION_KEY,
          LocalizedName: 'Dubai',
          Country: { ID: 'AE', LocalizedName: 'United Arab Emirates' },
          AdministrativeArea: { ID: 'DU', LocalizedName: 'Dubai' },
          GeoPosition: { Latitude: 25.2048, Longitude: 55.2708 },
          TimeZone: { Name: 'Asia/Dubai' },
        };
      }

      // Fetch all data in parallel
      const [currentConditions, dailyForecast, hourlyForecast] =
        await Promise.all([
          this.getCurrentConditions(locationKey),
          this.getDailyForecast(locationKey, days),
          this.getHourlyForecast(locationKey, 24),
        ]);

      // Normalize and return the data
      return {
        location: this.normalizeLocation(locationData),
        current: this.normalizeCurrentWeather(currentConditions),
        forecast: {
          forecastday: this.normalizeDailyForecast(
            dailyForecast,
            hourlyForecast
          ),
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred while fetching weather data');
    }
  }

  /**
   * Get weather icon URL (not used with AccuWeather as we use emojis)
   * @param iconPath - Icon code from API response
   */
  static getIconUrl(iconPath: string, size: 64 | 128 = 64): string {
    return `https://developer.accuweather.com/sites/default/files/${iconPath
      .padStart(2, '0')}-s.png`;
  }

  /**
   * Format temperature with unit
   */
  static formatTemp(temp: number, unit: 'C' | 'F' = 'C'): string {
    return `${Math.round(temp)}°${unit}`;
  }

  /**
   * Get weather emoji based on AccuWeather icon code
   * AccuWeather icon codes: 1-44
   */
  static getWeatherEmoji(code: number): string {
    const emojiMap: Record<number, string> = {
      1: '☀️', // Sunny
      2: '🌤️', // Mostly Sunny
      3: '⛅', // Partly Sunny
      4: '🌥️', // Intermittent Clouds
      5: '🌥️', // Hazy Sunshine
      6: '☁️', // Mostly Cloudy
      7: '☁️', // Cloudy
      8: '☁️', // Dreary (Overcast)
      11: '🌫️', // Fog
      12: '🌦️', // Showers
      13: '🌦️', // Mostly Cloudy w/ Showers
      14: '🌦️', // Partly Sunny w/ Showers
      15: '⛈️', // T-Storms
      16: '⛈️', // Mostly Cloudy w/ T-Storms
      17: '⛈️', // Partly Sunny w/ T-Storms
      18: '🌧️', // Rain
      19: '🌨️', // Flurries
      20: '🌨️', // Mostly Cloudy w/ Flurries
      21: '🌨️', // Partly Sunny w/ Flurries
      22: '🌨️', // Snow
      23: '🌨️', // Mostly Cloudy w/ Snow
      24: '🌨️', // Ice
      25: '🌨️', // Sleet
      26: '🌨️', // Freezing Rain
      29: '🌧️❄️', // Rain and Snow
      30: '🔥', // Hot
      31: '🥶', // Cold
      32: '💨', // Windy
      33: '🌙', // Clear (Night)
      34: '🌤️', // Mostly Clear (Night)
      35: '⛅', // Partly Cloudy (Night)
      36: '🌥️', // Intermittent Clouds (Night)
      37: '🌥️', // Hazy Moonlight
      38: '☁️', // Mostly Cloudy (Night)
      39: '🌦️', // Partly Cloudy w/ Showers (Night)
      40: '🌦️', // Mostly Cloudy w/ Showers (Night)
      41: '⛈️', // Partly Cloudy w/ T-Storms (Night)
      42: '⛈️', // Mostly Cloudy w/ T-Storms (Night)
      43: '🌨️', // Mostly Cloudy w/ Flurries (Night)
      44: '🌨️', // Mostly Cloudy w/ Snow (Night)
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
