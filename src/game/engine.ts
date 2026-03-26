import { Card, Suit } from '../constants/cards';
import {
  GameState,
  SeatPosition,
  Player,
  GamePhase,
  Trick,
} from './types';
import { createDeck, shuffleDeck, dealCards, dealRemainingCards, DealResult } from './deck';
import { getTrickWinner, addCardToTrick, createEmptyTrick, isValidCard } from './trick';
import { placeBid, selectTrump, getEstimatedBid, BID_MIN, BID_MAX } from './bidding';
import { calculateRoundScores, updateTeamScores } from './scoring';

const SEAT_ORDER: SeatPosition[] = ['bottom', 'left', 'top', 'right'];
const TOTAL_ROUNDS = 5;

export function createInitialState(): GameState {
  const deck = shuffleDeck(createDeck());
  const initialDeal = dealCards(deck, 5);

  const players: Record<SeatPosition, Player> = {
    bottom: createPlayer('bottom', 'You', true),
    top: createPlayer('top', 'Alex', false),
    left: createPlayer('left', 'Jordan', false),
    right: createPlayer('right', 'Sam', false),
  };

  players.bottom.hand = initialDeal.bottom;
  players.top.hand = initialDeal.top;
  players.left.hand = initialDeal.left;
  players.right.hand = initialDeal.right;

  return {
    phase: 'bidding',
    players,
    currentSeat: 'bottom',
    biddingOrder: ['bottom', 'left', 'top', 'right'],
    currentBidderIndex: 0,
    highestBid: 0,
    highestBidder: null,
    trumpSuit: null,
    trumpRevealed: false,
    currentTrick: createEmptyTrick(),
    completedTricks: [],
    round: 1,
    totalRounds: TOTAL_ROUNDS,
    teamScores: { BT: 0, LR: 0 },
    deck,
  };
}

function createPlayer(seat: SeatPosition, name: string, isHuman: boolean): Player {
  const team: 'BT' | 'LR' = seat === 'bottom' || seat === 'top' ? 'BT' : 'LR';
  return {
    id: seat,
    name,
    seat,
    team,
    isHuman,
    hand: [],
    bid: null,
    tricksTaken: 0,
  };
}

export function playCard(
  state: GameState,
  seat: SeatPosition,
  card: Card
): GameState {
  if (!isValidCard(card, state.players[seat].hand, state.currentTrick, state.trumpSuit)) {
    return state;
  }

  const newPlayers = { ...state.players };
  newPlayers[seat] = {
    ...newPlayers[seat],
    hand: newPlayers[seat].hand.filter(c => c.id !== card.id),
  };

  const newTrick = addCardToTrick(state.currentTrick, seat, card);

  const newTrickComplete = newTrick.cards.length === 4;

  let newState: GameState = {
    ...state,
    players: newPlayers,
    currentTrick: newTrick,
  };

  if (!newTrickComplete) {
    const currentIdx = SEAT_ORDER.indexOf(seat);
    const nextIdx = (currentIdx + 1) % 4;
    newState.currentSeat = SEAT_ORDER[nextIdx];
  } else {
    const winner = getTrickWinner(newTrick, state.trumpSuit);
    const winnerPlayer = newState.players[winner];
    const updatedWinnerPlayer: Player = {
      ...winnerPlayer,
      tricksTaken: winnerPlayer.tricksTaken + 1,
    };
    newState = {
      ...newState,
      currentTrick: { ...newTrick, winningSeat: winner },
      completedTricks: [...newState.completedTricks, { ...newTrick, winningSeat: winner }],
      players: {
        ...newState.players,
        [winner]: updatedWinnerPlayer,
      },
      currentSeat: winner,
      phase: 'trickEnd',
      trumpRevealed: false,
    };

    if (newState.completedTricks.length === 5) {
      const roundScores = calculateRoundScores(
        newState.players,
        newState.highestBid,
        newState.highestBidder
      );
      const newTeamScores = updateTeamScores(newState.teamScores, roundScores);

      newState = {
        ...newState,
        teamScores: newTeamScores,
        phase: 'roundEnd',
      };
    }
  }

  return newState;
}

export function revealTrump(state: GameState): GameState {
  return {
    ...state,
    trumpRevealed: true,
  };
}

export function advanceToNextRound(state: GameState): GameState {
  const nextRound = state.round + 1;

  if (nextRound > state.totalRounds) {
    return {
      ...state,
      phase: 'gameEnd',
    };
  }

  const newDeck = shuffleDeck(createDeck());
  const newDeal = dealCards(newDeck, 5);

  const resetPlayers: Record<SeatPosition, Player> = {
    bottom: createPlayer('bottom', 'You', true),
    top: createPlayer('top', 'Alex', false),
    left: createPlayer('left', 'Jordan', false),
    right: createPlayer('right', 'Sam', false),
  };

  resetPlayers.bottom.hand = newDeal.bottom;
  resetPlayers.top.hand = newDeal.top;
  resetPlayers.left.hand = newDeal.left;
  resetPlayers.right.hand = newDeal.right;

  return {
    ...state,
    phase: 'bidding',
    players: resetPlayers,
    currentSeat: 'bottom',
    biddingOrder: ['bottom', 'left', 'top', 'right'],
    currentBidderIndex: 0,
    highestBid: 0,
    highestBidder: null,
    trumpSuit: null,
    trumpRevealed: false,
    currentTrick: createEmptyTrick(),
    completedTricks: [],
    round: nextRound,
    deck: newDeck,
  };
}

export function startNewGame(): GameState {
  return createInitialState();
}

export { getEstimatedBid, BID_MIN, BID_MAX };
export { createDeck, shuffleDeck, dealCards, dealRemainingCards };
export { getTrickWinner, addCardToTrick, createEmptyTrick, isValidCard };
export { placeBid, selectTrump };
export { calculateRoundScores, updateTeamScores };