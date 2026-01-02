import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { DayRisk, DayForecast, TravelRiskReport, DayRiskLevel, HourlyForecast } from "../../types/travel.types";
import { getDestination } from "../../constants/destinations";
import { DestinationId } from "../../types/travel.types";
import { formatDate } from "../../utils/dateRange";
import { getHourlyForecast12 } from "../../services/forecastService";

const RISK_COLORS: Record<DayRiskLevel, string> = {
  LOW: "#22c55e",
  MEDIUM: "#f59e0b",
  HIGH: "#ef4444",
  EXTREME: "#dc2626",
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

function InfoCard({
  title,
  emoji,
  children,
}: {
  title: string;
  emoji?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoCardTitle}>
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
                  backgroundColor: hour.precipProbability > 50 ? "#60a5fa" : "rgba(96, 165, 250, 0.5)",
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
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>❓</Text>
          <Text style={styles.errorText}>No data available for this date</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
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
              { backgroundColor: RISK_COLORS[dayRisk.riskLevel] },
            ]}
          >
            <Text style={styles.riskBadgeText}>{dayRisk.riskLevel} RISK</Text>
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
        <InfoCard title="Hourly Forecast" emoji="🕐">
          <Text style={styles.timezoneText}>
            Local time ({destination?.timezone || "UTC"})
          </Text>
          {hourlyLoading ? (
            <ActivityIndicator size="small" color="#60a5fa" style={styles.hourlyLoader} />
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
        </InfoCard>

        {/* Travel Advice with emoji */}
        <InfoCard title="Travel Advice" emoji={ADVICE_EMOJIS[dayRisk.riskLevel]}>
          <Text style={styles.adviceText}>{dayRisk.advice}</Text>
        </InfoCard>

        {/* Analysis with bullet points */}
        <InfoCard title="Analysis" emoji="📊">
          {rationalePoints.length > 0 ? (
            rationalePoints.map((point, i) => (
              <BulletPoint key={i} text={point} />
            ))
          ) : (
            <Text style={styles.rationaleText}>{dayRisk.rationale}</Text>
          )}
        </InfoCard>

        {/* Expected Rainfall - Total for Day */}
        {(totalRainfall !== null || dayRisk.expectedRainMmRange) && (
          <InfoCard title="Expected Rainfall" emoji="🌧️">
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
          </InfoCard>
        )}

        {/* Weather Flags with emoji */}
        {dayRisk.flags && dayRisk.flags.length > 0 && (
          <InfoCard title="Weather Alerts" emoji="🚨">
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
          </InfoCard>
        )}

        {/* Temperature Range */}
        {dayForecast && (dayForecast.tempMinC !== null || dayForecast.tempMaxC !== null) && (
          <InfoCard title="Temperature" emoji="🌡️">
            <View style={styles.tempContainer}>
              <View style={styles.tempItem}>
                <Text style={styles.tempEmoji}>❄️</Text>
                <Text style={styles.tempValue}>
                  {dayForecast.tempMinC?.toFixed(0) ?? "N/A"}°C
                </Text>
                <Text style={styles.tempLabel}>Low</Text>
              </View>
              <View style={styles.tempDivider} />
              <View style={styles.tempItem}>
                <Text style={styles.tempEmoji}>🔥</Text>
                <Text style={styles.tempValue}>
                  {dayForecast.tempMaxC?.toFixed(0) ?? "N/A"}°C
                </Text>
                <Text style={styles.tempLabel}>High</Text>
              </View>
            </View>
          </InfoCard>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e3a5f",
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 12,
  },
  headerEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  headerDate: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  riskBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  riskBadgeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  confidence: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
  askAiButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  askAiButtonPressed: {
    backgroundColor: "#2563eb",
  },
  askAiIcon: {
    fontSize: 18,
  },
  askAiText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  infoCardTitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  timezoneText: {
    color: "rgba(255,255,255,0.5)",
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
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginBottom: 4,
  },
  hourlyTemp: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },
  hourlyRainBarContainer: {
    width: 24,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  hourlyRainFill: {
    width: "100%",
    borderRadius: 4,
  },
  hourlyRainText: {
    color: "#60a5fa",
    fontSize: 10,
  },
  hourlyLegend: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
  },
  hourlyLoader: {
    paddingVertical: 20,
  },
  noDataText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 12,
  },
  adviceText: {
    color: "white",
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 24,
  },
  rationaleText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 22,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  bulletDot: {
    color: "#60a5fa",
    fontSize: 16,
    marginRight: 8,
    lineHeight: 22,
  },
  bulletText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  rainfallContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  rainfallTotal: {
    color: "#67e8f9",
    fontSize: 32,
    fontWeight: "bold",
  },
  rainfallLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 4,
  },
  rainfallBreakdown: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  breakdownText: {
    color: "rgba(255,255,255,0.7)",
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
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  flagEmoji: {
    fontSize: 16,
  },
  flagText: {
    color: "#fca5a5",
    fontSize: 13,
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
  tempEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  tempValue: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  tempLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 2,
  },
  tempDivider: {
    width: 1,
    height: 60,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
});
