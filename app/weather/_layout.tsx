import { Stack } from "expo-router";
import { COLORS } from "../../constants/theme";

export default function WeatherLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.gradientStart },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: { fontWeight: "600" },
        headerBackTitle: " ",
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="[date]"
        options={{
          headerTitle: "Day Detail",
        }}
      />
    </Stack>
  );
}
