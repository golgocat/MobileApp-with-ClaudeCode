import { Pressable, Text, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
}: ButtonProps) {
  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const baseStyles = "items-center justify-center rounded-xl flex-row";
  
  const variantStyles = {
    primary: "bg-primary-600 active:bg-primary-700",
    secondary: "bg-secondary-600 active:bg-secondary-700",
    outline: "border-2 border-primary-600 bg-transparent active:bg-primary-50 dark:active:bg-primary-900/20",
    ghost: "bg-transparent active:bg-secondary-100 dark:active:bg-secondary-800",
  };

  const sizeStyles = {
    sm: "py-2 px-4",
    md: "py-3 px-6",
    lg: "py-4 px-8",
  };

  const textVariantStyles = {
    primary: "text-white",
    secondary: "text-white",
    outline: "text-primary-600 dark:text-primary-400",
    ghost: "text-secondary-700 dark:text-secondary-300",
  };

  const textSizeStyles = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const disabledStyles = disabled || loading ? "opacity-50" : "";
  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${widthStyles}`}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" || variant === "secondary" ? "#fff" : "#3b82f6"}
          size="small"
        />
      ) : (
        <Text
          className={`font-semibold ${textVariantStyles[variant]} ${textSizeStyles[size]}`}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
