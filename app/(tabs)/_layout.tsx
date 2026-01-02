import { Tabs } from "expo-router";
import { Text, View, StyleSheet } from "react-native";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    weather: "🌤️",
    travel: "✈️",
  };

  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.icon, focused && styles.iconFocused]}>
        {icons[name] || "📱"}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Weather",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="weather" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="travel"
        options={{
          title: "Travel",
          tabBarIcon: ({ focused }) => (
            <TabIcon name="travel" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#0f172a",
    borderTopColor: "rgba(255,255,255,0.1)",
    borderTopWidth: 1,
    height: 85,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 24,
    opacity: 0.6,
  },
  iconFocused: {
    opacity: 1,
  },
});
