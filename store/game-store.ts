import { create } from 'zustand';
import type { BotPlayResult, Difficulty, GameState } from '@/types/game-type';
import type { Card, Suit } from '../constants/cards';
import { useSettingsStore } from './settings-store';
import {
  passBid as enginePassBid,
  placeBid,
  selectTrump,
} from '../game/bidding';
import { getBotBid, selectBotTrump } from '../game/bot/bot-bidding';
import { getBotPlay } from '../game/bot/bot-play';
import {
  advanceToNextRound,
  createInitialState,
  dealSecondPhase,
  playCard,
} from '../game/engine';
import { logger } from '../utils/logger';

interface GameStore {
  state: GameState;
  difficulty: Difficulty;
  animSpeed: number;
  winThreshold: number;
  setDifficulty: (difficulty: Difficulty) => void;
  setAnimSpeed: (speed: number) => void;
  setWinThreshold: (threshold: number) => void;
  startNewGame: () => void;
  placePlayerBid: (bid: number) => void;
  passPlayerBid: () => void;
  selectPlayerTrump: (suit: Suit) => void;
  playPlayerCard: (cardId: string, wantsToTrump?: boolean) => void;
  revealTrump: () => void;
  runBotBids: () => void;
  dealRemainingCards: () => void;
  advanceAI: () => void;
  clearTrick: () => void;
  nextRound: () => void;
}

function delay(ms: number, speed: number): number {
  return ms / Math.max(0.1, speed);
}

