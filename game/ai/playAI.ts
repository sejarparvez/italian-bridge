import { Card, Suit } from '../../constants/cards';
import { getPlayableCards, getTrickWinner, Trick } from '../trick';
import { Difficulty, GameState, SeatPosition } from '../types';

export function getBotPlay(
  hand: Card[],
  trick: Trick,
  trump: Suit | null,
  trumpRevealed: boolean,  // FIX: was missing; getPlayableCards now requires this
  gameState: GameState,
  difficulty: Difficulty,
  seat: SeatPosition
): Card | null {
  // FIX: pass trumpRevealed so the bot only sees and plays by the same rules as humans
  const playable = getPlayableCards(hand, trick, trump, trumpRevealed);
  if (playable.length === 0) return null;

  switch (difficulty) {
    case 'easy':
      return playEasy(playable);
    case 'medium':
      return playMedium(playable, trick, trump, trumpRevealed, gameState, seat);
    case 'hard':
      return playHard(playable, trick, trump, trumpRevealed, gameState, seat);
    default:
      return playEasy(playable);
  }
}

function playEasy(playable: Card[]): Card {
  return playable[Math.floor(Math.random() * playable.length)];
}

function playMedium(
  playable: Card[],
  trick: Trick,
  trump: Suit | null,
  trumpRevealed: boolean,
  gameState: GameState,
  seat: SeatPosition
): Card {
  if (!gameState.highestBidder) return playEasy(playable);

  const myTeam = gameState.players[seat].team;
  const bidderTeam = gameState.players[gameState.highestBidder].team;
  const isBidderOnMyTeam = myTeam === bidderTeam;

  // FIX: use the passed `seat` param, not gameState.currentSeat, which can
  // drift during trick resolution and is the wrong reference point here.
  const partnerWinning = isMyPartnerWinning(trick, gameState, seat);

  // If partner is already winning, or we're defending — play low to preserve
  if (partnerWinning || !isBidderOnMyTeam) {
    return getLowestCard(playable);
  }

  // FIX: was `trick.cards.length < 3` which excluded playing trump as the
  // last player (length === 3) — exactly the most decisive moment.
  // Now we try to play trump whenever we're void and trump is available.
  if (trump !== null && trumpRevealed) {
    const trumpsInHand = playable.filter(c => c.suit === trump);
    if (trumpsInHand.length > 0) {
      // Prefer a high trump; fall back to lowest trump to preserve high ones
      const highTrumps = trumpsInHand.filter(c => c.value >= 12);
      if (highTrumps.length > 0) return getLowestCard(highTrumps);
      return getLowestCard(trumpsInHand);
    }
  }

  // Follow suit with highest card to try to win
  const leadSuit = trick.leadSuit;
  if (leadSuit) {
    const leadSuitCards = playable.filter(c => c.suit === leadSuit);
    if (leadSuitCards.length > 0) {
      return getHighestCard(leadSuitCards);
    }
  }

  // Leading the trick — play highest card
  return getHighestCard(playable);
}

function playHard(
  playable: Card[],
  trick: Trick,
  trump: Suit | null,
  trumpRevealed: boolean,
  gameState: GameState,
  seat: SeatPosition
): Card {
  // FIX: hard mode was identical to medium — it called playMedium and then
  // returned that result unconditionally in both branches of a dead check.
  // Hard mode now: evaluate every playable card and pick the one that wins
  // the trick if possible, otherwise fall back to medium logic.

  const myTeam = gameState.players[seat].team;

  // Find the best card that wins the current trick
  const winningCards = playable.filter(card =>
    canCardWinTrick(card, trick, trump, seat)
  );

  if (winningCards.length > 0) {
    // Win with the lowest winning card (preserve high cards for later tricks)
    return getLowestCard(winningCards);
  }

  // Can't win this trick — duck as cheaply as possible
  // Exception: if partner is winning, we still want to throw off low.
  const partnerWinning = isMyPartnerWinning(trick, gameState, seat);
  if (partnerWinning || gameState.players[seat].team !==
      gameState.players[gameState.highestBidder ?? seat].team) {
    return getLowestCard(playable);
  }

  // We can't win and partner isn't winning — fall back to medium for trump play
  return playMedium(playable, trick, trump, trumpRevealed, gameState, seat);
}

// FIX: isMyPartnerWinning now takes explicit `seat` instead of using
// gameState.currentSeat, which is unreliable during trick resolution.
function isMyPartnerWinning(trick: Trick, gameState: GameState, seat: SeatPosition): boolean {
  if (trick.cards.length === 0) return false;
  const currentWinner = getTrickWinner(trick, gameState.trumpSuit);
  const myTeam = gameState.players[seat].team;
  return gameState.players[currentWinner].team === myTeam;
}

function getLowestCard(cards: Card[]): Card {
  return cards.reduce((lowest, card) =>
    card.value < lowest.value ? card : lowest
  );
}

// FIX: was defined but never used. Now used in playMedium (follow suit highest)
// and playHard (pick lowest winning card from winning candidates).
function getHighestCard(cards: Card[]): Card {
  return cards.reduce((highest, card) =>
    card.value > highest.value ? card : highest
  );
}

// FIX: the old canWinWithCard was broken in three ways:
// 1. It looped over allPlayable cards testing each one — it tested any card,
//    not the specific card passed in, so it returned true whenever *any*
//    playable card could win, not whether the given card wins.
// 2. It hardcoded 'right' as the player seat instead of using the real seat.
// 3. It built a malformed trick by appending then filtering in the same step.
//
// The new canCardWinTrick simply simulates the card being played by `seat`
// and checks if `seat` would be the trick winner.
function canCardWinTrick(
  card: Card,
  trick: Trick,
  trump: Suit | null,
  seat: SeatPosition
): boolean {
  const simulatedTrick: Trick = {
    ...trick,
    leadSuit: trick.leadSuit ?? card.suit,
    cards: [...trick.cards, { player: seat, card }],
  };
  return getTrickWinner(simulatedTrick, trump) === seat;
}