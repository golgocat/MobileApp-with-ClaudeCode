import "../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { assertEnv } from "../config/env";
import { COLORS } from "../constants/theme";

// Check environment variables at startup
assertEnv();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="report/index"
          options={{
            headerShown: true,
            headerTitle: "Weather Analysis",
            headerStyle: { backgroundColor: COLORS.gradientStart },
            headerTintColor: COLORS.textPrimary,
            headerTitleStyle: { fontWeight: "600" },
            headerBackTitle: " ",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="report/[date]"
          options={{
            headerShown: true,
            headerTitle: "Day Details",
            headerStyle: { backgroundColor: COLORS.gradientStart },
            headerTintColor: COLORS.textPrimary,
            headerTitleStyle: { fontWeight: "600" },
            headerBackTitle: " ",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="report/chat"
          options={{
            headerShown: true,
            headerTitle: "Ask AI",
            headerStyle: { backgroundColor: COLORS.gradientStart },
            headerTintColor: COLORS.textPrimary,
            headerTitleStyle: { fontWeight: "600" },
            headerBackTitle: " ",
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
