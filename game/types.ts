import { Card, Suit } from '../constants/cards';

// ─── Primitives ───────────────────────────────────────────────────────────────

export type SeatPosition = 'bottom' | 'top' | 'left' | 'right';
export type TeamId       = 'BT' | 'LR';
export type Difficulty   = 'easy' | 'medium' | 'hard';

export type GamePhase =
  | 'dealing1'
  | 'bidding'
  | 'dealing2'
  | 'playing'
  | 'trickEnd'
  | 'roundEnd'
  | 'gameEnd';

// ─── Bidding ──────────────────────────────────────────────────────────────────

/**
 * Represents a player's bid status for the current round.
 *
 * - `null`   — player has not yet bid (bidding hasn't reached them)
 * - `0`      — player passed (explicitly chose not to bid)
 * - `7–10`   — player's active bid value
 *
 * This distinction matters: `null` means "pending", `0` means "out".
 */
export type BidValue = number | null;

// ─── Trick ────────────────────────────────────────────────────────────────────

/**
 * A single card played by a player within a trick.
 * Source of truth — imported by trick.ts, not redefined there.
 */
export interface TrickCard {
  player: SeatPosition;
  card: Card;
}

export interface Trick {
  cards: TrickCard[];
  leadSuit: Suit | null;
  winningSeat: SeatPosition | null;
}

// ─── Player ───────────────────────────────────────────────────────────────────

export interface Player {
  /** Same value as `seat` — used as a stable identifier for lookups. */
  id: SeatPosition;
  name: string;
  seat: SeatPosition;
  team: TeamId;
  isHuman: boolean;
  hand: Card[];
  /**
   * This player's bid for the current round.
   * See `BidValue` for the null / 0 / 7–10 distinction.
   */
  bid: BidValue;
  tricksTaken: number;
}

// ─── Game State ───────────────────────────────────────────────────────────────

export interface GameState {
  phase: GamePhase;

  // Players
  players: Record<SeatPosition, Player>;
  currentSeat: SeatPosition;

  // Bidding
  biddingOrder: SeatPosition[];
  currentBidderIndex: number;
  highestBid: number;
  highestBidder: SeatPosition | null;

  // Trump
  trumpSuit: Suit | null;
  trumpRevealed: boolean;
  /**
   * The seat that won the bid and selected the trump suit.
   * Used to enforce the peek rule: only the trump creator (if human)
   * can see the hidden trump card before it is revealed.
   * Null before trump has been selected.
   */
  trumpCreator: SeatPosition | null;

  // Tricks
  currentTrick: Trick;
  completedTricks: Trick[];

  // Round & scoring
  round: number;
  // NOTE: totalRounds removed — game end is score-driven (±30), not round-count-driven.
  teamScores: Record<TeamId, number>;

  /**
   * The full shuffled deck for this round.
   * Only needed during dealing phases; consider clearing after dealing2
   * to avoid carrying 52 cards through every state update.
   */
  deck: Card[];
}