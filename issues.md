# Italian Bridge Card Game Issues

1. **Trump Card Hand Visuals:** After the trump suit is revealed, the Trump card in the user's hand has a low opacity and a subtle gold color that should be removed [1].
3. **Select Trump Screen Text:** The text on the "Select Trump" screen is too muted and needs improvement [1].
4. **Gameplay Animation:** Gameplay on the board is currently too static; it needs to look like cards are being played from the hand [1].
5. **Scoring Logic Fix:** Scoring is currently only showing on one teammate's avatar; when the other partner wins a trick, the score is added to the main scoreboard but not to that partner's avatar [2].
6. **Trump Revealing Dialogue Trigger:** When a user cannot follow suit and the Trump is not yet revealed, the "Trump revealing" dialogue should appear instantly at the start of their turn instead of waiting for a card click [2].
7. **Enforce Trump Play Rules:** After a Trump card is revealed, a user with a Trump card must play it, whereas they currently can play any card [2].
8. **Round Completion Dialogue UI and Data:** The "Round Completion" dialogue needs more space at the top and bottom, and it should display the score of the latest completed round rather than the total score [3].
9. **Next Round Transition Animation:** When clicking "Next Round," a dealing animation should play before the bidding screen opens, rather than the screen opening instantly [3].
10. **Game Completion Freeze:** The game currently freezes upon completion and should instead display a "Game Over" dialogue [3].