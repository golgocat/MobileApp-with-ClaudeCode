import "../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { assertEnv } from "../config/env";

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
            headerTitle: "Rain Risk Report",
            headerStyle: { backgroundColor: "#0f1c2e" },
            headerTintColor: "white",
            headerTitleStyle: { fontWeight: "600" },
            headerBackTitle: "",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="report/[date]"
          options={{
            headerShown: true,
            headerTitle: "Day Details",
            headerStyle: { backgroundColor: "#0f1c2e" },
            headerTintColor: "white",
            headerTitleStyle: { fontWeight: "600" },
            headerBackTitle: "",
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="report/chat"
          options={{
            headerShown: true,
            headerTitle: "Ask AI",
            headerStyle: { backgroundColor: "#0f1c2e" },
            headerTintColor: "white",
            headerTitleStyle: { fontWeight: "600" },
            headerBackTitle: "",
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
