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
import { DestinationId, DayRisk, DayRiskLevel, DayForecast } from "../../types/travel.types";
import { formatDate } from "../../utils/dateRange";
import { COLORS, GRADIENTS, SHADOWS } from "../../constants/theme";

// Temperature level helpers
type TempLevel = "Extremely Cold" | "Cold" | "Cool" | "Moderate" | "Warm" | "Hot" | "Extremely Hot";

function getTempLevel(avgTemp: number): { level: TempLevel; emoji: string; color: string } {
  if (avgTemp < 0) return { level: "Extremely Cold", emoji: "🥶", color: "#3b82f6" };
  if (avgTemp < 10) return { level: "Cold", emoji: "❄️", color: "#60a5fa" };
  if (avgTemp < 18) return { level: "Cool", emoji: "🌬️", color: "#67e8f9" };
  if (avgTemp < 24) return { level: "Moderate", emoji: "😊", color: "#22c55e" };
  if (avgTemp < 30) return { level: "Warm", emoji: "☀️", color: "#fbbf24" };
  if (avgTemp < 38) return { level: "Hot", emoji: "🔥", color: "#f97316" };
  return { level: "Extremely Hot", emoji: "🥵", color: "#ef4444" };
}

// Wind level helpers
type WindLevel = "Calm" | "Light" | "Moderate" | "Strong" | "Very Strong";

function getWindLevel(avgWindKmh: number): { level: WindLevel; emoji: string; color: string } {
  if (avgWindKmh < 5) return { level: "Calm", emoji: "🍃", color: "#22c55e" };
  if (avgWindKmh < 20) return { level: "Light", emoji: "🌿", color: "#84cc16" };
  if (avgWindKmh < 40) return { level: "Moderate", emoji: "💨", color: "#fbbf24" };
  if (avgWindKmh < 60) return { level: "Strong", emoji: "🌬️", color: "#f97316" };
  return { level: "Very Strong", emoji: "🌪️", color: "#ef4444" };
}

// Calculate trip length
function getTripLength(startDate: string, endDate: string): { nights: number; days: number } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const days = nights + 1;
  return { nights, days };
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

const RISK_SCORES: Record<DayRiskLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  EXTREME: 4,
};

interface TripInsights {
  overallVerdict: string;
  verdictEmoji: string;
  verdictColor: string;
  totalRainMm: { min: number; max: number } | null;
  avgConfidence: number;
  bestDay: DayRisk | null;
  cautionDays: number;
  recommendation: string;
  tempInfo: { level: TempLevel; emoji: string; color: string; avgTemp: number } | null;
  windInfo: { level: WindLevel; emoji: string; color: string; avgWind: number } | null;
}

