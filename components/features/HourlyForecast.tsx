import { View, Text, ScrollView } from 'react-native';
import { ForecastDay } from '../../services/weather.types';
import { WeatherService } from '../../services/weatherService';

interface HourlyForecastProps {
  forecastDay: ForecastDay;
}

export function HourlyForecast({ forecastDay }: HourlyForecastProps) {
  // Get next 12 hours
  const currentHour = new Date().getHours();
  const hourlyData = forecastDay.hour.slice(currentHour, currentHour + 12);

  return (
    <View className="mx-4 mb-4">
      <Text className="text-white text-xl font-semibold mb-3">
        Hourly Forecast
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-row"
      >
        {hourlyData.map((hour, index) => {
          const time = new Date(hour.time);
          const timeStr = time.toLocaleTimeString('en-US', {
            hour: 'numeric',
            hour12: true,
          });
          const weatherEmoji = WeatherService.getWeatherEmoji(
            hour.condition.code
          );

          return (
            <View
              key={hour.time}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mr-3 border border-white/20 min-w-[90px] items-center"
            >
              {/* Time */}
              <Text className="text-white/80 text-sm mb-2">
                {index === 0 ? 'Now' : timeStr}
              </Text>

              {/* Icon */}
              <Text className="text-4xl mb-2">{weatherEmoji}</Text>

              {/* Temperature */}
              <Text className="text-white text-lg font-semibold mb-1">
                {Math.round(hour.temp_c)}°
              </Text>

              {/* Rain chance */}
              {hour.chance_of_rain > 0 && (
                <Text className="text-blue-300 text-xs">
                  💧 {hour.chance_of_rain}%
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
