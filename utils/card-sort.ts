import type { Card, Suit } from '@/constants/cards';

const RED_SUITS: Suit[] = ['hearts', 'diamonds'];
const BLACK_SUITS: Suit[] = ['spades', 'clubs'];

// Preferred order within each color group (higher = appears first)
const SUIT_RANK: Record<Suit, number> = {
  spades: 2,
  clubs: 1,
  hearts: 2,
  diamonds: 1,
};

function sortCardsWithinSuit(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => b.value - a.value);
}

export function sortHandAlternating(hand: Card[]): Card[] {
  if (hand.length === 0) return [];

  // Group cards by suit and sort each group by rank descending
  const bySuit: Partial<Record<Suit, Card[]>> = {};
  for (const card of hand) {
    if (!bySuit[card.suit]) bySuit[card.suit] = [];
    bySuit[card.suit]?.push(card);
  }
  for (const suit in bySuit) {
    // biome-ignore lint/style/noNonNullAssertion: this is fine
    bySuit[suit as Suit] = sortCardsWithinSuit(bySuit[suit as Suit]!);
  }

  // Which suits does the player actually hold, split by color
  const reds = RED_SUITS.filter((s) => bySuit[s]).sort(
    (a, b) => SUIT_RANK[b] - SUIT_RANK[a],
  ); // hearts before diamonds
  const blacks = BLACK_SUITS.filter((s) => bySuit[s]).sort(
    (a, b) => SUIT_RANK[b] - SUIT_RANK[a],
  ); // spades before clubs

  const r = reds.length; // 0–2
  const b = blacks.length; // 0–2

  // Build the interleaved suit order:
  //   0 colors of one type → just list what we have
  //   1R 1B  → R B
  //   2R 1B  → R B R
  //   1R 2B  → B R B
  //   2R 2B  → R B R B
  let suitOrder: Suit[];

  if (r === 0) {
    suitOrder = blacks;
  } else if (b === 0) {
    suitOrder = reds;
  } else if (r === 1 && b === 1) {
    suitOrder = [reds[0], blacks[0]];
  } else if (r === 2 && b === 1) {
    suitOrder = [reds[0], blacks[0], reds[1]];
  } else if (r === 1 && b === 2) {
    suitOrder = [blacks[0], reds[0], blacks[1]];
  } else {
    // r === 2 && b === 2
    suitOrder = [reds[0], blacks[0], reds[1], blacks[1]];
  }

  return suitOrder.flatMap((suit) => bySuit[suit] ?? []);
}
