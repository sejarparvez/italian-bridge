import { Suit } from '@/constants/cards';
import { getBotBid, selectBotTrump } from '@/game/ai/bidAI';
import { getBotPlay } from '@/game/ai/playAI';
import { create } from 'zustand';
import {
  passBid as enginePassBid,
  placeBid,
  selectTrump,
} from '../game/bidding';
import {
  advanceToNextRound,
  createInitialState,
  dealSecondPhase,
  playCard
} from '../game/engine';
import { Difficulty, GameState } from '../game/types';

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
  playPlayerCard: (cardId: string) => void;
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
  setAnimSpeed:  (animSpeed)  => set({ animSpeed }),

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
    // FIX: pass 'bottom' as seat so selectTrump can validate the caller is
    // the highest bidder. Previously called without seat argument.
    const newState = selectTrump(get().state, suit, 'bottom');
    set({ state: newState });
    // After human selects trump, deal remaining cards
    setTimeout(() => get().dealRemainingCards(), 400 / get().animSpeed);
  },

  // ── Player Card Play ────────────────────────────────────────────────────────

  playPlayerCard: (cardId) => {
    const card = get().state.players.bottom.hand.find(c => c.id === cardId);
    if (!card) return;

    // FIX: removed manual trumpRevealed check — playCard in the engine now
    // handles auto-reveal when a trump card is played. No need to duplicate here.
    const newState = playCard(get().state, 'bottom', card);
    set({ state: newState });
    afterPlayState(newState, get);
  },

  // ── Bot Bidding ─────────────────────────────────────────────────────────────

  runBotBids: () => {
    const { difficulty } = get();
    let currentState = get().state;
    if (currentState.phase !== 'bidding') return;

    const processBots = () => {
      if (currentState.phase !== 'bidding') {
        if (currentState.phase === 'dealing2') {
          setTimeout(() => get().dealRemainingCards(), 800 / get().animSpeed);
        }
        return;
      }

      const { biddingOrder, currentBidderIndex } = currentState;
      const seat = biddingOrder[currentBidderIndex];

      // Skip human — they act via placePlayerBid / passPlayerBid
      if (seat === 'bottom') return;

      const hand = currentState.players[seat].hand;

      // FIX: pass currentHighestBid so getBotBid can decide to pass (return 0)
      // if its estimate doesn't beat the table. The old inline `highCards <= 1`
      // pass check is removed — getBotBid handles all pass logic internally.
      const botBid = getBotBid(hand, difficulty, currentState.highestBid);

      currentState = botBid === 0
        ? enginePassBid(currentState, seat)
        : placeBid(currentState, seat, botBid);

      set({ state: currentState });

      if (currentState.phase === 'dealing2') {
        setTimeout(() => get().dealRemainingCards(), 800 / get().animSpeed);
        return;
      }

      setTimeout(processBots, 500 / get().animSpeed);
    };

    setTimeout(processBots, 300 / get().animSpeed);
  },

  // ── Second Deal ─────────────────────────────────────────────────────────────

  dealRemainingCards: () => {
    const currentState = get().state;

    // FIX: removed inline hand-merging logic — delegate entirely to the engine's
    // dealSecondPhase which handles offset calculation and phase transition.
    // Also fixed: selectBotTrump now receives difficulty as third argument,
    // and selectTrump now receives seat for caller validation.
    const { difficulty } = get();
    const bidder = currentState.highestBidder;

    if (bidder && !currentState.players[bidder].isHuman) {
      // Bot won the bid — deal full hands then auto-select trump
      const dealtState = dealSecondPhase(currentState);
      const trump = selectBotTrump(
        dealtState.players[bidder].hand,
        dealtState.highestBid,
        difficulty  // FIX: was missing; selectBotTrump requires difficulty for threshold logic
      );
      const nextState = selectTrump(dealtState, trump, bidder);
      set({ state: nextState });
      afterPlayState(nextState, get);
    } else {
      // Human won the bid — deal full hands and wait for human to pick trump
      // dealSecondPhase transitions to 'playing' but we need 'dealing2' here
      // so the trump-selection UI renders. Set phase manually after dealing.
      const dealtState = dealSecondPhase({ ...currentState, phase: 'dealing2' });
      set({ state: { ...dealtState, phase: 'dealing2' } });
    }
  },

  // ── AI Play ─────────────────────────────────────────────────────────────────

  advanceAI: () => {
    const { state, difficulty } = get();
    if (state.phase !== 'playing') return;

    const currentSeat = state.currentSeat;
    if (currentSeat === 'bottom') return;

    const hand = state.players[currentSeat].hand;
    const botCard = getBotPlay(
      hand,
      state.currentTrick,
      state.trumpSuit,
      state.trumpRevealed,
      state,
      difficulty,
      currentSeat
    );

    if (!botCard) return;

    // FIX: removed manual trumpRevealed check — playCard handles auto-reveal.
    const newState = playCard(state, currentSeat, botCard);
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

    // FIX: check for gameEnd before trying to start bot bids.
    // advanceToNextRound returns phase: 'gameEnd' if ±30 threshold is hit.
    if (newState.phase === 'gameEnd') return;

    if (newState.phase === 'bidding' && newState.currentSeat !== 'bottom') {
      setTimeout(() => get().runBotBids(), 600 / get().animSpeed);
    }
  },
}));

// ─── Shared Transition Helpers ────────────────────────────────────────────────

/**
 * Called after any bid action (human or bot) to trigger the next step.
 */
function afterBidState(
  newState: GameState,
  get: () => GameStore
): void {
  if (newState.phase === 'bidding' && newState.currentSeat !== 'bottom') {
    setTimeout(() => get().runBotBids(), 600 / get().animSpeed);
  } else if (newState.phase === 'dealing2') {
    setTimeout(() => get().dealRemainingCards(), 800 / get().animSpeed);
  }
}

/**
 * Called after any card play (human or bot) to trigger the next step.
 * Handles trickEnd → clearTrick and playing → advanceAI transitions.
 */
function afterPlayState(
  newState: GameState,
  get: () => GameStore
): void {
  if (newState.phase === 'trickEnd') {
    setTimeout(() => get().clearTrick(), 1200 / get().animSpeed);
  } else if (newState.phase === 'playing' && newState.currentSeat !== 'bottom') {
    setTimeout(() => get().advanceAI(), 500 / get().animSpeed);
  }
}