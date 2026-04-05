import { useCallback, useEffect, useState } from 'react';

export interface Card {
  suit: '♠' | '♥' | '♦' | '♣';
  rank: string;
}

export type PlayerPosition = 'top' | 'left' | 'right' | 'bottom';

interface DealingState {
  isDealing: boolean;
  currentCardIndex: number;
  deckCount: number;
  playerHands: Record<PlayerPosition, Card[]>;
}

interface UseDealingReturn {
  state: DealingState;
  startNewGame: () => void;
  resetGame: () => void;
}

const SUITS: Card['suit'][] = ['♠', '♥', '♦', '♣'];
const RANKS = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
];

function shuffleDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

const TOTAL_CARDS = 52;
const CARDS_PER_PLAYER = 13;

export function useDealing(autoStart = false): UseDealingReturn {
  const [state, setState] = useState<DealingState>({
    isDealing: false,
    currentCardIndex: 0,
    deckCount: TOTAL_CARDS,
    playerHands: {
      top: [],
      left: [],
      right: [],
      bottom: [],
    },
  });

  const startNewGame = useCallback(() => {
    const deck = shuffleDeck();
    const hands: Record<PlayerPosition, Card[]> = {
      top: [],
      left: [],
      right: [],
      bottom: [],
    };

    let cardIndex = 0;
    for (let round = 0; round < CARDS_PER_PLAYER; round++) {
      const positions: PlayerPosition[] = ['bottom', 'right', 'top', 'left'];
      for (const pos of positions) {
        if (cardIndex < deck.length) {
          hands[pos].push(deck[cardIndex]);
          cardIndex++;
        }
      }
    }

    setState({
      isDealing: true,
      currentCardIndex: 0,
      deckCount: TOTAL_CARDS,
      playerHands: hands,
    });

    const totalDeals = CARDS_PER_PLAYER * 4;
    const dealInterval = setInterval(() => {
      setState((prev) => {
        const next = prev.currentCardIndex + 1;
        if (next >= totalDeals) {
          clearInterval(dealInterval);
          return {
            ...prev,
            isDealing: false,
            currentCardIndex: next,
            deckCount: 0,
          };
        }
        return {
          ...prev,
          currentCardIndex: next,
          deckCount: TOTAL_CARDS - Math.ceil(next / 4),
        };
      });
    }, 120);
  }, []);

  useEffect(() => {
    if (autoStart && !state.isDealing && state.deckCount === TOTAL_CARDS) {
      startNewGame();
    }
  }, [autoStart, state.isDealing, state.deckCount, startNewGame]);

  const resetGame = useCallback(() => {
    setState({
      isDealing: false,
      currentCardIndex: 0,
      deckCount: TOTAL_CARDS,
      playerHands: {
        top: [],
        left: [],
        right: [],
        bottom: [],
      },
    });
  }, []);

  return { state, startNewGame, resetGame };
}
