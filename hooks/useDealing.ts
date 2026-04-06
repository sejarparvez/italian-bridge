import { useGameStore } from '@/store/game-store';
import { useCallback, useEffect, useState } from 'react';

export type PlayerPosition = 'top' | 'left' | 'right' | 'bottom';

interface DealingState {
  isDealing: boolean;
  currentCardIndex: number;
  deckCount: number;
  dealPhase: 'idle' | 'first' | 'second'; // track which deal phase
}

interface UseDealingReturn {
  state: DealingState;
  startNewGame: () => void;
  resetGame: () => void;
}

const TOTAL_CARDS = 52;
const FIRST_DEAL_PER_PLAYER = 5; // 5 cards each = 20 cards
const TOTAL_PER_PLAYER = 13;
const FIRST_DEAL_TOTAL = FIRST_DEAL_PER_PLAYER * 4; // 20
const SECOND_DEAL_TOTAL = (TOTAL_PER_PLAYER - FIRST_DEAL_PER_PLAYER) * 4; // 32

export function useDealing(autoStart = false): UseDealingReturn {
  const {
    startNewGame: storeStartNewGame,
    state: gameState,
    runBotBids,
  } = useGameStore();

  const [state, setState] = useState<DealingState>({
    isDealing: false,
    currentCardIndex: 0,
    deckCount: TOTAL_CARDS,
    dealPhase: 'idle',
  });

  // ── First Deal: 5 cards each ──────────────────────────────────────────────
  const startNewGame = useCallback(() => {
    // 1. Reset store state (shuffles deck, sets phase to 'dealing1')
    storeStartNewGame();

    // 2. Start dealing animation for first 5 cards per player
    setState({
      isDealing: true,
      currentCardIndex: 0,
      deckCount: TOTAL_CARDS,
      dealPhase: 'first',
    });

    let cardIndex = 0;
    const dealInterval = setInterval(() => {
      cardIndex++;
      const remaining = TOTAL_CARDS - Math.ceil(cardIndex / 4);

      if (cardIndex >= FIRST_DEAL_TOTAL) {
        clearInterval(dealInterval);
        // Animation done — now trigger bidding phase in store
        setState({
          isDealing: false,
          currentCardIndex: cardIndex,
          deckCount: remaining,
          dealPhase: 'idle',
        });
        // Tell the store to move to bidding (bots will auto-run if not human's turn)
        runBotBids();
        return;
      }

      setState((prev) => ({
        ...prev,
        currentCardIndex: cardIndex,
        deckCount: remaining,
      }));
    }, 120);
  }, [storeStartNewGame, runBotBids]);

  // ── Second Deal: remaining 8 cards after trump selected ───────────────────
  // Watch the store for 'dealing2' phase and animate the second deal
  useEffect(() => {
    if (gameState.phase !== 'dealing2') return;

    setState({
      isDealing: true,
      currentCardIndex: 0,
      deckCount: TOTAL_CARDS - FIRST_DEAL_TOTAL, // 32 remaining
      dealPhase: 'second',
    });

    let cardIndex = 0;
    const dealInterval = setInterval(() => {
      cardIndex++;
      const remaining =
        TOTAL_CARDS - FIRST_DEAL_TOTAL - Math.ceil(cardIndex / 4);

      if (cardIndex >= SECOND_DEAL_TOTAL) {
        clearInterval(dealInterval);
        setState({
          isDealing: false,
          currentCardIndex: cardIndex,
          deckCount: 0,
          dealPhase: 'idle',
        });
        // Tell store to deal the cards and move to playing phase
        useGameStore.getState().dealRemainingCards();
        return;
      }

      setState((prev) => ({
        ...prev,
        currentCardIndex: cardIndex,
        deckCount: remaining,
      }));
    }, 120);

    return () => clearInterval(dealInterval);
  }, [gameState.phase]);

  // ── Auto-start ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (
      autoStart &&
      !state.isDealing &&
      state.dealPhase === 'idle' &&
      state.deckCount === TOTAL_CARDS
    ) {
      startNewGame();
    }
  }, [
    autoStart,
    state.isDealing,
    state.dealPhase,
    state.deckCount,
    startNewGame,
  ]);

  const resetGame = useCallback(() => {
    setState({
      isDealing: false,
      currentCardIndex: 0,
      deckCount: TOTAL_CARDS,
      dealPhase: 'idle',
    });
  }, []);

  return { state, startNewGame, resetGame };
}
