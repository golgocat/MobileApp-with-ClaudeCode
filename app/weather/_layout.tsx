import { Stack } from "expo-router";
import { COLORS } from "../../constants/theme";

export default function WeatherLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "transparent",
        },
        headerTintColor: COLORS.textPrimary,
        headerTitleStyle: {
          fontWeight: "600",
        },
        headerShadowVisible: false,
        headerTransparent: true,
      }}
    >
      <Stack.Screen
        name="[date]"
        options={{
          title: "Day Detail",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
