import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { DailyForecast } from "../../types/weather.types";
import { HourlyForecast } from "../../types/travel.types";
import { getDestination } from "../../constants/destinations";
import { DestinationId } from "../../types/travel.types";
import { getHourlyForecast12 } from "../../services/forecastService";
import { weatherService } from "../../services/weatherService";
import { computeDaySummaryFacts, generateDaySummary, DaySummaryFacts } from "../../services/gemini/summaryService";
import { COLORS, GRADIENTS, SHADOWS } from "../../constants/theme";

function GlassCard({
  title,
  emoji,
  children,
}: {
  title: string;
  emoji?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.glassCard}>
      <Text style={styles.cardTitle}>
        {emoji && `${emoji} `}{title}
      </Text>
      {children}
    </View>
  );
}

// AI Summary Section Component
function AISummarySection({
  facts,
}: {
  facts: DaySummaryFacts | null;
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!facts) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateDaySummary(facts);
      setSummary(result);
    } catch (e) {
      console.error("AI Summary error:", e);
      setError(e instanceof Error ? e.message : "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  }, [facts]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (!facts) {
    return null;
  }

  return (
    <GlassCard title="AI Weather Summary" emoji="🤖">
      {loading ? (
        <View style={styles.summaryLoading}>
          <ActivityIndicator size="small" color={COLORS.accentBlue} />
          <Text style={styles.summaryLoadingText}>Generating summary...</Text>
        </View>
      ) : error ? (
        <View style={styles.summaryError}>
          <Text style={styles.summaryErrorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchSummary}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : summary ? (
        <Text style={styles.summaryText}>{summary}</Text>
      ) : (
        <Text style={styles.noDataText}>No summary available</Text>
      )}
    </GlassCard>
  );
}

// Stats Row Component
function StatsRow({
  hourlyData,
  dailyForecast,
}: {
  hourlyData: HourlyForecast[];
  dailyForecast: DailyForecast | undefined;
}) {
  // Calculate peak rain hour
  let peakRainHour: string | null = null;
  let peakRainProbability = 0;

  if (hourlyData.length > 0) {
    const maxPrecipHour = hourlyData.reduce((max, h) =>
      h.precipProbability > (max?.precipProbability ?? 0) ? h : max
    , hourlyData[0]);

    if (maxPrecipHour.precipProbability > 0) {
      peakRainHour = maxPrecipHour.localTime;
      peakRainProbability = maxPrecipHour.precipProbability;
    }
  }

  // Calculate rain window
  const rainyHours = hourlyData.filter(h => h.precipProbability >= 30);
  let rainWindow: string | null = null;
  if (rainyHours.length >= 2) {
    rainWindow = `${rainyHours[0].localTime} - ${rainyHours[rainyHours.length - 1].localTime}`;
  } else if (rainyHours.length === 1) {
    rainWindow = `Around ${rainyHours[0].localTime}`;
  }

  // Check if precipitation expected
  const hasPrecip = dailyForecast?.Day.HasPrecipitation || dailyForecast?.Night.HasPrecipitation;

  return (
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Peak Rain</Text>
        <Text style={styles.statValue}>
          {peakRainHour ? `${peakRainHour}` : "None"}
        </Text>
        {peakRainProbability > 0 && (
          <Text style={styles.statSubValue}>{peakRainProbability}%</Text>
        )}
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Rain Window</Text>
        <Text style={styles.statValue}>
          {rainWindow || "No rain expected"}
        </Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statLabel}>Precipitation</Text>
        <Text style={styles.statValue}>
          {hasPrecip ? "Expected" : "None"}
        </Text>
      </View>
    </View>
  );
}

// Vertical Hourly Row Component
function HourlyRow({ hour }: { hour: HourlyForecast }) {
  const precipColor = hour.precipProbability > 50
    ? COLORS.accentBlue
    : hour.precipProbability > 20
      ? "rgba(74, 144, 217, 0.7)"
      : COLORS.textMuted;

  return (
    <View style={styles.hourlyRow}>
      <Text style={styles.hourlyRowTime}>{hour.localTime}</Text>
      <View style={styles.hourlyRowTemp}>
        <Text style={styles.hourlyRowTempText}>{Math.round(hour.temperature)}°C</Text>
      </View>
      <View style={styles.hourlyRowPrecip}>
        <View style={styles.hourlyRowPrecipBarBg}>
          <View
            style={[
              styles.hourlyRowPrecipBar,
              {
                width: `${Math.max(5, hour.precipProbability)}%`,
                backgroundColor: precipColor,
              }
            ]}
          />
        </View>
        <Text style={[styles.hourlyRowPrecipText, { color: precipColor }]}>
          {hour.precipProbability}%
        </Text>
      </View>
      <Text style={styles.hourlyRowCondition}>{hour.iconPhrase}</Text>
    </View>
  );
}

