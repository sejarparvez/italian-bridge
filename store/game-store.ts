import { create } from 'zustand';
import type { BotPlayResult, Difficulty, GameState } from '@/types/game-type';
import type { Card, Suit } from '../constants/cards';
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
}

// ─── Safe speed helper ────────────────────────────────────────────────────────
// Prevents division by zero if animSpeed is ever set to 0.
// All setTimeout calls go through this instead of dividing directly.

function delay(ms: number, speed: number): number {
  return ms / Math.max(0.1, speed);
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  state: createInitialState(),
  difficulty: 'medium',
  animSpeed: 1,

  setDifficulty: (difficulty) => set({ difficulty }),
  setAnimSpeed: (animSpeed) => set({ animSpeed }),

  startNewGame: () => {
    logger.info('GameStore', 'Starting new game');
    set({ state: createInitialState() });
  },

  // ── Player Bidding ──────────────────────────────────────────────────────────

  placePlayerBid: (bid) => {
    logger.info('GameStore', `Player placing bid: ${bid}`);
    const newState = placeBid(get().state, 'bottom', bid);
    logger.debug(
      'GameStore',
      `After placeBid: phase=${newState.phase}, currentSeat=${newState.currentSeat}, highestBid=${newState.highestBid}, highestBidder=${newState.highestBidder}`,
    );
    set({ state: newState });
    afterBidState(newState, get);
  },

  passPlayerBid: () => {
    logger.info('GameStore', 'Player passing bid');
    const newState = enginePassBid(get().state, 'bottom');
    logger.debug(
      'GameStore',
      `After passBid: phase=${newState.phase}, currentSeat=${newState.currentSeat}`,
    );
    set({ state: newState });
    afterBidState(newState, get);
  },

  // ── Trump Selection ─────────────────────────────────────────────────────────

  selectPlayerTrump: (suit) => {
    logger.info('GameStore', `Player selecting trump: ${suit}`);
    const newState = selectTrump(get().state, suit, 'bottom');
    const dealtState = dealSecondPhase(newState);
    logger.debug(
      'GameStore',
      `After dealSecondPhase: phase=${dealtState.phase}, currentSeat=${dealtState.currentSeat}, handSize=${dealtState.players.bottom.hand.length}`,
    );
    set({ state: dealtState });
    afterPlayState(dealtState, get);
  },

  // ── Player Card Play ────────────────────────────────────────────────────────

  playPlayerCard: (cardId, wantsToTrump = false) => {
    logger.info(
      'GameStore',
      `Player playing card: ${cardId}, wantsToTrump=${wantsToTrump}`,
    );
    const card = get().state.players.bottom.hand.find((c) => c.id === cardId);
    if (!card) {
      logger.error('GameStore', `Card not found in hand: ${cardId}`);
      return;
    }

    const newState = playCard(get().state, 'bottom', card, wantsToTrump);
    logger.debug(
      'GameStore',
      `After playCard: phase=${newState.phase}, currentSeat=${newState.currentSeat}, trickCards=${newState.currentTrick.cards.length}`,
    );
    set({ state: newState });
    afterPlayState(newState, get);
  },

  revealTrump: () => {
    const { state } = get();
    if (state.trumpRevealed) return;
    logger.info('GameStore', 'Player revealing trump');
    set({ state: { ...state, trumpRevealed: true } });
  },

  // ── Bot Bidding ─────────────────────────────────────────────────────────────

  runBotBids: () => {
    try {
      const { difficulty } = get();
      let currentState = get().state;
      if (currentState.phase !== 'bidding') {
        logger.debug(
          'GameStore',
          `runBotBids skipped: phase=${currentState.phase}`,
        );
        return;
      }

      logger.info(
        'GameStore',
        `Starting bot bidding: currentSeat=${currentState.currentSeat}, biddingOrder=${currentState.biddingOrder}`,
      );

      const processBots = () => {
        try {
          currentState = get().state;
          logger.debug(
            'GameStore',
            `processBots loop: phase=${currentState.phase}, currentBidderIndex=${currentState.currentBidderIndex}`,
          );

          if (currentState.phase !== 'bidding') {
            if (currentState.phase === 'dealing2') {
              logger.info(
                'GameStore',
                `Bidding ended: dealing2, highestBidder=${currentState.highestBidder}`,
              );
              if (currentState.highestBidder !== 'bottom') {
                logger.info(
                  'GameStore',
                  `Bot won bid, triggering dealRemainingCards`,
                );
                setTimeout(
                  () => get().dealRemainingCards(),
                  delay(800, get().animSpeed),
                );
              } else {
                logger.info(
                  'GameStore',
                  'Human won bid - waiting for human to select trump',
                );
              }
            }
            return;
          }

          const { biddingOrder, currentBidderIndex } = currentState;
          const seat = biddingOrder[currentBidderIndex];
          logger.debug(
            'GameStore',
            `Processing bot bid: seat=${seat}, currentBidderIndex=${currentBidderIndex}`,
          );

          if (seat === 'bottom') {
            logger.debug(
              'GameStore',
              `Human's turn to bid - skipping bot processing`,
            );
            return;
          }

          const hand = currentState.players[seat].hand;
          logger.debug('GameStore', `Bot ${seat} hand size: ${hand.length}`);

          const botBid = getBotBid(hand, difficulty, currentState.highestBid);
          logger.debug('GameStore', `Bot ${seat} bid decision: ${botBid}`);

          currentState =
            botBid === 0
              ? enginePassBid(currentState, seat)
              : placeBid(currentState, seat, botBid);

          set({ state: currentState });
          logger.debug(
            'GameStore',
            `After bot bid: phase=${currentState.phase}, highestBid=${currentState.highestBid}`,
          );

          if (currentState.phase === 'dealing2') {
            logger.info(
              'GameStore',
              `Bidding ended: dealing2, highestBidder=${currentState.highestBidder}`,
            );
            if (currentState.highestBidder !== 'bottom') {
              logger.info(
                'GameStore',
                'Bot won bid - triggering dealRemainingCards',
              );
              setTimeout(
                () => get().dealRemainingCards(),
                delay(800, get().animSpeed),
              );
            } else {
              logger.info(
                'GameStore',
                'Human won bid - waiting for human to select trump',
              );
            }
            return;
          }

          setTimeout(processBots, delay(500, get().animSpeed));
        } catch (err) {
          logger.error('GameStore', `Error in processBots: ${err}`);
        }
      };

      setTimeout(processBots, delay(300, get().animSpeed));
    } catch (err) {
      logger.error('GameStore', `Error in runBotBids: ${err}`);
    }
  },

  // ── Second Deal ─────────────────────────────────────────────────────────────

  dealRemainingCards: () => {
    logger.info('GameStore', 'Starting dealRemainingCards');
    const currentState = get().state;
    const { difficulty } = get();
    const bidder = currentState.highestBidder;
    logger.debug(
      'GameStore',
      `dealRemainingCards: bidder=${bidder}, highestBid=${currentState.highestBid}`,
    );

    if (bidder && !currentState.players[bidder].isHuman) {
      const trump = selectBotTrump(
        currentState.players[bidder].hand,
        currentState.highestBid,
        difficulty,
      );
      logger.info('GameStore', `Bot selecting trump: ${trump}`);
      const trumpState = selectTrump(currentState, trump, bidder);
      const nextState = dealSecondPhase(trumpState);
      logger.debug(
        'GameStore',
        `After dealSecondPhase: phase=${nextState.phase}, currentSeat=${nextState.currentSeat}, handSize=${nextState.players.bottom.hand.length}`,
      );
      set({ state: nextState });
      afterPlayState(nextState, get);
    } else {
      logger.warn(
        'GameStore',
        `dealRemainingCards skipped: bidder=${bidder}, isHuman=${bidder ? currentState.players[bidder].isHuman : 'N/A'}`,
      );
    }
  },

  // ── AI Play ─────────────────────────────────────────────────────────────────

  advanceAI: () => {
    try {
      const { state, difficulty } = get();
      logger.debug(
        'GameStore',
        `advanceAI: phase=${state.phase}, currentSeat=${state.currentSeat}`,
      );
      if (state.phase !== 'playing') {
        logger.debug('GameStore', `advanceAI skipped: not in playing phase`);
        return;
      }

      const currentSeat = state.currentSeat;
      if (currentSeat === 'bottom') {
        logger.debug('GameStore', `advanceAI skipped: human's turn`);
        return;
      }

      const hand = state.players[currentSeat].hand;
      logger.debug(
        'GameStore',
        `Bot ${currentSeat} playing, hand size: ${hand.length}`,
      );

      const botPlay = getBotPlay(
        hand,
        state.currentTrick,
        state.trumpSuit,
        state.trumpRevealed,
        state,
        difficulty,
        currentSeat,
      );

      if (!botPlay) {
        logger.warn('GameStore', `Bot play returned null for ${currentSeat}`);
        return;
      }

      const isBotPlayResult = (v: unknown): v is BotPlayResult =>
        typeof v === 'object' &&
        v !== null &&
        'card' in v &&
        'wantsToTrump' in v;

      const botCard = isBotPlayResult(botPlay)
        ? botPlay.card
        : (botPlay as Card);
      const wantsToTrump = isBotPlayResult(botPlay)
        ? botPlay.wantsToTrump
        : false;

      logger.info(
        'GameStore',
        `Bot ${currentSeat} playing: ${botCard.id}, wantsToTrump=${wantsToTrump}`,
      );
      const newState = playCard(state, currentSeat, botCard, wantsToTrump);
      logger.debug(
        'GameStore',
        `After bot play: phase=${newState.phase}, currentSeat=${newState.currentSeat}, trickCards=${newState.currentTrick.cards.length}`,
      );
      set({ state: newState });
      afterPlayState(newState, get);
    } catch (err) {
      logger.error('GameStore', `Error in advanceAI: ${err}`);
    }
  },

  // ── Trick Cleanup ───────────────────────────────────────────────────────────

  clearTrick: () => {
    logger.info('GameStore', 'Clearing trick');
    const { state } = get();
    const trickWinner = state.currentTrick.winningSeat ?? state.currentSeat;
    logger.debug(
      'GameStore',
      `Trick winner: ${trickWinner}, completedTricks: ${state.completedTricks.length}`,
    );

    const newState: GameState = {
      ...state,
      currentTrick: { cards: [], leadSuit: null, winningSeat: null },
      currentSeat: trickWinner,
      phase: state.phase === 'roundEnd' ? 'roundEnd' : 'playing',
    };

    set({ state: newState });

    if (newState.phase === 'playing' && newState.currentSeat !== 'bottom') {
      setTimeout(() => get().advanceAI(), delay(300, get().animSpeed));
    }
  },

  // ── Round Advancement ───────────────────────────────────────────────────────

  nextRound: () => {
    logger.info('GameStore', 'Advancing to next round');
    const newState = advanceToNextRound(get().state);
    logger.debug(
      'GameStore',
      `After nextRound: phase=${newState.phase}, round=${newState.round}, dealer=${newState.dealer}, currentSeat=${newState.currentSeat}`,
    );
    set({ state: newState });

    if (newState.phase === 'gameEnd') return;

    if (newState.phase === 'bidding' && newState.currentSeat !== 'bottom') {
      setTimeout(() => get().runBotBids(), delay(600, get().animSpeed));
    }
  },
}));

