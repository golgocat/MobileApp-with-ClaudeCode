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
import { useLocalSearchParams, router } from "expo-router";
import { DayRisk, DayForecast, TravelRiskReport, DayRiskLevel, HourlyForecast } from "../../types/travel.types";
import { getDestination } from "../../constants/destinations";
import { DestinationId } from "../../types/travel.types";
import { formatDate } from "../../utils/dateRange";
import { getHourlyForecast12 } from "../../services/forecastService";
import { computeDaySummaryFacts, generateDaySummary, DaySummaryFacts } from "../../services/gemini/summaryService";
import { COLORS, GRADIENTS, SHADOWS } from "../../constants/theme";

// Wind level helpers
type WindLevel = "Calm" | "Light" | "Moderate" | "Strong" | "Very Strong";

function getWindLevel(avgWindKmh: number): { level: WindLevel; emoji: string; color: string } {
  if (avgWindKmh < 5) return { level: "Calm", emoji: "🍃", color: "#22c55e" };
  if (avgWindKmh < 20) return { level: "Light", emoji: "🌿", color: "#84cc16" };
  if (avgWindKmh < 40) return { level: "Moderate", emoji: "💨", color: "#fbbf24" };
  if (avgWindKmh < 60) return { level: "Strong", emoji: "🌬️", color: "#f97316" };
  return { level: "Very Strong", emoji: "🌪️", color: "#ef4444" };
}

const RISK_COLORS: Record<DayRiskLevel, string> = {
  LOW: "#22c55e",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
  EXTREME: "#dc2626",
};

const RISK_BG_COLORS: Record<DayRiskLevel, string> = {
  LOW: "rgba(34, 197, 94, 0.15)",
  MEDIUM: "rgba(245, 158, 11, 0.15)",
  HIGH: "rgba(239, 68, 68, 0.15)",
  EXTREME: "rgba(220, 38, 38, 0.2)",
};

const RISK_EMOJIS: Record<DayRiskLevel, string> = {
  LOW: "☀️",
  MEDIUM: "🌤️",
  HIGH: "🌧️",
  EXTREME: "⛈️",
};

const ADVICE_EMOJIS: Record<DayRiskLevel, string> = {
  LOW: "✅",
  MEDIUM: "⚠️",
  HIGH: "🌂",
  EXTREME: "🚫",
};

// Map weather flags to emoji
const FLAG_EMOJIS: Record<string, string> = {
  monsoon_season: "🌊",
  flash_flood_risk: "🌊",
  thunderstorm_risk: "⚡",
  heavy_rain: "🌧️",
  strong_winds: "💨",
  tropical_storm: "🌀",
  heat_wave: "🥵",
  cold_snap: "🥶",
  fog: "🌫️",
  hail: "🧊",
  snow: "❄️",
  uv_high: "☀️",
  humidity_high: "💦",
  default: "⚠️",
};

function getFlagEmoji(flag: string): string {
  const key = flag.toLowerCase().replace(/[^a-z_]/g, "_");
  return FLAG_EMOJIS[key] || FLAG_EMOJIS.default;
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
  facts,
  onRetry,
}: {
  facts: DaySummaryFacts | null;
  onRetry: () => void;
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

  const handleRetry = () => {
    fetchSummary();
    onRetry();
  };

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
          <Pressable style={styles.retryButton} onPress={handleRetry}>
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
  dayForecast,
}: {
  hourlyData: HourlyForecast[];
  dayForecast: DayForecast | undefined;
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

  // Calculate total precipitation
  const totalPrecipMm = dayForecast
    ? (dayForecast.precipAmountMmDay ?? 0) + (dayForecast.precipAmountMmNight ?? 0)
    : 0;

  // Get wind level
  const windInfo = dayForecast?.windSpeedKmh != null
    ? getWindLevel(dayForecast.windSpeedKmh)
    : null;

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
        <Text style={styles.statLabel}>Precipitation</Text>
        <Text style={styles.statValue}>
          {totalPrecipMm > 0 ? `${totalPrecipMm.toFixed(1)} mm` : "None"}
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
              {dayForecast?.windSpeedKmh?.toFixed(0)} km/h
            </Text>
          </>
        ) : (
          <Text style={styles.statValue}>N/A</Text>
        )}
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

