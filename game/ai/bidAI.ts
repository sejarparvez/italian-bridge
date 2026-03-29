import { ALL_SUITS, Card, Suit } from '../../constants/cards';
import { BID_MAX, BID_MIN } from '../bidding';
import { Difficulty } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Cards at or above this value are considered "high cards" */
export const HIGH_CARD_THRESHOLD = 11; // Jack and above

/** Suits with this many cards or more grant a long suit bonus */
const LONG_SUIT_THRESHOLD = 4;

/**
 * Minimum trump suit length for hard bots.
 * Hard bots won't pick a trump suit with fewer than this many cards —
 * running out of trump early costs tricks.
 */
const HARD_BOT_MIN_TRUMP_LENGTH = 3;

// ─── Hand Evaluation (shared) ─────────────────────────────────────────────────

export interface HandStrength {
  highCards: number;   // Jacks and above
  voids: number;       // suits with 0 cards (ruffing power)
  longSuits: number;   // suits with 4+ cards (control)
  total: number;       // combined estimate before clamping
}

/**
 * Evaluate the raw strength of a hand.
 * Used by both bid estimation and trump selection so both decisions
 * are based on the same hand assessment — no diverging logic.
 */
export function evaluateHand(hand: Card[]): HandStrength {
  const suitCounts = new Map<Suit, number>();
  for (const card of hand) {
    suitCounts.set(card.suit, (suitCounts.get(card.suit) ?? 0) + 1);
  }

  const highCards = hand.filter(c => c.value >= HIGH_CARD_THRESHOLD).length;
  const voids = ALL_SUITS.filter((s: Suit) => !suitCounts.has(s) || suitCounts.get(s) === 0).length;
  const longSuits = [...suitCounts.values()].filter(count => count >= LONG_SUIT_THRESHOLD).length;

  return {
    highCards,
    voids,
    longSuits,
    total: highCards + voids + longSuits,
  };
}

// ─── Bot Bid ──────────────────────────────────────────────────────────────────

/**
 * Returns the bot's bid, or 0 if it wants to pass.
 *
 * @param hand               - The bot's current hand
 * @param difficulty         - Bot difficulty level
 * @param currentHighestBid  - The highest bid placed so far; bot must exceed
 *                             this or pass (return 0)
 */
export function getBotBid(
  hand: Card[],
  difficulty: Difficulty,
  currentHighestBid: number
): number {
  const { total, highCards } = evaluateHand(hand);

  // Clamp raw estimate to valid bid range
  const baseBid = Math.min(BID_MAX, Math.max(BID_MIN, total));

  // Apply difficulty variance — easier bots are less accurate
  const variance = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 1 : 0;
  const offset = Math.floor(Math.random() * (variance * 2 + 1)) - variance;
  let estimate = Math.min(BID_MAX, Math.max(BID_MIN, baseBid + offset));

  // Must exceed the current highest bid or pass
  if (estimate <= currentHighestBid) {
    return 0; // pass
  }

  // Bid 10 caution: failing a bid of 10 costs -10 points — a huge penalty.
  // Only commit to bid 10 if the hand is genuinely strong enough.
  // Hard bots trust their hand more; easy bots are extra cautious.
  if (estimate === BID_MAX) {
    const bid10Threshold =
      difficulty === 'hard' ? 4 : difficulty === 'medium' ? 5 : 6;

    if (highCards < bid10Threshold) {
      // Step down to 9 if that still beats the table, otherwise pass
      const safeBid = BID_MAX - 1;
      return safeBid > currentHighestBid ? safeBid : 0;
    }
  }

  return estimate;
}

// ─── Bot Trump Selection ──────────────────────────────────────────────────────

/**
 * Selects the best trump suit for the bot based on hand strength.
 *
 * @param hand        - The bot's hand after all cards are dealt
 * @param bid         - The bid the bot won (higher bids need stronger trump)
 * @param difficulty  - Affects how conservatively the bot picks trump length
 */
export function selectBotTrump(
  hand: Card[],
  bid: number,
  difficulty: Difficulty
): Suit {
  const getSuitScore = (suit: Suit): number => {
    const suitCards = hand.filter(c => c.suit === suit);
    const length = suitCards.length;

    if (length === 0) return -Infinity;

    // Hard bots avoid short trump suits (running dry costs tricks)
    if (difficulty === 'hard' && length < HARD_BOT_MIN_TRUMP_LENGTH) {
      return -Infinity;
    }

    const highCards = suitCards.filter(c => c.value >= HIGH_CARD_THRESHOLD).length;

    // At higher bids, prioritise length even more since you need more tricks.
    // bid 7–8: balanced weight. bid 9–10: length is critical.
    const lengthWeight = bid >= 9 ? 3 : 2;
    const highCardWeight = 3;

    return length * lengthWeight + highCards * highCardWeight;
  };

  const ranked = (ALL_SUITS as Suit[])
    .slice()
    .sort((a, b) => getSuitScore(b) - getSuitScore(a));

  // Safety fallback: if hard bot filters eliminated all suits (very short hand),
  // fall back to the longest suit without the length restriction.
  if (getSuitScore(ranked[0]) === -Infinity) {
    return (ALL_SUITS as Suit[]).slice().sort((a, b) => {
      const aLen = hand.filter(c => c.suit === a).length;
      const bLen = hand.filter(c => c.suit === b).length;
      return bLen - aLen;
    })[0];
  }

  return ranked[0];
}