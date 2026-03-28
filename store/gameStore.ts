import { Suit } from '@/src/constants/cards';
import { create } from 'zustand';
import { getBotBid, selectBotTrump } from '../game/ai/bidAI';
import { getBotPlay } from '../game/ai/playAI';
import {
  advanceToNextRound,
  createInitialState,
  dealRemainingCards as engineDealRemainingCards,
  passBid as enginePassBid,
  placeBid,
  playCard,
  revealTrump,
  selectTrump,
} from '../game/engine';
import { Difficulty, GameState, SeatPosition } from '../game/types';

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

const initialState = createInitialState();

export const useGameStore = create<GameStore>((set, get) => ({
  state: initialState,
  difficulty: 'medium',
  animSpeed: 1,

  getState: () => get(),

  setDifficulty: (difficulty) => set({ difficulty }),
  setAnimSpeed: (animSpeed) => set({ animSpeed }),

  startNewGame: () => set({ state: createInitialState() }),

  placePlayerBid: (bid) => {
    const newState = placeBid(get().state, 'bottom', bid);
    set({ state: newState });
    // After human bids, let bots take their turns
    if (newState.phase === 'bidding') {
      setTimeout(() => get().runBotBids(), 600 / get().animSpeed);
    } else if (newState.phase === 'dealing2') {
      setTimeout(() => get().dealRemainingCards(), 800 / get().animSpeed);
    }
  },

  // FIX: renamed from passBid to passPlayerBid to avoid name collision with the
  // imported engine passBid. The old code shadowed the import, causing the
  // store method to call itself recursively.
  passPlayerBid: () => {
    // FIX: was calling placeBid with bid=0. Passing must go through enginePassBid
    // so the bidding state machine handles it correctly (0 is not a valid bid value
    // in placeBid — it only handles bids in BID_MIN..BID_MAX range).
    const newState = enginePassBid(get().state, 'bottom');
    set({ state: newState });
    if (newState.phase === 'bidding') {
      setTimeout(() => get().runBotBids(), 600 / get().animSpeed);
    } else if (newState.phase === 'dealing2') {
      setTimeout(() => get().dealRemainingCards(), 800 / get().animSpeed);
    }
  },

  selectPlayerTrump: (suit) => {
    const newState = selectTrump(get().state, suit);
    set({ state: newState });
  },

  playPlayerCard: (cardId) => {
    const card = get().state.players.bottom.hand.find(c => c.id === cardId);
    if (!card) return;

    let newState = playCard(get().state, 'bottom', card);

    // Reveal trump if a trump card was just played and trump isn't revealed yet.
    // Guard: trumpSuit must be non-null before checking card suits.
    if (
      newState.trumpSuit !== null &&
      !newState.trumpRevealed &&
      newState.currentTrick.cards.some(c => c.card.suit === newState.trumpSuit)
    ) {
      newState = revealTrump(newState);
    }

    set({ state: newState });

    if (newState.phase === 'trickEnd') {
      setTimeout(() => get().clearTrick(), 1200 / get().animSpeed);
    } else if (newState.phase === 'playing' && newState.currentSeat !== 'bottom') {
      setTimeout(() => get().advanceAI(), 500 / get().animSpeed);
    }
  },

  runBotBids: () => {
    const { difficulty } = get();
    let currentState = get().state;

    if (currentState.phase !== 'bidding') return;

    // FIX: was iterating ['left', 'top', 'right'] unconditionally from index 0,
    // ignoring the actual bidding order and currentBidderIndex. This meant bots
    // always bid in the wrong order after the human went first (or second, etc.)
    // and could re-bid seats that already placed a bid.
    //
    // Now we walk the real biddingOrder starting from currentBidderIndex,
    // skipping any seat that is human ('bottom') or has already bid (bid !== null).
    const processBots = () => {
      if (currentState.phase !== 'bidding') {
        // Bidding ended — move to dealing phase
        if (currentState.phase === 'dealing2') {
          setTimeout(() => get().dealRemainingCards(), 800 / get().animSpeed);
        }
        return;
      }

      const { biddingOrder, currentBidderIndex, players } = currentState;
      const seat = biddingOrder[currentBidderIndex];

      // Skip human player — they act via placePlayerBid / passPlayerBid
      if (seat === 'bottom') return;

      const hand = players[seat].hand;
      const highCards = hand.filter(c => c.value >= 11).length;
      // Bots with very weak hands prefer to pass
      const shouldPass = highCards <= 1 && Math.random() > 0.5;

      if (shouldPass) {
        // FIX: was calling placeBid(currentState, seat, 0). Must use enginePassBid
        // so the bidding state machine transitions correctly.
        currentState = enginePassBid(currentState, seat);
      } else {
        currentState = placeBid(currentState, seat, getBotBid(hand, difficulty));
      }

      set({ state: currentState });

      if (currentState.phase === 'dealing2') {
        setTimeout(() => get().dealRemainingCards(), 800 / get().animSpeed);
        return;
      }

      // Continue to next bidder
      setTimeout(processBots, 500 / get().animSpeed);
    };

    setTimeout(processBots, 300 / get().animSpeed);
  },

  dealRemainingCards: () => {
    const currentState = get().state;

    // FIX: the store was reimplementing deal logic inline with a hardcoded
    // cardIndex=20 offset, bypassing the engine entirely and duplicating fragile
    // logic. Now delegates to the engine's dealRemainingCards, which correctly
    // derives the offset from INITIAL_DEAL_COUNT and advances idx per player.
    const currentHands = {
      bottom: currentState.players.bottom.hand,
      top: currentState.players.top.hand,
      left: currentState.players.left.hand,
      right: currentState.players.right.hand,
    };
    const dealtHands = engineDealRemainingCards(currentState.deck, currentHands, 5);

    const newPlayers = { ...currentState.players };
    for (const seat of ['bottom', 'left', 'top', 'right'] as SeatPosition[]) {
      newPlayers[seat] = { ...newPlayers[seat], hand: dealtHands[seat] };
    }

    const bidder = currentState.highestBidder;

    // FIX: was always calling selectBotTrump and setting trumpSuit directly,
    // which bypassed the human trump-selection phase entirely. If the human won
    // the bid, we must transition to 'dealing2' so the UI can prompt them to
    // pick trump. Only auto-select trump when a bot won the bid.
    if (bidder && newPlayers[bidder].isHuman === false) {
      const trump = selectBotTrump(newPlayers[bidder].hand, currentState.highestBid);
      const nextState = selectTrump(
        { ...currentState, players: newPlayers },
        trump
      );
      set({ state: nextState });
    } else {
      // Human bidder: stay in dealing2 so the trump-selection UI renders
      set({
        state: {
          ...currentState,
          players: newPlayers,
          phase: 'dealing2',
        },
      });
    }
  },

  advanceAI: () => {
    const { state, difficulty } = get();
    if (state.phase !== 'playing') return;

    const currentSeat = state.currentSeat;
    if (currentSeat === 'bottom') return;

    const hand = state.players[currentSeat].hand;

    // FIX: was missing trumpRevealed — getBotPlay now requires it so bots
    // respect the same card-legality rules as the human player.
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

    let newState = playCard(state, currentSeat, botCard);

    if (
      newState.trumpSuit !== null &&
      !newState.trumpRevealed &&
      newState.currentTrick.cards.some(c => c.card.suit === newState.trumpSuit)
    ) {
      newState = revealTrump(newState);
    }

    set({ state: newState });

    if (newState.phase === 'trickEnd') {
      setTimeout(() => get().clearTrick(), 1200 / get().animSpeed);
    } else if (newState.phase === 'playing' && newState.currentSeat !== 'bottom') {
      setTimeout(() => get().advanceAI(), 600 / get().animSpeed);
    }
  },

  clearTrick: () => {
    const { state } = get();

    // The trick winner is stored on the completed trick; they lead the next trick.
    const trickWinner = state.currentTrick.winningSeat ?? state.currentSeat;

    const newState: GameState = {
      ...state,
      currentTrick: { cards: [], leadSuit: null, winningSeat: null },
      currentSeat: trickWinner,
      phase: state.phase === 'roundEnd' ? 'roundEnd' : 'playing',
    };

    set({ state: newState });

    // FIX: was reading state.currentSeat (the OLD state, before the trick was
    // cleared and winner assigned). Now checks newState.currentSeat — the seat
    // that actually leads the next trick — to decide if AI should continue.
    if (newState.phase === 'playing' && newState.currentSeat !== 'bottom') {
      setTimeout(() => get().advanceAI(), 300 / get().animSpeed);
    }
  },

  nextRound: () => {
    const newState = advanceToNextRound(get().state);
    set({ state: newState });
    // If the first bidder in the new round is a bot, kick off their bids
    if (newState.phase === 'bidding' && newState.currentSeat !== 'bottom') {
      setTimeout(() => get().runBotBids(), 600 / get().animSpeed);
    }
  },
}));