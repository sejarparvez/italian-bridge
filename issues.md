# Issue: Card Treated as Trump When Player Opts to "Skip" While Trump is Hidden

## Description
A logic error exists regarding the **"Skip" (Stay Hidden)** mechanic. When a player cannot follow the led suit and chooses to "Skip" (rather than "Reveal & Trump"), playing a card that happens to be of the hidden trump suit is incorrectly being treated as a trump. 

According to the official game rules, such a card must be treated as an ordinary discard to maintain the hidden state of the trump.

## Rule Documentation Reference
This behavior contradicts the logic defined in the [GAME_RULES.md](https://github.com/sejarparvez/italian-bridge/blob/main/docs/GAME_RULES.md ):

> **Option B — Skip (Stay Hidden):** "Crucially — if the player happens to hold trump suit cards, playing one of them does **not** count as trumping and does **not** reveal the trump... A diamond played when diamonds are the hidden trump is treated as an ordinary discard."

## Steps to Reproduce
1. **Context:** The trump suit is currently **hidden** (not yet revealed).
2. **Action:** A player is unable to follow the suit led in the current trick.
3. **Selection:** When prompted with the choice dialog, the player selects **"Skip"**.
4. **Action:** The player plays a card from their hand that matches the hidden trump suit.

## Expected Behavior
The played card should be treated as a standard discard. It should **not** win the trick as a trump, and the identity of the trump suit must remain hidden from all players.

## Actual Behavior
The game incorrectly identifies the card as a trump, allowing it to win the trick or influence the game state as if the trump had been revealed.

## Impact Analysis
* **Severity:** High
* **Category:** Core Game Logic
* **Details:** This bug breaks the fundamental strategic element of "Hidden Trumps," as it allows a player to benefit from a trump card without paying the price of revealing the suit to the table.

## Technical Recommendation
Ensure that the trick evaluation logic checks the `trump_revealed` state and the player's "Skip" intent before applying the trump multiplier or win condition to a played card.
