# 🃏 Partner Call Break — React Native + Expo Project Plan

## Game Summary

A **4-player fixed-partner trick-taking card game** inspired by Call Break / Court Piece.
- 1 human player + 3 AI bots
- **Landscape (horizontal) layout** — locked to portrait is OFF
- **Ace of Spades-inspired visual style** — dark green felt, gold accents, premium look
- Human (Bottom), Partner Bot (Top), Opponent Bots (Left & Right)
- Full 52-card deck, 13 cards per player
- Each player **bids** tricks before play; highest bidder picks trump suit
- Partners share a combined trick target
- Fully offline — Single Player vs AI

---

## Table of Contents
1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Architecture](#3-architecture)
4. [Game Rules & Data Models](#4-game-rules--data-models)
5. [Screens & Navigation](#5-screens--navigation)
6. [State Management](#6-state-management)
7. [AI Strategy](#7-ai-strategy)
8. [Animation Plan — Moti](#8-animation-plan--moti)
9. [Visual Design System](#9-visual-design-system)
10. [Landscape UI Layout](#10-landscape-ui-layout)
11. [Audio](#11-audio)
12. [Persistence](#12-persistence)
13. [Development Phases](#13-development-phases)
14. [Testing Strategy](#14-testing-strategy)
15. [Quick Start (Bun)](#15-quick-start-bun)

---

## 1. Tech Stack

| Category | Tool | Why |
|---|---|---|
| Runtime / Package Manager | **Bun** | Fast installs, fast scripts, drop-in npm replacement |
| Framework | Expo SDK 51+ (managed) | Cross-platform, OTA updates |
| Language | TypeScript | Type-safe game state |
| Navigation | Expo Router | File-based routing |
| State | Zustand | Minimal boilerplate |
| Animations | **Moti** (built on Reanimated 3) | Declarative, cleaner API than raw Reanimated |
| Gestures | React Native Gesture Handler | Card tap & drag |
| Storage | AsyncStorage | Save scores & settings |
| Audio | expo-av | Card SFX & ambient music |
| Orientation | expo-screen-orientation | Lock to landscape |
| Styling | **NativeWind v4** | Tailwind CSS for React Native (required by Gluestack v3) |
| UI Components | **Gluestack UI v3** | Copy-paste components via CLI, built on NativeWind |
| Icons | **lucide-react-native** | Clean, consistent icon set, tree-shakeable |

### Why Gluestack UI v3?
Gluestack v3 is the **shadcn/ui equivalent for React Native** — a major departure from v2. There is no longer a package to install and import from. Instead, you use a CLI to copy components directly into your project, where you own and edit them freely. Components are styled with **NativeWind v4** (Tailwind CSS for React Native).

**Key differences from v2:**
- ❌ No more `@gluestack-ui/themed` or `@gluestack-style/react` packages
- ❌ No more `sx` prop or `$` token syntax
- ✅ Components live in your codebase at `components/ui/`
- ✅ Styled with NativeWind Tailwind classes (e.g. `className="bg-gray-900 border border-yellow-600"`)
- ✅ Fully owned — edit component source directly, no fighting the library

**Setup for Expo:**
```bash
# Step 1: Initialize Gluestack in your project
npx gluestack-ui init

# Step 2: Add only the components you need
npx gluestack-ui add button
npx gluestack-ui add modal
npx gluestack-ui add pressable
npx gluestack-ui add switch
npx gluestack-ui add progress
npx gluestack-ui add select
```

This generates files like `components/ui/button/index.tsx` — fully editable source code in your repo.

**Theming with NativeWind (Tailwind config):**
```javascript
// tailwind.config.js — extend with your dark gold palette
module.exports = {
  theme: {
    extend: {
      colors: {
        felt:      { dark: '#0D2B1A', mid: '#1A4A2E' },
        gold:      { DEFAULT: '#C9A84C', light: '#E8D5A3', dark: '#8B6914' },
        card:      { face: '#F5F0E8', back: '#1C1C2E' },
      },
      fontFamily: {
        display: ['Cinzel'],
        body:    ['CrimsonText'],
      },
    },
  },
};
```

**Usage example (with your dark gold theme):**
```typescript
import { Button, ButtonText } from '@/components/ui/button';

<Button className="bg-felt-dark border border-gold rounded-lg active:bg-gold">
  <ButtonText className="text-gold-light font-display tracking-widest uppercase">
    New Game
  </ButtonText>
</Button>
```

### Why lucide-react-native?
Lucide icons are tree-shakeable — only the icons you import are bundled. Clean, consistent stroke style that suits the premium aesthetic well.

```typescript
import { Settings, Trophy, Volume2, VolumeX, ChevronRight } from 'lucide-react-native';

// Tinted gold to match the design system
<Settings color="#C9A84C" size={22} strokeWidth={1.5} />
```

### Gluestack Components Used in This Game
| Component | Where Used |
|---|---|
| `Button` | Home screen CTAs, bidding confirm, pause menu |
| `Modal` | Pause menu, round end summary |
| `Pressable` | Card tap targets |
| `Switch` | Sound on/off in settings |
| `Select` | Difficulty picker in settings |
| `Progress` | Bid vs tricks progress bar in HUD |
| `Text`, `Heading` | All typography (themed with Cinzel/Crimson via NativeWind) |

### Why Moti over raw Reanimated?
Moti gives you a cleaner declarative API while still running on the native thread via Reanimated under the hood. Instead of managing shared values manually:

```typescript
// Raw Reanimated (verbose)
const opacity = useSharedValue(0);
useEffect(() => { opacity.value = withTiming(1); }, []);
const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

// Moti (clean)
<MotiView from={{ opacity: 0 }} animate={{ opacity: 1}} />
```

---

## 2. Project Structure

```
partner-call-break/
├── app/                            # Expo Router screens
│   ├── index.tsx                   # Home / Main Menu
│   ├── game.tsx                    # Main game screen (landscape)
│   ├── bid.tsx                     # Bidding screen
│   ├── result.tsx                  # Round result screen
│   ├── scores.tsx                  # Score history
│   ├── settings.tsx                # Sound, speed, difficulty
│   └── _layout.tsx                 # Root layout (lock to landscape here)
│
├── src/
│   ├── game/                       # ✅ Pure TypeScript — zero React
│   │   ├── deck.ts                 # Create, shuffle, deal
│   │   ├── bidding.ts              # Bid validation, trump assignment
│   │   ├── trick.ts                # Trick resolution & valid moves
│   │   ├── engine.ts               # Game loop orchestration
│   │   ├── scoring.ts              # Score calculation per round
│   │   └── ai/
│   │       ├── bidAI.ts            # AI bidding strategy
│   │       └── playAI.ts           # AI card play strategy
│   │
│   ├── store/
│   │   ├── gameStore.ts            # Active game state (Zustand)
│   │   └── settingsStore.ts        # Sound, difficulty, speed
│   │
│   ├── components/
│   │   ├── cards/
│   │   │   ├── Card.tsx            # Single card with Moti flip
│   │   │   ├── CardBack.tsx        # Premium dark card back design
│   │   │   ├── PlayerHand.tsx      # Human's fan hand (horizontal bottom)
│   │   │   └── BotHand.tsx         # Bot hand (face-down, rotated per seat)
│   │   ├── table/
│   │   │   ├── GameTable.tsx       # Dark felt table background
│   │   │   ├── TrickArea.tsx       # Center 4-card trick display
│   │   │   ├── PlayerSeat.tsx      # Seat wrapper per player
│   │   │   └── TrumpBadge.tsx      # Gold trump suit badge
│   │   ├── hud/
│   │   │   ├── ScoreBar.tsx        # Team scores (left/right edges)
│   │   │   ├── BidPanel.tsx        # Bidding number picker
│   │   │   └── TurnIndicator.tsx   # Glowing ring on active seat
│   │   └── ui/
│   │       ├── AnimatedNumber.tsx  # Score count-up (Moti)
│   │       └── icons.ts            # Lucide icons re-exported with gold tint
│   │                               # Button, Modal etc. → from @gluestack-ui/themed
│   │
│   ├── hooks/
│   │   ├── useGame.ts              # Wrapper over gameStore
│   │   ├── useCardAnimation.ts     # Moti animation helpers
│   │   └── useSound.ts             # SFX helper
│   │
│   ├── constants/
│   │   ├── cards.ts                # Suit/rank definitions
│   │   ├── theme.ts                # Dark color palette, gold accents
│   │   └── gameConfig.ts           # Round count, bid limits
│   │
│   └── utils/
│       ├── shuffle.ts              # Fisher-Yates
│       └── seatUtils.ts            # Seat layout helpers
│
├── assets/
│   ├── cards/                      # SVG card faces (dark back design)
│   ├── sounds/                     # deal, play, win, ambient
│   ├── images/                     # felt texture, gold decorations
│   └── fonts/                      # Cinzel (gold headers), serif body
│
└── __tests__/
    ├── game/
    └── components/
```

---

## 3. Architecture

```
┌──────────────────────────────────────────────┐
│          React Native UI (Landscape)         │
│  GameTable → PlayerHand → TrickArea → HUD   │
│  Styled: dark felt + gold accents (Moti)     │
└────────────────────┬─────────────────────────┘
                     │ reads / dispatches
┌────────────────────▼─────────────────────────┐
│            Zustand Game Store                │
│         Single source of truth               │
└────────────────────┬─────────────────────────┘
                     │ calls pure functions
┌────────────────────▼─────────────────────────┐
│         Game Engine (Pure TypeScript)        │
│    deck → bidding → trick → scoring          │
│    No React, fully unit-testable with Bun    │
└──────────────────────────────────────────────┘
```

**Rule:** Engine never touches React. Store never has UI logic. UI never has game rules.

---

## 4. Game Rules & Data Models

### Card Model
```typescript
// src/constants/cards.ts
export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' |
                   '7' | '6' | '5' | '4' | '3' | '2';

export interface Card {
  id: string;       // e.g. "spades_A"
  suit: Suit;
  rank: Rank;
  value: number;    // A=14, K=13 ... 2=2
}

export const RANK_ORDER: Record<Rank, number> = {
  A: 14, K: 13, Q: 12, J: 11,
  '10': 10, '9': 9, '8': 8, '7': 7,
  '6': 6,  '5': 5, '4': 4, '3': 3, '2': 2,
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣',
};

export const SUIT_COLORS: Record<Suit, string> = {
  spades: '#E8D5A3',   // gold-tinted (dark theme)
  hearts: '#E05C5C',
  diamonds: '#E05C5C',
  clubs: '#E8D5A3',
};
```

### Player & Seat Model
```typescript
export type SeatPosition = 'bottom' | 'top' | 'left' | 'right';
// bottom = human, top = partner, left/right = opponents
export type TeamId = 'BT' | 'LR'; // Bottom-Top vs Left-Right

export interface Player {
  id: string;
  name: string;
  seat: SeatPosition;
  team: TeamId;
  isHuman: boolean;
  hand: Card[];
  bid: number | null;
  tricksTaken: number;
}
```

> **Note:** Seats renamed from N/S/E/W to Bottom/Top/Left/Right to match landscape orientation naturally.

### Game State
```typescript
export type GamePhase =
  | 'dealing'
  | 'bidding'
  | 'playing'
  | 'trickEnd'   // 1.2s pause before clearing trick
  | 'roundEnd'
  | 'gameEnd';

export interface Trick {
  cards: { player: SeatPosition; card: Card }[];
  leadSuit: Suit | null;
  winningSeat: SeatPosition | null;
}

export interface GameState {
  phase: GamePhase;
  players: Record<SeatPosition, Player>;
  currentSeat: SeatPosition;
  biddingOrder: SeatPosition[];
  currentBidderIndex: number;
  trumpSuit: Suit | null;
  currentTrick: Trick;
  completedTricks: Trick[];
  round: number;
  totalRounds: number;
  teamScores: Record<TeamId, number>;
}
```

### Core Game Flow
```
1. DEAL 1      → Shuffle 52 cards, deal 5 to each seat (4 players)
2. BIDDING    → Clockwise; each player bids 7-10 using only 5 cards
                 highest bidder selects trump suit (hidden from others)
3. DEAL 2     → Deal remaining 8 cards to each player (total 13)
4. TRUMP REVEAL→ When a player plays a trump card, reveal the hidden trump
5. PLAYING    → 5 tricks:
                - Must follow lead suit if possible
                - Void: play trump or discard
                - Highest trump wins; else highest lead-suit card
                - Trick winner leads next
6. SCORING    → Bidder's team: tricks vs bid
                 - Bid met → +bid points
                 - Bid failed → -bid points
                 - Bid 10 + met → +3 bonus
                Opponents: need 4 tricks minimum
                 - Got ≥4 → 0 (no points)
                 - Got <4 → -4 points
7. REPEAT     → 5 rounds; highest cumulative score wins
```

### Scoring Rules (Detailed)

**Bidder's Team:**
- If tricks ≥ bid: score = +bid (e.g., bid 7, got 8 tricks = +7)
- If tricks < bid: score = -bid (e.g., bid 7, got 5 tricks = -7)
- Special: Bid 10 and met → +10 + 3 bonus = +13

**Opponents:**
- Must get at least 4 tricks to avoid penalty
- If tricks ≥ 4: score = 0 (no points gained or lost)
- If tricks < 4: score = -4 (fixed penalty)

**Example:**
- Bidder (team BT): bid 8, got 9 tricks → +8 points
- Opponents (team LR): got 3 tricks → -4 points

### Trick Resolution
```typescript
// src/game/trick.ts
export const getTrickWinner = (trick: Trick, trump: Suit): SeatPosition => {
  const trumps = trick.cards.filter(c => c.card.suit === trump);
  const pool = trumps.length > 0
    ? trumps
    : trick.cards.filter(c => c.card.suit === trick.leadSuit!);

  return pool.reduce((best, curr) =>
    RANK_ORDER[curr.card.rank] > RANK_ORDER[best.card.rank] ? curr : best
  ).player;
};

export const getPlayableCards = (
  hand: Card[], trick: Trick, trump: Suit
): Card[] => {
  if (trick.cards.length === 0) return hand;
  const suitCards = hand.filter(c => c.suit === trick.leadSuit!);
  return suitCards.length > 0 ? suitCards : hand;
};
```

---

## 5. Screens & Navigation

### Landscape Lock (in `_layout.tsx`)
```typescript
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE
    );
  }, []);
  // ...
}
```

### Screen List
| Screen | Route | Notes |
|---|---|---|
| Home | `/` | Dark splash, gold title, New Game / Resume / Settings |
| Bidding | `/bid` | Landscape table view, number picker, bots auto-bid |
| Game | `/game` | Full landscape table — main play screen |
| Result | `/result` | Round summary, score delta, Next Round CTA |
| Scores | `/scores` | History list of past games |
| Settings | `/settings` | Sound, speed, difficulty, reset |

---

## 6. State Management

```typescript
// src/store/gameStore.ts
import { create } from 'zustand';

export const useGameStore = create<GameStore>((set, get) => ({
  state: engine.createInitialState(),

  playCard: (card) => {
    const next = engine.playCard(get().state, 'bottom', card);
    set({ state: next });
    scheduleAITurns();
  },

  advanceAI: () => {
    set({ state: engine.runAITurn(get().state) });
  },
}));

// Bots play with a natural delay (feels human)
const scheduleAITurns = () => {
  const BOT_SEATS: SeatPosition[] = ['right', 'top', 'left'];
  BOT_SEATS.forEach((seat, i) => {
    setTimeout(() => {
      const store = useGameStore.getState();
      if (store.state.currentSeat === seat) store.advanceAI();
    }, 900 * (i + 1));
  });
};
```

---

## 7. AI Strategy

### Bidding AI (`src/game/ai/bidAI.ts`)
```typescript
export const getBotBid = (hand: Card[], difficulty: Difficulty): number => {
  const highCards = hand.filter(c => RANK_ORDER[c.rank] >= 11).length;
  const voids = Object.values(getSuitLengths(hand)).filter(l => l === 0).length;
  let estimate = Math.floor(highCards * 0.7) + voids;
  if (difficulty === 'easy') estimate += randomInRange(-1, 1);
  return Math.max(1, Math.min(estimate, 13));
};
```

### Play AI (`src/game/ai/playAI.ts`)

| Level | Strategy |
|---|---|
| **Easy** | Random valid card |
| **Medium** | Win trick if beneficial; save high cards when partner leads; avoid wasting trumps |
| **Hard** | Card memory (track played cards); deduce voids; optimal trump management |

### Medium Heuristic
- **Leading:** Play highest card of longest non-trump suit
- **Partner winning:** Play lowest valid card — don't waste
- **Opponent winning:** Play just enough to beat them, or trump if void

### Hard Additional Logic
- `playedCards: Set<string>` — track every card played
- Estimate partner's hand from their bid
- Count remaining trumps before deciding to use one
- Infer opponent voids from suit-refusal patterns

### Bot Identities
| Seat | Name | Style |
|---|---|---|
| Top | Alex | 🤝 Partner — cooperative |
| Right | Sam | 😤 Aggressive |
| Left | Jordan | 🧠 Calculating |

---

## 8. Animation Plan — Moti

All animations use **Moti**. Import from `moti` and `moti/interactions`.

### Card Deal — staggered fly-in
```typescript
// Each card flies from center to seat with delay
<MotiView
  from={{ translateX: 0, translateY: 0, opacity: 0 }}
  animate={{ translateX: targetX, translateY: targetY, opacity: 1 }}
  transition={{ type: 'timing', duration: 350, delay: index * 75 }}
/>
```

### Card Flip — face-down to face-up
```typescript
// Use two MotiViews (front/back), crossfade on rotateY
<MotiView
  from={{ rotateY: '0deg' }}
  animate={{ rotateY: '180deg' }}
  transition={{ type: 'timing', duration: 380, delay: index * 60 }}
  style={{ backfaceVisibility: 'hidden' }}
/>
```

### Human Plays a Card — lift then fly to center
```typescript
// Step 1: lift on tap
<MotiView animate={{ translateY: selected ? -18 : 0 }} />

// Step 2: on confirm, animate to trick slot position
<MotiView
  animate={{ translateX: slotX, translateY: slotY, scale: 0.85 }}
  transition={{ type: 'spring', damping: 16 }}
/>
```

### Bot Plays — slide from seat to center
```typescript
<MotiView
  from={{ translateX: botOriginX, translateY: botOriginY, opacity: 0 }}
  animate={{ translateX: 0, translateY: 0, opacity: 1 }}
  transition={{ type: 'spring', damping: 18, duration: 320 }}
/>
```

### Trick Win — glow then cards collect
```typescript
// Winner's slot glows gold
<MotiView
  animate={{ borderColor: trickWon ? '#C9A84C' : 'transparent',
             shadowOpacity: trickWon ? 0.9 : 0 }}
  transition={{ type: 'timing', duration: 300 }}
/>
// All 4 cards shrink and slide to winner's corner
<MotiView
  animate={{ scale: 0, translateX: winnerCornerX, translateY: winnerCornerY }}
  transition={{ type: 'timing', duration: 450, delay: 1200 }}
/>
```

### Trump Badge Drop-in
```typescript
<MotiView
  from={{ translateY: -60, opacity: 0 }}
  animate={{ translateY: 0, opacity: 1 }}
  transition={{ type: 'spring', damping: 12 }}
/>
```

### Turn Indicator — pulsing glow ring
```typescript
<MotiView
  from={{ scale: 1, opacity: 0.6 }}
  animate={{ scale: 1.15, opacity: 1 }}
  transition={{ loop: true, type: 'timing', duration: 800, repeatReverse: true }}
/>
```

### Score Count-Up (result screen)
```typescript
// Use Moti's useAnimatedNumber or drive with Reanimated directly
<AnimatedNumber to={finalScore} duration={1000} />
```

### Animation Speed Setting
```typescript
const { animSpeed } = useSettingsStore(); // 1.0 normal, 0.5 fast
const dur = (ms: number) => ms * animSpeed;
// Pass dur(350) instead of 350 to all transition durations
```

---

## 9. Visual Design System

### Inspired by: Ace of Spades / High-Stakes Card Games
Dark green felt, aged gold accents, deep shadows, serif card numerals.

### Color Palette (`src/constants/theme.ts`)
```typescript
export const COLORS = {
  // Table & backgrounds
  feltDark:      '#0D2B1A',   // deep dark green felt
  feltMid:       '#1A4A2E',   // felt highlight
  feltBorder:    '#0A1F13',   // table edge

  // Gold accents (Ace of Spades style)
  goldPrimary:   '#C9A84C',   // main gold
  goldLight:     '#E8D5A3',   // light gold text
  goldDark:      '#8B6914',   // dark gold shadow

  // Card surfaces
  cardFace:      '#F5F0E8',   // warm white card face
  cardBack:      '#1C1C2E',   // deep navy card back
  cardBackAccent:'#C9A84C',   // gold pattern on card back
  cardShadow:    'rgba(0,0,0,0.55)',

  // Suit colors (on dark card face)
  redSuit:       '#C0392B',   // hearts & diamonds
  blackSuit:     '#1A1A2E',   // spades & clubs

  // UI
  overlayDark:   'rgba(0,0,0,0.75)',   // modal backdrop
  textPrimary:   '#E8D5A3',            // gold-tinted white
  textSecondary: 'rgba(232,213,163,0.6)',
  danger:        '#E05C5C',
  success:       '#4CAF7D',
};
```

### Typography
```typescript
export const FONTS = {
  display: 'Cinzel',          // Gold headers (serif, regal)
  body:    'Crimson Text',    // Card numbers, body text (elegant serif)
  mono:    'JetBrains Mono',  // Scores, numbers
};
// Load with expo-font
```

### Card Back Design
The card back should use a dark navy base with a repeating gold diamond/geometric pattern — similar to luxury casino card decks. Implement as an SVG pattern in `CardBack.tsx`.

### Table Felt
- Dark green radial gradient (lighter center, darker edges)
- Subtle noise/texture overlay (use a semi-transparent PNG or SVG filter)
- Gold oval outline marking the center trick area
- Thin gold border around the table

### Buttons
- Dark background (`#0D2B1A`) with gold border (`#C9A84C`)
- Gold text with slight letter-spacing
- Pressed state: gold background with dark text

### Trump Badge
- Gold pill badge with suit symbol
- Subtle glow effect (`shadowColor: '#C9A84C'`)
- Font: Cinzel, uppercase

### Score Bar (in landscape — left and right edges)
- Team names in Cinzel font
- Score in large gold numerals
- Bid vs tricks progress bar in gold

---

## 10. Landscape UI Layout

The game is **locked to landscape**. All layout uses landscape dimensions (~844×390 on iPhone, ~960×540 on Android mid-range).

```
┌─────────────────────────────────────────────────────────────────┐
│  [BT: 24]   [TOP BOT - Alex 🤝]                   [LR: 18]     │
│             🂠 🂠 🂠 🂠 🂠 🂠 🂠  (fan, face-down)               │
│                                                                  │
│  [LEFT BOT  ┌─────────────────────────────┐  RIGHT BOT]        │
│  Jordan 🧠  │   ♠A      [TRICK]     ♥K   │  Sam 😤            │
│  🂠          │      ♦Q  [♠TRUMP]  ♣J      │          🂠         │
│  🂠          │    gold oval center area    │          🂠         │
│  🂠          └─────────────────────────────┘          🂠         │
│                                                                  │
│    ╔═══════════════════════════════════════════════════╗        │
│    ║  ♠A  ♠K  ♥Q  ♦J  ♣10  ♠9  ♥8  ♦7  ♣6  ♠5  ... ║        │
│    ║              [HUMAN HAND — bottom, fan arc]        ║        │
│    ╚═══════════════════════════════════════════════════╝        │
│              Bid: 4   Tricks: ██░░░░  2/4                       │
└─────────────────────────────────────────────────────────────────┘
```

### Layout Rules
- **Bottom (Human):** Fan of 13 cards, slight arc, tappable. Cards slightly overlap. Full screen width minus padding.
- **Top (Partner bot):** Face-down fan, mirrored vertically. Smaller card size.
- **Left/Right (Opponent bots):** Vertical stack of face-down cards rotated 90°. Card count shown.
- **Center:** Gold oval trick area. 4 card slots positioned for each seat direction.
- **Score bars:** Pinned to left and right screen edges.
- **Trump badge:** Anchored top-center or inside the trick area.
- **Turn indicator:** Glowing gold ring around the active seat's name/avatar.

### Responsive Sizing
```typescript
import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');
// In landscape: width > height always
const CARD_WIDTH  = width * 0.07;   // ~7% of screen width
const CARD_HEIGHT = CARD_WIDTH * 1.4;
const TABLE_CENTER = { x: width / 2, y: height / 2 };
```

---

## 11. Audio

| File | Trigger |
|---|---|
| `deal.mp3` | Each card dealt |
| `card_play.mp3` | Any card played |
| `trick_win.mp3` | Trick winner decided |
| `trump_reveal.mp3` | Trump badge appears |
| `round_win.mp3` | Team meets bid |
| `round_lose.mp3` | Team fails bid |
| `game_win.mp3` | Player's team wins |
| `button.mp3` | UI button taps |
| `ambient_loop.mp3` | Quiet casino ambient loop (optional) |

```typescript
// src/hooks/useSound.ts
export const useSound = () => {
  const { soundEnabled } = useSettingsStore();
  const play = async (key: SoundKey) => {
    if (!soundEnabled) return;
    const { sound } = await Audio.Sound.createAsync(SOUNDS[key]);
    await sound.playAsync();
  };
  return { play };
};
```

---

## 12. Persistence

```typescript
const KEYS = {
  GAME_IN_PROGRESS: 'game_state',
  SCORE_HISTORY:    'score_history',
  SETTINGS:         'settings',
};

// Auto-save on every state change during active phases
useGameStore.subscribe((store) => {
  const { phase } = store.state;
  if (phase === 'playing' || phase === 'bidding') {
    AsyncStorage.setItem(KEYS.GAME_IN_PROGRESS, JSON.stringify(store.state));
  }
});
```

On launch: check for saved game → show "Resume" on home screen if found.

---

## 13. Development Phases

### Phase 1 — Setup (Days 1–3)
- [ ] `bun create expo-app partner-call-break --template blank-typescript`
- [ ] Install all deps with `bun add` / `bunx expo install` (see Quick Start)
- [ ] Configure Expo Router + landscape lock in `_layout.tsx`
- [ ] Set up NativeWind v4 (`tailwind.config.js`, babel plugin, `global.css`)
- [ ] Run `npx gluestack-ui init` and add required components via CLI
- [ ] Extend `tailwind.config.js` with dark gold color tokens (`felt`, `gold`, `card`)
- [ ] Define theme constants (dark palette, gold colors, fonts)
- [ ] Load custom fonts (Cinzel, Crimson Text) via `expo-font`
- [ ] Static `Card` component — face up and face down, themed
- [ ] Static landscape `GameTable` with felt background

### Phase 2 — Game Engine (Days 4–8)
- [ ] `deck.ts` — create, shuffle, deal 13 × 4
- [ ] `trick.ts` — `getTrickWinner`, `getPlayableCards`
- [ ] `bidding.ts` — bid order, trump assignment
- [ ] `scoring.ts` — round score, cumulative team score
- [ ] `engine.ts` — full game loop
- [ ] ✅ Unit tests with `bun test`

### Phase 3 — AI (Days 9–12)
- [ ] `bidAI.ts` — bid estimation (all 3 levels)
- [ ] `playAI.ts` — Easy (random valid)
- [ ] `playAI.ts` — Medium (greedy heuristic)
- [ ] `playAI.ts` — Hard (card memory + partner logic)
- [ ] ✅ Fuzz test: bots always play valid cards over 1000 random hands

### Phase 4 — Store + Playable (Days 13–17)
- [ ] `gameStore.ts` — connect engine to Zustand
- [ ] AI turn scheduling with delays
- [ ] Bidding screen (human picker + bots auto-bid with delay)
- [ ] Landscape game screen — tap card to play (no Moti yet)
- [ ] Result screen — score summary
- [ ] ✅ Full end-to-end game playable (ugly but functional)

### Phase 5 — Moti Animations (Days 18–24)
- [ ] Card deal stagger (center → each seat)
- [ ] Card flip (face-down → face-up reveal)
- [ ] Human card → trick center (lift + fly)
- [ ] Bot card → trick center (slide from seat)
- [ ] Trick win: gold glow → cards collect to winner
- [ ] Trump badge drop-in (spring bounce)
- [ ] Turn indicator pulsing gold ring
- [ ] Score count-up on result screen

### Phase 6 — Visual Polish (Days 25–30)
- [ ] Full dark felt table with texture overlay
- [ ] Gold card back SVG pattern
- [ ] Suit symbols styled in SUIT_COLORS
- [ ] Bot name/avatar labels at each seat
- [ ] Score bars pinned to left/right edges
- [ ] Gold oval trick area outline
- [ ] Pause menu modal (frosted dark overlay)
- [ ] Sound effects wired up
- [ ] Optional: ambient casino loop

### Phase 7 — Final (Days 31–35)
- [ ] Settings screen (sound, speed, difficulty)
- [ ] Score history screen
- [ ] Auto-save & resume
- [ ] Home screen final design (dark + gold logo)
- [ ] App icon + landscape splash screen
- [ ] Test on real Android + iOS devices
- [ ] `eas build`

---

## 14. Testing Strategy

### Unit Tests — run with `bun test`
```
__tests__/game/deck.test.ts
  ✓ Creates 52 unique cards
  ✓ Shuffle changes order
  ✓ Deal gives exactly 13 to each of 4 players

__tests__/game/trick.test.ts
  ✓ Highest trump wins
  ✓ Highest lead-suit card wins when no trump
  ✓ Suit-following is enforced
  ✓ Any card playable when void in lead suit

__tests__/game/scoring.test.ts
  ✓ Positive score when bid met
  ✓ Penalty when bid missed
  ✓ Cumulative scores add correctly

__tests__/game/ai.test.ts
  ✓ AI always plays valid card (1000 random hands)
  ✓ AI bid always 1–13
```

### Manual Checklist
- [ ] Landscape lock holds on rotation attempt
- [ ] 52 cards dealt, 13 per player, no duplicates
- [ ] Human can only play valid cards
- [ ] Trick winner correctly identified in all edge cases
- [ ] Score calculated correctly after 13 tricks
- [ ] Game ends after N rounds
- [ ] Save/resume works correctly
- [ ] All Moti animations play at both speeds
- [ ] No janky frames during card play animation
- [ ] UI looks correct on both Android & iOS in landscape

---

## 15. Quick Start (Bun)

```bash
# Create project
bun create expo-app partner-call-break --template blank-typescript
cd partner-call-break

# Expo native modules (always use bunx expo install for these)
bunx expo install react-native-reanimated
bunx expo install react-native-gesture-handler
bunx expo install expo-router
bunx expo install expo-av
bunx expo install expo-screen-orientation
bunx expo install expo-font
bunx expo install @react-native-async-storage/async-storage
bunx expo install react-native-svg  # required by lucide + gluestack

# NativeWind v4 (required by Gluestack v3)
bun add nativewind
bun add -d tailwindcss
bunx tailwindcss init

# Gluestack UI v3 — copy-paste model via CLI (no package import)
npx gluestack-ui init          # sets up GluestackUIProvider in your project
npx gluestack-ui add button    # copies to components/ui/button/
npx gluestack-ui add modal
npx gluestack-ui add pressable
npx gluestack-ui add switch
npx gluestack-ui add select
npx gluestack-ui add progress

# Moti (animations)
bun add moti

# Icons
bun add lucide-react-native

# State
bun add zustand

# Dev / testing
bun add -d jest @types/jest

# Start dev server
bunx expo start
```

> **Important:** Gluestack v3 uses a **copy-paste model** — `npx gluestack-ui add button` copies the component source into your `components/ui/` folder. You import from there (`@/components/ui/button`), not from an npm package. You own and edit the source directly.

### babel.config.js — required for Reanimated + NativeWind
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'nativewind/babel',
      'react-native-reanimated/plugin', // ← must be LAST
    ],
  };
};
```

### package.json scripts (Bun)
```json
{
  "scripts": {
    "start":   "expo start",
    "android": "expo start --android",
    "ios":     "expo start --ios",
    "test":    "bun test",
    "build":   "eas build"
  }
}
```

---

## Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| Package manager | Bun | Fast installs, fast test runner |
| Animation | Moti | Declarative API over raw Reanimated |
| UI Components | Gluestack UI v3 | Copy-paste model, NativeWind-styled, full ownership |
| Styling | NativeWind v4 | Tailwind classes in React Native, required by Gluestack v3 |
| Icons | lucide-react-native | Tree-shakeable, clean stroke style |
| Orientation | Landscape locked | More table space, better card layout |
| Visual style | Dark felt + gold (Ace of Spades) | Premium feel, easy on eyes |
| Seat naming | Bottom/Top/Left/Right | Matches landscape orientation naturally |
| Game engine | Pure TypeScript | Fully testable with `bun test`, no React |
| State | Zustand | Minimal boilerplate |
| AI pacing | `setTimeout` delays | Feels natural, not instant |
| Persistence | AsyncStorage | No server needed |
| Card assets | SVG | Scalable, themed via SUIT_COLORS |

---

*Game: Partner Call Break | Stack: React Native + Expo + Moti + Bun*
*Style: Ace of Spades dark premium | Orientation: Landscape*
*Last updated: March 2026*