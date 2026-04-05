import type { SeatPosition } from '@/types/game-type';
import {
  ALL_RANKS,
  ALL_SUITS,
  type Card,
  RANK_ORDER,
} from '../constants/cards';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Seat order used for dealing — consistent with bidding and trick order */
const SEAT_ORDER: SeatPosition[] = ['bottom', 'left', 'top', 'right'];

const TOTAL_PLAYERS = SEAT_ORDER.length;

// ─── Types ────────────────────────────────────────────────────────────────────

export type DealResult = Record<SeatPosition, Card[]>;

// ─── Deck Creation ────────────────────────────────────────────────────────────

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      deck.push({
        id: `${suit}_${rank}`,
        suit,
        rank,
        value: RANK_ORDER[rank],
      });
    }
  }
  return deck;
}

// ─── Shuffle ──────────────────────────────────────────────────────────────────

/** Fisher-Yates shuffle — returns a new array, does not mutate the input. */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ─── Deal ─────────────────────────────────────────────────────────────────────

/**
 * Deal `cardsPerPlayer` cards to each of the 4 seats from the deck.
 * Cards are dealt one at a time around the table (bottom → left → top → right),
 * matching real card dealing order.
 *
 * @throws if the deck doesn't have enough cards for the deal.
 */
export function dealCards(deck: Card[], cardsPerPlayer: number): DealResult {
  const required = cardsPerPlayer * TOTAL_PLAYERS;
  if (deck.length < required) {
    throw new Error(
      `Deck too small to deal ${cardsPerPlayer} cards to ${TOTAL_PLAYERS} players. ` +
        `Need ${required}, got ${deck.length}.`,
    );
  }

  const result: DealResult = {
    bottom: [],
    top: [],
    left: [],
    right: [],
  };

  // Deal one card at a time around the table — explicit and easy to follow
  for (let round = 0; round < cardsPerPlayer; round++) {
    for (let p = 0; p < TOTAL_PLAYERS; p++) {
      const seat = SEAT_ORDER[p];
      result[seat].push({ ...deck[round * TOTAL_PLAYERS + p] });
    }
  }

  return result;
}

/**
 * Deal remaining cards after the initial deal.
 * Automatically calculates how many cards each player receives from what's left.
 *
 * @param deck                 - The full shuffled deck
 * @param currentHands         - Hands already dealt in the first phase
 * @param initialCardsPerPlayer - How many cards were dealt in the first phase
 *
 * @throws if there aren't enough remaining cards to deal evenly.
 */
export function dealRemainingCards(
  deck: Card[],
  currentHands: DealResult,
  initialCardsPerPlayer: number,
): DealResult {
  const dealtSoFar = initialCardsPerPlayer * TOTAL_PLAYERS;
  const remaining = deck.slice(dealtSoFar);

  // Derive cards per player from remaining deck rather than hardcoding 8
  if (remaining.length % TOTAL_PLAYERS !== 0) {
    throw new Error(
      `Remaining cards (${remaining.length}) don't divide evenly among ` +
        `${TOTAL_PLAYERS} players.`,
    );
  }

  const cardsPerPlayer = remaining.length / TOTAL_PLAYERS;

  if (cardsPerPlayer === 0) {
    throw new Error('No remaining cards to deal.');
  }

  let idx = 0;
  const addCards = (hand: Card[], count: number): Card[] => {
    const newCards = remaining.slice(idx, idx + count).map((c) => ({ ...c }));
    idx += count;
    return [...hand, ...newCards];
  };

  return {
    bottom: addCards(currentHands.bottom, cardsPerPlayer),
    top: addCards(currentHands.top, cardsPerPlayer),
    left: addCards(currentHands.left, cardsPerPlayer),
    right: addCards(currentHands.right, cardsPerPlayer),
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Returns the total number of cards in all hands combined.
 * Useful for asserting deal correctness in tests.
 */
export function countDealtCards(hands: DealResult): number {
  return SEAT_ORDER.reduce((total, seat) => total + hands[seat].length, 0);
}

/**
 * Validates that a deal result has the expected number of cards per player.
 * Throws a descriptive error if any hand is the wrong size.
 */
export function validateDeal(
  hands: DealResult,
  expectedPerPlayer: number,
): void {
  for (const seat of SEAT_ORDER) {
    if (hands[seat].length !== expectedPerPlayer) {
      throw new Error(
        `Invalid deal: ${seat} has ${hands[seat].length} cards, expected ${expectedPerPlayer}.`,
      );
    }
  }
}
