import { Card, PlayerId, Suit } from '../types';
import { getRankValue } from '../deck';

export type Difficulty = 'easy' | 'medium' | 'hard';

function countSuitLengths(hand: Card[]): Record<Suit, number> {
  const counts: Record<Suit, number> = {
    spades: 0,
    hearts: 0,
    diamonds: 0,
    clubs: 0,
  };
  for (const card of hand) {
    counts[card.suit]++;
  }
  return counts;
}

function getSuitCards(hand: Card[], suit: Suit): Card[] {
  return hand.filter((c) => c.suit === suit).sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank));
}

export function estimateTricksAdvanced(hand: Card[]): number {
  let tricks = 0;
  const suitCounts = countSuitLengths(hand);

  for (const suit of Object.keys(suitCounts) as Suit[]) {
    const count = suitCounts[suit];
    if (count === 0) {
      tricks += 0.5;
    } else if (count === 1) {
      const card = getSuitCards(hand, suit)[0];
      if (getRankValue(card.rank) >= 12) tricks += 1;
      else tricks += 0.5;
    } else {
      const cards = getSuitCards(hand, suit);
      let suitTricks = 0;
      let topRank = 0;
      for (const card of cards) {
        const rank = getRankValue(card.rank);
        if (rank > topRank + 2) {
          suitTricks++;
          topRank = rank;
        }
      }
      tricks += Math.max(0, suitTricks - 1);
    }
  }

  return Math.round(tricks);
}

export function getBotBid(hand: Card[], difficulty: Difficulty): number {
  const baseEstimate = estimateTricksAdvanced(hand);
  
  let bid: number;
  
  switch (difficulty) {
    case 'easy':
      bid = baseEstimate + Math.floor(Math.random() * 3) - 1;
      break;
    case 'medium':
      bid = baseEstimate + Math.floor(Math.random() * 2) - 1;
      break;
    case 'hard':
      bid = Math.round(baseEstimate);
      break;
  }
  
  return Math.max(1, Math.min(bid, 13));
}
