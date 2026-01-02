import { View, Text, ScrollView, StyleSheet } from 'react-native';
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
    <View style={styles.hourlyItem}>
      <Text style={styles.time}>{displayTime}</Text>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.temp}>{temp}°</Text>
      {item.PrecipitationProbability > 0 && (
        <Text style={styles.precipitation}>{item.PrecipitationProbability}%</Text>
      )}
    </View>
  );
}

export function HourlyForecast({ hourly }: HourlyForecastProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hourly Forecast</Text>
      <View style={styles.card}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
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

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    marginHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 8,
  },
  hourlyItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  time: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  emoji: {
    fontSize: 32,
    marginVertical: 8,
  },
  temp: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  precipitation: {
    color: '#67e8f9',
    fontSize: 12,
    marginTop: 4,
  },
});
