import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { DESTINATIONS } from "../../constants/destinations";
import { generateId } from "../../utils/dateRange";
import { CalendarPicker } from "../../components/CalendarPicker";
import { COLORS, GRADIENTS, SHADOWS } from "../../constants/theme";
import { locationService, PlacePrediction } from "../../services/locationService";

// Extended destination type for searched locations
interface TravelDestination {
  id: string;
  displayName: string;
  countryCode: string;
  timezone: string;
  accuweatherLocationKey: string;
  lat: number;
  lon: number;
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
}

function getDaysBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export default function TravelScreen() {
  const [selectedDestination, setSelectedDestination] = useState<TravelDestination | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlacePrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingDestination, setLoadingDestination] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const results = await locationService.searchPlaces(query);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSelectSearchResult = async (prediction: PlacePrediction) => {
    setLoadingDestination(true);
    try {
      const locationDetails = await locationService.getLocationDetails(prediction.placeId);
      const destination: TravelDestination = {
        id: `search_${locationDetails.Key}`,
        displayName: locationDetails.LocalizedName,
        countryCode: locationDetails.Country.ID,
        timezone: locationDetails.TimeZone.Name,
        accuweatherLocationKey: locationDetails.Key,
        lat: locationDetails.GeoPosition.Latitude,
        lon: locationDetails.GeoPosition.Longitude,
      };
      setSelectedDestination(destination);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error loading destination:", error);
      Alert.alert("Error", "Failed to load destination details. Please try again.");
    } finally {
      setLoadingDestination(false);
    }
  };

  const handleSelectPreset = (dest: TravelDestination) => {
    setSelectedDestination(dest);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSelectDates = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleAnalyze = () => {
    if (!selectedDestination) {
      Alert.alert("Select Destination", "Please select a destination first");
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert("Select Dates", "Please select your trip dates first");
      return;
    }

    const itineraryId = generateId();

    router.push({
      pathname: "/report",
      params: {
        itineraryId,
        destinationId: selectedDestination.id,
        destinationKey: selectedDestination.accuweatherLocationKey,
        destinationName: selectedDestination.displayName,
        destinationCountry: selectedDestination.countryCode,
        destinationTimezone: selectedDestination.timezone,
        startDate,
        endDate,
      },
    });
  };

  const tripDays = getDaysBetween(startDate, endDate);
  const hasDates = startDate && endDate;
  const hasDestination = selectedDestination !== null;

  return (
    <LinearGradient colors={[...GRADIENTS.main]} style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerIcon}>✈️</Text>
            <Text style={styles.title}>Travel Weather Analysis</Text>
            <Text style={styles.subtitle}>
              Plan your trip with AI-powered weather analysis
            </Text>
          </View>

          {/* Destination Search */}
          <View style={styles.section}>
            <Text style={styles.label}>Destination</Text>

            {/* Selected Destination Display */}
            {selectedDestination && (
              <View style={styles.selectedDestination}>
                <Text style={styles.selectedDestinationEmoji}>📍</Text>
                <View style={styles.selectedDestinationInfo}>
                  <Text style={styles.selectedDestinationName}>
                    {selectedDestination.displayName}
                  </Text>
                  <Text style={styles.selectedDestinationCountry}>
                    {selectedDestination.countryCode}
                  </Text>
                </View>
                <Pressable
                  style={styles.clearButton}
                  onPress={() => setSelectedDestination(null)}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </Pressable>
              </View>
            )}

            {/* Search Input */}
            {!selectedDestination && (
              <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search for a city..."
                    placeholderTextColor={COLORS.textMuted}
                    value={searchQuery}
                    onChangeText={handleSearch}
                    autoCorrect={false}
                  />
                  {(searching || loadingDestination) && (
                    <ActivityIndicator size="small" color={COLORS.textMuted} />
                  )}
                </View>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <View style={styles.searchResults}>
                    {searchResults.map((result) => (
                      <Pressable
                        key={result.placeId}
                        style={styles.searchResultItem}
                        onPress={() => handleSelectSearchResult(result)}
                        disabled={loadingDestination}
                      >
                        <Text style={styles.searchResultMain}>
                          {result.mainText}
                        </Text>
                        <Text style={styles.searchResultSecondary}>
                          {result.secondaryText}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Quick Picks */}
                {searchResults.length === 0 && searchQuery.length === 0 && (
                  <View style={styles.quickPicks}>
                    <Text style={styles.quickPicksTitle}>Popular Destinations</Text>
                    <View style={styles.quickPicksGrid}>
                      {DESTINATIONS.slice(0, 6).map((dest) => (
                        <Pressable
                          key={dest.id}
                          style={styles.quickPickItem}
                          onPress={() => handleSelectPreset(dest)}
                        >
                          <Text style={styles.quickPickName}>{dest.displayName}</Text>
                          <Text style={styles.quickPickCountry}>{dest.countryCode}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Date Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>Trip Dates</Text>
            <Pressable
              style={styles.glassCard}
              onPress={() => setShowCalendar(true)}
            >
              {hasDates ? (
                <View style={styles.selectedDatesDisplay}>
                  <View style={styles.dateBlock}>
                    <Text style={styles.dateBlockLabel}>Start</Text>
                    <Text style={styles.dateBlockValue}>
                      {formatDisplayDate(startDate)}
                    </Text>
                  </View>
                  <View style={styles.dateArrowContainer}>
                    <Text style={styles.dateArrow}>→</Text>
                    <Text style={styles.tripDuration}>{tripDays} days</Text>
                  </View>
                  <View style={styles.dateBlock}>
                    <Text style={styles.dateBlockLabel}>End</Text>
                    <Text style={styles.dateBlockValue}>
                      {formatDisplayDate(endDate)}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyDateDisplay}>
                  <Text style={styles.calendarIcon}>📅</Text>
                  <Text style={styles.selectDatesText}>Tap to select dates</Text>
                  <Text style={styles.selectDatesHint}>
                    Choose from calendar or quick shortcuts
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Analyze Button */}
          <Pressable
            style={({ pressed }) => [
              styles.analyzeButton,
              (!hasDates || !hasDestination) && styles.analyzeButtonDisabled,
              pressed && hasDates && hasDestination && styles.analyzeButtonPressed,
            ]}
            onPress={handleAnalyze}
            disabled={!hasDates || !hasDestination}
          >
            <Text style={styles.analyzeButtonIcon}>🔍</Text>
            <Text style={styles.analyzeButtonText}>
              {hasDates && hasDestination ? "Analyze" : "AI Analysis"}
            </Text>
          </Pressable>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How it works</Text>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Text style={styles.infoIcon}>🌧️</Text>
              </View>
              <Text style={styles.infoText}>
                We fetch weather forecasts from AccuWeather
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Text style={styles.infoIcon}>🤖</Text>
              </View>
              <Text style={styles.infoText}>
                AI analyzes precipitation data for your trip
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Text style={styles.infoIcon}>📊</Text>
              </View>
              <Text style={styles.infoText}>
                Get day-by-day risk levels and travel advice
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Calendar Picker */}
      <CalendarPicker
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onSelectDates={handleSelectDates}
        initialStartDate={startDate}
        initialEndDate={endDate}
      />
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
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 16,
  },
  headerIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginLeft: 4,
  },
  glassCard: {
    backgroundColor: COLORS.glassBackground,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...SHADOWS.card,
  },
  // Destination Search styles
  selectedDestination: {
    backgroundColor: COLORS.glassBackground,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    ...SHADOWS.card,
  },
  selectedDestinationEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  selectedDestinationInfo: {
    flex: 1,
  },
  selectedDestinationName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "600",
  },
  selectedDestinationCountry: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  clearButtonText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "600",
  },
  searchSection: {
    gap: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  searchResults: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 12,
    overflow: "hidden",
  },
  searchResultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  searchResultMain: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  searchResultSecondary: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  quickPicks: {
    marginTop: 4,
  },
  quickPicksTitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  quickPicksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickPickItem: {
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: "30%",
  },
  quickPickName: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  quickPickCountry: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  selectedDatesDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flex: 1,
  },
  dateBlock: {
    flex: 1,
  },
  dateBlockLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dateBlockValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  dateArrowContainer: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  dateArrow: {
    color: COLORS.accentBlue,
    fontSize: 20,
    fontWeight: "300",
  },
  tripDuration: {
    color: COLORS.accentBlue,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  emptyDateDisplay: {
    alignItems: "center",
    paddingVertical: 12,
    flex: 1,
  },
  calendarIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  selectDatesText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "500",
  },
  selectDatesHint: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  analyzeButton: {
    backgroundColor: COLORS.accentBlue,
    borderRadius: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    ...SHADOWS.card,
  },
  analyzeButtonDisabled: {
    backgroundColor: "rgba(74, 144, 217, 0.4)",
  },
  analyzeButtonPressed: {
    backgroundColor: "#3a7fc4",
    transform: [{ scale: 0.98 }],
  },
  analyzeButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  analyzeButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  infoCard: {
    backgroundColor: COLORS.glassBackground,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    padding: 20,
    ...SHADOWS.card,
  },
  infoTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});
