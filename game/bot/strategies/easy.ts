import type { Card, Suit } from '@/constants/cards';
import type { Trick } from '@/types/game-type';

export function playEasy(
  playable: Card[],
  trump: Suit | null,
  trick: Trick,
): Card {
  const isVoidInLedSuit =
    trick.leadSuit !== null && !playable.some((c) => c.suit === trick.leadSuit);

  if (isVoidInLedSuit && trump !== null) {
    const trumpCards = playable.filter((c) => c.suit === trump);
    const nonTrumpCards = playable.filter((c) => c.suit !== trump);

    if (trumpCards.length > 0 && nonTrumpCards.length > 0) {
      const wantsToTrump = Math.random() < 0.4;
      const pool = wantsToTrump ? trumpCards : nonTrumpCards;
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }

  return playable[Math.floor(Math.random() * playable.length)];
}
