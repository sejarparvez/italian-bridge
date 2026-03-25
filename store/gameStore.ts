import { create } from 'zustand';
import { GameState, Card, PlayerId, Suit } from '@/engine/types';
import { createGame, placeBid, playCard, startNewRound, getPlayableCardsForPlayer, aiBid } from '@/engine/engine';
import { getBotBid } from '@/engine/ai/bidAI';
import { getBotPlay, type Difficulty } from '@/engine/ai/playAI';

interface GameStore {
  state: GameState;
  difficulty: Difficulty;
  
  initGame: () => void;
  newRound: () => void;
  submitBid: (tricks: number) => void;
  advanceBotBid: () => void;
  playCard: (card: Card) => void;
  advanceBot: () => void;
  setDifficulty: (difficulty: Difficulty) => void;
  getHumanHand: () => Card[];
  getPlayableCards: () => Card[];
  getCurrentTrick: () => Map<PlayerId, Card> | null;
  isHumanTurn: () => boolean;
  getTrickWinner: () => PlayerId | null;
}

export const useGameStore = create<GameStore>((set, get) => ({
  state: createGame(),
  difficulty: 'medium',

  initGame: () => {
    set({ state: createGame() });
  },

  newRound: () => {
    const { state } = get();
    set({ state: startNewRound(state) });
  },

  submitBid: (tricks: number) => {
    const { state, difficulty } = get();
    let newState = placeBid(state, state.currentPlayer, tricks);
    set({ state: newState });
    
    if (newState.phase === 'bidding' && newState.currentPlayer !== 0) {
      setTimeout(() => get().advanceBotBid(), 600);
    }
  },

  advanceBotBid: () => {
    const { state, difficulty } = get();
    if (state.phase !== 'bidding') return;
    if (state.currentPlayer === 0) return;
    
    const botPlayer = state.players.find((p) => p.id === state.currentPlayer);
    if (!botPlayer) return;
    
    const bid = getBotBid(botPlayer.hand, difficulty);
    let newState = placeBid(state, state.currentPlayer, bid);
    set({ state: newState });
    
    if (newState.phase === 'bidding' && newState.currentPlayer !== 0) {
      setTimeout(() => get().advanceBotBid(), 600);
    }
  },

  playCard: (card: Card) => {
    const { state } = get();
    if (state.currentPlayer !== 0) return;
    
    const newState = playCard(state, 0, card);
    set({ state: newState });
    
    if (newState.phase === 'playing' && newState.currentPlayer !== 0) {
      setTimeout(() => get().advanceBot(), 800);
    }
  },

  advanceBot: () => {
    const { state, difficulty } = get();
    if (state.phase !== 'playing') return;
    if (state.currentPlayer === 0) return;
    
    const player = state.players.find((p) => p.id === state.currentPlayer);
    if (!player) return;
    
    const context = {
      hand: player.hand,
      trick: state.trick?.cards ?? null,
      trump: state.trump,
      currentPlayer: state.currentPlayer,
      players: state.players,
      playedCards: new Set<string>(),
    };
    
    const card = getBotPlay(context, difficulty);
    const newState = playCard(state, state.currentPlayer, card);
    set({ state: newState });
    
    if (newState.phase === 'playing' && newState.currentPlayer !== 0) {
      setTimeout(() => get().advanceBot(), 800);
    }
  },

  setDifficulty: (difficulty: Difficulty) => {
    set({ difficulty });
  },

  getHumanHand: () => {
    const { state } = get();
    const human = state.players.find((p) => p.id === 0);
    return human?.hand ?? [];
  },

  getPlayableCards: () => {
    const { state } = get();
    return getPlayableCardsForPlayer(state);
  },

  getCurrentTrick: () => {
    const { state } = get();
    return state.trick?.cards ?? null;
  },

  isHumanTurn: () => {
    const { state } = get();
    return state.currentPlayer === 0 && state.phase === 'playing';
  },

  getTrickWinner: () => {
    const { state } = get();
    if (!state.trick || state.trick.cards.size < 4) return null;
    return null;
  },
}));
