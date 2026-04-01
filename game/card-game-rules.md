# Card Game Rules & Logic

## Overview
A 4-player partnership card game with bidding and trump mechanics.  
**Players:** 1 Human + 3 Bots → 2 Teams of 2  
**Partners:** Human + Bot 2 vs Bot 1 + Bot 3 (opposite seats)

---

## Teams

| Team | Players |
|------|---------|
| Team A | Human (Player 1) + Bot 2 (Player 3) |
| Team B | Bot 1 (Player 2) + Bot 3 (Player 4) |

> Players sit in alternating positions so partners face each other.

---

## Card Dealing

The round is dealt in **two phases**:

### Phase 1 — Before Bidding
- Each player receives **5 cards** face-down.
- Players may only look at these 5 cards when deciding their bid.
- The remaining 8 cards sit undealt until bidding is complete.

### Phase 2 — After Bidding
- Once the bid winner selects a trump suit, all players receive their remaining **8 cards**.
- Players now hold a full hand of **13 cards** for the playing phase.

| Phase | When | Cards Dealt | Total in Hand |
|-------|------|-------------|---------------|
| Phase 1 | Game start | 5 | 5 |
| Phase 2 | After trump selected | 8 | 13 |

> ⚠️ **Important:** Players must commit to their bid based on only 5 cards. The remaining 8 cards are unknown during bidding — this is intentional and adds strategic risk to higher bids.

---

## Bidding Phase

- Bidding starts at **7** and goes up to a maximum of **10**.
- Players bid in turns; each bid must be higher than the previous.
- A player may **pass** if they don't want to bid higher.
- The player who bids the highest **wins the bid**.
- The **winning bidder** selects the **trump suit** for the round.

### Bid Values

| Bid | Meaning |
|-----|---------|
| 7 | Minimum bid — team commits to scoring at least 7 points |
| 8 | Team commits to scoring at least 8 points |
| 9 | Team commits to scoring at least 9 points |
| 10 | Maximum bid — team commits to scoring all 10 points ⭐ Bonus applies |

---

## Trump Card Rules

### Selecting the Trump
- The player who **wins the bid** selects a trump suit.
- The trump is represented by a **face-down hidden card** — its suit is the trump suit for the round.
- The trump card is **not visible** to any player at the start of the round.

### Peeking at the Trump
- If the **user (human player)** wins the bid and creates the trump, they may **peek** at the hidden trump card at any time during the round.
- **Bots** that win the bid know the trump suit internally (they selected it), but the card remains hidden on the table.
- Opponents **cannot** peek at the trump card.

---

### Trumping a Trick — Full Rules

Trumping is a **deliberate decision**, not an obligation. A player who cannot follow the led suit is **allowed** to trump, but is never **required** to.

#### The Core Mechanic: Trump Reveal State

The trump suit starts **hidden** every round. This hidden state fundamentally controls how the game handles a player who cannot follow the led suit. Everything branches on one question: **has the trump suit already been revealed this round?**

---

#### When Trump Is Still Hidden

If a player cannot follow the led suit and the trump suit has **not yet been revealed**, the game presents a deliberate choice:

**Option A — Reveal & Trump:** The player declares intent to trump. This immediately reveals the trump suit to all players. The player must then play a trump card if they hold one. If they hold no trump cards, they may play any card from their hand — the reveal still fires because the *intent* triggered it, not the card played.

**Option B — Skip (Stay Hidden):** The player chooses not to trump. They play any card from their hand. The trump suit remains hidden. Crucially — if the player happens to hold trump suit cards, playing one of them does **not** count as trumping and does **not** reveal the trump, because the trump suit is still unknown to everyone. A diamond played when diamonds are the hidden trump is treated as an ordinary discard.

> **Example:** Bot 2 wins the bid and sets diamonds as trump. Nobody knows this yet. A club trick is led. The human has no clubs and chooses **Skip**. They play a diamond from their hand. Since trump is still hidden, that diamond is treated as an ordinary discard — it does **not** win the trick as a trump, and the trump suit remains hidden.

---

#### When Trump Has Already Been Revealed

