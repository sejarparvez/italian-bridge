import { Card, Suit, RANK_ORDER } from '../constants/cards';
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

  const trumps = trick.cards.filter(c => c.card.suit === trump);
  
  if (trumps.length > 0) {
    return trumps.reduce((best, curr) =>
      RANK_ORDER[curr.card.rank] > RANK_ORDER[best.card.rank] ? curr : best
    ).player;
  }

  const leadSuit = trick.leadSuit!;
  const leadSuitCards = trick.cards.filter(c => c.card.suit === leadSuit);
  
  return leadSuitCards.reduce((best, curr) =>
    RANK_ORDER[curr.card.rank] > RANK_ORDER[best.card.rank] ? curr : best
  ).player;
}

export function getPlayableCards(
  hand: Card[],
  trick: Trick,
  trump: Suit | null
): Card[] {
  if (trick.cards.length === 0) return hand;
  
  const leadSuit = trick.leadSuit!;
  const suitCards = hand.filter(c => c.suit === leadSuit);
  
  return suitCards.length > 0 ? suitCards : hand;
}

export function isValidCard(
  card: Card,
  hand: Card[],
  trick: Trick,
  trump: Suit | null
): boolean {
  const playableCards = getPlayableCards(hand, trick, trump);
  return playableCards.some(c => c.id === card.id);
}