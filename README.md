# Italian Bridge 🃏

Italian Bridge is a strategic 4-player partnership card game developed with React Native and Expo. Experience a classic trick-taking game featuring custom bots, a unique bidding phase, and a hidden trump mechanic.

## 🃏 Game Overview

Italian Bridge is played between two teams of two players sitting in alternating positions.

- **Teams:** 
  - **Team A:** Human (Player 1) + Bot 2 (Player 3)
  - **Team B:** Bot 1 (Player 2) + Bot 3 (Player 4)

### Key Features

- **Strategic Bidding:** Players receive only 5 cards before bidding. Bids range from 7 to 10. The winner selects the trump suit.
- **Two-Phase Dealing:** 5 cards are dealt before bidding, and the remaining 8 after trump selection.
- **Hidden Trump Mechanic:** The trump suit remains hidden until a player chooses to "Reveal & Trump" when they cannot follow the led suit.
- **Advanced Bots:** 3 AI-driven bots with unique bidding and playing strategies.
- **Scoring System:** Dynamic scoring with a special **+13 point bonus** for successful 10-trick bids.
- **Cross-Platform:** Built for Android, iOS, and Web (optimized for mobile landscape view).

For a detailed look at the rules, see [docs/rules.md](docs/rules.md).

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [Bun](https://bun.sh/) (Optional, but recommended for faster dependency installation)
- [Expo Go](https://expo.dev/go) app on your mobile device (for development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/italian-bridge.git
   cd italian-bridge
   ```

2. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```

3. Start the project:
   ```bash
   bun start
   # or
   npm start
   ```

### Scripts

- `bun run start` - Start the Expo development server.
- `bun run android` - Run on an Android emulator or device.
- `bun run ios` - Run on an iOS simulator or device.
- `bun run web` - Open in the browser.
- `bun run lint` - Run Biome linting.
- `bun run format` - Format code with Biome.
- `bun run fix` - Fix linting issues.

## 🛠️ Technical Stack

- **Framework:** [Expo](https://expo.dev/) (React Native)
- **Navigation:** [Expo Router](https://docs.expo.dev/router/introduction/) (v3)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Animations:** [Reanimated](https://docs.swmansion.com/react-native-reanimated/) & [Moti](https://moti.fyi/)
- **Styling:** [NativeWind](https://www.nativewind.dev/) / Vanilla CSS with [global.css](global.css)
- **Tooling:** [Biome](https://biomejs.dev/) for linting & formatting.

## 📁 Project Structure

```text
├── app/              # File-based routing (Expo Router)
├── assets/           # Images, icons, and fonts
├── components/       # UI components (shared and game-specific)
├── constants/        # Card definitions and theme colors
├── game/             # Core game engine, logic, and bot AI
├── hooks/            # Custom React hooks (e.g., useDealing)
├── store/            # Zustand game state
├── types/            # TypeScript interfaces and types
└── utils/            # Helper functions (sorting, logging)
```


---

Developed with ❤️ by Sejar Parvez
