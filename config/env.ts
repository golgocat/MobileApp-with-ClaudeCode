import Constants from "expo-constants";

type Extra = {
  GEMINI_API_KEY?: string;
  ACCUWEATHER_API_KEY?: string;
  GOOGLE_PLACES_API_KEY?: string;
  GEMINI_MODEL?: string;
  APP_ENV?: string;
};

function readExtra(): Extra {
  const expoConfig = Constants.expoConfig;
  const extra = (expoConfig?.extra ?? {}) as Extra;
  return extra;
}

export const ENV = {
  GEMINI_API_KEY: readExtra().GEMINI_API_KEY ?? "",
  ACCUWEATHER_API_KEY: readExtra().ACCUWEATHER_API_KEY ?? process.env.EXPO_PUBLIC_ACCUWEATHER_API_KEY ?? "",
  GOOGLE_PLACES_API_KEY: readExtra().GOOGLE_PLACES_API_KEY ?? process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? "",
  GEMINI_MODEL: readExtra().GEMINI_MODEL ?? "gemini-3-flash-preview",
  APP_ENV: readExtra().APP_ENV ?? "development",
};

export function assertEnv() {
  const missing: string[] = [];
  if (!ENV.GEMINI_API_KEY) missing.push("GEMINI_API_KEY");
  if (!ENV.ACCUWEATHER_API_KEY) missing.push("ACCUWEATHER_API_KEY");
  if (missing.length) {
    console.warn(`Missing env vars: ${missing.join(", ")}. Some features may not work.`);
  }
}
