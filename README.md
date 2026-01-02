# MobileApp-with-ClaudeCode

A React Native mobile application built with Expo, developed using Claude Code on iOS.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo Go app on your phone (for testing)
- Claude iOS app with Pro/Max subscription (for development)

### Installation

```bash
# Clone the repository
git clone https://github.com/golgocat/MobileApp-with-ClaudeCode.git
cd MobileApp-with-ClaudeCode

# Install dependencies
npm install

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
├── app/                 # Screens (Expo Router)
├── components/          # Reusable components
│   └── ui/             # Base UI components
├── hooks/              # Custom hooks
├── services/           # API services
├── stores/             # State management
├── utils/              # Utilities
├── constants/          # Theme & config
├── assets/             # Images, fonts
├── wireframes/         # UI designs
└── plans/              # Dev plans
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

## 📄 License

MIT

---

Built with ❤️ using Claude Code
