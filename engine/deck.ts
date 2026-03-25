import { Card, PlayerId, Suit, Rank, Player, Team } from './types';

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffle(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function deal(numPlayers: number = 4): Player[] {
  const deck = shuffle(createDeck());
  const players: Player[] = [];
  const cardsPerPlayer = Math.floor(deck.length / numPlayers);

  for (let i = 0; i < numPlayers; i++) {
    const start = i * cardsPerPlayer;
    const hand = deck.slice(start, start + cardsPerPlayer);
    const team: Team = i % 2 === 0 ? 'us' : 'them';
    players.push({ id: i as PlayerId, team, hand });
  }

  return players;
}

export const RANK_ORDER: Record<Rank, number> = {
  A: 14,
  K: 13,
  Q: 12,
  J: 11,
  '10': 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2,
};

export function getRankValue(rank: Rank): number {
  return RANK_ORDER[rank];
}
