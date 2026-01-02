import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { DayRisk, DayForecast, TravelRiskReport, DayRiskLevel } from "../../types/travel.types";
import { getDestination } from "../../constants/destinations";
import { DestinationId } from "../../types/travel.types";
import { formatDate } from "../../utils/dateRange";

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

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoCardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function StatRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number | null;
  icon: string;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>
        {value !== null && value !== undefined ? value : "N/A"}
      </Text>
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

        {/* Advice */}
        <InfoCard title="Travel Advice">
          <Text style={styles.adviceText}>{dayRisk.advice}</Text>
        </InfoCard>

        {/* Rationale */}
        <InfoCard title="Analysis">
          <Text style={styles.rationaleText}>{dayRisk.rationale}</Text>
        </InfoCard>

        {/* Expected Rain */}
        {dayRisk.expectedRainMmRange && (
          <InfoCard title="Expected Rainfall">
            <Text style={styles.rainText}>
              {dayRisk.expectedRainMmRange.min} – {dayRisk.expectedRainMmRange.max} mm
            </Text>
          </InfoCard>
        )}

        {/* Flags */}
        {dayRisk.flags && dayRisk.flags.length > 0 && (
          <InfoCard title="Weather Flags">
            <View style={styles.flagsContainer}>
              {dayRisk.flags.map((flag, i) => (
                <View key={i} style={styles.flag}>
                  <Text style={styles.flagText}>⚠️ {flag}</Text>
                </View>
              ))}
            </View>
          </InfoCard>
        )}

        {/* Forecast Details */}
        {dayForecast && (
          <InfoCard title="Forecast Data">
            <StatRow
              label="Day Rain Probability"
              value={
                dayForecast.precipProbabilityDay !== null
                  ? `${dayForecast.precipProbabilityDay}%`
                  : null
              }
              icon="🌧️"
            />
            <StatRow
              label="Night Rain Probability"
              value={
                dayForecast.precipProbabilityNight !== null
                  ? `${dayForecast.precipProbabilityNight}%`
                  : null
              }
              icon="🌙"
            />
            <StatRow
              label="Day Precipitation"
              value={
                dayForecast.precipAmountMmDay !== null
                  ? `${dayForecast.precipAmountMmDay.toFixed(1)} mm`
                  : null
              }
              icon="💧"
            />
            <StatRow
              label="Night Precipitation"
              value={
                dayForecast.precipAmountMmNight !== null
                  ? `${dayForecast.precipAmountMmNight.toFixed(1)} mm`
                  : null
              }
              icon="💧"
            />
            <View style={styles.divider} />
            <StatRow
              label="Min Temperature"
              value={
                dayForecast.tempMinC !== null
                  ? `${dayForecast.tempMinC.toFixed(0)}°C`
                  : null
              }
              icon="❄️"
            />
            <StatRow
              label="Max Temperature"
              value={
                dayForecast.tempMaxC !== null
                  ? `${dayForecast.tempMaxC.toFixed(0)}°C`
                  : null
              }
              icon="🔥"
            />
          </InfoCard>
        )}

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
    marginBottom: 24,
    paddingVertical: 16,
  },
  headerEmoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  headerDate: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
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
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  infoCardTitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  adviceText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 26,
  },
  rationaleText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    lineHeight: 22,
  },
  rainText: {
    color: "#67e8f9",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  flagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  flag: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  flagText: {
    color: "#fca5a5",
    fontSize: 12,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  statIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
  },
  statLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    flex: 1,
  },
  statValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 8,
  },
  askAiButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
    gap: 8,
  },
  askAiButtonPressed: {
    backgroundColor: "#2563eb",
  },
  askAiIcon: {
    fontSize: 20,
  },
  askAiText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
