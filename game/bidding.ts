import type { Card, Suit } from '../constants/cards';
import { logger } from '../utils/logger';
import { SEAT_ORDER } from './engine';
import type { GameState, Player, SeatPosition } from './types';

export const BID_MIN = 7;
export const BID_MAX = 10;
export const BID_10_BONUS = 3; // bid 10 + score 10 = +13 total

export interface BidResult {
  bids: Record<SeatPosition, number | null>;
  highestBid: number;
  highestBidder: SeatPosition | null;
}

// ─── Bidding Order ────────────────────────────────────────────────────────────

export function getBiddingOrder(startSeat: SeatPosition): SeatPosition[] {
  const order: SeatPosition[] = ['bottom', 'left', 'top', 'right'];
  const startIdx = order.indexOf(startSeat);
  return [...order.slice(startIdx), ...order.slice(0, startIdx)];
}

export function getNextBidder(
  currentIndex: number,
  bids: Record<SeatPosition, number | null>,
  biddingOrder: SeatPosition[],
): number {
  for (let i = currentIndex + 1; i < biddingOrder.length; i++) {
    const seat = biddingOrder[i];
    // null = hasn't bid yet, 0 = passed
    if (bids[seat] === null) {
      return i;
    }
  }
  return -1; // all bids placed
}

function extractBids(
  players: Record<SeatPosition, Player>,
): Record<SeatPosition, number | null> {
  return Object.fromEntries(
    Object.entries(players).map(([s, p]) => [s, p.bid]),
  ) as Record<SeatPosition, number | null>;
}

// ─── Place Bid ────────────────────────────────────────────────────────────────

export function placeBid(
  state: GameState,
  seat: SeatPosition,
  bid: number,
): GameState {
  logger.debug(
    'Bidding',
    `placeBid: seat=${seat}, bid=${bid}, currentSeat=${state.currentSeat}, highestBid=${state.highestBid}`,
  );

  // Validate: must be the current bidder
  if (state.currentSeat !== seat) {
    logger.error(
      'Bidding',
      `Not ${seat}'s turn to bid. Current: ${state.currentSeat}`,
    );
    throw new Error(`It is not ${seat}'s turn to bid.`);
  }

  // Validate: bid must be within allowed range
  if (bid < BID_MIN || bid > BID_MAX) {
    logger.error(
      'Bidding',
      `Invalid bid: ${bid} not in range ${BID_MIN}-${BID_MAX}`,
    );
    throw new Error(
      `Bid must be between ${BID_MIN} and ${BID_MAX}. Got: ${bid}`,
    );
  }

  // Validate: bid must strictly exceed the current highest bid
  if (bid <= state.highestBid) {
    logger.error('Bidding', `Bid too low: ${bid} <= ${state.highestBid}`);
    throw new Error(
      `Bid of ${bid} must exceed the current highest bid of ${state.highestBid}.`,
    );
  }

  const newPlayers = { ...state.players };
  newPlayers[seat] = { ...newPlayers[seat], bid };

  const newBids = extractBids(newPlayers);
  const nextIndex = getNextBidder(
    state.currentBidderIndex,
    newBids,
    state.biddingOrder,
  );
  const allBidsPlaced = nextIndex === -1;

  const currentSeat = allBidsPlaced
    ? seat // winner stays as currentSeat for trump selection
    : state.biddingOrder[nextIndex];

  return {
    ...state,
    players: newPlayers,
    highestBid: bid,
    highestBidder: seat,
    currentBidderIndex: nextIndex,
    currentSeat,
    phase: allBidsPlaced ? 'dealing2' : state.phase,
  };
}

// ─── Pass Bid ─────────────────────────────────────────────────────────────────

export function passBid(state: GameState, seat: SeatPosition): GameState {
  logger.debug(
    'Bidding',
    `passBid: seat=${seat}, currentSeat=${state.currentSeat}`,
  );

  // Validate: must be the current bidder
  if (state.currentSeat !== seat) {
    logger.error(
      'Bidding',
      `Not ${seat}'s turn to pass. Current: ${state.currentSeat}`,
    );
    throw new Error(`It is not ${seat}'s turn to bid.`);
  }

  const newPlayers = { ...state.players };
  // 0 marks "passed" — distinct from null which means "hasn't bid yet"
  newPlayers[seat] = { ...newPlayers[seat], bid: 0 };

  const newBids = extractBids(newPlayers);
  const nextIndex = getNextBidder(
    state.currentBidderIndex,
    newBids,
    state.biddingOrder,
  );
  const allBidsPlaced = nextIndex === -1;

  if (allBidsPlaced) {
    // If everyone passed, force the last bidder in order to hold BID_MIN
    let resolvedBidder = state.highestBidder;
    let resolvedBid = state.highestBid;
    if (resolvedBidder === null) {
      resolvedBidder = state.biddingOrder[state.biddingOrder.length - 1];
      resolvedBid = BID_MIN;
    }

    logger.info(
      'Bidding',
      `All passed - resolved to ${resolvedBidder} with bid ${resolvedBid}`,
    );
    return {
      ...state,
      players: newPlayers,
      highestBid: resolvedBid,
      highestBidder: resolvedBidder,
      phase: 'dealing2',
      currentSeat: resolvedBidder,
    };
  }

  return {
    ...state,
    players: newPlayers,
    currentBidderIndex: nextIndex,
    currentSeat: state.biddingOrder[nextIndex],
  };
}

