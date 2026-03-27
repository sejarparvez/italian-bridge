import { Card } from "@/src/constants/cards";


export function sortHandAlternating(hand: Card[]): Card[] {
  const black = [...hand]
    .filter(c => ['spades', 'clubs'].includes(c.suit))
    .sort((a, b) => b.value - a.value);

  const red = [...hand]
    .filter(c => ['hearts', 'diamonds'].includes(c.suit))
    .sort((a, b) => b.value - a.value);

  const result = black.reduce<Card[]>((acc, card, i) => {
    acc.push(card);
    if (red[i]) acc.push(red[i]!);
    return acc;
  }, []);

  if (red.length > black.length) {
    result.push(...red.slice(black.length));
  }

  return result;
}