Once any player has previously declared intent to trump (Option A), the trump suit is known to everyone for the rest of the round. From this point on:

**No dialog is shown.** Players who cannot follow the led suit simply play any card they like from their hand. They may play a trump card to try to win the trick, or discard from another suit — it is entirely their free choice. The game does not ask them to confirm anything, because the "Reveal or Skip" decision no longer exists.

> **Example:** Trump (diamonds) was revealed two tricks ago. A club trick is led. The human has no clubs but holds diamonds. The game shows no dialog — the human simply picks whichever card they want to play. If they play a diamond, it counts as a trump and wins unless a higher trump is played.

---

#### Decision Tree

```
Player cannot follow the led suit
│
├── Trump is HIDDEN?
│   ├── YES → Show choice dialog
│   │         ├── "Reveal & Trump" → Reveal trump suit to all players (one time only)
│   │         │                      → Player holds a trump card? Must play trump
│   │         │                      → Player holds no trump card? Play any card (reveal still fires)
│   │         └── "Skip"           → Player plays any card from hand
│   │                                Trump stays hidden
│   │                                (Playing trump suit cards here is just a discard — no reveal)
│   │
│   └── NO (Trump already revealed) → No dialog shown
│                                      Player freely plays any card from hand
```

---

#### Reveal Rules Summary

| Event | Trump Revealed? |
|-------|----------------|
| Player chooses "Reveal & Trump" and plays a trump card | ✅ Yes (first time only) |
| Player chooses "Reveal & Trump" but holds no trump — plays any card | ✅ Yes (first time only) — intent triggers the reveal |
| Player chooses "Skip" — plays any card including accidental trump suit | ❌ No — trump stays hidden |
| Player follows the led suit normally | ❌ No |
| Human peeks at their own trump card (private action) | ❌ No — peek is private |
| Trump already revealed in a prior trick — player plays freely | ✅ Already revealed, no change |

---

#### Playing a Trump Once Revealed

Once the player commits to "Reveal & Trump":

| Condition | Rule |
|-----------|------|
| Player holds a trump suit card | **Must** play a trump card — cannot switch to another suit |
| Player holds **no** trump suit card | May play any card from their hand |

---

### Trump Card Visibility Summary

| Who | Can See Trump? |
|-----|----------------|
| User (if they created the trump) | ✅ Can peek anytime — privately |
| Bots (if they created the trump) | ✅ Know internally; card stays hidden |
| All players (after first "Reveal & Trump" is declared) | ✅ Revealed to everyone |
| Opponents before any reveal | ❌ Cannot see the trump card |

---

## Scoring System

### Total Points Per Round
There are **10 points** available each round (one per trick or as defined by card values).

### Targets

| Team | Target |
|------|--------|
| Bidding Team | Must score ≥ their bid amount |
| Opposing Team | Must score ≥ 4 points |

---

### Bidding Team Scoring

| Outcome | Score Change |
|---------|-------------|
| Score ≥ bid amount (bid 7–9) | **+ bid amount** |
| Bid 10 and scores all 10 points | **+13** (10 + 3 bonus) |
| Score < bid amount | **− bid amount** |

> ⭐ **Bid 10 Bonus:** If a team bids 10 and successfully scores all 10 points, they receive a **+3 bonus**, making the total reward **+13** instead of +10.

**Examples:**
- Team A bids **8** and scores 9 → Team A: **+8**
- Team A bids **8** and scores 6 → Team A: **−8**
- Team A bids **10** and scores 10 → Team A: **+13** ⭐
- Team A bids **10** and scores 9 → Team A: **−10**

---

### Opposing Team Scoring

| Outcome | Score Change |
|---------|-------------|
| Score ≥ 4 | **+4** |
| Score < 4 | **−4** |

**Examples:**
- Team B (opponents) scores 4 or more → Team B: **+4**
- Team B (opponents) scores 3 or fewer → Team B: **−4**

---

## Round Scoring — Full Outcome Table

