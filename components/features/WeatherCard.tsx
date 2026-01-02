import { View, Text } from 'react-native';
import { CurrentWeather, WeatherLocation } from '../../services/weather.types';
import { WeatherService } from '../../services/weatherService';

interface WeatherCardProps {
  location: WeatherLocation;
  current: CurrentWeather;
}

export function WeatherCard({ location, current }: WeatherCardProps) {
  const weatherEmoji = WeatherService.getWeatherEmoji(current.condition.code);
  const greeting = WeatherService.getGreeting();

  return (
    <View className="mx-4 mt-6 mb-4">
      {/* Greeting */}
      <Text className="text-white/90 text-lg mb-2">{greeting}</Text>

      {/* Location */}
      <Text className="text-white text-3xl font-bold mb-1">
        {location.name}
      </Text>
      <Text className="text-white/70 text-base mb-6">
        {location.country}
      </Text>

      {/* Main Weather Display */}
      <View className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
        <View className="flex-row items-center justify-between mb-6">
          {/* Temperature */}
          <View>
            <Text className="text-white text-7xl font-bold">
              {Math.round(current.temp_c)}°
            </Text>
            <Text className="text-white/80 text-xl mt-2">
              {current.condition.text}
            </Text>
            <Text className="text-white/60 text-base mt-1">
              Feels like {Math.round(current.feelslike_c)}°
            </Text>
          </View>

          {/* Weather Icon/Emoji */}
          <Text className="text-8xl">{weatherEmoji}</Text>
        </View>

        {/* Weather Details Grid */}
        <View className="flex-row flex-wrap pt-6 border-t border-white/20">
          <WeatherDetail
            icon="💨"
            label="Wind"
            value={`${Math.round(current.wind_kph)} km/h`}
          />
          <WeatherDetail
            icon="💧"
            label="Humidity"
            value={`${current.humidity}%`}
          />
          <WeatherDetail
            icon="👁️"
            label="Visibility"
            value={`${current.vis_km} km`}
          />
          <WeatherDetail
            icon="🌡️"
            label="UV Index"
            value={current.uv.toString()}
          />
        </View>
      </View>
    </View>
  );
}

interface WeatherDetailProps {
  icon: string;
  label: string;
  value: string;
}

function WeatherDetail({ icon, label, value }: WeatherDetailProps) {
  return (
    <View className="w-1/2 mb-4">
      <View className="flex-row items-center">
        <Text className="text-2xl mr-2">{icon}</Text>
        <View>
          <Text className="text-white/60 text-sm">{label}</Text>
          <Text className="text-white text-base font-semibold">{value}</Text>
        </View>
      </View>
    </View>
  );
}
