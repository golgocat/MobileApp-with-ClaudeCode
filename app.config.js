require('dotenv').config();

module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      EXPO_PUBLIC_ACCUWEATHER_API_KEY: process.env.EXPO_PUBLIC_ACCUWEATHER_API_KEY,
    },
  };
};
