import {
  CurrentConditions,
  HourlyForecast,
  DailyForecastResponse,
  WeatherData,
} from '../types/weather.types';

const API_KEY = process.env.EXPO_PUBLIC_ACCUWEATHER_API_KEY || '';
const BASE_URL = 'https://dataservice.accuweather.com';

// Default location key (Dubai)
const DEFAULT_LOCATION_KEY = '323091';

class WeatherService {
  private async fetchWithTimeout(
    url: string,
    timeout: number = 10000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async getCurrentConditions(locationKey: string = DEFAULT_LOCATION_KEY): Promise<CurrentConditions> {
    const url = `${BASE_URL}/currentconditions/v1/${locationKey}?apikey=${API_KEY}&details=true`;

    const response = await this.fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(`Current conditions fetch failed: ${response.status}`);
    }

    const data = await response.json();
    return data[0];
  }

  async getHourlyForecast(locationKey: string = DEFAULT_LOCATION_KEY): Promise<HourlyForecast[]> {
    const url = `${BASE_URL}/forecasts/v1/hourly/12hour/${locationKey}?apikey=${API_KEY}&metric=true&details=true`;

    const response = await this.fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(`Hourly forecast fetch failed: ${response.status}`);
    }

    return response.json();
  }

  async getDailyForecast(locationKey: string = DEFAULT_LOCATION_KEY): Promise<DailyForecastResponse> {
    const url = `${BASE_URL}/forecasts/v1/daily/5day/${locationKey}?apikey=${API_KEY}&metric=true&details=false`;

    const response = await this.fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(`Daily forecast fetch failed: ${response.status}`);
    }

    return response.json();
  }

  async getDailyForecastWithDetails(locationKey: string = DEFAULT_LOCATION_KEY): Promise<DailyForecastResponse> {
    const url = `${BASE_URL}/forecasts/v1/daily/5day/${locationKey}?apikey=${API_KEY}&metric=true&details=true`;

    const response = await this.fetchWithTimeout(url);

    if (!response.ok) {
      throw new Error(`Daily forecast fetch failed: ${response.status}`);
    }

    return response.json();
  }

  async getAllWeatherData(locationKey: string = DEFAULT_LOCATION_KEY): Promise<WeatherData> {
    const [current, hourly, dailyResponse] = await Promise.all([
      this.getCurrentConditions(locationKey),
      this.getHourlyForecast(locationKey),
      this.getDailyForecast(locationKey),
    ]);

    return {
      current,
      hourly,
      daily: dailyResponse.DailyForecasts,
      headline: dailyResponse.Headline.Text,
    };
  }

  getWeatherIconUrl(iconNumber: number): string {
    const paddedIcon = iconNumber.toString().padStart(2, '0');
    return `https://developer.accuweather.com/sites/default/files/${paddedIcon}-s.png`;
  }

  getWeatherEmoji(iconNumber: number): string {
    const emojiMap: Record<number, string> = {
      1: '☀️', // Sunny
      2: '🌤️', // Mostly Sunny
      3: '⛅', // Partly Sunny
      4: '⛅', // Intermittent Clouds
      5: '🌥️', // Hazy Sunshine
      6: '🌥️', // Mostly Cloudy
      7: '☁️', // Cloudy
      8: '☁️', // Dreary
      11: '🌫️', // Fog
      12: '🌧️', // Showers
      13: '🌦️', // Mostly Cloudy w/ Showers
      14: '🌦️', // Partly Sunny w/ Showers
      15: '⛈️', // T-Storms
      16: '⛈️', // Mostly Cloudy w/ T-Storms
      17: '⛈️', // Partly Sunny w/ T-Storms
      18: '🌧️', // Rain
      19: '🌨️', // Flurries
      20: '🌨️', // Mostly Cloudy w/ Flurries
      21: '🌨️', // Partly Sunny w/ Flurries
      22: '❄️', // Snow
      23: '❄️', // Mostly Cloudy w/ Snow
      24: '🧊', // Ice
      25: '🌨️', // Sleet
      26: '🌧️', // Freezing Rain
      29: '🌨️', // Rain and Snow
      30: '🥵', // Hot
      31: '🥶', // Cold
      32: '💨', // Windy
      33: '🌙', // Clear (night)
      34: '🌙', // Mostly Clear (night)
      35: '☁️', // Partly Cloudy (night)
      36: '☁️', // Intermittent Clouds (night)
      37: '🌫️', // Hazy Moonlight
      38: '☁️', // Mostly Cloudy (night)
      39: '🌧️', // Partly Cloudy w/ Showers (night)
      40: '🌧️', // Mostly Cloudy w/ Showers (night)
      41: '⛈️', // Partly Cloudy w/ T-Storms (night)
      42: '⛈️', // Mostly Cloudy w/ T-Storms (night)
      43: '🌨️', // Mostly Cloudy w/ Flurries (night)
      44: '❄️', // Mostly Cloudy w/ Snow (night)
    };

    return emojiMap[iconNumber] || '🌡️';
  }
}

export const weatherService = new WeatherService();
