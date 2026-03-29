import { Card } from '../constants/cards';
import { BID_MAX, BID_MIN, getEstimatedBid, passBid, placeBid, selectTrump } from './bidding';
import { createDeck, dealCards, dealRemainingCards, shuffleDeck } from './deck';
import { calculateRoundScores, updateTeamScores } from './scoring';
import { addCardToTrick, createEmptyTrick, getTrickWinner, isValidCard } from './trick';
import { GameState, Player, SeatPosition } from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

export const SEAT_ORDER: SeatPosition[] = ['bottom', 'left', 'top', 'right'];

/** Cards dealt in the first phase; 8 more in second deal = 13 total per player */
const INITIAL_DEAL_COUNT = 5;

/** Total tricks per round (52 cards ÷ 4 players) */
const TRICKS_PER_ROUND = 13;

/**
 * Score thresholds that end the game.
 * Win: reach +30. Lose: drop to -30.
 */
const WIN_SCORE  =  30;
const LOSE_SCORE = -30;

// ─── Player Names ─────────────────────────────────────────────────────────────

/** Default player names — kept in one place so advanceToNextRound can reuse them */
const PLAYER_NAMES: Record<SeatPosition, string> = {
  bottom: 'You',
  top:    'Alex',
  left:   'Jordan',
  right:  'Sam',
};

const HUMAN_SEAT: SeatPosition = 'bottom';

// ─── Game Initialisation ──────────────────────────────────────────────────────

export function createInitialState(): GameState {
  const deck = shuffleDeck(createDeck());
  const initialDeal = dealCards(deck, INITIAL_DEAL_COUNT);

  const players = createPlayers(PLAYER_NAMES);
  SEAT_ORDER.forEach(seat => {
    players[seat].hand = initialDeal[seat];
  });

  return {
    phase: 'bidding',
    players,
    currentSeat: 'bottom',
    biddingOrder: [...SEAT_ORDER],
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
    deck,
  };
}

function createPlayers(
  names: Record<SeatPosition, string>
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

/**
 * Called after trump is selected (end of 'dealing2' phase).
 * Deals the remaining 8 cards to each player to complete their 13-card hands.
 */
export function dealSecondPhase(state: GameState): GameState {
  // Note: phase check removed — the store manages phase transitions explicitly
  // and may pass a state with an overridden phase to sequence correctly.
  if (state.phase !== 'dealing2' && state.phase !== 'playing') {
    throw new Error(`dealSecondPhase called in unexpected phase: ${state.phase}`);
  }

  const currentHands = {
    bottom: state.players.bottom.hand,
    top:    state.players.top.hand,
    left:   state.players.left.hand,
    right:  state.players.right.hand,
  };

  const fullHands = dealRemainingCards(state.deck, currentHands, INITIAL_DEAL_COUNT);

  const newPlayers = { ...state.players };
  SEAT_ORDER.forEach(seat => {
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
  card: Card
): GameState {
  if (!isValidCard(card, state.players[seat].hand, state.currentTrick, state.trumpSuit, state.trumpRevealed)) {
    return state;
  }

  // Remove card from hand
  const newPlayers = { ...state.players };
  newPlayers[seat] = {
    ...newPlayers[seat],
    hand: newPlayers[seat].hand.filter(c => c.id !== card.id),
  };

  // Add card to trick
  const newTrick = addCardToTrick(state.currentTrick, seat, card);
  const trickComplete = newTrick.cards.length === SEAT_ORDER.length;

  // Reveal trump automatically when a trump card is played
  const trumpJustRevealed =
    !state.trumpRevealed &&
    state.trumpSuit !== null &&
    card.suit === state.trumpSuit;

  let newState: GameState = {
    ...state,
    players: newPlayers,
    currentTrick: newTrick,
    trumpRevealed: state.trumpRevealed || trumpJustRevealed,
  };

  if (!trickComplete) {
    // Advance to next player
    const currentIdx = SEAT_ORDER.indexOf(seat);
    const nextIdx = (currentIdx + 1) % SEAT_ORDER.length;
    newState.currentSeat = SEAT_ORDER[nextIdx];
    return newState;
  }

  // ── Trick complete ──
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

  // ── Round complete (all 13 tricks played) ──
  if (newState.completedTricks.length === TRICKS_PER_ROUND) {
    const roundScores = calculateRoundScores(
      newState.players,
      newState.highestBid,
      newState.highestBidder
    );
    const newTeamScores = updateTeamScores(newState.teamScores, roundScores);

    newState = {
      ...newState,
      teamScores: newTeamScores,
      phase: isGameOver(newTeamScores) ? 'gameEnd' : 'roundEnd',
    };
  }

  return newState;
}

// ─── Trump ────────────────────────────────────────────────────────────────────

/**
 * Manually reveal the trump card (e.g. when a player explicitly chooses to trump).
 * Trump is also revealed automatically inside playCard when a trump card is played.
 */
export function revealTrump(state: GameState): GameState {
  return { ...state, trumpRevealed: true };
}

// ─── Round Advancement ────────────────────────────────────────────────────────

export function advanceToNextRound(state: GameState): GameState {
  // Check game-over conditions before advancing
  if (isGameOver(state.teamScores)) {
    return { ...state, phase: 'gameEnd' };
  }

  const newDeck = shuffleDeck(createDeck());
  const newDeal = dealCards(newDeck, INITIAL_DEAL_COUNT);

  // Rotate dealer: previous first bidder moves to end
  const rotatedOrder: SeatPosition[] = [
    ...state.biddingOrder.slice(1),
    state.biddingOrder[0],
  ];

  // Carry player names forward rather than hardcoding them again
  const names: Record<SeatPosition, string> = {} as Record<SeatPosition, string>;
  SEAT_ORDER.forEach(seat => { names[seat] = state.players[seat].name; });

  const resetPlayers = createPlayers(names);
  SEAT_ORDER.forEach(seat => {
    resetPlayers[seat].hand = newDeal[seat];
  });

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
    trumpCreator: null,
    currentTrick: createEmptyTrick(),
    completedTricks: [],
    round: state.round + 1,
    deck: newDeck,
    // teamScores intentionally NOT reset — accumulate until win/lose condition
  };
}

// ─── Game Over Check ──────────────────────────────────────────────────────────

/**
 * Returns true if either team has reached the win (+30) or lose (-30) threshold.
 * Called after each round's scores are applied.
 */
export function isGameOver(teamScores: GameState['teamScores']): boolean {
  return Object.values(teamScores).some(
    score => score >= WIN_SCORE || score <= LOSE_SCORE
  );
}

/**
 * Returns the winning team, or null if the game isn't over.
 * If one team hits +30 they win. If one team hits -30 the other wins.
 */
export function getWinner(
  teamScores: GameState['teamScores']
): 'BT' | 'LR' | null {
  const teams = Object.keys(teamScores) as ('BT' | 'LR')[];

  for (const team of teams) {
    if (teamScores[team] >= WIN_SCORE)  return team;
    if (teamScores[team] <= LOSE_SCORE) return teams.find(t => t !== team) ?? null;
  }

  return null;
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
  updateTeamScores
};
