import { View, Text, StyleSheet } from 'react-native';
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
    <View style={styles.dayItem}>
      <Text style={styles.dayName}>{dayName}</Text>
      <View style={styles.iconContainer}>
        <Text style={styles.emoji}>{emoji}</Text>
        {item.Day.HasPrecipitation && (
          <Text style={styles.precipitation}>Rain</Text>
        )}
      </View>
      <View style={styles.tempContainer}>
        <Text style={styles.highTemp}>{high}°</Text>
        <Text style={styles.tempDivider}>/</Text>
        <Text style={styles.lowTemp}>{low}°</Text>
      </View>
    </View>
  );
}

export function DailyForecast({ daily }: DailyForecastProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>5-Day Forecast</Text>
      <View style={styles.card}>
        {daily.map((item, index) => (
          <DayItem key={item.EpochDate} item={item} isToday={index === 0} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    overflow: 'hidden',
  },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  dayName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    width: 64,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 28,
    marginRight: 8,
  },
  precipitation: {
    color: '#67e8f9',
    fontSize: 12,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    justifyContent: 'flex-end',
  },
  highTemp: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tempDivider: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    marginHorizontal: 4,
  },
  lowTemp: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
});
