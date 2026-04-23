import type { GameState, Player, SeatPosition } from '@/types/game-type';
import type { Card } from '../constants/cards';
import { logger } from '../utils/logger';
import {
  BID_MAX,
  BID_MIN,
  getEstimatedBid,
  passBid,
  placeBid,
  selectTrump,
} from './bidding';
import { createDeck, dealCards, dealRemainingCards, shuffleDeck } from './deck';
import { calculateRoundScores, updateTeamScores } from './scoring';
import {
  addCardToTrick,
  createEmptyTrick,
  getTrickWinner,
  isValidCard,
} from './trick';

// ─── Constants ────────────────────────────────────────────────────────────────

export const SEAT_ORDER: SeatPosition[] = ['bottom', 'left', 'top', 'right'];

/** Cards dealt in the first phase; 8 more in second deal = 13 total per player */
const INITIAL_DEAL_COUNT = 5;

/** Total tricks per round (52 cards ÷ 4 players) */
const TRICKS_PER_ROUND = 13;

// ─── Player Names ─────────────────────────────────────────────────────────────

const PLAYER_NAMES: Record<SeatPosition, string> = {
  bottom: 'You',
  top: 'Alex',
  left: 'Jordan',
  right: 'Sam',
};

const HUMAN_SEAT: SeatPosition = 'bottom';

function getNextSeat(seat: SeatPosition): SeatPosition {
  const idx = SEAT_ORDER.indexOf(seat);
  return SEAT_ORDER[(idx + 1) % SEAT_ORDER.length];
}

function getBiddingOrderFrom(startSeat: SeatPosition): SeatPosition[] {
  const startIdx = SEAT_ORDER.indexOf(startSeat);
  const nextIdx = (startIdx + 1) % SEAT_ORDER.length;
  return [...SEAT_ORDER.slice(nextIdx), ...SEAT_ORDER.slice(0, nextIdx)];
}

// ─── Game Initialisation ──────────────────────────────────────────────────────

export function createInitialState(): GameState {
  logger.info('Engine', 'Creating initial game state');
  const deck = shuffleDeck(createDeck());
  const initialDeal = dealCards(deck, INITIAL_DEAL_COUNT);

  const players = createPlayers(PLAYER_NAMES);
  SEAT_ORDER.forEach((seat) => {
    players[seat].hand = initialDeal[seat];
  });

  const dealer: SeatPosition = 'bottom';
  const currentSeat = getNextSeat(dealer);
  const biddingOrder = getBiddingOrderFrom(dealer);

  logger.info(
    'Engine',
    `Initial state: dealer=${dealer}, currentSeat=${currentSeat}, biddingOrder=${biddingOrder}`,
  );

  return {
    phase: 'bidding',
    players,
    currentSeat: getNextSeat(dealer),
    biddingOrder: getBiddingOrderFrom(dealer),
    currentBidderIndex: 0,
    highestBid: 0,
    highestBidder: null,
    trumpSuit: null,
    trumpRevealed: false,
    trumpCreator: null,
    currentTrick: createEmptyTrick(),
    completedTricks: [],
    round: 1,
    teamScores: { BT: 0, LR: 0 },
    roundScores: [],
    deck,
    dealer,
  };
}

function createPlayers(
  names: Record<SeatPosition, string>,
): Record<SeatPosition, Player> {
  const players = {} as Record<SeatPosition, Player>;
  for (const seat of SEAT_ORDER) {
    const team: 'BT' | 'LR' = seat === 'bottom' || seat === 'top' ? 'BT' : 'LR';
    players[seat] = {
      id: seat,
      name: names[seat],
      seat,
      team,
      isHuman: seat === HUMAN_SEAT,
      hand: [],
      bid: null,
      tricksTaken: 0,
    };
  }
  return players;
}

export function startNewGame(): GameState {
  return createInitialState();
}

// ─── Second Deal ──────────────────────────────────────────────────────────────

export function dealSecondPhase(state: GameState): GameState {
  if (state.phase !== 'dealing2') {
    throw new Error(
      `dealSecondPhase called in unexpected phase: ${state.phase}`,
    );
  }

  const currentHands = {
    bottom: state.players.bottom.hand,
    top: state.players.top.hand,
    left: state.players.left.hand,
    right: state.players.right.hand,
  };

  const fullHands = dealRemainingCards(
    state.deck,
    currentHands,
    INITIAL_DEAL_COUNT,
  );

  const newPlayers = { ...state.players };
  SEAT_ORDER.forEach((seat) => {
    newPlayers[seat] = { ...newPlayers[seat], hand: fullHands[seat] };
  });

  return {
    ...state,
    players: newPlayers,
    phase: 'playing',
  };
}

// ─── Play Card ────────────────────────────────────────────────────────────────

