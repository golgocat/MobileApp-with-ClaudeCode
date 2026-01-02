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
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { DESTINATIONS } from "../../constants/destinations";
import { Destination } from "../../types/travel.types";
import { generateId } from "../../utils/dateRange";
import { CalendarPicker } from "../../components/CalendarPicker";

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
    <View style={styles.container}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
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
              style={styles.picker}
              onPress={() => setShowDestinationPicker(true)}
            >
              <Text style={styles.pickerText}>
                {selectedDestination.displayName}, {selectedDestination.countryCode}
              </Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </Pressable>
          </View>

          {/* Date Picker */}
          <View style={styles.section}>
            <Text style={styles.label}>Trip Dates</Text>
            <Pressable
              style={styles.datePickerButton}
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
            <Text style={styles.analyzeButtonText}>
              {hasDates ? "Analyze Rain Risk" : "Select dates to continue"}
            </Text>
          </Pressable>

          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How it works</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>🌧️</Text>
              <Text style={styles.infoText}>
                We fetch weather forecasts from AccuWeather
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>🤖</Text>
              <Text style={styles.infoText}>
                AI analyzes precipitation data for your trip
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📊</Text>
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
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    marginTop: 16,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
    textAlign: "center",
  },
  section: {
    marginBottom: 24,
  },
  label: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  picker: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerText: {
    color: "white",
    fontSize: 18,
  },
  pickerArrow: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
  datePickerButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
  },
  selectedDatesDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateBlock: {
    flex: 1,
  },
  dateBlockLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginBottom: 4,
  },
  dateBlockValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  dateArrowContainer: {
    alignItems: "center",
    paddingHorizontal: 12,
  },
  dateArrow: {
    color: "#3b82f6",
    fontSize: 20,
  },
  tripDuration: {
    color: "#60a5fa",
    fontSize: 12,
    marginTop: 2,
  },
  emptyDateDisplay: {
    alignItems: "center",
    paddingVertical: 12,
  },
  calendarIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  selectDatesText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  selectDatesHint: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    marginTop: 4,
  },
  analyzeButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 32,
  },
  analyzeButtonDisabled: {
    backgroundColor: "rgba(59, 130, 246, 0.3)",
  },
  analyzeButtonPressed: {
    backgroundColor: "#2563eb",
  },
  analyzeButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 20,
  },
  infoTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 28,
  },
  infoText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1e3a5f",
    borderRadius: 16,
    padding: 20,
    width: "80%",
    maxWidth: 320,
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalOptionSelected: {
    backgroundColor: "rgba(59, 130, 246, 0.3)",
  },
  modalOptionText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
  },
  modalOptionTextSelected: {
    color: "white",
    fontWeight: "600",
  },
});
