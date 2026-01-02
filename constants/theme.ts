// Design system based on glassmorphism weather app
// Soft gradients, frosted glass cards, clean typography

export const COLORS = {
  // Gradient colors
  gradientStart: "#e0d4f0", // Soft lavender
  gradientMiddle: "#f0e8f5", // Light purple
  gradientEnd: "#fce4d4", // Soft peach

  // Card colors (glassmorphism)
  glassBackground: "rgba(255, 255, 255, 0.7)",
  glassBorder: "rgba(255, 255, 255, 0.9)",
  glassBackgroundDark: "rgba(255, 255, 255, 0.5)",

  // Text colors
  textPrimary: "#1a1a2e",
  textSecondary: "#4a4a6a",
  textMuted: "#8a8aa0",
  textLight: "#ffffff",

  // Accent colors
  accentBlue: "#4a90d9",
  accentOrange: "#f5a623",
  accentRed: "#e74c3c",
  accentGreen: "#27ae60",
  accentYellow: "#f1c40f",
  accentPurple: "#9b59b6",

  // Temperature bar colors
  tempCold: "#74b9ff",
  tempCool: "#81ecec",
  tempMild: "#a8e6cf",
  tempWarm: "#ffeaa7",
  tempHot: "#fab1a0",

  // Risk colors
  riskLow: "#27ae60",
  riskMedium: "#f5a623",
  riskHigh: "#e67e22",
  riskExtreme: "#e74c3c",

  // Tab bar
  tabBarBackground: "rgba(255, 255, 255, 0.95)",
  tabBarActive: "#4a4a6a",
  tabBarInactive: "#b0b0c0",
};

export const GRADIENTS = {
  main: ["#e0d4f0", "#f0e8f5", "#fce4d4"] as const,
  mainVertical: ["#d8cce8", "#f5eff8", "#fde8d7"] as const,
};

export const SHADOWS = {
  card: {
    shadowColor: "#8b7aa0",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardSmall: {
    shadowColor: "#8b7aa0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const GLASS_STYLE = {
  backgroundColor: COLORS.glassBackground,
  borderRadius: 24,
  borderWidth: 1.5,
  borderColor: COLORS.glassBorder,
  ...SHADOWS.card,
};

export const TYPOGRAPHY = {
  hero: {
    fontSize: 80,
    fontWeight: "200" as const,
    color: COLORS.textPrimary,
  },
  largeTemp: {
    fontSize: 56,
    fontWeight: "300" as const,
    color: COLORS.textPrimary,
  },
  mediumTemp: {
    fontSize: 32,
    fontWeight: "400" as const,
    color: COLORS.textPrimary,
  },
  title: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: COLORS.textSecondary,
  },
  body: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: COLORS.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: COLORS.textMuted,
  },
  small: {
    fontSize: 11,
    fontWeight: "400" as const,
    color: COLORS.textMuted,
  },
};

// Weather icon mapping for AccuWeather icon codes
export const WEATHER_ICONS: Record<number, string> = {
  1: "☀️", // Sunny
  2: "🌤️", // Mostly Sunny
  3: "⛅", // Partly Sunny
  4: "🌥️", // Intermittent Clouds
  5: "🌥️", // Hazy Sunshine
  6: "☁️", // Mostly Cloudy
  7: "☁️", // Cloudy
  8: "☁️", // Dreary
  11: "🌫️", // Fog
  12: "🌧️", // Showers
  13: "🌦️", // Mostly Cloudy w/ Showers
  14: "🌦️", // Partly Sunny w/ Showers
  15: "⛈️", // T-Storms
  16: "⛈️", // Mostly Cloudy w/ T-Storms
  17: "⛈️", // Partly Sunny w/ T-Storms
  18: "🌧️", // Rain
  19: "🌨️", // Flurries
  20: "🌨️", // Mostly Cloudy w/ Flurries
  21: "🌨️", // Partly Sunny w/ Flurries
  22: "❄️", // Snow
  23: "❄️", // Mostly Cloudy w/ Snow
  24: "🧊", // Ice
  25: "🌧️", // Sleet
  26: "🌧️", // Freezing Rain
  29: "🌧️", // Rain and Snow
  30: "🥵", // Hot
  31: "🥶", // Cold
  32: "💨", // Windy
  33: "🌙", // Clear (night)
  34: "🌙", // Mostly Clear (night)
  35: "🌙", // Partly Cloudy (night)
  36: "🌙", // Intermittent Clouds (night)
  37: "🌙", // Hazy Moonlight
  38: "☁️", // Mostly Cloudy (night)
  39: "🌧️", // Partly Cloudy w/ Showers (night)
  40: "🌧️", // Mostly Cloudy w/ Showers (night)
  41: "⛈️", // Partly Cloudy w/ T-Storms (night)
  42: "⛈️", // Mostly Cloudy w/ T-Storms (night)
  43: "🌨️", // Mostly Cloudy w/ Flurries (night)
  44: "❄️", // Mostly Cloudy w/ Snow (night)
};

export function getWeatherIcon(iconCode: number): string {
  return WEATHER_ICONS[iconCode] || "🌤️";
}

// Legacy exports for backward compatibility
export const Colors = {
  light: {
    text: COLORS.textPrimary,
    textSecondary: COLORS.textSecondary,
    background: "#ffffff",
    backgroundSecondary: "#f8fafc",
    primary: COLORS.accentBlue,
    primaryDark: "#2563eb",
    border: "#e2e8f0",
    error: COLORS.accentRed,
    success: COLORS.accentGreen,
    warning: COLORS.accentOrange,
  },
  dark: {
    text: "#f8fafc",
    textSecondary: "#94a3b8",
    background: "#0f172a",
    backgroundSecondary: "#1e293b",
    primary: "#60a5fa",
    primaryDark: "#3b82f6",
    border: "#334155",
    error: "#f87171",
    success: "#4ade80",
    warning: "#fbbf24",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};
