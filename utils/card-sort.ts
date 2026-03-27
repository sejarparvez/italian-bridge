import { Card, Suit } from "@/src/constants/cards";

const SUIT_ORDER: Record<Suit, number> = {
  spades: 4,
  hearts: 3,
  clubs: 2,
  diamonds: 1,
};

export function sortHandAlternating(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => {
    const suitDiff = SUIT_ORDER[b.suit] - SUIT_ORDER[a.suit];
    if (suitDiff !== 0) return suitDiff;
    return b.value - a.value;
  });
}
