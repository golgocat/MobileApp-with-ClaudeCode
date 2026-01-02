import { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, StyleSheet, Pressable, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeather } from '../../hooks/useWeather';
import { DESTINATIONS } from '../../constants/destinations';
import { Destination } from '../../types/travel.types';
import {
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
  WeatherDetails,
} from '../../components/weather';

export default function WeatherScreen() {
  const [selectedLocation, setSelectedLocation] = useState<Destination>(DESTINATIONS[1]); // Default to Dubai
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const { weather, loading, error, refreshing, refresh } = useWeather(selectedLocation.accuWeatherKey);

  if (loading && !weather) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.centerContent}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading weather...</Text>
        </SafeAreaView>
      </View>
    );
  }

  if (error && !weather) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.centerContent}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          <Text style={styles.errorHint}>
            Please check your internet connection and try again
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, weather?.current?.IsDayTime ? styles.dayBg : styles.nightBg]}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="white"
              colors={['white']}
            />
          }
        >
          {/* Headline */}
          {weather?.headline && (
            <View style={styles.headlineContainer}>
              <Text style={styles.headline}>{weather.headline}</Text>
            </View>
          )}

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
          {weather?.current && <CurrentWeather current={weather.current} />}

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
                    selectedLocation.id === dest.id && styles.modalOptionTextSelected,
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
    backgroundColor: '#1e3a5f',
  },
  dayBg: {
    backgroundColor: '#2d5a87',
  },
  nightBg: {
    backgroundColor: '#0f1c2e',
  },
  flex: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
    marginTop: 16,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorMessage: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  errorHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  headlineContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headline: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  locationPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  locationText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
  },
  locationArrow: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginLeft: 8,
  },
  attribution: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  attributionText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e3a5f',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalOptionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  modalOptionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
  },
  modalOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
});