// ─── Select Trump ─────────────────────────────────────────────────────────────

export function selectTrump(
  state: GameState,
  suit: Suit,
  seat: SeatPosition,
): GameState {
  // Validate: only the highest bidder can select trump
  if (state.highestBidder !== seat) {
    throw new Error(
      `Only the highest bidder (${state.highestBidder}) can select the trump suit.`,
    );
  }

  // Validate: trump can only be selected in the dealing2 phase
  if (state.phase !== 'dealing2') {
    throw new Error(
      `Trump can only be selected in the 'dealing2' phase. Current phase: ${state.phase}`,
    );
  }

  // Validate: suit must be a valid suit
  const validSuits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
  if (!validSuits.includes(suit)) {
    throw new Error(`Invalid suit: ${suit}`);
  }

  const bidderIdx = SEAT_ORDER.indexOf(seat);
  const nextPlayerIdx = (bidderIdx + 1) % SEAT_ORDER.length;
  const firstToPlay = SEAT_ORDER[nextPlayerIdx];

  logger.info(
    'Bidding',
    `Trump selected by ${seat}, first to play: ${firstToPlay}`,
  );

  return {
    ...state,
    trumpSuit: suit,
    trumpRevealed: false,
    trumpCreator: seat,
    phase: 'dealing2',
    currentSeat: firstToPlay,
  };
}

// ─── Bot Bid Estimation ───────────────────────────────────────────────────────

export function getEstimatedBid(
  hand: Card[],
  difficulty: 'easy' | 'medium' | 'hard',
  currentHighestBid: number, // bots must bid above this or pass (return 0)
): number {
  const highCards = hand.filter((c) => c.value >= 11).length;
  const voids = countVoids(hand);

  // Raw estimate of what this hand is worth
  const rawEstimate = Math.min(BID_MAX, Math.max(BID_MIN, highCards + voids));

  // Apply difficulty variance — easier bots make less accurate estimates
  const variance = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 1 : 0;
  const randomOffset =
    Math.floor(Math.random() * (variance * 2 + 1)) - variance;
  const estimate = Math.min(
    BID_MAX,
    Math.max(BID_MIN, rawEstimate + randomOffset),
  );

  // Bot must bid strictly above the current highest bid, or pass
  if (estimate <= currentHighestBid) {
    return 0; // pass
  }

  // Extra caution around bid 10: failing it is a heavy penalty (-10).
  // Only bid 10 if the hand is genuinely strong (hard bots are more willing).
  if (estimate === BID_MAX) {
    const bid10Threshold =
      difficulty === 'hard' ? 4 : difficulty === 'medium' ? 5 : 6;
    if (highCards < bid10Threshold) {
      // Hand isn't strong enough to risk bid 10 — step down to 9 or pass
      const safeBid = BID_MAX - 1;
      return safeBid > currentHighestBid ? safeBid : 0;
    }
  }

  return estimate;
}

// ─── Scoring Helper ───────────────────────────────────────────────────────────

/**
 * Calculate the score delta for the bidding team after a round.
 * Bid 10 + score 10 earns a +3 bonus (total +13).
 */
export function calculateBiddingTeamScore(
  bid: number,
  tricksWon: number,
): number {
  if (tricksWon >= bid) {
    const bonus = bid === BID_MAX && tricksWon === BID_MAX ? BID_10_BONUS : 0;
    return bid + bonus;
  }
  return -bid;
}

/**
 * Calculate the score delta for the opposing team after a round.
 * They need 4+ points (tricks). If the bidding team scored all 10,
 * opponents only have 3 left — they always get -4 in that case.
 */
export function calculateOpponentScore(opponentTricks: number): number {
  return opponentTricks >= 4 ? 4 : -4;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function countVoids(hand: Card[]): number {
  const suitCounts: Record<string, number> = {
    spades: 0,
    hearts: 0,
    diamonds: 0,
    clubs: 0,
  };
  for (const card of hand) {
    suitCounts[card.suit]++;
  }
  return Object.values(suitCounts).filter((count) => count === 0).length;
}
