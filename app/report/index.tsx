import { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";
import { useTravelRisk } from "../../hooks/useTravelRisk";
import { getDestination } from "../../constants/destinations";
import { DestinationId, DayRisk, DayRiskLevel } from "../../types/travel.types";
import { formatDate } from "../../utils/dateRange";
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

function RiskBadge({ level }: { level: DayRiskLevel }) {
  return (
    <View style={[styles.riskBadge, { backgroundColor: RISK_BG_COLORS[level] }]}>
      <Text style={[styles.riskBadgeText, { color: RISK_COLORS[level] }]}>{level}</Text>
    </View>
  );
}

function DayCard({ day, onPress }: { day: DayRisk; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.dayCard, pressed && styles.dayCardPressed]}
      onPress={onPress}
    >
      <View style={styles.dayCardLeft}>
        <Text style={styles.dayEmoji}>{RISK_EMOJIS[day.riskLevel]}</Text>
        <View style={styles.dayCardInfo}>
          <Text style={styles.dayDate}>{formatDate(day.date)}</Text>
          <Text style={styles.dayAdvice} numberOfLines={1}>
            {day.advice}
          </Text>
        </View>
      </View>
      <View style={styles.dayCardRight}>
        <RiskBadge level={day.riskLevel} />
        <Text style={styles.dayConfidence}>
          {Math.round(day.confidence * 100)}% conf
        </Text>
      </View>
    </Pressable>
  );
}

export default function ReportScreen() {
  const params = useLocalSearchParams<{
    itineraryId: string;
    destinationId: string;
    startDate: string;
    endDate: string;
  }>();

  const { loading, refreshing, error, report, forecastDays, generate, refresh } =
    useTravelRisk();

  const destination = getDestination(params.destinationId as DestinationId);

  const itinerary = {
    id: params.itineraryId || "temp",
    destinationId: params.destinationId as DestinationId,
    startDate: params.startDate || "",
    endDate: params.endDate || "",
    createdAt: new Date().toISOString(),
  };

  useEffect(() => {
    if (destination && itinerary.startDate && itinerary.endDate) {
      generate(destination, itinerary);
    }
  }, []);

  const handleRefresh = () => {
    if (destination) {
      refresh(destination, itinerary);
    }
  };

  const handleDayPress = (date: string) => {
    router.push({
      pathname: "/report/[date]",
      params: {
        date,
        itineraryId: params.itineraryId,
        destinationId: params.destinationId,
        startDate: params.startDate,
        endDate: params.endDate,
        reportJson: JSON.stringify(report),
        forecastJson: JSON.stringify(forecastDays),
      },
    });
  };

  if (loading && !report) {
    return (
      <LinearGradient colors={[...GRADIENTS.main]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accentBlue} />
          <Text style={styles.loadingText}>Analyzing weather data...</Text>
          <Text style={styles.loadingSubtext}>
            Fetching forecasts and running AI analysis
          </Text>
        </View>
      </LinearGradient>
    );
  }

  if (error && !report) {
    return (
      <LinearGradient colors={[...GRADIENTS.main]} style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Analysis Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => generate(destination, itinerary)}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.textSecondary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerDestination}>
            {destination.displayName}, {destination.countryCode}
          </Text>
          <Text style={styles.headerDates}>
            {formatDate(params.startDate)} — {formatDate(params.endDate)}
          </Text>
        </View>

        {/* Risk Summary */}
        {report && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Trip Overview</Text>
            <View style={styles.summaryStats}>
              {(["LOW", "MEDIUM", "HIGH", "EXTREME"] as DayRiskLevel[]).map(
                (level) => {
                  const count = report.days.filter(
                    (d) => d.riskLevel === level
                  ).length;
                  if (count === 0) return null;
                  return (
                    <View key={level} style={styles.summaryStat}>
                      <Text style={styles.summaryEmoji}>
                        {RISK_EMOJIS[level]}
                      </Text>
                      <Text
                        style={[
                          styles.summaryCount,
                          { color: RISK_COLORS[level] },
                        ]}
                      >
                        {count}
                      </Text>
                      <Text style={styles.summaryLabel}>{level}</Text>
                    </View>
                  );
                }
              )}
            </View>
          </View>
        )}

        {/* Day List */}
        <View style={styles.dayList}>
          <Text style={styles.dayListTitle}>Day-by-Day Analysis</Text>
          {report?.days.map((day) => (
            <DayCard
              key={day.date}
              day={day}
              onPress={() => handleDayPress(day.date)}
            />
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated at {new Date(report?.generatedAt || "").toLocaleString()}
          </Text>
          <Text style={styles.footerText}>
            Powered by AccuWeather + Gemini AI
          </Text>
        </View>
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  loadingSubtext: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 8,
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
  errorTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  errorMessage: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.accentBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    ...SHADOWS.card,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  headerDestination: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: "700",
  },
  headerDates: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: COLORS.glassBackground,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    padding: 20,
    marginBottom: 24,
    ...SHADOWS.card,
  },
  summaryTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  summaryStat: {
    alignItems: "center",
  },
  summaryEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 28,
    fontWeight: "700",
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  dayList: {
    marginBottom: 24,
  },
  dayListTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  dayCard: {
    backgroundColor: COLORS.glassBackground,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...SHADOWS.cardSmall,
  },
  dayCardPressed: {
    backgroundColor: "rgba(255,255,255,0.8)",
    transform: [{ scale: 0.98 }],
  },
  dayCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dayCardInfo: {
    flex: 1,
  },
  dayEmoji: {
    fontSize: 36,
    marginRight: 14,
  },
  dayDate: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  dayAdvice: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
    maxWidth: 180,
  },
  dayCardRight: {
    alignItems: "flex-end",
  },
  dayConfidence: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  footerText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
});
