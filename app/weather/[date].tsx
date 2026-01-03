import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { DailyForecast, HourlyForecast } from "../../types/weather.types";
import { getDestination } from "../../constants/destinations";
import { DestinationId } from "../../types/travel.types";
import { weatherService } from "../../services/weatherService";
import { generateDaySummary, computeDaySummaryFacts } from "../../services/gemini/summaryService";
import { COLORS, GRADIENTS, SHADOWS } from "../../constants/theme";

// Wind level helpers
type WindLevel = "Calm" | "Light" | "Moderate" | "Strong" | "Very Strong";

function getWindLevel(windKmh: number): { level: WindLevel; emoji: string; color: string } {
  if (windKmh < 5) return { level: "Calm", emoji: "🍃", color: "#22c55e" };
  if (windKmh < 20) return { level: "Light", emoji: "🌿", color: "#84cc16" };
  if (windKmh < 40) return { level: "Moderate", emoji: "💨", color: "#fbbf24" };
  if (windKmh < 60) return { level: "Strong", emoji: "🌬️", color: "#f97316" };
  return { level: "Very Strong", emoji: "🌪️", color: "#ef4444" };
}

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
  location,
  date,
  hourlyData,
  dailyForecast,
}: {
  location: string;
  date: string;
  hourlyData: HourlyForecast[];
  dailyForecast: DailyForecast | null;
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (hourlyData.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert weather types to travel types for summary service
      const convertedHourly = hourlyData.map(h => ({
        dateTime: h.DateTime,
        localTime: h.DateTime.slice(11, 16),
        temperature: h.Temperature.Value,
        precipProbability: h.PrecipitationProbability,
        iconPhrase: h.IconPhrase,
        icon: h.WeatherIcon,
      }));

      const facts = computeDaySummaryFacts(
        date,
        location,
        convertedHourly,
        dailyForecast ? {
          tempMinC: dailyForecast.Temperature.Minimum.Value,
          tempMaxC: dailyForecast.Temperature.Maximum.Value,
          precipAmountMmDay: null,
          precipAmountMmNight: null,
          iconPhraseDay: dailyForecast.Day.IconPhrase,
        } : undefined
      );

      const result = await generateDaySummary(facts);
      setSummary(result);
    } catch (e) {
      console.error("AI Summary error:", e);
      setError(e instanceof Error ? e.message : "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  }, [hourlyData, location, date, dailyForecast]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <GlassCard title="AI Weather Summary" emoji="🤖">
      {loading ? (
        <View style={styles.summaryLoading}>
          <ActivityIndicator size="small" color={COLORS.accentBlue} />
          <Text style={styles.summaryLoadingText}>Generating summary...</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
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
  dailyForecast: DailyForecast | null;
}) {
  // Calculate peak rain hour
  let peakRainHour: string | null = null;
  let peakRainProbability = 0;

  if (hourlyData.length > 0) {
    const maxPrecipHour = hourlyData.reduce((max, h) =>
      h.PrecipitationProbability > (max?.PrecipitationProbability ?? 0) ? h : max
    , hourlyData[0]);

    if (maxPrecipHour.PrecipitationProbability > 0) {
      peakRainHour = maxPrecipHour.DateTime.slice(11, 16);
      peakRainProbability = maxPrecipHour.PrecipitationProbability;
    }
  }

  // Calculate rain window
  const rainyHours = hourlyData.filter(h => h.PrecipitationProbability >= 30);
  let rainWindow: string | null = null;
  if (rainyHours.length >= 2) {
    rainWindow = `${rainyHours[0].DateTime.slice(11, 16)} - ${rainyHours[rainyHours.length - 1].DateTime.slice(11, 16)}`;
  } else if (rainyHours.length === 1) {
    rainWindow = `Around ${rainyHours[0].DateTime.slice(11, 16)}`;
  }

  // Get wind info from hourly data
  const windSpeeds = hourlyData.map(h => h.Wind?.Speed?.Value ?? 0);
  const avgWind = hourlyData.length > 0
    ? windSpeeds.reduce((sum, v) => sum + v, 0) / hourlyData.length
    : 0;
  const maxWind = hourlyData.length > 0 ? Math.max(...windSpeeds) : 0;
  const windInfo = avgWind > 0 ? getWindLevel(avgWind) : null;

  return (
    <GlassCard title="Quick Stats" emoji="📊">
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Peak Rain</Text>
          <Text style={styles.statValue}>
            {peakRainHour || "None"}
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
          <Text style={styles.statLabel}>Wind</Text>
          {windInfo ? (
            <>
              <Text style={styles.statValue}>
                {windInfo.emoji} {windInfo.level}
              </Text>
              <Text style={[styles.statSubValue, { color: windInfo.color }]}>
                {avgWind.toFixed(0)} km/h{maxWind > avgWind && ` (gust ${maxWind.toFixed(0)})`}
              </Text>
            </>
          ) : (
            <Text style={styles.statValue}>N/A</Text>
          )}
        </View>
      </View>
    </GlassCard>
  );
}

// Day & Night Conditions
function DayNightConditions({ dailyForecast }: { dailyForecast: DailyForecast }) {
  const dayEmoji = weatherService.getWeatherEmoji(dailyForecast.Day.Icon);
  const nightEmoji = weatherService.getWeatherEmoji(dailyForecast.Night.Icon);

  return (
    <GlassCard title="Day & Night Conditions" emoji="🌍">
      <View style={styles.dayNightRow}>
        <View style={styles.dayNightItem}>
          <Text style={styles.dayNightEmoji}>{dayEmoji}</Text>
          <Text style={styles.dayNightLabel}>Day</Text>
          <Text style={styles.dayNightCondition}>{dailyForecast.Day.IconPhrase}</Text>
        </View>
        <View style={styles.dayNightDivider} />
        <View style={styles.dayNightItem}>
          <Text style={styles.dayNightEmoji}>{nightEmoji}</Text>
          <Text style={styles.dayNightLabel}>Night</Text>
          <Text style={styles.dayNightCondition}>{dailyForecast.Night.IconPhrase}</Text>
        </View>
      </View>
    </GlassCard>
  );
}

// Hourly Forecast Row
function HourlyRow({ hour }: { hour: HourlyForecast }) {
  const precipColor = hour.PrecipitationProbability > 50
    ? COLORS.accentBlue
    : hour.PrecipitationProbability > 20
      ? "rgba(74, 144, 217, 0.7)"
      : COLORS.textMuted;

  return (
    <View style={styles.hourlyRow}>
      <Text style={styles.hourlyTime}>{hour.DateTime.slice(11, 16)}</Text>
      <Text style={styles.hourlyTemp}>{Math.round(hour.Temperature.Value)}°C</Text>
      <View style={styles.hourlyPrecipContainer}>
        <View style={styles.hourlyPrecipBarBg}>
          <View
            style={[
              styles.hourlyPrecipBar,
              {
                width: `${Math.max(5, hour.PrecipitationProbability)}%`,
                backgroundColor: precipColor,
              }
            ]}
          />
        </View>
        <Text style={[styles.hourlyPrecipText, { color: precipColor }]}>
          {hour.PrecipitationProbability}%
        </Text>
      </View>
      <Text style={styles.hourlyCondition}>{hour.IconPhrase}</Text>
    </View>
  );
}

export default function WeatherDayDetailScreen() {
  const params = useLocalSearchParams<{
    date: string;
    destinationId: string;
    dailyJson: string;
  }>();

  const [hourlyData, setHourlyData] = useState<HourlyForecast[]>([]);
  const [loading, setLoading] = useState(true);

  const destination = getDestination(params.destinationId as DestinationId);

  let dailyForecast: DailyForecast | null = null;
  try {
    dailyForecast = JSON.parse(params.dailyJson || "null");
  } catch (e) {
    console.error("Failed to parse daily forecast:", e);
  }

  // Fetch hourly forecast
  useEffect(() => {
    async function fetchHourly() {
      if (!destination) return;
      try {
        const data = await weatherService.getHourlyForecast(destination.accuweatherLocationKey);
        setHourlyData(data);
      } catch (e) {
        console.warn("Failed to fetch hourly forecast:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchHourly();
  }, [destination?.accuweatherLocationKey]);

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const emoji = dailyForecast ? weatherService.getWeatherEmoji(dailyForecast.Day.Icon) : "🌡️";

  return (
    <LinearGradient colors={[...GRADIENTS.main]} style={styles.container}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>{emoji}</Text>
          <Text style={styles.headerDate}>{formatDisplayDate(params.date)}</Text>
          {dailyForecast && (
            <Text style={styles.headerTemp}>
              {Math.round(dailyForecast.Temperature.Minimum.Value)}° / {Math.round(dailyForecast.Temperature.Maximum.Value)}°C
            </Text>
          )}
          <Text style={styles.headerLocation}>{destination?.displayName}</Text>
        </View>

        {/* AI Summary */}
        {hourlyData.length > 0 && (
          <AISummarySection
            location={destination?.displayName || ""}
            date={params.date}
            hourlyData={hourlyData}
            dailyForecast={dailyForecast}
          />
        )}

        {/* Quick Stats */}
        <StatsRow hourlyData={hourlyData} dailyForecast={dailyForecast} />

        {/* Day & Night Conditions */}
        {dailyForecast && <DayNightConditions dailyForecast={dailyForecast} />}

        {/* Hourly Forecast */}
        <GlassCard title="Hourly Forecast" emoji="🕐">
          <Text style={styles.timezoneText}>
            Local time ({destination?.timezone || "UTC"})
          </Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.accentBlue} />
              <Text style={styles.loadingText}>Loading hourly data...</Text>
            </View>
          ) : hourlyData.length > 0 ? (
            <View style={styles.hourlyList}>
              {/* Header Row */}
              <View style={styles.hourlyHeaderRow}>
                <Text style={[styles.hourlyHeaderCell, styles.timeCol]}>Time</Text>
                <Text style={[styles.hourlyHeaderCell, styles.tempCol]}>Temp</Text>
                <Text style={[styles.hourlyHeaderCell, styles.precipCol]}>Rain %</Text>
                <Text style={[styles.hourlyHeaderCell, styles.conditionCol]}>Condition</Text>
              </View>
              {hourlyData.map((hour, index) => (
                <HourlyRow key={`${hour.EpochDateTime}-${index}`} hour={hour} />
              ))}
            </View>
          ) : (
            <Text style={styles.noDataText}>Hourly data not available</Text>
          )}
        </GlassCard>
      </ScrollView>
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
  header: {
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 12,
  },
  headerEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  headerDate: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerTemp: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 4,
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
  summaryText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    lineHeight: 24,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    textAlign: "center",
  },
  noDataText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 12,
  },
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
  dayNightRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dayNightItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  dayNightEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  dayNightLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  dayNightCondition: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  dayNightDivider: {
    width: 1,
    height: 60,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  timezoneText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 12,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  hourlyList: {
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
  timeCol: {
    width: 50,
  },
  tempCol: {
    width: 50,
  },
  precipCol: {
    flex: 1,
    marginHorizontal: 8,
  },
  conditionCol: {
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
  hourlyTime: {
    width: 50,
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  hourlyTemp: {
    width: 50,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  hourlyPrecipContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    gap: 8,
  },
  hourlyPrecipBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(74, 144, 217, 0.15)",
    borderRadius: 3,
    overflow: "hidden",
  },
  hourlyPrecipBar: {
    height: "100%",
    borderRadius: 3,
  },
  hourlyPrecipText: {
    width: 32,
    fontSize: 12,
    fontWeight: "500",
    textAlign: "right",
  },
  hourlyCondition: {
    width: 80,
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: "right",
  },
});
