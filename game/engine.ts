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
 *
 * FIX: phase guard tightened to only allow 'dealing2'. Allowing 'playing'
 * meant this could be called mid-round and silently re-deal over a live game.
 */
export function dealSecondPhase(state: GameState): GameState {
  if (state.phase !== 'dealing2') {
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

/**
 * Plays a card for the given seat.
 *
 * `wantsToTrump` — pass true when the player has explicitly declared intent to
 * trump this trick (even if they hold no trump cards). This is the sole trigger
 * for revealing the trump suit, per game rules:
 *
 *   "Trump is revealed the first time any player declares their intent to trump,
 *    regardless of whether they actually hold a trump card."
 *
 * For the human player the UI sets this flag when the player taps the trump
 * action. For bots, `botWantsToTrump()` from bot-play determines the value.
 *
 * Passing false (the default) means the player is either following suit or
 * choosing to discard without trumping — trump is NOT revealed.
 */
export function playCard(
  state: GameState,
  seat: SeatPosition,
  card: Card,
  wantsToTrump = false,
): GameState {
  // Guard: card must belong to this player's hand
  if (!state.players[seat].hand.some(c => c.id === card.id)) {
    return state;
  }

  // Guard: player must not have already played in this trick
  if (state.currentTrick.cards.some(tc => tc.player === seat)) {
    return state;
  }

  if (!isValidCard(card, state.players[seat].hand, state.currentTrick, state.trumpSuit, state.trumpRevealed)) {
    return state;
  }

  // ── Trump reveal ──────────────────────────────────────────────────────────
  //
  // FIX: reveal is now driven by INTENT (`wantsToTrump`), not by which card
  // was played. This correctly handles:
  //   • Player declares intent + plays trump card        → reveal ✅
  //   • Player declares intent + holds no trump + plays any card → reveal ✅
  //   • Player is void in led suit but discards non-trump → no reveal ✅
  //   • Player follows suit normally                     → no reveal ✅
  //
  // Previously the engine checked `card.suit === state.trumpSuit`, which:
  //   - Never revealed trump when a player declared intent but held no trump
  //   - Would reveal trump if a player accidentally played a trump card while
  //     meaning to discard (e.g. trump is the only low card available and
  //     `wantsToTrump` was not the intent)
  const trumpJustRevealed =
    !state.trumpRevealed &&
    state.trumpSuit !== null &&
    wantsToTrump;

  // Remove card from hand
  const newPlayers = { ...state.players };
  newPlayers[seat] = {
    ...newPlayers[seat],
    hand: newPlayers[seat].hand.filter(c => c.id !== card.id),
  };

  // Add card to trick
  const newTrick = addCardToTrick(state.currentTrick, seat, card);
  const trickComplete = newTrick.cards.length === SEAT_ORDER.length;

  let newState: GameState = {
    ...state,
    players: newPlayers,
    currentTrick: newTrick,
    trumpRevealed: state.trumpRevealed || trumpJustRevealed,
  };

  if (!trickComplete) {
    // Advance to next player
    const currentIdx = SEAT_ORDER.indexOf(seat);
    const nextIdx    = (currentIdx + 1) % SEAT_ORDER.length;
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

  // ── Round complete (all 13 tricks played) ─────────────────────────────────
  if (newState.completedTricks.length === TRICKS_PER_ROUND) {
    const roundScores  = calculateRoundScores(
      newState.players,
      newState.highestBid,
      newState.highestBidder,
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
 * Explicitly reveal the trump card.
 *
 * This is the canonical reveal function — both the engine's `playCard` (via the
 * `wantsToTrump` flag) and any external caller (store, UI) should go through
 * this path to guarantee a single consistent reveal mechanism.
 *
 * Idempotent: calling it on an already-revealed state is a no-op.
 */
export function revealTrump(state: GameState): GameState {
  if (state.trumpRevealed) return state;
  return { ...state, trumpRevealed: true };
}

// ─── Round Advancement ────────────────────────────────────────────────────────

export function advanceToNextRound(state: GameState): GameState {
  if (isGameOver(state.teamScores)) {
    return { ...state, phase: 'gameEnd' };
  }

  const newDeck    = shuffleDeck(createDeck());
  const newDeal    = dealCards(newDeck, INITIAL_DEAL_COUNT);

  // Rotate dealer: previous first bidder moves to end
  const rotatedOrder: SeatPosition[] = [
    ...state.biddingOrder.slice(1),
    state.biddingOrder[0],
  ];

  // Carry player names forward
  const names = {} as Record<SeatPosition, string>;
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
 */
export function isGameOver(teamScores: GameState['teamScores']): boolean {
  return Object.values(teamScores).some(
    score => score >= WIN_SCORE || score <= LOSE_SCORE
  );
}

/**
 * Returns the winning team, or null if the game isn't over.
 *
 * Priority:
 *   1. A team that reached +30 wins outright.
 *   2. A team that dropped to -30 loses — the other team wins.
 *   3. If BOTH teams hit -30 in the same round, the higher score wins.
 *      (Per README: "if both hit −30, higher score wins.")
 *
 * FIX: the old implementation returned the opponent of the first -30 team it
 * found, without checking whether that opponent had also hit -30. This meant
 * the wrong team could be declared winner in a simultaneous -30 scenario.
 */
export function getWinner(
  teamScores: GameState['teamScores']
): 'BT' | 'LR' | null {
  const teams = Object.keys(teamScores) as ('BT' | 'LR')[];

  // 1. Outright win — reached +30
  for (const team of teams) {
    if (teamScores[team] >= WIN_SCORE) return team;
  }

  // 2. Check for -30 eliminations
  const eliminated = teams.filter(t => teamScores[t] <= LOSE_SCORE);

  if (eliminated.length === 0) return null;

  // 3. Both teams hit -30 simultaneously → higher score wins
  if (eliminated.length === teams.length) {
    return teams.reduce((best, team) =>
      teamScores[team] > teamScores[best] ? team : best
    );
  }

  // 4. One team eliminated → the other wins
  return teams.find(t => !eliminated.includes(t)) ?? null;
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
