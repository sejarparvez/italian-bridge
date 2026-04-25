# Bot AI System — Developer Documentation

## Overview

The bot system controls all three non-human players in the game. It handles two distinct phases: **bidding** (deciding how many tricks to commit to) and **playing** (deciding which card to play on each turn). Both phases share a single design principle — bots reason the same way a skilled human player would, using only information legally available to them.

All bot logic is deterministic. There is no randomness anywhere in the system. This is intentional: teammates on the same team receive the same game state and independently reach the same conclusions, simulating coordination without any explicit communication between bots.

---

## File Structure

```
game/bot/
├── bot-play.ts         Entry point for play decisions. Routes by difficulty.
├── bot-bidding.ts      Bidding logic and trump selection.
└── strategies/
    └── playHard.ts     Hard difficulty play strategy (currently the only active strategy).

game/
└── utils.ts            Shared card utility functions used by all strategies.
```

---

## Part 1 — Bidding System (`bot-bidding.ts`)

### How Bidding Works

Each bot evaluates its 5-card hand (Phase 1 only — the remaining 8 cards have not been dealt yet) and decides whether to bid or pass. The bot that bids highest wins the right to select the trump suit.

The bidding system is structured into **four reasoning layers**, applied in order:

| Layer | Question |
|-------|----------|
| 1 — Hand strength | What cards do I hold? How strong is my hand? |
| 2 — Score context | Where are both teams relative to the win threshold? |
| 3 — Table reading | What have other players' bids revealed about their hands? |
| 4 — Risk calibration | What does winning or losing this bid actually cost my team? |

---

### Layer 1 — Hand Strength (`evaluateHand`)

Evaluates the bot's 5-card hand and produces a `HandStrength` object used by all downstream decisions.

**High Card Points (HCP) scale:**

| Card | Points |
|------|--------|
| Ace  | 4 |
| King | 3 |
| Queen | 2 |
| Jack | 1 |

**Bonuses applied on top of raw HCP:**

- **+1 suit concentration** — longest suit has 3+ cards (signals trump control)
- **+1 solid pair** — holds both Ace and King of the same suit (near-guaranteed 2 tricks)

**Naive bid estimate from adjusted score:**

| Adjusted score | Bid estimate |
|---------------|--------------|
| 0–3 | 7 (weak) |
| 4–5 | 8 (average) |
| 6–8 | 9 (good) |
| 9+  | 10 (dominant) |

**Safety rules applied after the initial estimate:**

- Bid 9+ requires at least one Ace. High HCP from Queens and Jacks alone is not reliable for trick prediction.
- Bid 10 is suppressed if the longest suit has fewer than 3 cards and there are no Queens — even dominant honours need trump depth to win all 10 tricks.
- 2 Aces + 1 King across 2+ suits bumps the estimate directly to 10.

**`isTrumpAgnosticStrong`** — a special flag set when the bot holds enough top cards spread across enough suits that it can win tricks regardless of what trump suit an opponent picks. Required for the forced bid trap (see below).

---

### Layer 2 — Score Context (`analyzeWinPaths`)

Analyses what each team can achieve this round given their current cumulative scores. All comparisons use ratios (`score / winThreshold`) so the logic scales correctly for any game length setting (±30, ±50, ±100, etc.).

Five boolean flags are computed:

| Flag | Meaning |
|------|---------|
| `weWinOnDefense` | Scoring +4 as opponents this round reaches our threshold |
| `weWinByBidding` | Winning the bid and scoring it reaches our threshold |
| `weMustWinBid` | Defense alone won't win us the game, but bidding will |
| `oppWinsOnDefense` | Opponents score +4 and hit their threshold |
| `oppWinsByBidding` | Opponents win the bid and hit their threshold |
| `simultaneousWinRisk` | Both teams can potentially reach their threshold this round |

These flags drive the highest-priority bid decisions — critical game state is resolved before hand evaluation.

---

### Layer 3 — Table Reading (`getTableReadingAdjustment`)

Reads what other players' bidding behaviour signals and returns an integer adjustment (positive = bid higher, negative = bid lower) applied to the naive hand estimate.