export function playCard(
  state: GameState,
  seat: SeatPosition,
  card: Card,
  wantsToTrump = false,
  winThreshold = 30,
): GameState {
  logger.debug(
    'Engine',
    `playCard: seat=${seat}, card=${card.id}, wantsToTrump=${wantsToTrump}, trickCards=${state.currentTrick.cards.length}`,
  );

  if (!state.players[seat].hand.some((c) => c.id === card.id)) {
    logger.warn('Engine', `Card not in hand: ${card.id} for ${seat}`);
    return state;
  }

  if (state.currentTrick.cards.some((tc) => tc.player === seat)) {
    logger.warn('Engine', `Player already played: ${seat}`);
    return state;
  }

  if (
    !isValidCard(
      card,
      state.players[seat].hand,
      state.currentTrick,
      state.trumpSuit,
      state.trumpRevealed,
      wantsToTrump,
    )
  ) {
    logger.warn('Engine', `Invalid card: ${card.id} for ${seat}`);
    return state;
  }

  const trumpJustRevealed =
    !state.trumpRevealed && state.trumpSuit !== null && wantsToTrump;

  const newPlayers = { ...state.players };
  newPlayers[seat] = {
    ...newPlayers[seat],
    hand: newPlayers[seat].hand.filter((c) => c.id !== card.id),
  };

  const newTrick = addCardToTrick(state.currentTrick, seat, card);
  const trickComplete = newTrick.cards.length === SEAT_ORDER.length;

  let newState: GameState = {
    ...state,
    players: newPlayers,
    currentTrick: newTrick,
    trumpRevealed: state.trumpRevealed || trumpJustRevealed,
  };

  if (!trickComplete) {
    const currentIdx = SEAT_ORDER.indexOf(seat);
    const nextIdx = (currentIdx + 1) % SEAT_ORDER.length;
    newState.currentSeat = SEAT_ORDER[nextIdx];
    return newState;
  }

  // ── Trick complete ────────────────────────────────────────────────────────
  const winner = getTrickWinner(newTrick, state.trumpSuit);
  const updatedWinner: Player = {
    ...newState.players[winner],
    tricksTaken: newState.players[winner].tricksTaken + 1,
  };

  const completedTrick = { ...newTrick, winningSeat: winner };

  newState = {
    ...newState,
    currentTrick: completedTrick,
    completedTricks: [...newState.completedTricks, completedTrick],
    players: { ...newState.players, [winner]: updatedWinner },
    currentSeat: winner,
    phase: 'trickEnd',
  };

  // ── Round complete ────────────────────────────────────────────────────────
  if (newState.completedTricks.length === TRICKS_PER_ROUND) {
    const roundScores = calculateRoundScores(
      newState.players,
      newState.highestBid,
      newState.highestBidder,
    );
    const newTeamScores = updateTeamScores(newState.teamScores, roundScores);

    newState = {
      ...newState,
      teamScores: newTeamScores,
      roundScores: [
        ...newState.roundScores,
        { round: newState.round, scores: newTeamScores },
      ],
      phase: isGameOver(newTeamScores, winThreshold) ? 'gameEnd' : 'roundEnd',
    };
  }

  return newState;
}

// ─── Trump ────────────────────────────────────────────────────────────────────

export function revealTrump(state: GameState): GameState {
  if (state.trumpRevealed) return state;
  return { ...state, trumpRevealed: true };
}

// ─── Round Advancement ────────────────────────────────────────────────────────

export function advanceToNextRound(
  state: GameState,
  winThreshold = 30,
): GameState {
  logger.info(
    'Engine',
    `advanceToNextRound: round=${state.round}, dealer=${state.dealer}`,
  );

  if (isGameOver(state.teamScores, winThreshold)) {
    logger.info('Engine', 'Game over - ending');
    return { ...state, phase: 'gameEnd' };
  }

  const newDeck = shuffleDeck(createDeck());
  const newDeal = dealCards(newDeck, INITIAL_DEAL_COUNT);

  const newDealer = getNextSeat(state.dealer);
  logger.info('Engine', `Rotating dealer: ${state.dealer} -> ${newDealer}`);

  const names = {} as Record<SeatPosition, string>;
  SEAT_ORDER.forEach((seat) => {
    names[seat] = state.players[seat].name;
  });

  const resetPlayers = createPlayers(names);
  SEAT_ORDER.forEach((seat) => {
    resetPlayers[seat].hand = newDeal[seat];
  });

  const updatedRoundScores = [
    ...state.roundScores,
    { round: state.round, scores: { ...state.teamScores } },
  ];

  logger.info(
    'Engine',
    `New round state: round=${state.round + 1}, dealer=${newDealer}, currentSeat=${getNextSeat(newDealer)}`,
  );

  return {
    ...state,
    phase: 'bidding',
    players: resetPlayers,
    currentSeat: getNextSeat(newDealer),
    biddingOrder: getBiddingOrderFrom(newDealer),
    currentBidderIndex: 0,
    highestBid: 0,
    highestBidder: null,
    trumpSuit: null,
    trumpRevealed: false,
    trumpCreator: null,
    currentTrick: createEmptyTrick(),
    completedTricks: [],
    round: state.round + 1,
    deck: newDeck,
    roundScores: updatedRoundScores,
    dealer: newDealer,
  };
}

// ─── Game Over Check ──────────────────────────────────────────────────────────

export function isGameOver(
  teamScores: GameState['teamScores'],
  winThreshold = 30,
): boolean {
  return Object.values(teamScores).some(
    (score) => score >= winThreshold || score <= -winThreshold,
  );
}

export function getWinner(
  teamScores: GameState['teamScores'],
  winThreshold = 30,
): 'BT' | 'LR' | null {
  const teams = Object.keys(teamScores) as ('BT' | 'LR')[];

  for (const team of teams) {
    if (teamScores[team] >= winThreshold) return team;
  }

  const eliminated = teams.filter((t) => teamScores[t] <= -winThreshold);

  if (eliminated.length === 0) return null;

  if (eliminated.length === teams.length) {
    return teams.reduce((best, team) =>
      teamScores[team] > teamScores[best] ? team : best,
    );
  }

  return teams.find((t) => !eliminated.includes(t)) ?? null;
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

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
  updateTeamScores,
};
