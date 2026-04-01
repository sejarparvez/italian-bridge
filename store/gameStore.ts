import { Card, Suit } from '@/constants/cards';
import { getBotBid, selectBotTrump } from '@/game/bot/bot-bidding';
import { getBotPlay } from '@/game/bot/bot-play';
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
import { BotPlayResult, Difficulty, GameState } from '../game/types';

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
  runBotBids: () => void;
  dealRemainingCards: () => void;
  advanceAI: () => void;
  clearTrick: () => void;
  nextRound: () => void;
  getState: () => GameStore;
  // NOTE: revealTrump() has been removed. Trump reveal is now atomic with card
  // play — triggered by wantsToTrump=true inside playCard. A standalone reveal
  // action would allow the reveal to fire without a card following it, which
  // violates the rule that only a committed trump play triggers the reveal.
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
    console.log('[STORE] selectPlayerTrump called with suit:', suit);
    const newState = selectTrump(get().state, suit, 'bottom');
    console.log('[STORE] After selectTrump - phase:', newState.phase, 'trumpSuit:', newState.trumpSuit);
    // selectTrump sets phase to 'playing', but dealSecondPhase requires 'dealing2'
    const dealtState = dealSecondPhase({ ...newState, phase: 'dealing2' });
    console.log('[STORE] After dealSecondPhase - phase:', dealtState.phase);
    // Add delay before transitioning to playing so trump picker can show
    set({ state: { ...dealtState, phase: 'dealing2' } });
    console.log('[STORE] Set state with phase: dealing2, will transition to playing after delay');
    setTimeout(() => {
      console.log('[STORE] Timeout complete - transitioning to playing');
      set(s => ({ state: { ...s.state, phase: 'playing' } }));
    }, 800 / get().animSpeed);
  },

  // ── Player Card Play ────────────────────────────────────────────────────────

  // wantsToTrump should be true ONLY when:
  //   (a) trump is still hidden (state.trumpRevealed === false), AND
  //   (b) the player cannot follow the led suit, AND
  //   (c) the player consciously chose "Reveal & Trump" in the UI dialog.
  //
  // When trump is already revealed, the UI skips the dialog entirely and calls
  // this with no flag (defaults to false). playCard handles the rest.
  playPlayerCard: (cardId, wantsToTrump = false) => {
    const card = get().state.players.bottom.hand.find(c => c.id === cardId);
    if (!card) return;

    const newState = playCard(get().state, 'bottom', card, wantsToTrump);
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
        console.log('[RUN_BOTS] Phase not bidding, checking next steps');
        if (currentState.phase === 'dealing2') {
          // Only auto-deal if a BOT won the bid
          if (currentState.highestBidder !== 'bottom') {
            console.log('[RUN_BOTS] Bot won bid, auto-dealing remaining cards');
            setTimeout(() => get().dealRemainingCards(), 800 / get().animSpeed);
          } else {
            console.log('[RUN_BOTS] Human won bid - waiting for human to select trump');
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

      currentState = botBid === 0
        ? enginePassBid(currentState, seat)
        : placeBid(currentState, seat, botBid);

      set({ state: currentState });

      if (currentState.phase === 'dealing2') {
        // Only auto-deal if a BOT won the bid
        if (currentState.highestBidder !== 'bottom') {
          console.log('[RUN_BOTS] After bot bid, auto-dealing remaining cards');
          setTimeout(() => get().dealRemainingCards(), 800 / get().animSpeed);
        } else {
          console.log('[RUN_BOTS] Human won bid after bot bid - waiting for human to select trump');
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
        difficulty
      );
      const trumpState  = selectTrump(currentState, trump, bidder);
      const nextState   = dealSecondPhase({ ...trumpState, phase: 'dealing2' });
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

    // getBotPlay returns { card, wantsToTrump } so the bot can signal its intent
    // to reveal trump — matching the same rule the human follows:
    //   - wantsToTrump=true only when trump is hidden AND the bot cannot follow
    //     suit AND it decides trumping is strategically worthwhile.
    //   - wantsToTrump=false (or omitted) when trump is already revealed — the
    //     bot simply plays freely with no reveal step needed.
    const botPlay = getBotPlay(
      hand,
      state.currentTrick,
      state.trumpSuit,
      state.trumpRevealed,
      state,
      difficulty,
      currentSeat
    );

    if (!botPlay) return;

    // Type guard — returns true only when getBotPlay has been updated to return
    // BotPlayResult. Falls back gracefully to treating the return as a bare Card
    // so this compiles without error before bot-play.ts is updated.
    const isBotPlayResult = (v: unknown): v is BotPlayResult =>
      typeof v === 'object' && v !== null && 'card' in v && 'wantsToTrump' in v;

    const botCard      = isBotPlayResult(botPlay) ? botPlay.card      : (botPlay as Card);
    const wantsToTrump = isBotPlayResult(botPlay) ? botPlay.wantsToTrump : false;

    const newState = playCard(state, currentSeat, botCard, wantsToTrump);
    set({ state: newState });
    afterPlayState(newState, get);
  },

  // ── Trick Cleanup ───────────────────────────────────────────────────────────

  // trumpRevealed is intentionally NOT reset here — it must persist for the
  // entire round. Once trump is revealed in any trick, all subsequent tricks
  // in the same round have it revealed. Only advanceToNextRound resets it.
  clearTrick: () => {
    const { state } = get();
    const trickWinner = state.currentTrick.winningSeat ?? state.currentSeat;

    const newState: GameState = {
      ...state,
      currentTrick: { cards: [], leadSuit: null, winningSeat: null },
      currentSeat: trickWinner,
      phase: state.phase === 'roundEnd' ? 'roundEnd' : 'playing',
      // trumpRevealed is preserved via the spread above — do not override it here
    };

    set({ state: newState });

    if (newState.phase === 'playing' && newState.currentSeat !== 'bottom') {
      setTimeout(() => get().advanceAI(), 300 / get().animSpeed);
    }
  },

  // ── Round Advancement ───────────────────────────────────────────────────────

  // advanceToNextRound in the engine is responsible for resetting trumpRevealed
  // to false along with all other per-round state. Verify this in engine.ts if
  // trump ever appears pre-revealed at the start of a new round.
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
    if (newState.highestBidder !== 'bottom') {
      setTimeout(() => get().dealRemainingCards(), 800 / get().animSpeed);
    }
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