// Vertical Hourly Timeline Component
function VerticalHourlyTimeline({
  hourlyData,
  loading
}: {
  hourlyData: HourlyForecast[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <View style={styles.hourlyLoader}>
        <ActivityIndicator size="small" color={COLORS.accentBlue} />
        <Text style={styles.hourlyLoaderText}>Loading hourly data...</Text>
      </View>
    );
  }

  if (hourlyData.length === 0) {
    return (
      <Text style={styles.noDataText}>Hourly data not available</Text>
    );
  }

  return (
    <View style={styles.verticalTimeline}>
      {/* Header Row */}
      <View style={styles.hourlyHeaderRow}>
        <Text style={[styles.hourlyHeaderCell, styles.hourlyTimeCol]}>Time</Text>
        <Text style={[styles.hourlyHeaderCell, styles.hourlyTempCol]}>Temp</Text>
        <Text style={[styles.hourlyHeaderCell, styles.hourlyPrecipCol]}>Rain %</Text>
        <Text style={[styles.hourlyHeaderCell, styles.hourlyConditionCol]}>Condition</Text>
      </View>
      {/* Data Rows */}
      <FlatList
        data={hourlyData}
        keyExtractor={(item, index) => `${item.dateTime}-${index}`}
        renderItem={({ item }) => <HourlyRow hour={item} />}
        scrollEnabled={false}
      />
    </View>
  );
}

