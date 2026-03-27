import { create } from 'zustand';
import { GameState, SeatPosition, Difficulty } from '../game/types';
import { Suit } from '../constants/cards';
import {
  createInitialState,
  playCard,
  selectTrump,
  advanceToNextRound,
  revealTrump,
  placeBid,
  passBid,
} from '../game/engine';
import { getBotBid, selectBotTrump } from '../game/ai/bidAI';
import { getBotPlay } from '../game/ai/playAI';

interface GameStore {
  state: GameState;
  difficulty: Difficulty;
  animSpeed: number;
  setDifficulty: (difficulty: Difficulty) => void;
  setAnimSpeed: (speed: number) => void;
  startNewGame: () => void;
  placePlayerBid: (bid: number) => void;
  passBid: () => void;
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
    let newState = placeBid(get().state, 'bottom', bid);
    set({ state: newState });
    setTimeout(() => get().runBotBids(), 600 / get().animSpeed);
  },

  passBid: () => {
    const newState = passBid(get().state, 'bottom');
    set({ state: newState });
    setTimeout(() => get().runBotBids(), 600 / get().animSpeed);
  },

  selectPlayerTrump: (suit) => {
    const newState = selectTrump(get().state, suit);
    set({ state: newState });
  },

  playPlayerCard: (cardId) => {
    const card = get().state.players.bottom.hand.find(c => c.id === cardId);
    if (!card) return;

    let newState = playCard(get().state, 'bottom', card);
    
    if (newState.trumpSuit && !newState.trumpRevealed && 
        newState.currentTrick.cards.some(c => c.card.suit === newState.trumpSuit)) {
      newState = revealTrump(newState);
    }
    
    set({ state: newState });

    if (newState.phase === 'playing' && newState.currentSeat !== 'bottom') {
      setTimeout(() => get().advanceAI(), 500 / get().animSpeed);
    }
  },

  runBotBids: () => {
    const { state, difficulty } = get();
    if (state.phase !== 'bidding') return;

    const botSeats: SeatPosition[] = ['left', 'top', 'right'];
    let currentState = state;

    const processNextBot = (index: number) => {
      if (index >= botSeats.length) {
        if (currentState.phase === 'dealing2') {
          setTimeout(() => get().dealRemainingCards(), 800 / get().animSpeed);
        }
        return;
      }

      const seat = botSeats[index];
      const hand = currentState.players[seat].hand;
      
      const highCards = hand.filter(c => c.value >= 11).length;
      const shouldPass = highCards <= 1 && Math.random() > 0.5;
      
      const bid = shouldPass ? 0 : getBotBid(hand, difficulty);
      currentState = placeBid(currentState, seat, bid);
      set({ state: currentState });

      if (currentState.phase === 'dealing2') {
        setTimeout(() => get().dealRemainingCards(), 800 / get().animSpeed);
        return;
      }

      setTimeout(() => processNextBot(index + 1), 500 / get().animSpeed);
    };

    setTimeout(() => processNextBot(0), 300 / get().animSpeed);
  },

  dealRemainingCards: () => {
    const currentState = get().state;
    const newDeck = [...currentState.deck];
    
    const newPlayers = { ...currentState.players };
    const allSeats: SeatPosition[] = ['bottom', 'left', 'top', 'right'];
    
    let cardIndex = 20;
    for (const seat of allSeats) {
      for (let i = 0; i < 8; i++) {
        if (cardIndex < newDeck.length) {
          newPlayers[seat] = {
            ...newPlayers[seat],
            hand: [...newPlayers[seat].hand, newDeck[cardIndex]!],
          };
          cardIndex++;
        }
      }
    }

    const bidder = currentState.highestBidder!;
    const bidderHand = newPlayers[bidder].hand;
    const trump = selectBotTrump(bidderHand, currentState.highestBid);

    set({
      state: {
        ...currentState,
        players: newPlayers,
        phase: 'playing',
        trumpSuit: trump,
      },
    });
  },

  advanceAI: () => {
    const { state, difficulty } = get();
    if (state.phase !== 'playing') return;

    const currentSeat = state.currentSeat;
    if (currentSeat === 'bottom') return;

    const hand = state.players[currentSeat].hand;
    const botCard = getBotPlay(
      hand, state.currentTrick, state.trumpSuit,
      state, difficulty, currentSeat
    );

    if (!botCard) return;

    let newState = playCard(state, currentSeat, botCard);
    
    if (newState.trumpSuit && !newState.trumpRevealed && 
        newState.currentTrick.cards.some(c => c.card.suit === newState.trumpSuit)) {
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
    set({
      state: {
        ...state,
        currentTrick: { cards: [], leadSuit: null, winningSeat: null },
        phase: 'playing',
      },
    });

    if (state.currentSeat !== 'bottom') {
      setTimeout(() => get().advanceAI(), 300 / get().animSpeed);
    }
  },

  nextRound: () => {
    const newState = advanceToNextRound(get().state);
    set({ state: newState });
  },
}));