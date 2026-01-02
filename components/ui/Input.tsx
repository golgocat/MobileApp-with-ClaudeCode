import { View, TextInput, Text } from "react-native";
import { useState } from "react";

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
  error,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? "border-red-500"
    : isFocused
    ? "border-primary-500"
    : "border-secondary-300 dark:border-secondary-600";

  return (
    <View className="w-full">
      {label && (
        <Text className="text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
          {label}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={!disabled}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          bg-white dark:bg-secondary-800 
          border-2 ${borderColor}
          rounded-xl px-4 py-3
          text-secondary-900 dark:text-white
          text-base
          ${disabled ? "opacity-50" : ""}
          ${multiline ? "min-h-[100px] text-top" : ""}
        `}
        style={{ textAlignVertical: multiline ? "top" : "center" }}
      />
      {error && (
        <Text className="text-sm text-red-500 mt-1.5">{error}</Text>
      )}
    </View>
  );
}