| Signal | Adjustment |
|--------|-----------|
| Partner passed | −1 (their hand is weak — lower ambition) |
| Partner bid 8 | −1 (they already committed — don't stack) |
| Partner bid 9+ | −2 (heavily committed — only bid if forced) |
| All others passed | +1 if HCP ≥ 5 (weak field — bid confidently) |
| Current highest bid ≥ 9 | −1 if HCP < 6 (strong opponent — don't contest on a weak hand) |
| Current highest bid = 8 | −1 if HCP < 5 (moderate caution) |

---

### Layer 4 — Priority Decision Tree (`getBotBid`)

The main entry point. Decisions are evaluated in strict priority order — higher priorities override lower ones. This mirrors expert human thinking: resolve the most critical game-state questions first, then fall back to hand evaluation.

```
P1  Forced bid      Dealer must bid if all others passed → bid honestly at minimum
P2  Win by bidding  Our bid gets us to the threshold → just bid (don't wait)
P3  Win by defense  Scoring +4 as opponents wins it → pass freely
P4  Simultaneous    Both teams can win this round → control trump to prevent opponent winning
P5  Forced trap     Opponent is dealing + strong hand → pass to trap (see below)
P6  Partner shield  Weak hand + dealer partner → let them take the forced bid
P7  Desperation     Opponents win on defense regardless → bid 10 or accept loss
P8  Standard        Hand estimate + urgency + table reading = final bid
```

**Urgency levels** applied in P8:

- `desperate` — team is far behind (≤ −65% of threshold) or opponent is close to winning (≥ 70%): bid +1
- `cautious` — our team is close to winning (≥ 70%): bid −1
- `normal` — standard mid-game: no adjustment

**Bid-10 gate** — even when the estimate reaches 10, a strict secondary check runs before committing. Failing bid-10 costs −10, which is catastrophic. The gate requires Ace + King + HCP ≥ 8 + longest suit ≥ 3 cards in normal play. In desperation mode (opponents win on defense regardless), the bar drops to Ace + HCP ≥ 6 — bid 10 is the only option that can stop them.

---

### Special Strategy — Forced Bid Trap

When an opponent is the dealer and all players pass, the dealer is forced to bid at minimum (bid 7). The bot can deliberately pass to engineer this situation, then try to win 7 tricks as the opposing team and inflict a −7 penalty on the dealer.

All five conditions must hold simultaneously:

1. An opponent is dealing this round
2. We cannot win the game by bidding ourselves (no free win available)
3. Hand is `isTrumpAgnosticStrong` — we don't pick trump when we pass, so our hand must win regardless of whatever suit they choose
4. The −7 penalty would be meaningful — it must drop opponents below 30% progress
5. Sufficient power cards — at least 2 Aces, or 1 Ace + 2 Kings, to project 7-trick capacity

Both bots on the defending team reach this conclusion independently (the function is deterministic) — this is how silent coordination is achieved.

---

### Trump Selection (`selectBotTrump`)

Called after Phase 2 dealing — all 13 cards are now known. Voids in side suits are now meaningful ruffing opportunities (unlike in Phase 1 where they just meant undealt cards).

Each suit is scored:

```
score = (suit length × lengthWeight) + (suit HCP × 3) + voidCount
```

Where `lengthWeight` is 3 for bid 9–10, 2 for bid 8, 2 for bid 7.

**Safety minimum** — at bid 9–10, any suit with fewer than 4 cards is eliminated entirely (score = −∞). Running out of trump at a high bid is almost always fatal.

If the safety minimum eliminates all suits (extremely rare), the bot falls back to simply selecting the longest suit.

---

## Part 2 — Play System (`playHard.ts`)

### Entry Point (`getBotPlay` in `bot-play.ts`)

`getBotPlay` is called from the store's `advanceAI` action. It:

1. Computes the legal playable cards via `getPlayableCards`
2. Routes to the appropriate strategy based on difficulty (currently `playHard` for all difficulties)
3. Wraps the returned card in a `BotPlayResult` with a `wantsToTrump` flag

**`wantsToTrump`** is computed separately by `botWantsToTrump`: it returns `true` only when trump is still hidden, there is a led suit, the chosen card does not follow suit, and the chosen card's suit matches the trump. This mirrors exactly what the human player signals via the "Reveal & Trump" dialog.

---

### Context Building (`buildContext`)

Before any card decision is made, `playHard` calls `buildContext` to compute a `PlayContext` object. This runs once per bot turn and gathers everything needed for smart play.

**Card memory** — derived from `completedTricks` (which stores full `Trick` objects) plus the current trick's already-played cards. No changes to `GameState` are needed — this is computed on the fly.

| Derived value | How |
|---------------|-----|
| `playedCardIds` | All card IDs seen in completed tricks + current trick |
| `unplayedCardIds` | Full 52-card set minus `playedCardIds` |
| `trumpsRemaining` | Count of unplayed cards in the trump suit |
| `iHoldHighestTrump` | Whether our hand contains the highest unplayed trump |

**Score context** — also computed fresh each turn:

| Value | Meaning |
|-------|---------|
| `myTeamTricks` | Tricks won by our team this round so far |
| `tricksRemaining` | 10 − tricks already completed |
| `tricksNeeded` | Target (bid or 4) minus tricks already won — how many more we need |
| `mustWin` | `tricksNeeded >= tricksRemaining` — we cannot afford to lose another trick |
| `safelyAhead` | We have already hit our target — can afford to duck |

---

### Decision Flow

```
playHard()
│
├── Position 1 (leading) → getSmartLead()
│
├── Can follow led suit → playFollowingSuit()
│   ├── Position 2 → duck by default; take only if mustWin + have winner
│   ├── Position 3/4, partner winning → play lowest (don't waste a high card)
│   ├── Position 3/4, can win → play cheapest winner
│   └── Position 3/4, cannot win → play lowest (discard)
│
└── Cannot follow suit (void) → playVoid()
    ├── Partner winning → discard cheapest non-trump
    ├── Have winning trumps, position 4 → play lowest winner (safe, no one follows)
    ├── Have winning trumps, position 3, hold highest trump OR mustWin → play lowest winner
    ├── Have winning trumps, position 3, otherwise → save trump; discard non-trump instead
    ├── Have trumps but none can win → discard cheapest
    └── No trumps → discard cheapest
```

---

### Smart Lead (`getSmartLead`)

Leading is the most strategically complex decision because there are no constraints — any card is legal. The bot evaluates in this order:

**1. Desperate trump draw** — if `mustWin`, we are the bidding team, we hold 3+ trumps, and we hold the highest remaining trump: lead the highest trump. This forces opponents to spend their trumps.

**2. Singleton dump** — if any non-trump suit has exactly 1 card, lead it. Going void in a suit deliberately creates a ruffing entry later in the round.

**3. Bidding team standard lead** — lead the highest card from the longest non-trump suit. Establishes winners in our strongest suit. If only trump cards remain, lead the lowest trump to preserve high ones.

**4. Defending team lead** — lead the lowest card from the longest non-trump suit. Safe, non-committal. Avoids handing tricks to opponents on a weak lead.

---

### Key Utility Functions (`utils.ts`)

| Function | Purpose |
|----------|---------|
| `getTrickPosition` | Returns 1–4 based on how many cards are already in the trick |
| `isMyPartnerWinning` | True if the current trick winner is on our team |
| `canCardWinTrick` | Simulates playing a card and checks if it would win |
| `getCheapestDiscard` | Lowest non-trump card, or lowest trump if no non-trump available |
| `getLongestSuitCards` | Cards from the longest non-trump suit in hand |
| `getShortestSuitCards` | Cards from the shortest non-trump suit — for singleton leads |
| `countTrumpsRemaining` | How many trumps are still unplayed in the entire game |
| `holdingHighestRemainingTrump` | True if our hand contains the highest unplayed trump card |

---

## Design Decisions & Rationale

**Why derive played cards from `completedTricks` instead of adding a field to `GameState`?**
`completedTricks` already stores full `Trick` objects with all 4 cards. Deriving played cards on the fly costs one pass over `completedTricks` per bot turn — negligible at 10 tricks — and avoids duplicating state that could fall out of sync.

**Why is position-2 logic conservative by default?**
Second-to-play is the worst position in trick games. You don't know what your partner or the last opponent will play. Playing high in position 2 often wastes a winner that your partner would have taken anyway, or gets overtrumped by the player in position 4. The exception (`mustWin`) only fires when the team genuinely cannot afford to lose another trick.

**Why does position-3 trump logic check `iHoldHighestTrump`?**
In position 3, the opponent in position 4 plays after you. If you trump the trick but an opponent holds a higher trump, they simply overtrump and take it back. Checking whether you hold the highest remaining trump tells you whether trumping is safe before committing.

**Why is `wantsToTrump` computed in `bot-play.ts` rather than inside `playHard`?**
The trump reveal is a game-engine concern, not a strategy concern. `playHard` simply picks the best card — it doesn't need to know whether that card will trigger a reveal. Separating the two keeps strategy logic clean and makes `botWantsToTrump` independently testable.

**Why no randomness anywhere?**
Determinism enables silent team coordination. Both bots on the same team always reach the same conclusion from the same game state. Adding randomness would break this — two teammates might independently make contradictory decisions.

---

## Extending the System

**Adding a new difficulty level:**
1. Create `strategies/playEasy.ts` or `strategies/playMedium.ts` exporting a function with the same signature as `playHard`
2. Add a case in the `switch` in `bot-play.ts`
3. The store already passes `difficulty` through — no store changes needed

**Adding new context to `PlayContext`:**
Add fields to the `PlayContext` interface and populate them in `buildContext`. All downstream functions receive `ctx` so they pick up new fields automatically.

**Improving lead logic:**
`getSmartLead` is self-contained. Add new conditions before the existing ones to give them higher priority, or after to use them as a fallback.