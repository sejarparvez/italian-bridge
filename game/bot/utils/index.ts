import type { Card, Suit } from '@/constants/cards';
import type { GameState, SeatPosition, Trick } from '@/types/game-type';
import { getTrickWinner } from '../../trick';

export function getTrickPosition(trick: Trick): 1 | 2 | 3 | 4 {
  const pos = trick.cards.length + 1;
  return Math.min(4, Math.max(1, pos)) as 1 | 2 | 3 | 4;
}

export function isMyPartnerWinning(
  trick: Trick,
  gameState: GameState,
  seat: SeatPosition,
): boolean {
  if (trick.cards.length === 0) return false;
  const currentWinner = getTrickWinner(trick, gameState.trumpSuit);
  return gameState.players[currentWinner].team === gameState.players[seat].team;
}

export function canCardWinTrick(
  card: Card,
  trick: Trick,
  trump: Suit | null,
  seat: SeatPosition,
): boolean {
  const simulatedTrick: Trick = {
    ...trick,
    leadSuit: trick.leadSuit ?? card.suit,
    cards: [...trick.cards, { player: seat, card }],
  };
  return getTrickWinner(simulatedTrick, trump) === seat;
}

export function getCheapestDiscard(playable: Card[], trump: Suit | null): Card {
  const nonTrump = trump ? playable.filter((c) => c.suit !== trump) : playable;
  if (nonTrump.length > 0) return getLowestCard(nonTrump);
  return getLowestCard(playable);
}

export function getLowestCard(cards: Card[]): Card {
  return cards.reduce((lowest, card) =>
    card.value < lowest.value ? card : lowest,
  );
}

export function getHighestCard(cards: Card[]): Card {
  return cards.reduce((highest, card) =>
    card.value > highest.value ? card : highest,
  );
}

export function getLongestSuitCards(cards: Card[], trump: Suit | null): Card[] {
  const suitGroups = new Map<Suit, Card[]>();
  for (const card of cards) {
    if (card.suit === trump) continue;
    const group = suitGroups.get(card.suit) ?? [];
    group.push(card);
    suitGroups.set(card.suit, group);
  }
  if (suitGroups.size === 0) return cards;
  return [...suitGroups.values()].reduce((longest, group) =>
    group.length > longest.length ? group : longest,
  );
}
