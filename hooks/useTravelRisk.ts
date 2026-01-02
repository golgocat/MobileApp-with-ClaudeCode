import { useCallback, useState } from "react";
import { Destination, Itinerary, TravelRiskReport, DayForecast } from "../types/travel.types";
import { generateTravelRiskReport } from "../services/riskOrchestrator";

export interface UseTravelRiskReturn {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  forecastDays: DayForecast[] | null;
  report: TravelRiskReport | null;
  generate: (destination: Destination, itinerary: Itinerary) => Promise<void>;
  refresh: (destination: Destination, itinerary: Itinerary) => Promise<void>;
  reset: () => void;
}

export function useTravelRisk(): UseTravelRiskReturn {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecastDays, setForecastDays] = useState<DayForecast[] | null>(null);
  const [report, setReport] = useState<TravelRiskReport | null>(null);

  const generate = useCallback(
    async (destination: Destination, itinerary: Itinerary) => {
      setLoading(true);
      setError(null);
      try {
        const res = await generateTravelRiskReport({ destination, itinerary });
        setForecastDays(res.forecastDays);
        setReport(res.report);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const refresh = useCallback(
    async (destination: Destination, itinerary: Itinerary) => {
      setRefreshing(true);
      setError(null);
      try {
        const res = await generateTravelRiskReport({ destination, itinerary });
        setForecastDays(res.forecastDays);
        setReport(res.report);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        setError(message);
      } finally {
        setRefreshing(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setLoading(false);
    setRefreshing(false);
    setError(null);
    setForecastDays(null);
    setReport(null);
  }, []);

  return {
    loading,
    refreshing,
    error,
    forecastDays,
    report,
    generate,
    refresh,
    reset,
  };
}
