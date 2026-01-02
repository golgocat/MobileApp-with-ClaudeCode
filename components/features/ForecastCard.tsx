import { View, Text } from 'react-native';
import { ForecastDay } from '../../services/weather.types';
import { WeatherService } from '../../services/weatherService';

interface ForecastCardProps {
  forecast: ForecastDay;
  isToday?: boolean;
}

export function ForecastCard({ forecast, isToday = false }: ForecastCardProps) {
  const weatherEmoji = WeatherService.getWeatherEmoji(
    forecast.day.condition.code
  );

  // Format date
  const date = new Date(forecast.date);
  const dayName = isToday
    ? 'Today'
    : date.toLocaleDateString('en-US', { weekday: 'short' });
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <View className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mr-3 border border-white/20 min-w-[140px]">
      {/* Day */}
      <Text className="text-white font-semibold text-base mb-1">
        {dayName}
      </Text>
      <Text className="text-white/60 text-sm mb-3">{dateStr}</Text>

      {/* Weather Icon */}
      <Text className="text-5xl text-center mb-3">{weatherEmoji}</Text>

      {/* Condition */}
      <Text className="text-white/80 text-sm text-center mb-3" numberOfLines={2}>
        {forecast.day.condition.text}
      </Text>

      {/* Temperature Range */}
      <View className="flex-row items-center justify-center gap-2">
        <Text className="text-white text-lg font-bold">
          {Math.round(forecast.day.maxtemp_c)}°
        </Text>
        <Text className="text-white/50 text-base">
          {Math.round(forecast.day.mintemp_c)}°
        </Text>
      </View>

      {/* Rain Chance */}
      {forecast.day.daily_chance_of_rain > 0 && (
        <View className="mt-2 flex-row items-center justify-center">
          <Text className="text-blue-300 text-xs">
            💧 {forecast.day.daily_chance_of_rain}%
          </Text>
        </View>
      )}
    </View>
  );
}
