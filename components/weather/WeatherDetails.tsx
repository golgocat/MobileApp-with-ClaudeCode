import { View, Text } from 'react-native';
import { CurrentConditions } from '../../types/weather.types';

interface WeatherDetailsProps {
  current: CurrentConditions;
}

interface DetailItemProps {
  label: string;
  value: string;
  icon: string;
}

function DetailItem({ label, value, icon }: DetailItemProps) {
  return (
    <View className="bg-white/10 rounded-2xl p-4 flex-1 min-w-[45%] m-1.5">
      <View className="flex-row items-center mb-2">
        <Text className="text-xl mr-2">{icon}</Text>
        <Text className="text-white/60 text-sm uppercase tracking-wide">
          {label}
        </Text>
      </View>
      <Text className="text-white text-2xl font-semibold">{value}</Text>
    </View>
  );
}

export function WeatherDetails({ current }: WeatherDetailsProps) {
  const visibility = current.Visibility.Metric.Value;
  const pressure = current.Pressure.Metric.Value;
  const windSpeed = Math.round(current.Wind.Speed.Metric.Value);
  const windDirection = current.Wind.Direction.Localized;

  return (
    <View className="mt-6 mx-4 mb-8">
      <Text className="text-white text-lg font-semibold px-1 mb-3">
        Weather Details
      </Text>
      <View className="flex-row flex-wrap">
        <DetailItem
          label="Humidity"
          value={`${current.RelativeHumidity}%`}
          icon="💧"
        />
        <DetailItem
          label="Wind"
          value={`${windSpeed} km/h ${windDirection}`}
          icon="💨"
        />
        <DetailItem
          label="Visibility"
          value={`${visibility} km`}
          icon="👁️"
        />
        <DetailItem
          label="Pressure"
          value={`${pressure} mb`}
          icon="🌡️"
        />
        <DetailItem
          label="UV Index"
          value={`${current.UVIndex} ${current.UVIndexText}`}
          icon="☀️"
        />
        <DetailItem
          label="Cloud Cover"
          value={`${current.CloudCover}%`}
          icon="☁️"
        />
      </View>
    </View>
  );
}
