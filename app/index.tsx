import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WeatherCard } from "../components/features/WeatherCard";
import { HourlyForecast } from "../components/features/HourlyForecast";
import { ForecastCard } from "../components/features/ForecastCard";
import { useWeather } from "../hooks/useWeather";

export default function HomeScreen() {
  const { weatherData, loading, error, refreshing, refetch } = useWeather(
    "Dubai",
    7
  );

  if (loading) {
    return (
      <View className="flex-1 bg-blue-500 items-center justify-center">
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="text-white text-lg mt-4">
          Loading Dubai weather...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-blue-500">
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">⚠️</Text>
          <Text className="text-white text-xl font-semibold text-center mb-2">
            Oops! Something went wrong
          </Text>
          <Text className="text-white/80 text-center mb-6">{error}</Text>
          <Text className="text-white/60 text-sm text-center">
            Please check your internet connection and try again
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!weatherData) {
    return null;
  }

  return (
    <View className="flex-1 bg-blue-500">
      <SafeAreaView className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refetch}
              tintColor="#ffffff"
            />
          }
        >
          {/* Current Weather */}
          <WeatherCard
            location={weatherData.location}
            current={weatherData.current}
          />

          {/* Hourly Forecast */}
          <HourlyForecast forecastDay={weatherData.forecast.forecastday[0]} />

          {/* 7-Day Forecast */}
          <View className="mx-4 mb-6">
            <Text className="text-white text-xl font-semibold mb-3">
              7-Day Forecast
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row"
            >
              {weatherData.forecast.forecastday.map((day, index) => (
                <ForecastCard
                  key={day.date}
                  forecast={day}
                  isToday={index === 0}
                />
              ))}
            </ScrollView>
          </View>

          {/* Sun Info */}
          <View className="mx-4 mb-6">
            <View className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
              <Text className="text-white text-lg font-semibold mb-4">
                Sun & Moon
              </Text>
              <View className="flex-row justify-between">
                <View className="flex-1">
                  <Text className="text-4xl mb-2">🌅</Text>
                  <Text className="text-white/60 text-sm">Sunrise</Text>
                  <Text className="text-white text-base font-semibold">
                    {weatherData.forecast.forecastday[0].astro.sunrise}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-4xl mb-2">🌇</Text>
                  <Text className="text-white/60 text-sm">Sunset</Text>
                  <Text className="text-white text-base font-semibold">
                    {weatherData.forecast.forecastday[0].astro.sunset}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-4xl mb-2">🌙</Text>
                  <Text className="text-white/60 text-sm">Moon Phase</Text>
                  <Text className="text-white text-base font-semibold">
                    {weatherData.forecast.forecastday[0].astro.moon_phase}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View className="items-center pb-6">
            <Text className="text-white/50 text-sm">
              Last updated: {new Date().toLocaleTimeString()}
            </Text>
            <Text className="text-white/40 text-xs mt-1">
              Pull down to refresh
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
