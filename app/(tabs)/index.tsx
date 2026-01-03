import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { useWeather } from "../../hooks/useWeather";
import { COLORS, GRADIENTS } from "../../constants/theme";
import { SavedLocation } from "../../types/location.types";
import { locationStorage } from "../../services/locationStorage";
import {
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
  WeatherDetails,
} from "../../components/weather";

export default function WeatherScreen() {
  const [selectedLocation, setSelectedLocation] = useState<SavedLocation | null>(null);
  const [locationsLoading, setLocationsLoading] = useState(true);

  // Load pinned location on mount and when screen comes into focus
  const loadPinnedLocation = useCallback(async () => {
    try {
      const pinned = await locationStorage.getPinnedLocation();
      if (pinned) {
        setSelectedLocation(pinned);
      }
    } catch (error) {
      console.error("Error loading pinned location:", error);
    } finally {
      setLocationsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPinnedLocation();
  }, [loadPinnedLocation]);

  // Reload when screen comes into focus (after selecting location)
  useFocusEffect(
    useCallback(() => {
      loadPinnedLocation();
    }, [loadPinnedLocation])
  );

  const { weather, loading, error, refreshing, refresh } = useWeather(
    selectedLocation?.accuweatherLocationKey
  );

  const handleLocationPress = () => {
    router.push("/location" as any);
  };

  if (locationsLoading || (loading && !weather)) {
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

  if (!selectedLocation) {
    return (
      <LinearGradient colors={[...GRADIENTS.main]} style={styles.container}>
        <SafeAreaView style={styles.centerContent}>
          <Text style={styles.errorEmoji}>📍</Text>
          <Text style={styles.errorTitle}>No Location Selected</Text>
          <Pressable style={styles.retryButton} onPress={handleLocationPress}>
            <Text style={styles.retryButtonText}>Select Location</Text>
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
            onPress={handleLocationPress}
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
            <DailyForecast daily={weather.daily} destinationId={selectedLocation.id} />
          )}

          {/* Weather Details */}
          {weather?.current && <WeatherDetails current={weather.current} />}

          {/* Attribution */}
          <View style={styles.attribution}>
            <Text style={styles.attributionText}>Powered by AccuWeather</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
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
});