export default function WeatherDayDetailScreen() {
  const params = useLocalSearchParams<{
    date: string;
    destinationId: string;
    dailyForecastJson: string;
  }>();

  const [hourlyData, setHourlyData] = useState<HourlyForecast[]>([]);
  const [hourlyLoading, setHourlyLoading] = useState(true);
  const [summaryFacts, setSummaryFacts] = useState<DaySummaryFacts | null>(null);

  const destination = getDestination(params.destinationId as DestinationId);

  let dailyForecast: DailyForecast | undefined;
  try {
    dailyForecast = JSON.parse(params.dailyForecastJson || "{}");
  } catch (e) {
    console.error("Failed to parse dailyForecastJson:", e);
  }

  const dateObj = new Date(params.date);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const tempHigh = dailyForecast?.Temperature?.Maximum?.Value;
  const tempLow = dailyForecast?.Temperature?.Minimum?.Value;
  const dayIcon = dailyForecast?.Day?.Icon;
  const dayPhrase = dailyForecast?.Day?.IconPhrase;
  const nightPhrase = dailyForecast?.Night?.IconPhrase;

  // Fetch hourly forecast
  useEffect(() => {
    async function fetchHourly() {
      if (!destination) return;
      try {
        const data = await getHourlyForecast12(destination.accuweatherLocationKey);
        setHourlyData(data);

        // Compute summary facts for AI
        if (data.length > 0 && dailyForecast) {
          const facts = computeDaySummaryFacts(
            params.date,
            destination.displayName,
            data,
            {
              tempMinC: tempLow ?? null,
              tempMaxC: tempHigh ?? null,
              precipAmountMmDay: null,
              precipAmountMmNight: null,
            }
          );
          setSummaryFacts(facts);
        }
      } catch (e) {
        console.warn("Failed to fetch hourly forecast:", e);
      } finally {
        setHourlyLoading(false);
      }
    }
    fetchHourly();
  }, [destination?.accuweatherLocationKey, params.date]);

  if (!dailyForecast || !dailyForecast.Date) {
    return (
      <LinearGradient colors={[...GRADIENTS.main]} style={styles.container}>
        <SafeAreaView style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>❓</Text>
          <Text style={styles.errorText}>No weather data available for this date</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Prepare list data for FlatList
  const listData = [
    { type: "header" as const },
    { type: "summary" as const },
    { type: "stats" as const },
    { type: "conditions" as const },
    { type: "hourly" as const },
  ];

  const renderItem = ({ item }: { item: { type: string } }) => {
    switch (item.type) {
      case "header":
        return (
          <View style={styles.header}>
            <Text style={styles.headerEmoji}>
              {weatherService.getWeatherEmoji(dayIcon || 1)}
            </Text>
            <Text style={styles.headerDate}>{formattedDate}</Text>
            <Text style={styles.headerTempRange}>
              {Math.round(tempLow ?? 0)}° / {Math.round(tempHigh ?? 0)}°C
            </Text>
            <Text style={styles.headerLocation}>
              {destination?.displayName || "Unknown"}
            </Text>
          </View>
        );

      case "summary":
        return <AISummarySection facts={summaryFacts} />;

      case "stats":
        return (
          <GlassCard title="Quick Stats" emoji="📊">
            <StatsRow hourlyData={hourlyData} dailyForecast={dailyForecast} />
          </GlassCard>
        );

      case "conditions":
        return (
          <GlassCard title="Day & Night Conditions" emoji="🌓">
            <View style={styles.conditionsContainer}>
              <View style={styles.conditionItem}>
                <Text style={styles.conditionEmoji}>☀️</Text>
                <Text style={styles.conditionLabel}>Day</Text>
                <Text style={styles.conditionText}>{dayPhrase || "N/A"}</Text>
                {dailyForecast?.Day.HasPrecipitation && (
                  <Text style={styles.precipInfo}>
                    {dailyForecast.Day.PrecipitationType} - {dailyForecast.Day.PrecipitationIntensity}
                  </Text>
                )}
              </View>
              <View style={styles.conditionDivider} />
              <View style={styles.conditionItem}>
                <Text style={styles.conditionEmoji}>🌙</Text>
                <Text style={styles.conditionLabel}>Night</Text>
                <Text style={styles.conditionText}>{nightPhrase || "N/A"}</Text>
                {dailyForecast?.Night.HasPrecipitation && (
                  <Text style={styles.precipInfo}>
                    {dailyForecast.Night.PrecipitationType} - {dailyForecast.Night.PrecipitationIntensity}
                  </Text>
                )}
              </View>
            </View>
          </GlassCard>
        );

      case "hourly":
        return (
          <GlassCard title="Hourly Forecast" emoji="🕐">
            <Text style={styles.timezoneText}>
              Local time ({destination?.timezone || "UTC"})
            </Text>
            <VerticalHourlyTimeline hourlyData={hourlyData} loading={hourlyLoading} />
          </GlassCard>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient colors={[...GRADIENTS.main]} style={styles.container}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <FlatList
          data={listData}
          keyExtractor={(item, index) => `${item.type}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 16,
  },
  headerEmoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  headerDate: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerTempRange: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: "300",
    marginBottom: 8,
  },
  headerLocation: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  glassCard: {
    backgroundColor: COLORS.glassBackground,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.card,
  },
  cardTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  // AI Summary styles
  summaryLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 12,
  },
  summaryLoadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  summaryError: {
    alignItems: "center",
    paddingVertical: 12,
  },
  summaryErrorText: {
    color: "#ef4444",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: COLORS.accentBlue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  summaryText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    lineHeight: 24,
  },
  // Stats Row styles
  statsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  statSubValue: {
    color: COLORS.accentBlue,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginHorizontal: 8,
  },
  // Conditions styles
  conditionsContainer: {
    flexDirection: "row",
  },
  conditionItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  conditionEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  conditionLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  conditionText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  precipInfo: {
    color: COLORS.accentBlue,
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  conditionDivider: {
    width: 1,
    height: 80,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginHorizontal: 12,
  },
  // Vertical Hourly Timeline styles
  verticalTimeline: {
    marginTop: 8,
  },
  hourlyHeaderRow: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
    marginBottom: 8,
  },
  hourlyHeaderCell: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  hourlyTimeCol: {
    width: 50,
  },
  hourlyTempCol: {
    width: 50,
  },
  hourlyPrecipCol: {
    flex: 1,
    marginHorizontal: 8,
  },
  hourlyConditionCol: {
    width: 80,
    textAlign: "right",
  },
  hourlyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  hourlyRowTime: {
    width: 50,
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  hourlyRowTemp: {
    width: 50,
  },
  hourlyRowTempText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  hourlyRowPrecip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    gap: 8,
  },
  hourlyRowPrecipBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(74, 144, 217, 0.15)",
    borderRadius: 3,
    overflow: "hidden",
  },
  hourlyRowPrecipBar: {
    height: "100%",
    borderRadius: 3,
  },
  hourlyRowPrecipText: {
    width: 32,
    fontSize: 12,
    fontWeight: "500",
    textAlign: "right",
  },
  hourlyRowCondition: {
    width: 80,
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: "right",
  },
  hourlyLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 12,
  },
  hourlyLoaderText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  timezoneText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 8,
  },
  noDataText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 12,
  },
});
