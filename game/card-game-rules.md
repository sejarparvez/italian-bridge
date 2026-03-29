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

### Revealing the Trump

The trump card is **revealed to all players** the first time any player chooses to trump a trick.

| Event | Action |
|-------|--------|
| Player decides to trump | Trump card is **flipped and shown** to all players |
| Trump suit is now public | All players can see the trump suit for the rest of the round |

### Playing a Trump

When a player wants to trump a trick, the following rules apply:

| Condition | Rule |
|-----------|------|
| Player has a trump suit card in hand | They **must** play a trump card — they cannot play another suit |
| Player does **not** have a trump suit card | They may play any other card from their hand |

> ⚠️ **Important:** A player cannot claim to trump and then play a non-trump card if they actually hold a trump card. The act of choosing to trump is a commitment — if they have it, they must play it.

### Trump Card Visibility Summary

| Who | Can See Trump? |
|-----|----------------|
| User (if they created the trump) | ✅ Can peek anytime |
| Bots (if they created the trump) | ✅ Know internally, card stays hidden |
| All players (after first trump played) | ✅ Trump card revealed to everyone |
| Opponents before trump is revealed | ❌ Cannot see the trump card |

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
   └── If user won the bid → user may peek at trump anytime
   └── If bot won the bid  → bot knows trump internally
4. Deal Phase 2
   └── Each player receives remaining 8 cards (full 13-card hand)
5. Play tricks
   ├── If a player chooses to trump:
   │   ├── Reveal trump card to all players (first time only)
   │   ├── Player has trump suit? → Must play a trump card
   │   └── Player has no trump?  → May play any other card
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
| Both teams score exactly their target | Both teams score positively |
| Bidding team scores all 10 points | Opponents are left with only 3 tricks — they always get −4 |
| Bid 10 but only score 9 | No bonus; team gets −10 (failed bid) |
| Score is tied at round end | Handle based on trick-taking tiebreaker rules |
| A team's score goes below 0 | Allowed; they must recover before hitting −30 |
| A team reaches −30 | They lose immediately; no further rounds played |
| Both teams reach ±30 in the same round | +30 team wins; if both hit −30, higher score wins |