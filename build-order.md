# Partner Call Break — Build Order

## How to read this

Each phase must be **fully working** before moving to the next. The rule: if you can't play a complete (ugly) game by end of Phase 5, don't touch animations or polish.

---

## Phase 1 — Project Setup
**Goal:** Empty app that runs in landscape with your design tokens loaded.

- [ ] `bun create expo-app partner-call-break --template blank-typescript`
- [ ] Install all deps (`bunx expo install`, `bun add` — see Quick Start in plan)
- [ ] Configure Expo Router in `_layout.tsx`
- [ ] Lock to landscape with `expo-screen-orientation`
- [ ] Set up NativeWind v4 (`tailwind.config.js`, babel plugin, `global.css`)
- [ ] Run `npx gluestack-ui init` and add: button, modal, pressable, switch, select, progress
- [ ] Extend `tailwind.config.js` with `felt`, `gold`, `card` color tokens
- [ ] Load Cinzel + Crimson Text fonts via `expo-font`

**Done when:** App opens in landscape, shows a dark green background and gold-colored text. Nothing else.

---

## Phase 2 — Static Card + Table (No Logic)
**Goal:** See what the game will look like. No state, no interaction.

- [ ] `Card.tsx` — render a single card face-up (suit symbol, rank, SUIT_COLORS)
- [ ] `CardBack.tsx` — navy card back with gold SVG pattern
- [ ] `GameTable.tsx` — dark felt background with gold oval center area
- [ ] Hard-code a fake hand of 13 cards at the bottom of the screen
- [ ] Hard-code 3 face-down bot hands (top, left, right positions)
- [ ] Hard-code 4 cards in the center trick area (one per seat)
- [ ] `ScoreBar.tsx` — static team score display pinned to left/right edges
- [ ] `TrumpBadge.tsx` — static gold pill badge showing a suit

**Done when:** The game *looks* like a card table with cards in all the right places. Screenshot it — this is your visual reference for everything that follows.

---

## Phase 3 — Game Engine (Pure TypeScript)
**Goal:** All game logic written and fully tested. Zero React involved.

- [ ] `deck.ts` — create 52 cards, shuffle (Fisher-Yates), deal 13 × 4
- [ ] `trick.ts` — `getTrickWinner()`, `getPlayableCards()`
- [ ] `bidding.ts` — bid order, trump assignment to highest bidder
- [ ] `scoring.ts` — round score (met bid = +points, missed = -penalty), cumulative team scores
- [ ] `engine.ts` — full game loop orchestrating the above

### Tests (run with `bun test`)
- [ ] Creates exactly 52 unique cards
- [ ] Shuffle changes order
- [ ] Deal gives exactly 13 cards to each of 4 players, no duplicates
- [ ] Highest trump wins trick
- [ ] Highest lead-suit card wins when no trump played
- [ ] Suit-following is enforced by `getPlayableCards`
- [ ] Any card playable when void in lead suit
- [ ] Positive score when bid met
- [ ] Penalty when bid missed
- [ ] Cumulative scores add correctly

**Done when:** All tests pass. Do not proceed until they do.

---

## Phase 4 — AI Bots
**Goal:** All three bot seats can bid and play cards without breaking the rules.

- [ ] `bidAI.ts` — estimate tricks from hand (high cards + voids), apply difficulty offset
- [ ] `playAI.ts` — Easy: random valid card
- [ ] `playAI.ts` — Medium: win trick if beneficial, save high cards when partner leads
- [ ] `playAI.ts` — Hard: card memory (`playedCards` set), infer voids, optimal trump use

### Tests
- [ ] AI always plays a valid card (1000 random hands, zero violations)
- [ ] AI bid always between 1 and 13

**Done when:** Fuzz test passes for all three difficulty levels.

---

## Phase 5 — Zustand Store + First Playable Game
**Goal:** A complete, playable game from start to finish. Ugly is fine.

- [ ] `gameStore.ts` — connect engine to Zustand, expose `playCard`, `advanceAI`
- [ ] `settingsStore.ts` — sound toggle, difficulty, animation speed
- [ ] Bot turn scheduling with `setTimeout` delays (~900ms per bot)
- [ ] **Bidding screen** (`/bid`) — number picker for human, bots auto-bid with delay
- [ ] **Game screen** (`/game`) — tap a card to play it, bots respond, trick clears after 1.2s
- [ ] **Result screen** (`/result`) — show round scores, Next Round button
- [ ] Wire up the full flow: Home → Bidding → Game → Result → repeat

