import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-secondary-900">
      <View className="flex-1 items-center justify-center px-6">
        {/* Logo/Title Area */}
        <View className="mb-8">
          <Text className="text-4xl font-bold text-primary-600 dark:text-primary-400 text-center">
            MobileApp
          </Text>
          <Text className="text-lg text-secondary-500 dark:text-secondary-400 text-center mt-2">
            Built with Claude Code
          </Text>
        </View>

        {/* Description */}
        <View className="mb-12">
          <Text className="text-center text-secondary-600 dark:text-secondary-300 text-base leading-6">
            Your React Native + Expo app is ready for development.
            {"\n"}
            Start building amazing features!
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="w-full max-w-xs gap-4">
          <Pressable
            className="bg-primary-600 py-4 px-6 rounded-xl active:bg-primary-700"
            onPress={() => {
              // Navigate to main app
            }}
          >
            <Text className="text-white text-center font-semibold text-lg">
              Get Started
            </Text>
          </Pressable>

          <Pressable
            className="border-2 border-primary-600 py-4 px-6 rounded-xl active:bg-primary-50 dark:active:bg-primary-900/20"
            onPress={() => {
              // Navigate to docs/help
            }}
          >
            <Text className="text-primary-600 dark:text-primary-400 text-center font-semibold text-lg">
              Learn More
            </Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View className="absolute bottom-8">
          <Text className="text-secondary-400 text-sm">
            Powered by Expo + NativeWind
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
