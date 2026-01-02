import { View, Text } from 'react-native';
import { CurrentConditions } from '../../types/weather.types';
import { weatherService } from '../../services/weatherService';

interface CurrentWeatherProps {
  current: CurrentConditions;
}

export function CurrentWeather({ current }: CurrentWeatherProps) {
  const emoji = weatherService.getWeatherEmoji(current.WeatherIcon);
  const temp = Math.round(current.Temperature.Metric.Value);
  const feelsLike = Math.round(current.RealFeelTemperature.Metric.Value);

  return (
    <View className="items-center py-8">
      {/* Location */}
      <Text className="text-white/80 text-lg font-medium mb-2">Dubai, UAE</Text>

      {/* Weather Icon */}
      <Text className="text-8xl mb-4">{emoji}</Text>

      {/* Temperature */}
      <Text className="text-white text-8xl font-extralight">{temp}°</Text>

      {/* Weather Description */}
      <Text className="text-white text-2xl font-medium mt-2">
        {current.WeatherText}
      </Text>

      {/* Feels Like */}
      <Text className="text-white/70 text-base mt-1">
        Feels like {feelsLike}°
      </Text>

      {/* High/Low - We'll show humidity instead since we don't have daily in current */}
      <View className="flex-row mt-4 gap-4">
        <View className="items-center">
          <Text className="text-white/60 text-sm">Humidity</Text>
          <Text className="text-white text-lg font-semibold">
            {current.RelativeHumidity}%
          </Text>
        </View>
        <View className="w-px bg-white/30 h-10" />
        <View className="items-center">
          <Text className="text-white/60 text-sm">Wind</Text>
          <Text className="text-white text-lg font-semibold">
            {Math.round(current.Wind.Speed.Metric.Value)} km/h
          </Text>
        </View>
        <View className="w-px bg-white/30 h-10" />
        <View className="items-center">
          <Text className="text-white/60 text-sm">UV Index</Text>
          <Text className="text-white text-lg font-semibold">
            {current.UVIndex}
          </Text>
        </View>
      </View>
    </View>
  );
}