function computeTripInsights(days: DayRisk[], forecasts: DayForecast[]): TripInsights {
  if (days.length === 0) {
    return {
      overallVerdict: "No data",
      verdictEmoji: "❓",
      verdictColor: COLORS.textMuted,
      totalRainMm: null,
      avgConfidence: 0,
      bestDay: null,
      cautionDays: 0,
      recommendation: "Unable to analyze trip.",
      tempInfo: null,
      windInfo: null,
    };
  }

  // Calculate average temperature from forecasts
  let tempInfo: TripInsights["tempInfo"] = null;
  const tempValues = forecasts
    .filter(f => f.tempMinC != null && f.tempMaxC != null)
    .map(f => ((f.tempMinC ?? 0) + (f.tempMaxC ?? 0)) / 2);
  if (tempValues.length > 0) {
    const avgTemp = tempValues.reduce((a, b) => a + b, 0) / tempValues.length;
    const levelInfo = getTempLevel(avgTemp);
    tempInfo = { ...levelInfo, avgTemp: Math.round(avgTemp) };
  }

  // Calculate average wind from forecasts
  let windInfo: TripInsights["windInfo"] = null;
  const windValues = forecasts
    .filter(f => f.windSpeedKmh != null)
    .map(f => f.windSpeedKmh ?? 0);
  if (windValues.length > 0) {
    const avgWind = windValues.reduce((a, b) => a + b, 0) / windValues.length;
    const levelInfo = getWindLevel(avgWind);
    windInfo = { ...levelInfo, avgWind: Math.round(avgWind) };
  }

  // Calculate average risk score
  const avgScore = days.reduce((sum, d) => sum + RISK_SCORES[d.riskLevel], 0) / days.length;

  // Count risk levels
  const lowCount = days.filter(d => d.riskLevel === "LOW").length;
  const highCount = days.filter(d => d.riskLevel === "HIGH" || d.riskLevel === "EXTREME").length;

  // Calculate total expected rainfall
  let totalRainMin = 0;
  let totalRainMax = 0;
  let hasRainData = false;
  days.forEach(d => {
    if (d.expectedRainMmRange) {
      totalRainMin += d.expectedRainMmRange.min;
      totalRainMax += d.expectedRainMmRange.max;
      hasRainData = true;
    }
  });

  // Average confidence
  const avgConfidence = days.reduce((sum, d) => sum + d.confidence, 0) / days.length;

  // Best day (lowest risk score, highest confidence)
  const bestDay = [...days].sort((a, b) => {
    const scoreDiff = RISK_SCORES[a.riskLevel] - RISK_SCORES[b.riskLevel];
    if (scoreDiff !== 0) return scoreDiff;
    return b.confidence - a.confidence;
  })[0];

  // Caution days (HIGH or EXTREME)
  const cautionDays = highCount;

  // Determine verdict
  let overallVerdict: string;
  let verdictEmoji: string;
  let verdictColor: string;
  let recommendation: string;

  if (avgScore <= 1.3) {
    overallVerdict = "Perfect Weather";
    verdictEmoji = "🌟";
    verdictColor = RISK_COLORS.LOW;
    recommendation = "Excellent conditions for outdoor activities throughout your trip!";
  } else if (avgScore <= 1.8) {
    overallVerdict = "Mostly Clear";
    verdictEmoji = "😎";
    verdictColor = RISK_COLORS.LOW;
    recommendation = "Great trip ahead with mostly favorable weather conditions.";
  } else if (avgScore <= 2.3) {
    overallVerdict = "Mixed Conditions";
    verdictEmoji = "🌤️";
    verdictColor = RISK_COLORS.MEDIUM;
    recommendation = "Plan outdoor activities for clear days. Keep an umbrella handy.";
  } else if (avgScore <= 3) {
    overallVerdict = "Rain Expected";
    verdictEmoji = "🌂";
    verdictColor = RISK_COLORS.HIGH;
    recommendation = "Pack rain gear and have indoor backup plans ready.";
  } else {
    overallVerdict = "Challenging Weather";
    verdictEmoji = "⚠️";
    verdictColor = RISK_COLORS.EXTREME;
    recommendation = "Consider flexible scheduling. Monitor forecasts closely.";
  }

  return {
    overallVerdict,
    verdictEmoji,
    verdictColor,
    totalRainMm: hasRainData ? { min: totalRainMin, max: totalRainMax } : null,
    avgConfidence,
    bestDay,
    cautionDays,
    recommendation,
    tempInfo,
    windInfo,
  };
}

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
          {(() => {
            const { nights, days } = getTripLength(params.startDate, params.endDate);
            return (
              <Text style={styles.headerTripLength}>
                {nights} {nights === 1 ? "night" : "nights"} {days} {days === 1 ? "day" : "days"}
              </Text>
            );
          })()}
        </View>

        {/* Trip Overview */}
        {report && (() => {
          const insights = computeTripInsights(report.days, forecastDays || []);
          return (
            <View style={styles.summaryCard}>
              {/* Verdict Header */}
              <View style={styles.verdictHeader}>
                <Text style={styles.verdictEmoji}>{insights.verdictEmoji}</Text>
                <Text style={[styles.verdictText, { color: insights.verdictColor }]}>
                  {insights.overallVerdict}
                </Text>
              </View>

              {/* Recommendation */}
              <Text style={styles.recommendationText}>{insights.recommendation}</Text>

              {/* Key Stats */}
              <View style={styles.insightsGrid}>
                {/* Best Day */}
                {insights.bestDay && (
                  <View style={styles.insightItem}>
                    <Text style={styles.insightIcon}>✨</Text>
                    <View style={styles.insightContent}>
                      <Text style={styles.insightLabel}>Best Day</Text>
                      <Text style={styles.insightValue}>{formatDate(insights.bestDay.date)}</Text>
                    </View>
                  </View>
                )}

                {/* Total Rainfall */}
                {insights.totalRainMm && (
                  <View style={styles.insightItem}>
                    <Text style={styles.insightIcon}>💧</Text>
                    <View style={styles.insightContent}>
                      <Text style={styles.insightLabel}>Expected Rain</Text>
                      <Text style={styles.insightValue}>
                        {insights.totalRainMm.min === insights.totalRainMm.max
                          ? `${insights.totalRainMm.min.toFixed(0)} mm`
                          : `${insights.totalRainMm.min.toFixed(0)}-${insights.totalRainMm.max.toFixed(0)} mm`}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Temperature */}
                {insights.tempInfo && (
                  <View style={styles.insightItem}>
                    <Text style={styles.insightIcon}>{insights.tempInfo.emoji}</Text>
                    <View style={styles.insightContent}>
                      <Text style={styles.insightLabel}>Temperature</Text>
                      <Text style={[styles.insightValue, { color: insights.tempInfo.color }]}>
                        {insights.tempInfo.level}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Wind */}
                {insights.windInfo && (
                  <View style={styles.insightItem}>
                    <Text style={styles.insightIcon}>{insights.windInfo.emoji}</Text>
                    <View style={styles.insightContent}>
                      <Text style={styles.insightLabel}>Wind</Text>
                      <Text style={[styles.insightValue, { color: insights.windInfo.color }]}>
                        {insights.windInfo.level}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Caution Days */}
                {insights.cautionDays > 0 && (
                  <View style={styles.insightItem}>
                    <Text style={styles.insightIcon}>⚠️</Text>
                    <View style={styles.insightContent}>
                      <Text style={styles.insightLabel}>Caution Days</Text>
                      <Text style={[styles.insightValue, { color: RISK_COLORS.HIGH }]}>
                        {insights.cautionDays} {insights.cautionDays === 1 ? "day" : "days"}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Confidence */}
                <View style={styles.insightItem}>
                  <Text style={styles.insightIcon}>📊</Text>
                  <View style={styles.insightContent}>
                    <Text style={styles.insightLabel}>Confidence</Text>
                    <Text style={styles.insightValue}>{Math.round(insights.avgConfidence * 100)}%</Text>
                  </View>
                </View>
              </View>

              {/* Day Distribution */}
              <View style={styles.dayDistribution}>
                {(["LOW", "MEDIUM", "HIGH", "EXTREME"] as DayRiskLevel[]).map((level) => {
                  const count = report.days.filter((d) => d.riskLevel === level).length;
                  if (count === 0) return null;
                  const labels: Record<DayRiskLevel, string> = {
                    LOW: "Clear",
                    MEDIUM: "Fair",
                    HIGH: "Rainy",
                    EXTREME: "Severe",
                  };
                  return (
                    <View
                      key={level}
                      style={[styles.distributionPill, { backgroundColor: RISK_BG_COLORS[level] }]}
                    >
                      <Text style={styles.distributionEmoji}>{RISK_EMOJIS[level]}</Text>
                      <Text style={[styles.distributionText, { color: RISK_COLORS[level] }]}>
                        {count} {labels[level]}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })()}

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
  headerTripLength: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
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
  verdictHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  verdictEmoji: {
    fontSize: 36,
    marginRight: 10,
  },
  verdictText: {
    fontSize: 24,
    fontWeight: "700",
  },
  recommendationText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  insightsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  insightIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  insightContent: {
    flex: 1,
  },
  insightLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  insightValue: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 1,
  },
  dayDistribution: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    gap: 8,
  },
  distributionPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  distributionEmoji: {
    fontSize: 14,
  },
  distributionText: {
    fontSize: 13,
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
