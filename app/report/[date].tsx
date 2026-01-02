import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
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
import { COLORS, GRADIENTS, SHADOWS } from "../../constants/theme";

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

function HourlyTimeline({ hourlyData }: { hourlyData: HourlyForecast[] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.hourlyScroll}
      contentContainerStyle={styles.hourlyContent}
    >
      {hourlyData.map((hour, index) => (
        <View key={index} style={styles.hourlyItem}>
          <Text style={styles.hourlyTime}>{hour.localTime}</Text>
          <Text style={styles.hourlyTemp}>{Math.round(hour.temperature)}°</Text>
          <View style={styles.hourlyRainBarContainer}>
            <View
              style={[
                styles.hourlyRainFill,
                {
                  height: `${Math.max(10, hour.precipProbability)}%`,
                  backgroundColor: hour.precipProbability > 50 ? COLORS.accentBlue : "rgba(74, 144, 217, 0.5)",
                },
              ]}
            />
          </View>
          <Text style={styles.hourlyRainText}>
            {hour.precipProbability > 0 ? `${hour.precipProbability}%` : "-"}
          </Text>
        </View>
      ))}
    </ScrollView>
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

  // Fetch hourly forecast
  useEffect(() => {
    async function fetchHourly() {
      if (!destination) return;
      try {
        const data = await getHourlyForecast12(destination.accuweatherLocationKey);
        setHourlyData(data);
      } catch (e) {
        console.warn("Failed to fetch hourly forecast:", e);
      } finally {
        setHourlyLoading(false);
      }
    }
    fetchHourly();
  }, [destination?.accuweatherLocationKey]);

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

  return (
    <LinearGradient colors={[...GRADIENTS.main]} style={styles.container}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Date Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>
            {RISK_EMOJIS[dayRisk.riskLevel]}
          </Text>
          <Text style={styles.headerDate}>{formatDate(params.date)}</Text>
          <View
            style={[
              styles.riskBadge,
              { backgroundColor: RISK_BG_COLORS[dayRisk.riskLevel] },
            ]}
          >
            <Text style={[styles.riskBadgeText, { color: RISK_COLORS[dayRisk.riskLevel] }]}>
              {dayRisk.riskLevel} RISK
            </Text>
          </View>
          <Text style={styles.confidence}>
            {Math.round(dayRisk.confidence * 100)}% Confidence
          </Text>
        </View>

        {/* Ask AI Button - at top */}
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

        {/* Hourly Timeline */}
        <GlassCard title="Hourly Forecast" emoji="🕐">
          <Text style={styles.timezoneText}>
            Local time ({destination?.timezone || "UTC"})
          </Text>
          {hourlyLoading ? (
            <ActivityIndicator size="small" color={COLORS.accentBlue} style={styles.hourlyLoader} />
          ) : hourlyData.length > 0 ? (
            <>
              <View style={styles.hourlyLegend}>
                <Text style={styles.legendItem}>🌡️ Temp</Text>
                <Text style={styles.legendItem}>💧 Rain %</Text>
              </View>
              <HourlyTimeline hourlyData={hourlyData} />
            </>
          ) : (
            <Text style={styles.noDataText}>Hourly data not available</Text>
          )}
        </GlassCard>

        {/* Travel Advice with emoji */}
        <GlassCard title="Travel Advice" emoji={ADVICE_EMOJIS[dayRisk.riskLevel]}>
          <Text style={styles.adviceText}>{dayRisk.advice}</Text>
        </GlassCard>

        {/* Analysis with bullet points */}
        <GlassCard title="Analysis" emoji="📊">
          {rationalePoints.length > 0 ? (
            rationalePoints.map((point, i) => (
              <BulletPoint key={i} text={point} />
            ))
          ) : (
            <Text style={styles.rationaleText}>{dayRisk.rationale}</Text>
          )}
        </GlassCard>

        {/* Expected Rainfall - Total for Day */}
        {(totalRainfall !== null || dayRisk.expectedRainMmRange) && (
          <GlassCard title="Expected Rainfall" emoji="🌧️">
            {totalRainfall !== null ? (
              <View style={styles.rainfallContainer}>
                <Text style={styles.rainfallTotal}>
                  {totalRainfall.toFixed(1)} mm
                </Text>
                <Text style={styles.rainfallLabel}>total for the day</Text>
              </View>
            ) : dayRisk.expectedRainMmRange ? (
              <View style={styles.rainfallContainer}>
                <Text style={styles.rainfallTotal}>
                  {dayRisk.expectedRainMmRange.min} – {dayRisk.expectedRainMmRange.max} mm
                </Text>
                <Text style={styles.rainfallLabel}>expected range</Text>
              </View>
            ) : null}
            {dayForecast && (
              <View style={styles.rainfallBreakdown}>
                <Text style={styles.breakdownText}>
                  ☀️ Day: {dayForecast.precipAmountMmDay?.toFixed(1) ?? "0"} mm ({dayForecast.precipProbabilityDay ?? 0}% chance)
                </Text>
                <Text style={styles.breakdownText}>
                  🌙 Night: {dayForecast.precipAmountMmNight?.toFixed(1) ?? "0"} mm ({dayForecast.precipProbabilityNight ?? 0}% chance)
                </Text>
              </View>
            )}
          </GlassCard>
        )}

        {/* Weather Flags with emoji */}
        {dayRisk.flags && dayRisk.flags.length > 0 && (
          <GlassCard title="Weather Alerts" emoji="🚨">
            <View style={styles.flagsContainer}>
              {dayRisk.flags.map((flag, i) => (
                <View key={i} style={styles.flag}>
                  <Text style={styles.flagEmoji}>{getFlagEmoji(flag)}</Text>
                  <Text style={styles.flagText}>
                    {flag.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        )}

        {/* Temperature Range */}
        {dayForecast && (dayForecast.tempMinC !== null || dayForecast.tempMaxC !== null) && (
          <GlassCard title="Temperature" emoji="🌡️">
            <View style={styles.tempContainer}>
              <View style={styles.tempItem}>
                <View style={styles.tempIconContainer}>
                  <Text style={styles.tempEmoji}>❄️</Text>
                </View>
                <Text style={styles.tempValue}>
                  {dayForecast.tempMinC?.toFixed(0) ?? "N/A"}°
                </Text>
                <Text style={styles.tempLabel}>Low</Text>
              </View>
              <View style={styles.tempDivider} />
              <View style={styles.tempItem}>
                <View style={styles.tempIconContainer}>
                  <Text style={styles.tempEmoji}>🔥</Text>
                </View>
                <Text style={styles.tempValue}>
                  {dayForecast.tempMaxC?.toFixed(0) ?? "N/A"}°
                </Text>
                <Text style={styles.tempLabel}>High</Text>
              </View>
            </View>
          </GlassCard>
        )}
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
  timezoneText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 8,
  },
  hourlyScroll: {
    marginHorizontal: -8,
  },
  hourlyContent: {
    paddingHorizontal: 8,
    gap: 12,
  },
  hourlyItem: {
    alignItems: "center",
    width: 48,
  },
  hourlyTime: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  hourlyTemp: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  hourlyRainBarContainer: {
    width: 24,
    height: 40,
    backgroundColor: "rgba(74, 144, 217, 0.1)",
    borderRadius: 6,
    overflow: "hidden",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  hourlyRainFill: {
    width: "100%",
    borderRadius: 6,
  },
  hourlyRainText: {
    color: COLORS.accentBlue,
    fontSize: 10,
    fontWeight: "500",
  },
  hourlyLegend: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  hourlyLoader: {
    paddingVertical: 20,
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
  tempContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },
  tempItem: {
    alignItems: "center",
    flex: 1,
  },
  tempIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  tempEmoji: {
    fontSize: 24,
  },
  tempValue: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: "700",
  },
  tempLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  tempDivider: {
    width: 1,
    height: 80,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
});
