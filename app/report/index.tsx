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
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTravelRisk } from "../../hooks/useTravelRisk";
import { getDestination } from "../../constants/destinations";
import { DestinationId, DayRisk, DayRiskLevel } from "../../types/travel.types";
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

function RiskBadge({ level }: { level: DayRiskLevel }) {
  return (
    <View style={[styles.riskBadge, { backgroundColor: RISK_COLORS[level] }]}>
      <Text style={styles.riskBadgeText}>{level}</Text>
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
        <View>
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
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Analyzing weather data...</Text>
          <Text style={styles.loadingSubtext}>
            Fetching forecasts and running AI analysis
          </Text>
        </View>
      </View>
    );
  }

  if (error && !report) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Analysis Failed</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => generate(destination, itinerary)}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="white"
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  loadingText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  loadingSubtext: {
    color: "rgba(255,255,255,0.6)",
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
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  errorMessage: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
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
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  headerDates: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  summaryTitle: {
    color: "white",
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
    fontSize: 24,
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 24,
    fontWeight: "bold",
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    textTransform: "uppercase",
  },
  dayList: {
    marginBottom: 24,
  },
  dayListTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  dayCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayCardPressed: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  dayCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dayEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  dayDate: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  dayAdvice: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 2,
    maxWidth: 180,
  },
  dayCardRight: {
    alignItems: "flex-end",
  },
  dayConfidence: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    marginTop: 4,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  footer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  footerText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginBottom: 4,
  },
});
