import { Tabs } from "expo-router";
import { Text, View, StyleSheet } from "react-native";
import { COLORS, SHADOWS } from "../../constants/theme";

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    weather: "🌤️",
    travel: "✈️",
  };

  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
      <Text style={styles.icon}>{icons[name] || "📱"}</Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.textPrimary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
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
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
    height: 90,
    paddingBottom: 24,
    paddingTop: 12,
    paddingHorizontal: 24,
    position: "absolute",
    elevation: 0,
    ...SHADOWS.tabBar,
  },
  tabItem: {
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "transparent",
  },
  iconContainerFocused: {
    backgroundColor: "rgba(74, 144, 217, 0.15)",
  },
  icon: {
    fontSize: 28,
  },
});
