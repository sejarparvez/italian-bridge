import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from '@/store/game-store';

export type PlayerPosition = 'top' | 'left' | 'right' | 'bottom';

interface DealingState {
  isDealing: boolean;
  currentCardIndex: number;
  deckCount: number;
  dealPhase: 'idle' | 'first' | 'second';
}

interface UseDealingReturn {
  state: DealingState;
  startNewGame: () => void;
  resetGame: () => void;
}

const TOTAL_CARDS = 52;
const FIRST_DEAL_PER_PLAYER = 5;
const TOTAL_PER_PLAYER = 13;
const FIRST_DEAL_TOTAL = FIRST_DEAL_PER_PLAYER * 4;
const SECOND_DEAL_TOTAL = (TOTAL_PER_PLAYER - FIRST_DEAL_PER_PLAYER) * 4;

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

  const startNewGame = useCallback(() => {
    storeStartNewGame();

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
        setState({
          isDealing: false,
          currentCardIndex: cardIndex,
          deckCount: remaining,
          dealPhase: 'idle',
        });
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

  const startSecondDeal = useCallback(() => {
    setState({
      isDealing: true,
      currentCardIndex: 0,
      deckCount: TOTAL_CARDS - FIRST_DEAL_TOTAL,
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
        useGameStore.getState().dealRemainingCards();
        return;
      }

      setState((prev) => ({
        ...prev,
        currentCardIndex: cardIndex,
        deckCount: remaining,
      }));
    }, 120);
  }, []);

  useEffect(() => {
    if (gameState.phase !== 'dealing2') return;
    if (gameState.highestBidder === 'bottom') return;

    startSecondDeal();
  }, [gameState.phase, gameState.highestBidder, startSecondDeal]);

  useEffect(() => {
    if (gameState.phase !== 'dealing2') return;
    if (gameState.highestBidder !== 'bottom') return;
    if (!gameState.trumpSuit) return;

    startSecondDeal();
  }, [
    gameState.phase,
    gameState.highestBidder,
    gameState.trumpSuit,
    startSecondDeal,
  ]);

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
