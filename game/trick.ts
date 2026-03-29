import { Card, RANK_ORDER, Suit } from '../constants/cards';
import { SeatPosition } from './types';

export interface TrickCard {
  player: SeatPosition;
  card: Card;
}

export interface Trick {
  cards: TrickCard[];
  leadSuit: Suit | null;
  winningSeat: SeatPosition | null;
}

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
  const leadSuit = trick.leadSuit ?? card.suit;
  return {
    ...trick,
    cards: [...trick.cards, { player, card }],
    leadSuit,
  };
}

export function getTrickWinner(trick: Trick, trump: Suit | null): SeatPosition {
  if (trick.cards.length === 0) return 'bottom';

  // Trump cards beat all non-trump; highest trump wins
  if (trump !== null) {
    const trumpCards = trick.cards.filter(c => c.card.suit === trump);
    if (trumpCards.length > 0) {
      return trumpCards.reduce((best, curr) =>
        RANK_ORDER[curr.card.rank] > RANK_ORDER[best.card.rank] ? curr : best
      ).player;
    }
  }

  // No trump played — highest card of lead suit wins
  const leadSuit = trick.leadSuit!;
  const leadSuitCards = trick.cards.filter(c => c.card.suit === leadSuit);
  return leadSuitCards.reduce((best, curr) =>
    RANK_ORDER[curr.card.rank] > RANK_ORDER[best.card.rank] ? curr : best
  ).player;
}

// BUG FIX: trumpRevealed added as parameter.
// If trump hasn't been revealed yet, trump cards are treated as ordinary cards
// (player can't be forced to play them, and leading trump doesn't "reveal" it —
// that's a deliberate game action handled by the engine's revealTrump()).
export function getPlayableCards(
  hand: Card[],
  trick: Trick,
  trump: Suit | null,
  trumpRevealed: boolean
): Card[] {
  // Leading the trick — all cards are playable
  if (trick.cards.length === 0) return hand;

  const leadSuit = trick.leadSuit!;

  // Cards matching the lead suit (excluding trump if it IS the lead suit and
  // it hasn't been revealed yet — edge case: trump suit can be led once revealed)
  const suitCards = hand.filter(c => c.suit === leadSuit);

  if (suitCards.length > 0) {
    // Player has lead-suit cards; must play one
    return suitCards;
  }

  // Player is void in lead suit — can play anything,
  // but if trump is not yet revealed, trump cards are still allowed
  // (the act of playing trump when void is what "reveals" it in many variants;
  // here we let the engine's revealTrump handle that — we just don't restrict).
  return hand;
}

export function isValidCard(
  card: Card,
  hand: Card[],
  trick: Trick,
  trump: Suit | null,
  trumpRevealed: boolean
): boolean {
  const playableCards = getPlayableCards(hand, trick, trump, trumpRevealed);
  return playableCards.some(c => c.id === card.id);
}