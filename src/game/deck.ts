import { Card, Rank, Suit, ALL_RANKS, ALL_SUITS, RANK_ORDER } from '../constants/cards';

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

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export interface DealResult {
  bottom: Card[];
  top: Card[];
  left: Card[];
  right: Card[];
}

export function dealCards(deck: Card[], cardsPerPlayer: number): DealResult {
  const result: DealResult = {
    bottom: [],
    top: [],
    left: [],
    right: [],
  };

  for (let i = 0; i < cardsPerPlayer; i++) {
    result.bottom.push(deck[i * 4]);
    result.top.push(deck[i * 4 + 1]);
    result.left.push(deck[i * 4 + 2]);
    result.right.push(deck[i * 4 + 3]);
  }

  return result;
}

export function dealRemainingCards(
  deck: Card[],
  currentHands: DealResult
): DealResult {
  const remaining = deck.slice(16);
  let idx = 0;

  const addCards = (hand: Card[], count: number): Card[] => [
    ...hand,
    ...remaining.slice(idx, idx + count).map(c => ({ ...c })),
  ];

  return {
    bottom: addCards(currentHands.bottom, 8),
    top: addCards(currentHands.top, 8),
    left: addCards(currentHands.left, 8),
    right: addCards(currentHands.right, 8),
  };
}