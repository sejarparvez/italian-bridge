import { Card, Suit } from '../constants/cards';
import { GameState, Player, SeatPosition } from './types';

export const BID_MIN = 7;
export const BID_MAX = 10;

export interface BidResult {
  bids: Record<SeatPosition, number | null>;
  highestBid: number;
  highestBidder: SeatPosition | null;
}

export function getBiddingOrder(startSeat: SeatPosition): SeatPosition[] {
  const order: SeatPosition[] = ['bottom', 'left', 'top', 'right'];
  const startIdx = order.indexOf(startSeat);
  return [...order.slice(startIdx), ...order.slice(0, startIdx)];
}

export function getNextBidder(
  currentIndex: number,
  bids: Record<SeatPosition, number | null>,
  biddingOrder: SeatPosition[]
): number {
  for (let i = currentIndex + 1; i < biddingOrder.length; i++) {
    const seat = biddingOrder[i];
    // A null bid means this player hasn't bid yet (0 = passed)
    if (bids[seat] === null) {
      return i;
    }
  }
  return -1; // all bids placed
}

function extractBids(players: Record<SeatPosition, Player>): Record<SeatPosition, number | null> {
  return Object.fromEntries(
    Object.entries(players).map(([s, p]) => [s, p.bid])
  ) as Record<SeatPosition, number | null>;
}

export function placeBid(
  state: GameState,
  seat: SeatPosition,
  bid: number
): GameState {
  const newPlayers = { ...state.players };
  newPlayers[seat] = { ...newPlayers[seat], bid };

  const newBids = extractBids(newPlayers);

  let highestBid = state.highestBid;
  let highestBidder = state.highestBidder;
  if (bid > highestBid) {
    highestBid = bid;
    highestBidder = seat;
  }

  const nextIndex = getNextBidder(state.currentBidderIndex, newBids, state.biddingOrder);
  const allBidsPlaced = nextIndex === -1;

  // BUG FIX: If everyone passed (highestBidder still null), force the last
  // bidder in the order to hold the minimum bid — the game must continue.
  let resolvedBidder = highestBidder;
  let resolvedBid = highestBid;
  if (allBidsPlaced && resolvedBidder === null) {
    resolvedBidder = state.biddingOrder[state.biddingOrder.length - 1];
    resolvedBid = BID_MIN;
  }

  const currentSeat = allBidsPlaced
    ? (resolvedBidder ?? state.currentSeat)
    : state.biddingOrder[nextIndex];

  return {
    ...state,
    players: newPlayers,
    highestBid: resolvedBid,
    highestBidder: resolvedBidder,
    currentBidderIndex: nextIndex,
    currentSeat,
    phase: allBidsPlaced ? 'dealing2' : state.phase,
  };
}

export function passBid(
  state: GameState,
  seat: SeatPosition
): GameState {
  const newPlayers = { ...state.players };
  // 0 marks "passed" — distinct from null which means "hasn't bid yet"
  newPlayers[seat] = { ...newPlayers[seat], bid: 0 };

  const newBids = extractBids(newPlayers);

  // BUG FIX: use getNextBidder (same logic as placeBid) instead of a bare +1
  const nextIndex = getNextBidder(state.currentBidderIndex, newBids, state.biddingOrder);
  const allBidsPlaced = nextIndex === -1;

  if (allBidsPlaced) {
    // BUG FIX: if everyone passed, force the last bidder to take BID_MIN
    let resolvedBidder = state.highestBidder;
    let resolvedBid = state.highestBid;
    if (resolvedBidder === null) {
      resolvedBidder = state.biddingOrder[state.biddingOrder.length - 1];
      resolvedBid = BID_MIN;
    }

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

export function selectTrump(
  state: GameState,
  suit: Suit
): GameState {
  return {
    ...state,
    trumpSuit: suit,
    phase: 'playing',
  };
}

export function getEstimatedBid(hand: Card[], difficulty: 'easy' | 'medium' | 'hard'): number {
  const highCards = hand.filter(c => c.value >= 11).length;
  const voids = countVoids(hand);
  const estimate = Math.min(BID_MAX, Math.max(BID_MIN, highCards + voids));
  const variance = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 1 : 0;
  const randomOffset = Math.floor(Math.random() * (variance * 2 + 1)) - variance;
  return Math.min(BID_MAX, Math.max(BID_MIN, estimate + randomOffset));
}

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
  return Object.values(suitCounts).filter(count => count === 0).length;
}