// ─── Shared Transition Helpers ────────────────────────────────────────────────

function afterBidState(newState: GameState, get: () => GameStore): void {
  if (newState.phase === 'bidding' && newState.currentSeat !== 'bottom') {
    setTimeout(() => get().runBotBids(), delay(600, get().animSpeed));
  } else if (newState.phase === 'dealing2') {
    if (newState.highestBidder !== 'bottom') {
      setTimeout(() => get().dealRemainingCards(), delay(800, get().animSpeed));
    }
  }
}

function afterPlayState(newState: GameState, get: () => GameStore): void {
  logger.debug(
    'GameStore',
    `afterPlayState: phase=${newState.phase}, currentSeat=${newState.currentSeat}, trickCards=${newState.currentTrick.cards.length}`,
  );

  if (newState.phase === 'trickEnd') {
    logger.info('GameStore', 'Scheduling clearTrick');
    setTimeout(
      () => {
        try {
          get().clearTrick();
        } catch (err) {
          logger.error('GameStore', `Error in clearTrick: ${err}`);
        }
      },
      delay(1200, get().animSpeed),
    );
  } else if (
    newState.phase === 'playing' &&
    newState.currentSeat !== 'bottom'
  ) {
    logger.info(
      'GameStore',
      `Scheduling advanceAI for ${newState.currentSeat}`,
    );
    setTimeout(
      () => {
        try {
          get().advanceAI();
        } catch (err) {
          logger.error('GameStore', `Error in advanceAI: ${err}`);
        }
      },
      delay(500, get().animSpeed),
    );
  }
}
