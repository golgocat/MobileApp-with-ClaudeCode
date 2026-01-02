# Dubai Weather Forecast App

A stunning weather forecast mobile application for Dubai, built with React Native, Expo, and NativeWind. Developed using Claude Code on iOS.

## ✨ Features

- **Current Weather**: Real-time weather conditions for Dubai with temperature, feels-like, and weather emoji
- **7-Day Forecast**: Extended forecast with daily highs, lows, and rain probability
- **Hourly Forecast**: Hour-by-hour predictions for the next 12 hours
- **Weather Details**: Comprehensive data including wind speed, humidity, visibility, and UV index
- **Sun & Moon Info**: Sunrise, sunset times, and moon phase
- **Pull to Refresh**: Swipe down to update weather data
- **Beautiful UI**: Glassmorphism design with smooth animations and emoji weather icons

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo Go app on your phone (for testing)
- AccuWeather API key from [AccuWeather Developer](https://developer.accuweather.com/) (free tier or subscription)

### Installation

```bash
# Clone the repository
git clone https://github.com/golgocat/MobileApp-with-ClaudeCode.git
cd MobileApp-with-ClaudeCode

# Install dependencies
npm install

# Set up your AccuWeather API key
cp .env.example .env
# Edit .env and add your API key from developer.accuweather.com

# Start the development server
npx expo start
```

### Testing on Device
1. Install **Expo Go** from the App Store or Play Store
2. Scan the QR code shown in the terminal
3. The app will load on your device

## 📱 Development with Claude Code

This project is optimized for development using Claude Code on the iOS app.

### Getting Started with Claude Code

1. Open **Claude iOS app**
2. Start a **Claude Code** session
3. Connect your **GitHub repository**
4. Start building!

### Key Files for Claude Code

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project context and coding conventions |
| `TODO.md` | Task tracking and progress |
| `wireframes/` | UI mockups (add screenshots here) |
| `plans/` | Development plans by phase |

### Useful Commands in Claude Code

```
/init          # Initialize/refresh CLAUDE.md
/mcp           # Connect Expo MCP server
```

## 🛠 Tech Stack

- **Framework**: React Native + Expo SDK 54
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Styling**: NativeWind (Tailwind CSS)
- **State**: React Context (upgradeable to Zustand)

## 📁 Project Structure

```
├── app/
│   ├── index.tsx            # Main weather screen
│   └── _layout.tsx          # Root layout
├── components/
│   ├── features/
│   │   ├── WeatherCard.tsx      # Current weather display
│   │   ├── ForecastCard.tsx     # Daily forecast card
│   │   └── HourlyForecast.tsx   # Hourly forecast slider
│   └── ui/                  # Base UI components (Button, Input)
├── hooks/
│   └── useWeather.ts        # Weather data custom hook
├── services/
│   ├── weatherService.ts    # Weather API service
│   └── weather.types.ts     # TypeScript type definitions
├── constants/               # Theme & config
├── assets/                  # Images, fonts
├── wireframes/              # UI designs
└── plans/                   # Dev plans
```

## 📱 Available Scripts

```bash
npm start              # Start Expo dev server
npm run ios            # Start iOS simulator
npm run android        # Start Android emulator
npm run web            # Start web version
npm run lint           # Run ESLint
npm run typecheck      # TypeScript check
```

## 🏗 Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## 🌤️ Weather API - AccuWeather

This app uses [AccuWeather API](https://developer.accuweather.com/) which provides:
- Current weather conditions with detailed metrics
- Up to 15-day daily forecast (depending on subscription tier)
- 12-hour and 24-hour hourly forecasts
- Astronomy data (sunrise, sunset, moon phase)
- AccuWeather's proprietary RealFeel® Temperature
- High-accuracy weather data used by millions worldwide

### Getting Your AccuWeather API Key

1. Visit [AccuWeather Developer Portal](https://developer.accuweather.com/)
2. Sign up for a free account or use your existing subscription
3. Create a new app in the dashboard
4. Copy your API key
5. Add it to your `.env` file as `EXPO_PUBLIC_ACCUWEATHER_API_KEY`

**Free tier (Limited Trial):**
- 50 API calls per day
- Access to all forecast endpoints
- Perfect for testing and development

**Paid subscriptions available for production use with higher limits**

### Changing the Location

To change from Dubai to another city, edit `app/index.tsx` line 15:

```typescript
const { weatherData, loading, error, refreshing, refetch } = useWeather(
  "Dubai",  // Change this to any city name
  7
);
```

## 📄 License

MIT

---

Built with ❤️ using Claude Code | Weather data by [AccuWeather](https://www.accuweather.com/)
