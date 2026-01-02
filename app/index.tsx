import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeather } from '../hooks/useWeather';
import {
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
  WeatherDetails,
} from '../components/weather';

export default function WeatherScreen() {
  const { weather, loading, error, refreshing, refresh } = useWeather();

  if (loading && !weather) {
    return (
      <LinearGradient
        colors={['#1e3a5f', '#2d5a87', '#3d7ab5']}
        className="flex-1"
      >
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="white" />
          <Text className="text-white text-lg mt-4">Loading weather...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (error && !weather) {
    return (
      <LinearGradient
        colors={['#1e3a5f', '#2d5a87', '#3d7ab5']}
        className="flex-1"
      >
        <SafeAreaView className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">⚠️</Text>
          <Text className="text-white text-xl font-semibold text-center">
            Oops! Something went wrong
          </Text>
          <Text className="text-white/70 text-base text-center mt-2">
            {error.message}
          </Text>
          <Text className="text-white/50 text-sm text-center mt-4">
            Please check your internet connection and try again
          </Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={
        weather?.current?.IsDayTime
          ? ['#1e3a5f', '#2d5a87', '#4a90c2']
          : ['#0f1c2e', '#1a2f4a', '#243b55']
      }
      className="flex-1"
    >
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView
          className="flex-1"
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
            <View className="px-5 pt-2">
              <Text className="text-white/80 text-sm text-center italic">
                {weather.headline}
              </Text>
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
          <View className="items-center pb-8">
            <Text className="text-white/40 text-xs">
              Powered by AccuWeather
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
