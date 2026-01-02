import { View, Text, ScrollView } from 'react-native';
import { HourlyForecast as HourlyForecastType } from '../../types/weather.types';
import { weatherService } from '../../services/weatherService';

interface HourlyForecastProps {
  hourly: HourlyForecastType[];
}

function HourlyItem({ item, isFirst }: { item: HourlyForecastType; isFirst: boolean }) {
  const emoji = weatherService.getWeatherEmoji(item.WeatherIcon);
  const temp = Math.round(item.Temperature.Value);
  const time = new Date(item.DateTime);
  const hour = time.getHours();
  const displayTime = isFirst ? 'Now' : `${hour}:00`;

  return (
    <View className="items-center px-4 py-3">
      <Text className="text-white/80 text-sm font-medium">{displayTime}</Text>
      <Text className="text-4xl my-2">{emoji}</Text>
      <Text className="text-white text-lg font-semibold">{temp}°</Text>
      {item.PrecipitationProbability > 0 && (
        <Text className="text-cyan-300 text-xs mt-1">
          {item.PrecipitationProbability}%
        </Text>
      )}
    </View>
  );
}

export function HourlyForecast({ hourly }: HourlyForecastProps) {
  return (
    <View className="mt-6">
      <Text className="text-white text-lg font-semibold px-5 mb-3">
        Hourly Forecast
      </Text>
      <View className="bg-white/10 rounded-3xl mx-4 backdrop-blur-lg">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        >
          {hourly.slice(0, 12).map((item, index) => (
            <HourlyItem
              key={item.EpochDateTime}
              item={item}
              isFirst={index === 0}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
