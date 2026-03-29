import { Card, Suit } from '../constants/cards';

export type SeatPosition = 'bottom' | 'top' | 'left' | 'right';
export type TeamId = 'BT' | 'LR';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type GamePhase =
  | 'dealing1'
  | 'bidding'
  | 'dealing2'
  | 'playing'
  | 'trickEnd'
  | 'roundEnd'
  | 'gameEnd';

export interface Player {
  id: string;
  name: string;
  seat: SeatPosition;
  team: TeamId;
  isHuman: boolean;
  hand: Card[];
  bid: number | null;
  tricksTaken: number;
}

export interface TrickCard {
  player: SeatPosition;
  card: Card;
}

export interface Trick {
  cards: TrickCard[];
  leadSuit: Suit | null;
  winningSeat: SeatPosition | null;
}

export interface GameState {
  phase: GamePhase;
  players: Record<SeatPosition, Player>;
  currentSeat: SeatPosition;
  biddingOrder: SeatPosition[];
  currentBidderIndex: number;
  highestBid: number;
  highestBidder: SeatPosition | null;
  trumpSuit: Suit | null;
  trumpRevealed: boolean;
  currentTrick: Trick;
  completedTricks: Trick[];
  round: number;
  totalRounds: number;
  teamScores: Record<TeamId, number>;
  deck: Card[];
}