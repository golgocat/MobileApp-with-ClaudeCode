# MobileApp-with-ClaudeCode

## Project Overview
A native mobile application built with React Native and Expo, developed using Claude Code on mobile.

## Tech Stack
- **Framework**: React Native with Expo SDK 54+
- **Language**: TypeScript (strict mode)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: React Context + hooks (upgrade to Zustand if needed)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Backend**: TBD (Supabase recommended)

## Project Structure
```
├── app/                    # Expo Router screens (file-based routing)
│   ├── (tabs)/            # Tab navigation screens
│   ├── (auth)/            # Authentication screens
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Entry point
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (Button, Input, etc.)
│   └── features/         # Feature-specific components
├── hooks/                 # Custom React hooks
├── services/              # API and external services
├── stores/                # State management
├── utils/                 # Utility functions
├── constants/             # App constants and config
├── assets/                # Images, fonts, etc.
├── wireframes/            # UI mockups and designs
└── plans/                 # Development plans and phases
```

## Coding Conventions

### TypeScript
- Use strict mode
- Prefer interfaces over types for object shapes
- Export types from dedicated `.types.ts` files
- Use `unknown` over `any`

### Components
- Use functional components with hooks
- One component per file
- Use named exports
- Props interface named `{ComponentName}Props`

```typescript
// Example component structure
interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ label, onPress, variant = 'primary' }: ButtonProps) {
  // implementation
}
```

### File Naming
- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utils: `camelCase.ts`
- Types: `camelCase.types.ts`

### Imports Order
1. React/React Native
2. Third-party libraries
3. Internal components/hooks
4. Types
5. Styles/constants

## Commands

### Development
```bash
npx expo start              # Start dev server
npx expo start --ios        # Start with iOS simulator
npx expo start --android    # Start with Android emulator
npx expo start --web        # Start web version
```

### Building
```bash
npx expo prebuild           # Generate native projects
eas build --platform ios    # Build for iOS
eas build --platform android # Build for Android
```

### Testing
```bash
npm test                    # Run tests
npm run lint                # Run ESLint
npm run typecheck           # Run TypeScript check
```

## Git Workflow
- Commit after each major feature/fix
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `style:`, `test:`
- Create feature branches: `feat/feature-name`
- Always run tests before committing

## Claude Code Instructions

### When implementing features:
1. Check TODO.md for current tasks
2. Review wireframes/ if UI is involved
3. Follow the coding conventions above
4. Write tests for new functionality
5. Update TODO.md when tasks are completed
6. Commit with descriptive message

### When fixing bugs:
1. Reproduce the issue first
2. Write a failing test
3. Fix the issue
4. Verify the test passes
5. Check for related issues

### Best Practices for this project:
- Always use Expo SDK APIs when available
- Prefer expo-* packages over react-native-* alternatives
- Use Expo Router for all navigation
- Handle loading and error states in all async operations
- Support both iOS and Android - test on both platforms
- Consider accessibility (a11y) in all UI components

## Environment Variables
Create `.env` file (not committed):
```
EXPO_PUBLIC_API_URL=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## Dependencies to Install
```bash
# Core
npx expo install expo-router expo-linking expo-constants expo-status-bar

# UI
npx expo install nativewind tailwindcss

# Utilities
npx expo install expo-secure-store expo-image expo-haptics

# Development
npm install -D @types/react typescript eslint prettier
```

## Notes
- This project is optimized for development with Claude Code on iOS
- Run `/init` in Claude Code to refresh this context
- Use `/mcp` to connect Expo MCP server for enhanced features
