import { View, StyleSheet, ViewStyle } from "react-native";
import { COLORS, SHADOWS } from "../../constants/theme";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "light" | "dark";
}

export function GlassCard({ children, style, variant = "default" }: GlassCardProps) {
  const bgColor =
    variant === "light"
      ? "rgba(255, 255, 255, 0.8)"
      : variant === "dark"
      ? "rgba(255, 255, 255, 0.5)"
      : COLORS.glassBackground;

  return (
    <View style={[styles.card, { backgroundColor: bgColor }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.card,
  },
});