function BulletPoint({ text }: { text: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

export default function DayDetailScreen() {
  const params = useLocalSearchParams<{
    date: string;
    destinationId: string;
    reportJson: string;
    forecastJson: string;
  }>();

  const [hourlyData, setHourlyData] = useState<HourlyForecast[]>([]);
  const [hourlyLoading, setHourlyLoading] = useState(true);
  const [summaryFacts, setSummaryFacts] = useState<DaySummaryFacts | null>(null);

  const destination = getDestination(params.destinationId as DestinationId);

  let dayRisk: DayRisk | undefined;
  let dayForecast: DayForecast | undefined;

  try {
    const report: TravelRiskReport = JSON.parse(params.reportJson || "{}");
    const forecasts: DayForecast[] = JSON.parse(params.forecastJson || "[]");

    dayRisk = report.days?.find((d) => d.date === params.date);
    dayForecast = forecasts.find((f) => f.date === params.date);
  } catch (e) {
    console.error("Failed to parse params:", e);
  }

  // Fetch hourly forecast and compute summary facts
  useEffect(() => {
    async function fetchHourly() {
      if (!destination) return;
      try {
        const data = await getHourlyForecast12(destination.accuweatherLocationKey);
        setHourlyData(data);

        // Compute summary facts for AI
        if (data.length > 0) {
          const facts = computeDaySummaryFacts(
            params.date,
            destination.displayName,
            data,
            dayForecast
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

  const handleAskAI = () => {
    if (!dayRisk) return;

    router.push({
      pathname: "/report/chat",
      params: {
        date: formatDate(params.date),
        destination: destination?.displayName || "Unknown",
        riskLevel: dayRisk.riskLevel,
        advice: dayRisk.advice,
        rationale: dayRisk.rationale,
        forecastJson: dayForecast
          ? JSON.stringify({
              precipProbDay: dayForecast.precipProbabilityDay,
              precipProbNight: dayForecast.precipProbabilityNight,
              tempMin: dayForecast.tempMinC,
              tempMax: dayForecast.tempMaxC,
            })
          : "",
      },
    });
  };

  // Callback for AI summary retry
  const handleSummaryRetry = useCallback(() => {
    // Summary component handles its own retry logic
  }, []);

  // Calculate total rainfall for the day
  const totalRainfall =
    dayForecast &&
    (dayForecast.precipAmountMmDay !== null || dayForecast.precipAmountMmNight !== null)
      ? (dayForecast.precipAmountMmDay ?? 0) + (dayForecast.precipAmountMmNight ?? 0)
      : null;

  // Parse rationale into bullet points (split by sentences or periods)
  const rationalePoints = dayRisk?.rationale
    ? dayRisk.rationale
        .split(/(?<=[.!?])\s+/)
        .filter((s) => s.trim().length > 0)
        .slice(0, 4) // Max 4 bullet points
    : [];

  if (!dayRisk) {
    return (
      <LinearGradient colors={[...GRADIENTS.main]} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>❓</Text>
          <Text style={styles.errorText}>No data available for this date</Text>
        </View>
      </LinearGradient>
    );
  }

  // Prepare list data for FlatList
  const listData = [
    { type: "header" as const },
    { type: "summary" as const },
    { type: "stats" as const },
    { type: "hourly" as const },
    { type: "advice" as const },
    { type: "analysis" as const },
    ...(totalRainfall !== null || dayRisk.expectedRainMmRange ? [{ type: "rainfall" as const }] : []),
    ...(dayRisk.flags && dayRisk.flags.length > 0 ? [{ type: "flags" as const }] : []),
  ];

  const renderItem = ({ item }: { item: { type: string } }) => {
    switch (item.type) {
      case "header":
        return (
          <>
            {/* Date Header with Temperature Range */}
            <View style={styles.header}>
              <Text style={styles.headerEmoji}>
                {RISK_EMOJIS[dayRisk!.riskLevel]}
              </Text>
              <Text style={styles.headerDate}>{formatDate(params.date)}</Text>

              {/* Temperature Range in Header */}
              {dayForecast && (dayForecast.tempMinC !== null || dayForecast.tempMaxC !== null) && (
                <Text style={styles.headerTempRange}>
                  {dayForecast.tempMinC?.toFixed(0) ?? "--"}° / {dayForecast.tempMaxC?.toFixed(0) ?? "--"}°C
                </Text>
              )}

              <View
                style={[
                  styles.riskBadge,
                  { backgroundColor: RISK_BG_COLORS[dayRisk!.riskLevel] },
                ]}
              >
                <Text style={[styles.riskBadgeText, { color: RISK_COLORS[dayRisk!.riskLevel] }]}>
                  {dayRisk!.riskLevel} RISK
                </Text>
              </View>
              <Text style={styles.confidence}>
                {Math.round(dayRisk!.confidence * 100)}% Confidence
              </Text>
            </View>

            {/* Ask AI Button */}
            <Pressable
              style={({ pressed }) => [
                styles.askAiButton,
                pressed && styles.askAiButtonPressed,
              ]}
              onPress={handleAskAI}
            >
              <Text style={styles.askAiIcon}>💬</Text>
              <Text style={styles.askAiText}>Ask AI about this day</Text>
            </Pressable>
          </>
        );

      case "summary":
        return (
          <AISummarySection facts={summaryFacts} onRetry={handleSummaryRetry} />
        );

      case "stats":
        return (
          <GlassCard title="Quick Stats" emoji="📊">
            <StatsRow hourlyData={hourlyData} dayForecast={dayForecast} />
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

      case "advice":
        return (
          <GlassCard title="Travel Advice" emoji={ADVICE_EMOJIS[dayRisk!.riskLevel]}>
            <Text style={styles.adviceText}>{dayRisk!.advice}</Text>
          </GlassCard>
        );

      case "analysis":
        return (
          <GlassCard title="Analysis" emoji="📈">
            {rationalePoints.length > 0 ? (
              rationalePoints.map((point, i) => (
                <BulletPoint key={i} text={point} />
              ))
            ) : (
              <Text style={styles.rationaleText}>{dayRisk!.rationale}</Text>
            )}
          </GlassCard>
        );

      case "rainfall":
        return (
          <GlassCard title="Expected Rainfall" emoji="🌧️">
            {totalRainfall !== null ? (
              <View style={styles.rainfallContainer}>
                <Text style={styles.rainfallTotal}>
                  {totalRainfall.toFixed(1)} mm
                </Text>
                <Text style={styles.rainfallLabel}>total for the day</Text>
              </View>
            ) : dayRisk!.expectedRainMmRange ? (
              <View style={styles.rainfallContainer}>
                <Text style={styles.rainfallTotal}>
                  {dayRisk!.expectedRainMmRange.min} – {dayRisk!.expectedRainMmRange.max} mm
                </Text>
                <Text style={styles.rainfallLabel}>expected range</Text>
              </View>
            ) : null}
            {dayForecast && (
              <View style={styles.rainfallBreakdown}>
                <Text style={styles.breakdownText}>
                  Day: {dayForecast.precipAmountMmDay?.toFixed(1) ?? "0"} mm ({dayForecast.precipProbabilityDay ?? 0}% chance)
                </Text>
                <Text style={styles.breakdownText}>
                  Night: {dayForecast.precipAmountMmNight?.toFixed(1) ?? "0"} mm ({dayForecast.precipProbabilityNight ?? 0}% chance)
                </Text>
              </View>
            )}
          </GlassCard>
        );

      case "flags":
        return (
          <GlassCard title="Weather Alerts" emoji="🚨">
            <View style={styles.flagsContainer}>
              {dayRisk!.flags.map((flag, i) => (
                <View key={i} style={styles.flag}>
                  <Text style={styles.flagEmoji}>{getFlagEmoji(flag)}</Text>
                  <Text style={styles.flagText}>
                    {flag.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        );

      default:
        return null;
    }
  };

  return (
    <LinearGradient colors={[...GRADIENTS.main]} style={styles.container}>
      <FlatList
        data={listData}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
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
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 12,
  },
  headerEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  headerDate: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerTempRange: {
    color: COLORS.textSecondary,
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 12,
  },
  riskBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 8,
  },
  riskBadgeText: {
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  confidence: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  askAiButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accentBlue,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 8,
    ...SHADOWS.card,
  },
  askAiButtonPressed: {
    backgroundColor: "#3a7fc4",
    transform: [{ scale: 0.98 }],
  },
  askAiIcon: {
    fontSize: 20,
  },
  askAiText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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
  adviceText: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 24,
  },
  rationaleText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  bulletDot: {
    color: COLORS.accentBlue,
    fontSize: 16,
    marginRight: 8,
    lineHeight: 22,
  },
  bulletText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  rainfallContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  rainfallTotal: {
    color: COLORS.accentBlue,
    fontSize: 36,
    fontWeight: "700",
  },
  rainfallLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  rainfallBreakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  breakdownText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  flagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  flag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  flagEmoji: {
    fontSize: 16,
  },
  flagText: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "500",
  },
});
