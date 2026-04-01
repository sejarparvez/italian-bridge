import { create } from 'zustand';
import type { Card, Suit } from '@/constants/cards';
import { getBotBid, selectBotTrump } from '@/game/bot/bot-bidding';
import { getBotPlay } from '@/game/bot/bot-play';
import {
  passBid as enginePassBid,
  placeBid,
  selectTrump,
} from '../game/bidding';
import {
  advanceToNextRound,
  createInitialState,
  dealSecondPhase,
  playCard,
} from '../game/engine';
import type { BotPlayResult, Difficulty, GameState } from '../game/types';

// ─── Store Interface ──────────────────────────────────────────────────────────

interface GameStore {
  state: GameState;
  difficulty: Difficulty;
  animSpeed: number;
  setDifficulty: (difficulty: Difficulty) => void;
  setAnimSpeed: (speed: number) => void;
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
  getState: () => GameStore;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(),
  difficulty: 'medium',
  animSpeed: 1,

  getState: () => get(),

  setDifficulty: (difficulty) => set({ difficulty }),
  setAnimSpeed: (animSpeed) => set({ animSpeed }),

  startNewGame: () => set({ state: createInitialState() }),

  // ── Player Bidding ──────────────────────────────────────────────────────────

  placePlayerBid: (bid) => {
    const newState = placeBid(get().state, 'bottom', bid);
    set({ state: newState });
    afterBidState(newState, get);
  },

  passPlayerBid: () => {
    const newState = enginePassBid(get().state, 'bottom');
    set({ state: newState });
    afterBidState(newState, get);
  },

  // ── Trump Selection ─────────────────────────────────────────────────────────

  selectPlayerTrump: (suit) => {
    const newState = selectTrump(get().state, suit, 'bottom');
    const dealtState = dealSecondPhase({ ...newState, phase: 'dealing2' });
    set({ state: { ...dealtState, phase: 'dealing2' } });
    setTimeout(() => {
      set((s) => ({ state: { ...s.state, phase: 'playing' } }));
    }, 800 / get().animSpeed);
  },

  // ── Player Card Play ────────────────────────────────────────────────────────

  playPlayerCard: (cardId, wantsToTrump = false) => {
    const card = get().state.players.bottom.hand.find((c) => c.id === cardId);
    if (!card) return;

    const newState = playCard(get().state, 'bottom', card, wantsToTrump);
    set({ state: newState });
    afterPlayState(newState, get);
  },

  revealTrump: () => {
    const { state } = get();
    if (state.trumpRevealed) return;
    set({ state: { ...state, trumpRevealed: true } });
  },

  // ── Bot Bidding ─────────────────────────────────────────────────────────────

  runBotBids: () => {
    const { difficulty } = get();
    let currentState = get().state;
    if (currentState.phase !== 'bidding') return;

    const processBots = () => {
      if (currentState.phase !== 'bidding') {
        if (currentState.phase === 'dealing2') {
          // Only auto-deal if a BOT won the bid
          if (currentState.highestBidder !== 'bottom') {
            setTimeout(() => get().dealRemainingCards(), 800 / get().animSpeed);
          } else {
            console.log(
              '[RUN_BOTS] Human won bid - waiting for human to select trump',
            );
          }
        }
        return;
      }

      const { biddingOrder, currentBidderIndex } = currentState;
      const seat = biddingOrder[currentBidderIndex];

      // Skip human — they act via placePlayerBid / passPlayerBid
      if (seat === 'bottom') return;

      const hand = currentState.players[seat].hand;

      const botBid = getBotBid(hand, difficulty, currentState.highestBid);

      currentState =
        botBid === 0
          ? enginePassBid(currentState, seat)
          : placeBid(currentState, seat, botBid);

      set({ state: currentState });

      if (currentState.phase === 'dealing2') {
        // Only auto-deal if a BOT won the bid
        if (currentState.highestBidder !== 'bottom') {
          setTimeout(() => get().dealRemainingCards(), 800 / get().animSpeed);
        } else {
          console.log(
            '[RUN_BOTS] Human won bid after bot bid - waiting for human to select trump',
          );
        }
        return;
      }

      setTimeout(processBots, 500 / get().animSpeed);
    };

    setTimeout(processBots, 300 / get().animSpeed);
  },

