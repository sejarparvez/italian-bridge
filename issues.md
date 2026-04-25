# Issue: Incorrect Trump Reveal Popup After Winning a Trick

## Description
A logic error causes the **trump reveal popup** to appear incorrectly at the start of a new trick. This occurs specifically when a player wins the previous trick and had only one card remaining of the suit that was led.

## Steps to Reproduce
1. **Setup:** A player has only one card of a specific suit (e.g., the Ace of Spades).
2. **Action:** The current trick is led with that same suit (Spades).
3. **Action:** The player wins the trick with their single card (the Ace).
4. **Trigger:** The player prepares to lead the next trick.

## Expected Behavior
The game should proceed directly to the player's turn to lead the next trick without any interruptions.

## Actual Behavior
The **trump reveal popup** is displayed at the start of the next trick, even though it is not relevant to the current game state.

## Technical Notes
* **Context:** The issue seems tied to the transition between winning a trick with a "singleton" (the only card of a suit) and leading the subsequent trick.
* **Impact:** Disrupts gameplay flow and may confuse players regarding the trump status.