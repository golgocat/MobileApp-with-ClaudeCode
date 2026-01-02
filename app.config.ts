import "dotenv/config";

export default ({ config }: any) => ({
  ...config,
  extra: {
    ...config.extra,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    ACCUWEATHER_API_KEY: process.env.EXPO_PUBLIC_ACCUWEATHER_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    APP_ENV: process.env.APP_ENV || "development",
  },
});
