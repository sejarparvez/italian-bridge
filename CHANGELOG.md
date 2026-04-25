# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.5] - 2026-04-25

### Changed
- Refactored and expanded bot bidding logic for improved decision-making.
- Simplified game engine and trick-taking code.

## [1.2.4] - 2026-04-25

### Changed
- Updated all Expo SDK packages to latest versions.
- Migrated from MMKV v3 to createMMKV API in settings store.
- Added expo-image plugin to app.json configuration.
- Code formatting improvements for consistency.

## [1.2.3] - 2026-04-25

### Fixed
- Trump reveal popup no longer appears incorrectly at the start of a new trick after winning with a singleton card.

## [1.2.2] - 2026-04-23

### Added
- Game menu: Settings now links to settings screen.
- Game menu: Show Scores displays current team scores overlay.
- Game menu: Exit Game with custom confirmation modal.

## [1.2.1] - 2026-04-23

### Fixed
- Score chips now show defending target only on one opponent player (not both).

## [1.2.0] - 2026-04-23

### Fixed
- Game over overlay now shows when a team reaches ±winThreshold (from settings, default 20/30).
- Fixed win/loss detection to properly handle negative score thresholds.

## [1.1.9] - 2026-04-22

### Fixed
- Scoreboard chips now show combined team tricks instead of individual player tricks.
- Bidding team chip shows bidder's avatar; defending team chip shows human's avatar.
- Partner winning trick now correctly increments the bidding team's chip.

## [1.1.8] - 2026-04-22

### Fixed
- When player declares "Reveal & Trump" and holds trump cards in hand, only trump cards are now playable (per game rules).

## [1.1.7] - 2026-04-22

### Fixed
- Trump dialog now correctly shows only when following a trick, not when leading a new trick.

## [1.1.6] - 2026-04-22

### Fixed
- Redesigned Round End overlay with modern, compact UI for landscape orientation.

## [1.1.5] - 2026-04-22

### Fixed
- Trump dialog now shows automatically at start of turn when user cannot follow lead suit.
- Dialog no longer shows when user is leading a new trick.
- Skip/Reveal buttons now properly close dialog allowing user to pick their card.

## [1.1.4] - 2026-04-22

### Fixed
- Redesigned Select Trump overlay with modern UI including gradient background, card-style buttons, and animations.
- User's hand now visible during Trump selection phase for informed decision-making.

### Technical Details
- Added LinearGradient background and MotiView animations.
- Hearts and diamonds now display in red color.
- Suit order changed to Spades, Hearts, Clubs, Diamonds.

## [1.1.3] - 2026-04-22

### Fixed
- Trump revealing dialog now appears automatically at the start of the user's turn when they cannot follow the led suit.

## [1.1.2] - 2026-04-22

### Fixed
- Dealing animation now properly shows 5-card hands during second dealing phase when a bot wins the bid.

### Technical Details
- Fixed race condition where dealRemainingCards was called before dealing animation could run.
- Updated showPartialHands condition to display partial hands during dealing animation.

## [1.1.1] - 2026-04-22

### Fixed
- Card design now uses realistic SVG card images for all 52 cards.
- Bidding screen color fix for number 10 display.

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
