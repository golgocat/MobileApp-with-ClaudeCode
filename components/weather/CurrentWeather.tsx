import { View, Text, StyleSheet } from 'react-native';
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
    <View style={styles.container}>
      {/* Location */}
      <Text style={styles.location}>Dubai, UAE</Text>

      {/* Weather Icon */}
      <Text style={styles.emoji}>{emoji}</Text>

      {/* Temperature */}
      <Text style={styles.temperature}>{temp}°</Text>

      {/* Weather Description */}
      <Text style={styles.description}>{current.WeatherText}</Text>

      {/* Feels Like */}
      <Text style={styles.feelsLike}>Feels like {feelsLike}°</Text>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Humidity</Text>
          <Text style={styles.statValue}>{current.RelativeHumidity}%</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Wind</Text>
          <Text style={styles.statValue}>
            {Math.round(current.Wind.Speed.Metric.Value)} km/h
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>UV Index</Text>
          <Text style={styles.statValue}>{current.UVIndex}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  location: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 96,
    marginBottom: 16,
  },
  temperature: {
    color: 'white',
    fontSize: 96,
    fontWeight: '200',
  },
  description: {
    color: 'white',
    fontSize: 24,
    fontWeight: '500',
    marginTop: 8,
  },
  feelsLike: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  statValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
