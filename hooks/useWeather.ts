import { useState, useEffect, useCallback } from 'react';
import { weatherService } from '../services/weatherService';
import { WeatherData, WeatherError } from '../types/weather.types';

interface UseWeatherReturn {
  weather: WeatherData | null;
  loading: boolean;
  error: WeatherError | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

export function useWeather(locationKey?: string): UseWeatherReturn {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<WeatherError | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await weatherService.getAllWeatherData(locationKey);
      setWeather(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch weather data';
      setError({ message });
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [locationKey]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const refresh = useCallback(async () => {
    await fetchWeather(true);
  }, [fetchWeather]);

  return {
    weather,
    loading,
    error,
    refreshing,
    refresh,
  };
}
