import { View, Text, ScrollView, StyleSheet } from "react-native";
import { HourlyForecast as HourlyForecastType } from "../../types/weather.types";
import { weatherService } from "../../services/weatherService";
import { COLORS, SHADOWS } from "../../constants/theme";
import { GlassCard } from "../ui";

interface HourlyForecastProps {
  hourly: HourlyForecastType[];
}

function HourlyItem({ item, isFirst }: { item: HourlyForecastType; isFirst: boolean }) {
  const emoji = weatherService.getWeatherEmoji(item.WeatherIcon);
  const temp = Math.round(item.Temperature.Value);
  const time = new Date(item.DateTime);
  const hour = time.getHours();
  const displayTime = isFirst ? "Now" : `${hour}:00`;

  return (
    <View style={styles.hourlyItem}>
      <Text style={styles.time}>{displayTime}</Text>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.temp}>{temp}°</Text>
    </View>
  );
}

export function HourlyForecast({ hourly }: HourlyForecastProps) {
  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        <Text style={styles.title}>Hourly Forecast</Text>
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
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  card: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  scrollContent: {
    paddingRight: 8,
  },
  hourlyItem: {
    alignItems: "center",
    marginRight: 20,
    minWidth: 50,
  },
  time: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  emoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  temp: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
});
