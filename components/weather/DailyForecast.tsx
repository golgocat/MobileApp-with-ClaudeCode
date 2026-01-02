import { View, Text, StyleSheet } from "react-native";
import { DailyForecast as DailyForecastType } from "../../types/weather.types";
import { weatherService } from "../../services/weatherService";
import { COLORS } from "../../constants/theme";
import { GlassCard } from "../ui";

interface DailyForecastProps {
  daily: DailyForecastType[];
}

// Temperature bar color based on temperature
function getTempBarColors(low: number, high: number): { left: string; right: string } {
  const getColor = (temp: number): string => {
    if (temp <= 10) return COLORS.tempCold;
    if (temp <= 18) return COLORS.tempCool;
    if (temp <= 24) return COLORS.tempMild;
    if (temp <= 30) return COLORS.tempWarm;
    return COLORS.tempHot;
  };
  return { left: getColor(low), right: getColor(high) };
}

function DayItem({ item, isToday, minTemp, maxTemp }: {
  item: DailyForecastType;
  isToday: boolean;
  minTemp: number;
  maxTemp: number;
}) {
  const emoji = weatherService.getWeatherEmoji(item.Day.Icon);
  const high = Math.round(item.Temperature.Maximum.Value);
  const low = Math.round(item.Temperature.Minimum.Value);

  const date = new Date(item.Date);
  const dayName = isToday
    ? "Today"
    : date.toLocaleDateString("en-US", { weekday: "short" });

  // Calculate temperature bar position
  const tempRange = maxTemp - minTemp || 1;
  const barLeft = ((low - minTemp) / tempRange) * 100;
  const barWidth = ((high - low) / tempRange) * 100;
  const colors = getTempBarColors(low, high);

  return (
    <View style={styles.dayItem}>
      <Text style={styles.dayName}>{dayName}</Text>
      <Text style={styles.emoji}>{emoji}</Text>

      {/* Temperature Bar */}
      <View style={styles.tempBarContainer}>
        <View style={styles.tempBarBackground}>
          <View
            style={[
              styles.tempBar,
              {
                left: `${barLeft}%`,
                width: `${Math.max(barWidth, 15)}%`,
                backgroundColor: colors.left,
              },
            ]}
          />
        </View>
      </View>

      {/* Temperature Values */}
      <View style={styles.tempValues}>
        <Text style={styles.highTemp}>{high}°</Text>
        <Text style={styles.tempSeparator}>/</Text>
        <Text style={styles.lowTemp}>{low}°</Text>
      </View>
    </View>
  );
}

export function DailyForecast({ daily }: DailyForecastProps) {
  const temps = daily.flatMap((d) => [
    d.Temperature.Maximum.Value,
    d.Temperature.Minimum.Value,
  ]);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);

  return (
    <View style={styles.container}>
      <GlassCard style={styles.card}>
        <Text style={styles.title}>5-Day Forecast</Text>
        {daily.map((item, index) => (
          <DayItem
            key={item.EpochDate}
            item={item}
            isToday={index === 0}
            minTemp={minTemp}
            maxTemp={maxTemp}
          />
        ))}
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
    marginBottom: 12,
  },
  dayItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  dayName: {
    width: 50,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textPrimary,
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  tempBarContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  tempBarBackground: {
    height: 6,
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 3,
    position: "relative",
    overflow: "hidden",
  },
  tempBar: {
    position: "absolute",
    height: "100%",
    borderRadius: 3,
  },
  tempValues: {
    flexDirection: "row",
    alignItems: "center",
    width: 70,
    justifyContent: "flex-end",
  },
  highTemp: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  tempSeparator: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginHorizontal: 2,
  },
  lowTemp: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
