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

// ─── New utils — append these to the bottom of your existing utils.ts ────────

import { ALL_RANKS } from '@/constants/cards';

/**
 * Returns the cards from `cards` that belong to the shortest non-trump suit.
 * Used to find singleton leads — deliberately going void to get trump entries.
 * Falls back to the full card list if all suits are equally short.
 */
export function getShortestSuitCards(
  cards: Card[],
  trump: Suit | null,
): Card[] {
  const suitGroups = new Map<Suit, Card[]>();
  for (const card of cards) {
    if (card.suit === trump) continue;
    const group = suitGroups.get(card.suit) ?? [];
    group.push(card);
    suitGroups.set(card.suit, group);
  }
  if (suitGroups.size === 0) return cards;
  return [...suitGroups.values()].reduce((shortest, group) =>
    group.length < shortest.length ? group : shortest,
  );
}

/**
 * Counts how many trump cards are still unplayed in the entire game
 * (i.e. not yet seen in any completed trick or the current trick).
 * Uses the pre-derived `unplayedCardIds` set from buildContext to avoid
 * recomputing every call.
 */
export function countTrumpsRemaining(
  trump: Suit | null,
  unplayedCardIds: Set<string>,
): number {
  if (!trump) return 0;
  let count = 0;
  for (const rank of ALL_RANKS) {
    if (unplayedCardIds.has(`${rank}-${trump}`)) count++;
  }
  return count;
}

/**
 * Returns true if the bot holds the highest trump card that has not yet
 * been played. Used to decide whether it is safe to lead trump or overtrump
 * without being beaten by a higher trump from an opponent.
 */
export function holdingHighestRemainingTrump(
  hand: Card[],
  trump: Suit | null,
  unplayedCardIds: Set<string>,
): boolean {
  if (!trump) return false;

  // Find the highest rank still unplayed in the trump suit
  // ALL_RANKS is ordered A → 2 (high to low), so first match is the highest live trump
  for (const rank of ALL_RANKS) {
    const id = `${rank}-${trump}`;
    if (unplayedCardIds.has(id)) {
      // Is this card in our hand?
      return hand.some((c) => c.id === id);
    }
  }
  return false;
}
