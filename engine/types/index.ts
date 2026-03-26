export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';

export type Rank =
  | 'A'
  | 'K'
  | 'Q'
  | 'J'
  | '10'
  | '9'
  | '8'
  | '7'
  | '6'
  | '5'
  | '4'
  | '3'
  | '2';

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type PlayerId = 0 | 1 | 2 | 3;

export type Team = 'us' | 'them';

export interface Player {
  id: PlayerId;
  team: Team;
  hand: Card[];
}

export type SuitOrNull = Suit | null;

export interface Trick {
  cards: Map<PlayerId, Card>;
  leader: PlayerId;
}

export interface Bid {
  player: PlayerId;
  tricks: number;
}

export interface RoundResult {
  teamUs: number;
  teamThem: number;
  usMade: number;
  usBid: number;
  themMade: number;
  themBid: number;
}

export interface GameState {
  players: Player[];
  currentPlayer: PlayerId;
  trick: Trick | null;
  trump: SuitOrNull;
  trumpRevealed: boolean;
  bids: Bid[];
  roundNumber: number;
  scores: { us: number; them: number };
  phase: 'bidding' | 'playing' | 'result';
  trickWins: PlayerId[];
  roundResult: RoundResult | null;
  remainingDeck: Card[];
}