| Bidding Team Result | Opponent Result | Bidding Team Score | Opponent Score |
|--------------------|-----------------|--------------------|----------------|
| ✅ Met bid (7–9) | ✅ Scored 4+ | +bid | +4 |
| ✅ Met bid (7–9) | ❌ Scored < 4 | +bid | −4 |
| ✅ Bid 10, scored 10 | ❌ Opponents can only score 3 (impossible to reach 4) | **+13** ⭐ | **−4** |
| ❌ Failed bid | ✅ Scored 4+ | −bid | +4 |
| ❌ Failed bid | ❌ Scored < 4 | −bid | −4 |

> ⚠️ **13-Trick Rule:** The game has 13 tricks total. If the bidding team wins all 10 points, the opponents are left with only 3 — making it **impossible** for them to reach their target of 4. So a successful bid of 10 **always** results in −4 for the opponents.

> **Note:** Both teams' scores are evaluated independently each round.

---

## Game End Condition

The game ends immediately when **any** of the following conditions are met:

| Condition | Result |
|-----------|--------|
| A team's cumulative score reaches **+30** | That team **wins** |
| A team's cumulative score drops to **−30** | That team **loses** |

- The first team to reach **+30** wins the game.
- If a team's score falls to **−30**, they are **eliminated** and the opposing team wins immediately.
- Scores can go negative; a team must recover before hitting −30.

---

## Logic Flow (Per Round)

```
1. Deal Phase 1
   └── Each player receives 5 cards (hand is partially visible)

2. Bidding Phase
   └── Players bid from 7 to 10, or pass (seeing 5 cards only)
   └── Highest bidder wins → selects trump suit

3. Trump Card Setup
   └── Trump card placed face-down (hidden)
   └── If user won the bid → user may peek at trump anytime (privately, no reveal)
   └── If bot won the bid  → bot knows trump internally

4. Deal Phase 2
   └── Each player receives remaining 8 cards (full 13-card hand)

5. Play tricks
   ├── On each trick, if a player cannot follow the led suit:
   │   ├── Trump is HIDDEN?
   │   │   ├── YES → Show "Reveal & Trump" or "Skip" dialog (human)
   │   │   │         Bots decide internally using same logic
   │   │   │   ├── "Reveal & Trump" → Reveal trump suit to all (one time only)
   │   │   │   │                      → Player has a trump card? Must play it
   │   │   │   │                      → Player has no trump card? Play any card (reveal still fires)
   │   │   │   └── "Skip"           → Player plays any card; trump stays hidden
   │   │   │                          (trump suit cards played here are just discards)
   │   │   └── NO (already revealed) → No dialog; player freely plays any card
   └── Count points won by each team

6. Evaluate Scores
   ├── Bidding Team:
   │   ├── bid == 10 and score == 10? → +13 (bonus round)
   │   └── score >= bid?             → +bid : -bid
   └── Opposing Team: score >= 4?    → +4   : -4

7. Update cumulative totals

8. Check end conditions
   ├── Any team total >= +30 → That team WINS
   ├── Any team total <= -30 → That team LOSES (opponent wins)
   └── Otherwise → Next Round
```

---

## Edge Cases & Clarifications

| Scenario | Rule |
|----------|------|
| Player cannot follow suit but partner is already winning the trick | Player may choose "Skip" and discard instead — trump is not revealed |
| Player cannot follow suit, chooses "Reveal & Trump", but holds no trump cards | May play any card; trump suit **is revealed** — intent to trump triggers the reveal |
| Player cannot follow suit, chooses "Skip", and plays a trump-suit card | That card is treated as an ordinary discard — trump suit is **not** revealed, trick is **not** won by trump |
| Trump already revealed — player cannot follow suit | No dialog shown; player freely plays any card they like |
| Player peeks at the trump card (human only) | Private action — trump suit is not revealed to other players |
| Both teams score exactly their target | Both teams score positively |
| Bidding team scores all 10 points | Opponents are left with only 3 tricks — they always get −4 |
| Bid 10 but only score 9 | No bonus; team gets −10 (failed bid) |
| Score is tied at round end | Handle based on trick-taking tiebreaker rules |
| A team's score goes below 0 | Allowed; they must recover before hitting −30 |
| A team reaches −30 | They lose immediately; no further rounds played |
| Both teams reach ±30 in the same round | +30 team wins; if both hit −30, higher score wins |