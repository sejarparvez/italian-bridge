import { Card, PlayerId, Suit, Bid } from '../types';
import { getRankValue } from '../deck';
import { MIN_BID, MAX_BID, getValidBids } from '../bidding';

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

export function getBotBid(hand: Card[], difficulty: Difficulty, bids: Bid[] = []): number | null {
  const baseEstimate = estimateTricksAdvanced(hand);
  const validBids = getValidBids(bids);
  const bidOptions = validBids.filter((b): b is number => b !== null);
  
  if (bidOptions.length === 0) return null;
  
  if (baseEstimate < MIN_BID) {
    return null;
  }
  
  let bid: number;
  
  switch (difficulty) {
    case 'easy':
      bid = baseEstimate + Math.floor(Math.random() * 2) - 1;
      break;
    case 'medium':
      bid = baseEstimate;
      break;
    case 'hard':
      bid = baseEstimate + 1;
      break;
  }
  
  const validBid = Math.max(MIN_BID, Math.min(bid, MAX_BID));
  
  if (!bidOptions.includes(validBid)) {
    return bidOptions[bidOptions.length - 1];
  }
  
  return validBid;
}
