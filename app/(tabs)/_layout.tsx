import { Tabs } from "expo-router";
import { Text, View, StyleSheet } from "react-native";

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
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "rgba(255,255,255,0.5)",
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
    backgroundColor: "#0f1c2e",
    borderTopWidth: 0,
    height: 90,
    paddingBottom: 24,
    paddingTop: 12,
    paddingHorizontal: 24,
    elevation: 0,
    shadowOpacity: 0,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "transparent",
  },
  iconContainerFocused: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
  },
  icon: {
    fontSize: 26,
  },
});
