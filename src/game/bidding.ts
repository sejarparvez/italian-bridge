import { Card, Suit, ALL_SUITS } from '../constants/cards';
import { SeatPosition, Player, GameState } from './types';

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
    if (bids[seat] === null) {
      return i;
    }
  }
  return -1;
}

export function placeBid(
  state: GameState,
  seat: SeatPosition,
  bid: number
): GameState {
  const newPlayers = { ...state.players };
  newPlayers[seat] = { ...newPlayers[seat], bid };

  const newBids = Object.fromEntries(
    Object.entries(newPlayers).map(([s, p]) => [s, p.bid])
  ) as Record<SeatPosition, number | null>;

  let highestBid = state.highestBid;
  let highestBidder = state.highestBidder;

  if (bid > highestBid) {
    highestBid = bid;
    highestBidder = seat;
  }

  const nextIndex = getNextBidder(
    state.currentBidderIndex,
    newBids,
    state.biddingOrder
  );

  const allBidsPlaced = nextIndex === -1;
  const currentSeat = allBidsPlaced
    ? (highestBidder ?? state.currentSeat)
    : state.biddingOrder[nextIndex];

  return {
    ...state,
    players: newPlayers,
    highestBid,
    highestBidder,
    currentBidderIndex: nextIndex,
    currentSeat,
    phase: allBidsPlaced ? 'dealing2' : state.phase,
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

export function passBid(
  state: GameState,
  seat: SeatPosition
): GameState {
  const newPlayers = { ...state.players };
  newPlayers[seat] = { ...newPlayers[seat], bid: 0 };

  const nextIndex = state.currentBidderIndex + 1;
  const allBidsPlaced = nextIndex >= state.biddingOrder.length;
  
  if (allBidsPlaced) {
    return {
      ...state,
      players: newPlayers,
      phase: 'dealing2',
      currentSeat: state.highestBidder ?? 'bottom',
    };
  }

  return {
    ...state,
    players: newPlayers,
    currentBidderIndex: nextIndex,
    currentSeat: state.biddingOrder[nextIndex],
  };
}

export function getEstimatedBid(hand: Card[], difficulty: 'easy' | 'medium' | 'hard'): number {
  const highCards = hand.filter(c => c.value >= 11).length;
  const voids = countVoids(hand);
  let estimate = Math.min(10, Math.max(7, highCards + voids));

  const variance = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 1 : 0;
  const randomOffset = Math.floor(Math.random() * (variance * 2 + 1)) - variance;
  
  return Math.min(10, Math.max(7, estimate + randomOffset));
}

function countVoids(hand: Card[]): number {
  const suitCounts: Record<Suit, number> = {
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