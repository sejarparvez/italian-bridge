import { Card, Suit } from '../constants/cards';
import { SeatPosition } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrickCard {
  player: SeatPosition;
  card: Card;
}

export interface Trick {
  cards: TrickCard[];
  leadSuit: Suit | null;
  winningSeat: SeatPosition | null;
}

// ─── Trick Management ─────────────────────────────────────────────────────────

export function createEmptyTrick(): Trick {
  return {
    cards: [],
    leadSuit: null,
    winningSeat: null,
  };
}

export function addCardToTrick(
  trick: Trick,
  player: SeatPosition,
  card: Card
): Trick {
  // Guard: prevent duplicate players in the same trick
  if (trick.cards.some(tc => tc.player === player)) {
    throw new Error(`Player '${player}' has already played in this trick.`);
  }

  // Guard: prevent more than 4 cards in a trick
  if (trick.cards.length >= 4) {
    throw new Error('Trick is already complete — cannot add more cards.');
  }

  // Lead suit is set by the first card played and never changes
  const leadSuit = trick.leadSuit ?? card.suit;

  return {
    ...trick,
    cards: [...trick.cards, { player, card }],
    leadSuit,
  };
}

// ─── Trick Winner ─────────────────────────────────────────────────────────────

/**
 * Determines the winner of a completed trick.
 *
 * Rules:
 * - If any trump cards were played, the highest trump wins.
 * - Otherwise, the highest card of the lead suit wins.
 * - Off-suit, non-trump cards can never win.
 *
 * @throws if the trick has no cards (no winner possible).
 * @throws if no lead suit cards are found (data integrity error).
 */
export function getTrickWinner(trick: Trick, trump: Suit | null): SeatPosition {
  if (trick.cards.length === 0) {
    throw new Error('Cannot determine winner of an empty trick.');
  }

  // Trump cards beat all non-trump; highest trump wins
  if (trump !== null) {
    const trumpCards = trick.cards.filter(tc => tc.card.suit === trump);
    if (trumpCards.length > 0) {
      return highestCard(trumpCards).player;
    }
  }

  // No trump played — highest card of lead suit wins
  if (trick.leadSuit === null) {
    throw new Error('Trick has cards but no lead suit — data integrity error.');
  }

  const leadSuitCards = trick.cards.filter(tc => tc.card.suit === trick.leadSuit);

  if (leadSuitCards.length === 0) {
    throw new Error(
      `No cards found for lead suit '${trick.leadSuit}' — data integrity error.`
    );
  }

  return highestCard(leadSuitCards).player;
}

// ─── Playable Cards ───────────────────────────────────────────────────────────

/**
 * Returns the subset of cards in `hand` that are legal to play.
 *
 * Rules:
 * - Leading the trick: any card is playable.
 * - Following: must follow lead suit if possible.
 * - Void in lead suit: any card is playable (including trump).
 *   The act of playing trump when void is what triggers trump reveal —
 *   this function doesn't restrict it, the engine's revealTrump handles that.
 * - If trump has not been revealed, trump cards are treated as ordinary cards
 *   and players are not forced to play them (they may choose to reveal).
 */
export function getPlayableCards(
  hand: Card[],
  trick: Trick,
  trump: Suit | null,
  trumpRevealed: boolean
): Card[] {
  // Leading — all cards are playable
  if (trick.cards.length === 0) return hand;

  if (trick.leadSuit === null) {
    // Shouldn't happen if addCardToTrick is used correctly, but fail safely
    return hand;
  }

  const leadSuitCards = hand.filter(c => c.suit === trick.leadSuit);

  if (leadSuitCards.length > 0) {
    // Player has cards in lead suit — must follow suit
    return leadSuitCards;
  }

  // Void in lead suit — any card is playable
  return hand;
}

// ─── Card Validation ──────────────────────────────────────────────────────────

/**
 * Returns true if `card` is a legal play given the current hand, trick, and trump state.
 */
export function isValidCard(
  card: Card,
  hand: Card[],
  trick: Trick,
  trump: Suit | null,
  trumpRevealed: boolean
): boolean {
  // Card must actually be in the player's hand
  if (!hand.some(c => c.id === card.id)) return false;

  const playable = getPlayableCards(hand, trick, trump, trumpRevealed);
  return playable.some(c => c.id === card.id);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the TrickCard with the highest card value from a non-empty array.
 * Uses `card.value` (pre-resolved in createDeck) instead of re-resolving rank.
 */
function highestCard(cards: TrickCard[]): TrickCard {
  return cards.reduce((best, curr) =>
    curr.card.value > best.card.value ? curr : best
  );
}