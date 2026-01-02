import { View, Text, StyleSheet } from 'react-native';
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
    <View style={styles.detailItem}>
      <View style={styles.labelRow}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function WeatherDetails({ current }: WeatherDetailsProps) {
  const visibility = current.Visibility.Metric.Value;
  const pressure = current.Pressure.Metric.Value;
  const windSpeed = Math.round(current.Wind.Speed.Metric.Value);
  const windDirection = current.Wind.Direction.Localized;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weather Details</Text>
      <View style={styles.grid}>
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

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 32,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    margin: '1%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  label: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  value: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
});
