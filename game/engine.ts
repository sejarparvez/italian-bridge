import { Card } from '../src/constants/cards';
import { BID_MAX, BID_MIN, getEstimatedBid, passBid, placeBid, selectTrump } from './bidding';
import { createDeck, dealCards, dealRemainingCards, shuffleDeck } from './deck';
import { calculateRoundScores, updateTeamScores } from './scoring';
import { addCardToTrick, createEmptyTrick, getTrickWinner, isValidCard } from './trick';
import {
    GameState,
    Player,
    SeatPosition
} from './types';

const SEAT_ORDER: SeatPosition[] = ['bottom', 'left', 'top', 'right'];
const TOTAL_ROUNDS = 5;
// Cards dealt in first deal; 8 more in second deal = 13 total per player
const INITIAL_DEAL_COUNT = 5;

export function createInitialState(): GameState {
  const deck = shuffleDeck(createDeck());
  const initialDeal = dealCards(deck, INITIAL_DEAL_COUNT);

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
  // BUG FIX: pass trumpRevealed so isValidCard can enforce trump visibility rules
  if (!isValidCard(card, state.players[seat].hand, state.currentTrick, state.trumpSuit, state.trumpRevealed)) {
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
      // BUG FIX: removed erroneous `trumpRevealed: false` reset here.
      // Trump is revealed once per round (via revealTrump()) and stays revealed
      // until the round ends. Resetting it here would hide trump from the UI
      // between tricks.
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
  const newDeal = dealCards(newDeck, INITIAL_DEAL_COUNT);

  // BUG FIX: rotate dealer each round so bidding order advances fairly.
  // The previous first bidder moves to the end.
  const prevFirst = state.biddingOrder[0];
  const rotatedOrder: SeatPosition[] = [
    ...state.biddingOrder.slice(1),
    prevFirst,
  ];

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
    currentSeat: rotatedOrder[0],
    biddingOrder: rotatedOrder,
    currentBidderIndex: 0,
    highestBid: 0,
    highestBidder: null,
    trumpSuit: null,
    trumpRevealed: false,
    currentTrick: createEmptyTrick(),
    completedTricks: [],
    round: nextRound,
    deck: newDeck,
    // teamScores intentionally NOT reset — they accumulate across all rounds
  };
}

export function startNewGame(): GameState {
  return createInitialState();
}

export {
    addCardToTrick,
    BID_MAX,
    BID_MIN,
    calculateRoundScores,
    createDeck,
    createEmptyTrick,
    dealCards,
    dealRemainingCards,
    getEstimatedBid,
    getTrickWinner,
    isValidCard,
    passBid,
    placeBid,
    selectTrump,
    shuffleDeck,
    updateTeamScores
};

