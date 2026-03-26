import { Card, Suit, ALL_SUITS } from '../../constants/cards';
import { Difficulty } from '../types';

export function getBotBid(hand: Card[], difficulty: Difficulty): number {
  const highCards = countHighCards(hand);
  const voids = countVoids(hand);
  const suitsWithCards = countSuitsWithCards(hand);

  let baseBid = highCards + voids + (suitsWithCards >= 3 ? 1 : 0);

  baseBid = Math.min(10, Math.max(7, baseBid));

  const variance = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 1 : 0;
  const offset = Math.floor(Math.random() * (variance * 2 + 1)) - variance;
  
  return Math.min(10, Math.max(7, baseBid + offset));
}

function countHighCards(hand: Card[]): number {
  return hand.filter(c => c.value >= 11).length;
}

function countVoids(hand: Card[]): number {
  const suits = new Set(hand.map(c => c.suit));
  return ALL_SUITS.filter((s: Suit) => !suits.has(s)).length;
}

function countSuitsWithCards(hand: Card[]): number {
  const suitCounts: Record<Suit, number> = {
    spades: 0,
    hearts: 0,
    diamonds: 0,
    clubs: 0,
  };

  for (const card of hand) {
    suitCounts[card.suit]++;
  }

  return Object.values(suitCounts).filter(count => count >= 2).length;
}

export function selectBotTrump(hand: Card[], bid: number): Suit {
  const suitStrengths: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
  
  const getSuitStrength = (suit: Suit): number => {
    const suitCards = hand.filter(c => c.suit === suit);
    if (suitCards.length === 0) return 0;
    
    const highCards = suitCards.filter(c => c.value >= 11).length;
    const totalValue = suitCards.reduce((sum, c) => sum + c.value, 0);
    
    return highCards * 3 + totalValue;
  };

  const sortedSuits = [...suitStrengths].sort((a, b) => 
    getSuitStrength(b) - getSuitStrength(a)
  );

  return sortedSuits[0];
}