export const useGameStore = create<GameStore>((set, get) => {
  const settings = useSettingsStore.getState();
  return {
    state: createInitialState(),
    difficulty: settings.difficulty,
    animSpeed: settings.animSpeed,
    winThreshold: settings.winThreshold,

    setDifficulty: (difficulty) => {
      useSettingsStore.getState().setDifficulty(difficulty);
      set({ difficulty });
    },
    setAnimSpeed: (animSpeed) => {
      useSettingsStore.getState().setAnimSpeed(animSpeed);
      set({ animSpeed });
    },
    setWinThreshold: (winThreshold) => {
      useSettingsStore.getState().setWinThreshold(winThreshold);
      set({ winThreshold });
    },

    startNewGame: () => {
      logger.info('GameStore', 'Starting new game');
      set({ state: createInitialState() });
    },

    placePlayerBid: (bid) => {
      logger.info('GameStore', `Player placing bid: ${bid}`);
      const newState = placeBid(get().state, 'bottom', bid);
      set({ state: newState });
      afterBidState(newState, get);
    },

    passPlayerBid: () => {
      logger.info('GameStore', 'Player passing bid');
      const newState = enginePassBid(get().state, 'bottom');
      set({ state: newState });
      afterBidState(newState, get);
    },

    selectPlayerTrump: (suit) => {
      logger.info('GameStore', `Player selecting trump: ${suit}`);
      const newState = selectTrump(get().state, suit, 'bottom');
      set({ state: newState });
    },

    playPlayerCard: (cardId, wantsToTrump = false) => {
      const card = get().state.players.bottom.hand.find((c) => c.id === cardId);
      if (!card) return;

      const { winThreshold } = get();
      const newState = playCard(get().state, 'bottom', card, wantsToTrump, winThreshold);
      set({ state: newState });
      afterPlayState(newState, get);
    },

    revealTrump: () => {
      const { state } = get();
      if (state.trumpRevealed) return;
      if (state.phase !== 'playing' && state.phase !== 'trickEnd') return;
      logger.info('GameStore', 'Player revealing trump');
      set({ state: { ...state, trumpRevealed: true } });
    },

    runBotBids: () => {
      try {
        const { difficulty } = get();
        let currentState = get().state;
        if (currentState.phase !== 'bidding') return;

        const processBots = () => {
          currentState = get().state;
          if (currentState.phase !== 'bidding') return;

          const { biddingOrder, currentBidderIndex } = currentState;
          const seat = biddingOrder[currentBidderIndex];
          if (seat === 'bottom') return;

          const hand = currentState.players[seat].hand;
          const botBid = getBotBid(hand, difficulty, currentState.highestBid);

          currentState = botBid === 0
            ? enginePassBid(currentState, seat)
            : placeBid(currentState, seat, botBid);

          set({ state: currentState });

          if (currentState.phase === 'dealing2') {
            if (currentState.highestBidder !== 'bottom') {
              setTimeout(() => get().dealRemainingCards(), delay(800, get().animSpeed));
            }
            return;
          }

          setTimeout(processBots, delay(500, get().animSpeed));
        };

        setTimeout(processBots, delay(300, get().animSpeed));
      } catch (err) {
        logger.error('GameStore', `Error in runBotBids: ${err}`);
      }
    },

    dealRemainingCards: () => {
      const currentState = get().state;
      const { difficulty } = get();
      const bidder = currentState.highestBidder;
      if (!bidder || currentState.phase !== 'dealing2') return;

      if (currentState.players[bidder].isHuman) {
        const nextState = dealSecondPhase(currentState);
        set({ state: nextState });
        afterPlayState(nextState, get);
      } else {
        const trump = selectBotTrump(currentState.players[bidder].hand, currentState.highestBid, difficulty);
        const trumpState = { ...currentState, trumpSuit: trump, trumpCreator: bidder };
        const nextState = dealSecondPhase(trumpState);
        set({ state: nextState });
        afterPlayState(nextState, get);
      }
    },

    advanceAI: () => {
      try {
        const { state, difficulty, winThreshold } = get();
        if (state.phase !== 'playing') return;

        const currentSeat = state.currentSeat;
        if (currentSeat === 'bottom') return;

        const hand = state.players[currentSeat].hand;
        const botPlay = getBotPlay(hand, state.currentTrick, state.trumpSuit, state.trumpRevealed, state, difficulty, currentSeat);
        if (!botPlay) return;

        const isBotPlayResult = (v: unknown): v is BotPlayResult =>
          typeof v === 'object' && v !== null && 'card' in v && 'wantsToTrump' in v;

        const botCard = isBotPlayResult(botPlay) ? botPlay.card : (botPlay as Card);
        const wantsToTrump = isBotPlayResult(botPlay) ? botPlay.wantsToTrump : false;

        const newState = playCard(state, currentSeat, botCard, wantsToTrump, winThreshold);
        set({ state: newState });
        afterPlayState(newState, get);
      } catch (err) {
        logger.error('GameStore', `Error in advanceAI: ${err}`);
      }
    },

    clearTrick: () => {
      const { state } = get();
      const trickWinner = state.currentTrick.winningSeat ?? state.currentSeat;

      const newState: GameState = {
        ...state,
        currentTrick: { cards: [], leadSuit: null, winningSeat: null },
        currentSeat: trickWinner,
        phase: state.phase === 'roundEnd' ? 'roundEnd' : 'playing',
        trumpRevealed: state.trumpRevealed,
      };

      set({ state: newState });

      if (newState.phase === 'playing' && newState.currentSeat !== 'bottom') {
        setTimeout(() => get().advanceAI(), delay(300, get().animSpeed));
      }
    },

    nextRound: () => {
      const { winThreshold } = get();
      const newState = advanceToNextRound(get().state, winThreshold);
      set({ state: newState });

      if (newState.phase === 'gameEnd') return;

      if (newState.phase === 'bidding' && newState.currentSeat !== 'bottom') {
        setTimeout(() => get().runBotBids(), delay(600, get().animSpeed));
      }
    },
  };
});

function afterBidState(newState: GameState, get: () => GameStore): void {
  if (newState.phase === 'bidding' && newState.currentSeat !== 'bottom') {
    setTimeout(() => get().runBotBids(), delay(600, get().animSpeed));
  }
}

function afterPlayState(newState: GameState, get: () => GameStore): void {
  if (newState.phase === 'trickEnd') {
    setTimeout(() => get().clearTrick(), delay(1200, get().animSpeed));
  } else if (newState.phase === 'playing' && newState.currentSeat !== 'bottom') {
    setTimeout(() => get().advanceAI(), delay(500, get().animSpeed));
  }
}