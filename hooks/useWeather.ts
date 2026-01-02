import { useState, useEffect, useCallback } from 'react';
import { WeatherService } from '../services/weatherService';
import { WeatherData } from '../services/weather.types';

interface UseWeatherResult {
  weatherData: WeatherData | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  refetch: () => void;
}

export function useWeather(location: string, days: number = 7): UseWeatherResult {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeather = useCallback(async () => {
    try {
      setError(null);
      const data = await WeatherService.getWeather(location, days);
      setWeatherData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data';
      setError(errorMessage);
      console.error('❌ Weather fetch error:', err);
      console.error('❌ Error message:', errorMessage);
      console.error('❌ Error type:', err instanceof Error ? err.constructor.name : typeof err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [location, days]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const refetch = useCallback(() => {
    setRefreshing(true);
    fetchWeather();
  }, [fetchWeather]);

  return {
    weatherData,
    loading,
    error,
    refreshing,
    refetch,
  };
}
