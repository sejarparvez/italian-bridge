# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-04-06

### Added
- Initial release of Italian Bridge card game.
- 4-player partnership gameplay (1 Human vs 3 Bots).
- Bidding system (7-10) with special bonus for Bid 10.
- Two-phase card dealing mechanic (5 cards, then 8).
- Hidden trump suit with "Reveal & Trump" or "Skip" logic.
- Automated bot decision-making for bidding and playing.
- Responsive landscape UI optimized for mobile devices.
- State management powered by Zustand.
- Smooth animations using React Native Reanimated and Moti.
- Project linting and formatting with Biome.
- GitHub Actions workflow for automated deployments.

### Technical Details
- Built with React Native and Expo (SDK 55).
- Uses Expo Router for file-based navigation.
- Integrated `expo-screen-orientation` to lock landscape mode.
- Custom game engine for trick-taking and scoring logic.
