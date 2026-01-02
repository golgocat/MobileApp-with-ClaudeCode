import { View, Text, StyleSheet } from "react-native";
import { CurrentConditions } from "../../types/weather.types";
import { COLORS, SHADOWS } from "../../constants/theme";

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
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
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
          label="HUMIDITY"
          value={`${current.RelativeHumidity}%`}
          icon="💧"
        />
        <DetailItem
          label="WIND"
          value={`${windSpeed} km/h ${windDirection}`}
          icon="💨"
        />
        <DetailItem
          label="VISIBILITY"
          value={`${visibility} km`}
          icon="👁️"
        />
        <DetailItem
          label="PRESSURE"
          value={`${pressure} mb`}
          icon="🌡️"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  detailItem: {
    backgroundColor: COLORS.glassBackground,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    padding: 16,
    width: "48%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    ...SHADOWS.cardSmall,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  icon: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
});
