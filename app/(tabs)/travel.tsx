import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { DESTINATIONS } from "../../constants/destinations";
import { Destination, DestinationId } from "../../types/travel.types";
import { generateId } from "../../utils/dateRange";

export default function TravelScreen() {
  const [selectedDestination, setSelectedDestination] = useState<Destination>(
    DESTINATIONS[1] // Default to Dubai
  );
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const validateDates = (): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (!dateRegex.test(startDate)) {
      Alert.alert("Invalid Date", "Please enter start date in YYYY-MM-DD format");
      return false;
    }

    if (!dateRegex.test(endDate)) {
      Alert.alert("Invalid Date", "Please enter end date in YYYY-MM-DD format");
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime())) {
      Alert.alert("Invalid Date", "Start date is not valid");
      return false;
    }

    if (isNaN(end.getTime())) {
      Alert.alert("Invalid Date", "End date is not valid");
      return false;
    }

    if (start < today) {
      Alert.alert("Invalid Date", "Start date cannot be in the past");
      return false;
    }

    if (end < start) {
      Alert.alert("Invalid Date", "End date must be after start date");
      return false;
    }

    // Check if dates are within 5-day forecast range
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 5);

    if (start > maxDate) {
      Alert.alert(
        "Date Out of Range",
        "Weather forecasts are only available for the next 5 days"
      );
      return false;
    }

    return true;
  };

  const handleAnalyze = () => {
    if (!validateDates()) return;

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

  // Get today's date and max date for placeholder
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 4);
  const maxDateStr = maxDate.toISOString().slice(0, 10);

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

          {/* Date Inputs */}
          <View style={styles.section}>
            <Text style={styles.label}>Trip Dates</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Start</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder={todayStr}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={startDate}
                  onChangeText={setStartDate}
                  keyboardType="numbers-and-punctuation"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.dateSeparator}>
                <Text style={styles.dateSeparatorText}>→</Text>
              </View>
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>End</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder={maxDateStr}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={endDate}
                  onChangeText={setEndDate}
                  keyboardType="numbers-and-punctuation"
                  autoCapitalize="none"
                />
              </View>
            </View>
            <Text style={styles.dateHint}>
              Format: YYYY-MM-DD (forecasts available for next 5 days)
            </Text>
          </View>

          {/* Analyze Button */}
          <Pressable
            style={({ pressed }) => [
              styles.analyzeButton,
              pressed && styles.analyzeButtonPressed,
            ]}
            onPress={handleAnalyze}
          >
            <Text style={styles.analyzeButtonText}>Analyze Rain Risk</Text>
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
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginBottom: 4,
  },
  dateInput: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "white",
    fontSize: 16,
  },
  dateSeparator: {
    paddingHorizontal: 12,
    paddingTop: 16,
  },
  dateSeparatorText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 20,
  },
  dateHint: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 8,
    textAlign: "center",
  },
  analyzeButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginBottom: 32,
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
