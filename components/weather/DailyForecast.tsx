import { View, Text } from 'react-native';
import { DailyForecast as DailyForecastType } from '../../types/weather.types';
import { weatherService } from '../../services/weatherService';

interface DailyForecastProps {
  daily: DailyForecastType[];
}

function DayItem({ item, isToday }: { item: DailyForecastType; isToday: boolean }) {
  const emoji = weatherService.getWeatherEmoji(item.Day.Icon);
  const high = Math.round(item.Temperature.Maximum.Value);
  const low = Math.round(item.Temperature.Minimum.Value);

  const date = new Date(item.Date);
  const dayName = isToday
    ? 'Today'
    : date.toLocaleDateString('en-US', { weekday: 'short' });

  return (
    <View className="flex-row items-center justify-between py-3 px-5 border-b border-white/10 last:border-b-0">
      <Text className="text-white text-base font-medium w-16">{dayName}</Text>
      <View className="flex-row items-center flex-1 justify-center">
        <Text className="text-3xl mr-2">{emoji}</Text>
        {item.Day.HasPrecipitation && (
          <Text className="text-cyan-300 text-xs">Rain</Text>
        )}
      </View>
      <View className="flex-row items-center w-20 justify-end">
        <Text className="text-white text-base font-semibold">{high}°</Text>
        <Text className="text-white/50 text-base mx-1">/</Text>
        <Text className="text-white/60 text-base">{low}°</Text>
      </View>
    </View>
  );
}

export function DailyForecast({ daily }: DailyForecastProps) {
  return (
    <View className="mt-6 mx-4">
      <Text className="text-white text-lg font-semibold px-1 mb-3">
        5-Day Forecast
      </Text>
      <View className="bg-white/10 rounded-3xl backdrop-blur-lg overflow-hidden">
        {daily.map((item, index) => (
          <DayItem key={item.EpochDate} item={item} isToday={index === 0} />
        ))}
      </View>
    </View>
  );
}