**Done when:** You can play a complete game of Partner Call Break end-to-end. No animations yet. No sound. Just working.

---

## Phase 6 — Moti Animations
**Goal:** Every game action has a matching animation.

Work through these in order — each one builds on the previous:

- [ ] Turn indicator — pulsing gold ring on active seat (easiest, confirms Moti is wired up)
- [ ] Trump badge — spring drop-in from above
- [ ] Card deal — staggered fly-in from center to each seat (350ms, 75ms delay per card)
- [ ] Card flip — face-down to face-up reveal on deal (rotateY, backfaceVisibility)
- [ ] Human plays a card — lift on tap (translateY -18), fly to center slot on confirm
- [ ] Bot plays a card — slide from seat to center trick slot
- [ ] Trick win — winner slot glows gold, all 4 cards shrink and collect to winner's corner
- [ ] Score count-up on result screen (`AnimatedNumber`)
- [ ] Wire animation speed setting: `dur = ms * animSpeed` everywhere

**Done when:** All 8 animation types play correctly at both normal and fast speed.

---

## Phase 7 — Visual Polish
**Goal:** The game looks premium.

- [ ] Felt table — dark green radial gradient, subtle texture overlay
- [ ] Gold card back — repeating diamond SVG pattern on navy
- [ ] Suit symbols — styled with SUIT_COLORS (gold for spades/clubs, red for hearts/diamonds)
- [ ] Bot name + avatar labels at each seat (Alex 🤝, Sam 😤, Jordan 🧠)
- [ ] Score bars pinned to left/right screen edges with bid progress bar
- [ ] Gold oval outline around the center trick area
- [ ] Pause menu modal — frosted dark overlay with resume/quit options
- [ ] Refine all button styles: dark bg, gold border, gold text, pressed state

**Done when:** Screenshot looks like a premium casino card game.

---

## Phase 8 — Audio
**Goal:** Every game action has a matching sound.

- [ ] Wire up `useSound.ts` hook with `expo-av`
- [ ] `deal.mp3` → card dealt
- [ ] `card_play.mp3` → any card played
- [ ] `trick_win.mp3` → trick resolved
- [ ] `trump_reveal.mp3` → trump badge appears
- [ ] `round_win.mp3` / `round_lose.mp3` → round ends
- [ ] `game_win.mp3` → final game result
- [ ] `button.mp3` → UI taps
- [ ] Optional: `ambient_loop.mp3` → quiet casino background loop
- [ ] Sound on/off toggle in settings wired up

---

## Phase 9 — Persistence + Remaining Screens
**Goal:** Game state survives app restarts. All screens complete.

- [ ] Auto-save game state to AsyncStorage on every `playing` / `bidding` phase change
- [ ] Resume button on home screen when a saved game is found
- [ ] **Scores screen** (`/scores`) — history list of past games
- [ ] **Settings screen** (`/settings`) — sound, animation speed, difficulty, reset
- [ ] **Home screen** — final dark + gold design, logo, New Game / Resume / Scores / Settings

---

## Phase 10 — Ship
**Goal:** Ready for real devices and app stores.

- [ ] Test on real Android device (landscape lock, touch targets, performance)
- [ ] Test on real iOS device (same)
- [ ] App icon (dark felt + gold spade motif)
- [ ] Landscape splash screen
- [ ] `eas build` — Android APK / iOS archive
- [ ] Final manual checklist from plan (52 cards, no dupes, valid moves only, save/resume, etc.)

---

## Summary Table

| Phase | What you build | Done when |
|---|---|---|
| 1 | Project setup | App opens in landscape, dark green bg |
| 2 | Static card + table | Game *looks* right, all elements visible |
| 3 | Game engine (pure TS) | All `bun test` unit tests pass |
| 4 | AI bots | Fuzz test passes (1000 hands, zero invalid moves) |
| 5 | Store + playable game | Full game playable end-to-end (ugly) |
| 6 | Moti animations | All 8 animation types working at both speeds |
| 7 | Visual polish | Screenshots look premium |
| 8 | Audio | All SFX wired, toggle works |
| 9 | Persistence + screens | Save/resume works, all screens complete |
| 10 | Ship | Builds pass on real Android + iOS |

---

> **The golden rule:** Never start Phase N+1 until Phase N is fully working.
> Animations on broken game logic = double the debugging.