  // ── Second Deal ─────────────────────────────────────────────────────────────

  dealRemainingCards: () => {
    const currentState = get().state;
    const { difficulty } = get();
    const bidder = currentState.highestBidder;

    if (bidder && !currentState.players[bidder].isHuman) {
      const trump = selectBotTrump(
        currentState.players[bidder].hand,
        currentState.highestBid,
        difficulty,
      );
      const trumpState = selectTrump(currentState, trump, bidder);
      const nextState = dealSecondPhase({ ...trumpState, phase: 'dealing2' });
      set({ state: nextState });
      afterPlayState(nextState, get);
    }
  },

  // ── AI Play ─────────────────────────────────────────────────────────────────

  advanceAI: () => {
    const { state, difficulty } = get();
    if (state.phase !== 'playing') return;

    const currentSeat = state.currentSeat;
    if (currentSeat === 'bottom') return;

    const hand = state.players[currentSeat].hand;

    const botPlay = getBotPlay(
      hand,
      state.currentTrick,
      state.trumpSuit,
      state.trumpRevealed,
      state,
      difficulty,
      currentSeat,
    );

    if (!botPlay) return;

    const isBotPlayResult = (v: unknown): v is BotPlayResult =>
      typeof v === 'object' && v !== null && 'card' in v && 'wantsToTrump' in v;

    const botCard = isBotPlayResult(botPlay) ? botPlay.card : (botPlay as Card);
    const wantsToTrump = isBotPlayResult(botPlay)
      ? botPlay.wantsToTrump
      : false;

    const newState = playCard(state, currentSeat, botCard, wantsToTrump);
    set({ state: newState });
    afterPlayState(newState, get);
  },

  // ── Trick Cleanup ───────────────────────────────────────────────────────────

  clearTrick: () => {
    const { state } = get();
    const trickWinner = state.currentTrick.winningSeat ?? state.currentSeat;

    const newState: GameState = {
      ...state,
      currentTrick: { cards: [], leadSuit: null, winningSeat: null },
      currentSeat: trickWinner,
      phase: state.phase === 'roundEnd' ? 'roundEnd' : 'playing',
    };

    set({ state: newState });

    if (newState.phase === 'playing' && newState.currentSeat !== 'bottom') {
      setTimeout(() => get().advanceAI(), 300 / get().animSpeed);
    }
  },

  // ── Round Advancement ───────────────────────────────────────────────────────

  nextRound: () => {
    const newState = advanceToNextRound(get().state);
    set({ state: newState });

    if (newState.phase === 'gameEnd') return;

    if (newState.phase === 'bidding' && newState.currentSeat !== 'bottom') {
      setTimeout(() => get().runBotBids(), 600 / get().animSpeed);
    }
  },
}));

// ─── Shared Transition Helpers ────────────────────────────────────────────────

function afterBidState(newState: GameState, get: () => GameStore): void {
  if (newState.phase === 'bidding' && newState.currentSeat !== 'bottom') {
    setTimeout(() => get().runBotBids(), 600 / get().animSpeed);
  } else if (newState.phase === 'dealing2') {
    if (newState.highestBidder !== 'bottom') {
      setTimeout(() => get().dealRemainingCards(), 800 / get().animSpeed);
    }
  }
}

function afterPlayState(newState: GameState, get: () => GameStore): void {
  if (newState.phase === 'trickEnd') {
    setTimeout(() => get().clearTrick(), 1200 / get().animSpeed);
  } else if (
    newState.phase === 'playing' &&
    newState.currentSeat !== 'bottom'
  ) {
    setTimeout(() => get().advanceAI(), 500 / get().animSpeed);
  }
}
