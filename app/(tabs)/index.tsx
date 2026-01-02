import { View, Text, ScrollView, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeather } from '../../hooks/useWeather';
import {
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
  WeatherDetails,
} from '../../components/weather';

export default function WeatherScreen() {
  const { weather, loading, error, refreshing, refresh } = useWeather();

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
  attribution: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  attributionText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
});
