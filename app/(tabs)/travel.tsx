import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { DESTINATIONS } from "../../constants/destinations";
import { Destination } from "../../types/travel.types";
import { generateId } from "../../utils/dateRange";
import { CalendarPicker } from "../../components/CalendarPicker";
import { COLORS, GRADIENTS, SHADOWS } from "../../constants/theme";

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
  const [selectedDestination, setSelectedDestination] = useState<Destination>(
    DESTINATIONS[1] // Default to Dubai
  );
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSelectDates = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleAnalyze = () => {
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
        startDate,
        endDate,
      },
    });
  };

  const tripDays = getDaysBetween(startDate, endDate);
  const hasDates = startDate && endDate;

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
            <Text style={styles.title}>Travel Rain Risk</Text>
            <Text style={styles.subtitle}>
              Plan your trip with AI-powered weather analysis
            </Text>
          </View>

          {/* Destination Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>Destination</Text>
            <Pressable
              style={styles.glassCard}
              onPress={() => setShowDestinationPicker(true)}
            >
              <View style={styles.pickerContent}>
                <Text style={styles.pickerEmoji}>📍</Text>
                <Text style={styles.pickerText}>
                  {selectedDestination.displayName}, {selectedDestination.countryCode}
                </Text>
              </View>
              <Text style={styles.pickerArrow}>▼</Text>
            </Pressable>
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
              !hasDates && styles.analyzeButtonDisabled,
              pressed && hasDates && styles.analyzeButtonPressed,
            ]}
            onPress={handleAnalyze}
            disabled={!hasDates}
          >
            <Text style={styles.analyzeButtonIcon}>🔍</Text>
            <Text style={styles.analyzeButtonText}>
              {hasDates ? "Analyze Rain Risk" : "Select dates to continue"}
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

      {/* Destination Picker Modal */}
      <Modal
        visible={showDestinationPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDestinationPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowDestinationPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Destination</Text>
            {DESTINATIONS.map((dest) => (
              <Pressable
                key={dest.id}
                style={[
                  styles.modalOption,
                  selectedDestination.id === dest.id && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setSelectedDestination(dest);
                  setShowDestinationPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedDestination.id === dest.id &&
                      styles.modalOptionTextSelected,
                  ]}
                >
                  {dest.displayName}, {dest.countryCode}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

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
  pickerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  pickerEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  pickerText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "500",
  },
  pickerArrow: {
    color: COLORS.textMuted,
    fontSize: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 24,
    padding: 20,
    width: "80%",
    maxWidth: 320,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalOptionSelected: {
    backgroundColor: "rgba(74, 144, 217, 0.15)",
  },
  modalOptionText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  modalOptionTextSelected: {
    color: COLORS.accentBlue,
    fontWeight: "600",
  },
});
