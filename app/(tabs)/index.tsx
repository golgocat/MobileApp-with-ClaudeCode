import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWeather } from "../../hooks/useWeather";
import { DESTINATIONS } from "../../constants/destinations";
import { COLORS, GRADIENTS } from "../../constants/theme";
import { Destination } from "../../types/travel.types";
import {
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
  WeatherDetails,
} from "../../components/weather";

export default function WeatherScreen() {
  const [selectedLocation, setSelectedLocation] = useState<Destination>(
    DESTINATIONS[1]
  ); // Default to Dubai
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const { weather, loading, error, refreshing, refresh } = useWeather(
    selectedLocation.accuweatherLocationKey
  );

  if (loading && !weather) {
    return (
      <LinearGradient colors={[...GRADIENTS.main]} style={styles.container}>
        <SafeAreaView style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.textSecondary} />
          <Text style={styles.loadingText}>Loading weather...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error && !weather) {
    return (
      <LinearGradient colors={[...GRADIENTS.main]} style={styles.container}>
        <SafeAreaView style={styles.centerContent}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <Pressable style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[...GRADIENTS.main]} style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <ScrollView
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={COLORS.textSecondary}
            />
          }
        >
          {/* Location Picker */}
          <Pressable
            style={styles.locationPicker}
            onPress={() => setShowLocationPicker(true)}
          >
            <Text style={styles.locationText}>
              {selectedLocation.displayName}, {selectedLocation.countryCode}
            </Text>
            <Text style={styles.locationArrow}>▼</Text>
          </Pressable>

          {/* Current Weather */}
          {weather?.current && (
            <CurrentWeather
              current={weather.current}
              locationName={selectedLocation.displayName}
            />
          )}

          {/* Hourly Forecast */}
          {weather?.hourly && weather.hourly.length > 0 && (
            <HourlyForecast hourly={weather.hourly} />
          )}

          {/* Daily Forecast */}
          {weather?.daily && weather.daily.length > 0 && (
            <DailyForecast daily={weather.daily} />
          )}

          {/* Weather Details */}
          {weather?.current && <WeatherDetails current={weather.current} />}

          {/* Attribution */}
          <View style={styles.attribution}>
            <Text style={styles.attributionText}>Powered by AccuWeather</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowLocationPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Location</Text>
            {DESTINATIONS.map((dest) => (
              <Pressable
                key={dest.id}
                style={[
                  styles.modalOption,
                  selectedLocation.id === dest.id && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setSelectedLocation(dest);
                  setShowLocationPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedLocation.id === dest.id &&
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
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 18,
    marginTop: 16,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  errorMessage: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: COLORS.accentBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  locationPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  locationText: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: "500",
  },
  locationArrow: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginLeft: 8,
  },
  attribution: {
    alignItems: "center",
    paddingBottom: 120,
  },
  attributionText: {
    color: COLORS.textMuted,
    fontSize: 12,
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
