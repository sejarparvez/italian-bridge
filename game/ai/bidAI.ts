import { ALL_SUITS, Card, Suit } from '../../src/constants/cards';
import { BID_MAX, BID_MIN } from '../bidding';
import { Difficulty } from '../types';

export function getBotBid(hand: Card[], difficulty: Difficulty): number {
  const highCards = countHighCards(hand);
  const voids = countVoids(hand);
  // FIX: long suits (4+ cards in one suit) are a bidding asset, not short suits.
  // Replace the backwards "breadth bonus" with a length bonus.
  const longSuits = countLongSuits(hand);

  let baseBid = highCards + voids + longSuits;
  baseBid = Math.min(BID_MAX, Math.max(BID_MIN, baseBid));

  const variance = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 1 : 0;
  const offset = Math.floor(Math.random() * (variance * 2 + 1)) - variance;
  return Math.min(BID_MAX, Math.max(BID_MIN, baseBid + offset));
}

function countHighCards(hand: Card[]): number {
  // Cards with rank Jack (11) or higher are "high cards"
  return hand.filter(c => c.value >= 11).length;
}

function countVoids(hand: Card[]): number {
  const suits = new Set(hand.map(c => c.suit));
  return ALL_SUITS.filter((s: Suit) => !suits.has(s)).length;
}

// FIX: was countSuitsWithCards (breadth), which incorrectly rewarded spreading
// cards thin. Long suits give you control and ruffing power — that's the asset.
function countLongSuits(hand: Card[]): number {
  const suitCounts = new Map<Suit, number>();
  for (const card of hand) {
    suitCounts.set(card.suit, (suitCounts.get(card.suit) ?? 0) + 1);
  }
  // Each suit with 4+ cards is worth +1 to the bid estimate
  return [...suitCounts.values()].filter(count => count >= 4).length;
}

export function selectBotTrump(hand: Card[], _bid: number): Suit {
  // FIX: previous formula double-counted high cards (highCards * 3 AND their
  // raw value summed together). Separate quality (high card count) from length
  // so a suit with 1 ace doesn't outscore a suit with 3 face cards.
  const getSuitScore = (suit: Suit): number => {
    const suitCards = hand.filter(c => c.suit === suit);
    if (suitCards.length === 0) return -Infinity;

    const length = suitCards.length;
    const highCards = suitCards.filter(c => c.value >= 11).length;
    // Weight: length matters most (each card is a potential trick),
    // high cards are a bonus (they're likely winners), not the sole factor.
    return length * 2 + highCards * 3;
  };

  // FIX: renamed from misleading 'suitStrengths' (it was just the suit list)
  const ranked = (ALL_SUITS as Suit[]).slice().sort(
    (a, b) => getSuitScore(b) - getSuitScore(a)
  );
  return ranked[0];
}