import { View, Text, StyleSheet } from "react-native";
import { CurrentConditions } from "../../types/weather.types";
import { weatherService } from "../../services/weatherService";
import { COLORS, TYPOGRAPHY } from "../../constants/theme";

interface CurrentWeatherProps {
  current: CurrentConditions;
  locationName?: string;
}

export function CurrentWeather({ current, locationName }: CurrentWeatherProps) {
  const emoji = weatherService.getWeatherEmoji(current.WeatherIcon);
  const temp = Math.round(current.Temperature.Metric.Value);

  return (
    <View style={styles.container}>
      {/* Temperature and Icon Row */}
      <View style={styles.mainRow}>
        <Text style={styles.temperature}>{temp}°</Text>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      {/* Weather Description */}
      <Text style={styles.description}>{current.WeatherText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
  },
  temperature: {
    fontSize: 80,
    fontWeight: "200",
    color: COLORS.textPrimary,
    lineHeight: 90,
  },
  emoji: {
    fontSize: 64,
    marginTop: 8,
  },
  description: {
    fontSize: 22,
    fontWeight: "500",
    color: COLORS.textPrimary,
    marginTop: -8,
  },
});
