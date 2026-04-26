import { ALL_RANKS, ALL_SUITS, type Card, type Suit } from '@/constants/cards';
import type { GameState, SeatPosition, Trick } from '@/types/game-type';
import {
  canCardWinTrick,
  countPartnerTrumpsSpent,
  countTrumpsRemaining,
  getCheapestDiscard,
  getHighestCard,
  getLongestSuitCards,
  getLowestCard,
  getPartnerLastLedSuit,
  getPartnerSeat,
  getShortestSuitCards,
  getTrickPosition,
  holdingHighestRemainingTrump,
  isMyPartnerWinning,
  isOpponentWinningWithTrump,
} from '../utils';

// ─── Played-card memory ───────────────────────────────────────────────────────

/**
 * Derives the set of card IDs already played this round from completedTricks.
 * No GameState changes needed — computed on the fly from the full Trick objects
 * that are already stored in completedTricks.
 */
function getPlayedCardIds(gameState: GameState): Set<string> {
  const played = new Set<string>();
  for (const trick of gameState.completedTricks) {
    for (const tc of trick.cards) {
      played.add(tc.card.id);
    }
  }
  // Also include cards played in the current (incomplete) trick
  for (const tc of gameState.currentTrick.cards) {
    played.add(tc.card.id);
  }
  return played;
}

/**
 * Builds the full 52-card ID set so we can derive what's still live.
 */
function getAllCardIds(): Set<string> {
  const all = new Set<string>();
  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      all.add(`${rank}-${suit}`);
    }
  }
  return all;
}

/**
 * Cards that have NOT yet been played by anyone this round.
 * Includes cards still in all players' hands (unknown to us) + our own hand.
 */
function getUnplayedCardIds(gameState: GameState): Set<string> {
  const played = getPlayedCardIds(gameState);
  const all = getAllCardIds();
  for (const id of played) all.delete(id);
  return all;
}

// ─── Trick / score context ────────────────────────────────────────────────────

function getTeamTrickCount(team: 'BT' | 'LR', gameState: GameState): number {
  let count = 0;
  for (const trick of gameState.completedTricks) {
    if (trick.winningSeat) {
      if (gameState.players[trick.winningSeat].team === team) count++;
    }
  }
  return count;
}

interface PlayContext {
  myTeam: 'BT' | 'LR';
  opponentTeam: 'BT' | 'LR';
  isBiddingTeam: boolean;
  bid: number;
  myTeamTricks: number;
  opponentTricks: number;
  tricksPlayed: number;
  tricksRemaining: number;
  /** How many more tricks my team needs to hit its target (bid or 4). */
  tricksNeeded: number;
  /** True when we cannot afford to lose another trick. */
  mustWin: boolean;
  /** True when we are safely ahead — can afford to duck. */
  safelyAhead: boolean;
  playedCardIds: Set<string>;
  unplayedCardIds: Set<string>;
  trumpsRemaining: number;
  iHoldHighestTrump: boolean;
  /** Estimated number of trumps opponents still hold. */
  opponentTrumpsEstimate: number;
  /** Suit partner signalled by leading last trick (if won by our team). */
  partnerSignalSuit: Suit | null;
  partnerSeat: SeatPosition;
}

function buildContext(
  gameState: GameState,
  seat: SeatPosition,
  playable: Card[],
): PlayContext {
  const partnerSeat = getPartnerSeat(seat);

  if (!gameState.highestBidder) {
    return {
      myTeam: gameState.players[seat].team,
      opponentTeam: gameState.players[seat].team === 'BT' ? 'LR' : 'BT',
      isBiddingTeam: false,
      bid: 7,
      myTeamTricks: 0,
      opponentTricks: 0,
      tricksPlayed: 0,
      tricksRemaining: 10,
      tricksNeeded: 4,
      mustWin: false,
      safelyAhead: false,
      playedCardIds: new Set(),
      unplayedCardIds: getAllCardIds(),
      trumpsRemaining: 13,
      iHoldHighestTrump: false,
      opponentTrumpsEstimate: 13,
      partnerSignalSuit: null,
      partnerSeat,
    };
  }

  const myTeam = gameState.players[seat].team;
  const opponentTeam = myTeam === 'BT' ? 'LR' : 'BT';
  const bidderTeam = gameState.players[gameState.highestBidder].team;
  const isBiddingTeam = myTeam === bidderTeam;
  const bid = gameState.highestBid;

  const myTeamTricks = getTeamTrickCount(myTeam, gameState);
  const opponentTricks = getTeamTrickCount(opponentTeam, gameState);
  const tricksPlayed = gameState.completedTricks.length;
  const tricksRemaining = 10 - tricksPlayed;

  const target = isBiddingTeam ? bid : 4;
  const tricksNeeded = Math.max(0, target - myTeamTricks);
  const mustWin = tricksNeeded >= tricksRemaining;
  const safelyAhead = myTeamTricks >= target;

  const playedCardIds = getPlayedCardIds(gameState);
  const unplayedCardIds = getUnplayedCardIds(gameState);

  const trumpsRemaining = countTrumpsRemaining(
    gameState.trumpSuit,
    unplayedCardIds,
  );
  const iHoldHighestTrump = holdingHighestRemainingTrump(
    playable,
    gameState.trumpSuit,
    unplayedCardIds,
  );

  // Estimate opponent trump count:
  // Total unplayed trumps minus what I hold minus what partner has spent
  const myTrumpCount = gameState.trumpSuit
    ? playable.filter((c) => c.suit === gameState.trumpSuit).length
    : 0;
  const partnerTrumpsSpent = countPartnerTrumpsSpent(
    gameState.completedTricks,
    partnerSeat,
    gameState.trumpSuit,
  );
  const opponentTrumpsEstimate = Math.max(
    0,
    trumpsRemaining - myTrumpCount - partnerTrumpsSpent,
  );

  // Partner signal: suit they led in the last trick won by our team
  const partnerSignalSuit = getPartnerLastLedSuit(
    gameState.completedTricks,
    partnerSeat,
    myTeam,
    gameState,
  );

  return {
    myTeam,
    opponentTeam,
    isBiddingTeam,
    bid,
    myTeamTricks,
    opponentTricks,
    tricksPlayed,
    tricksRemaining,
    tricksNeeded,
    mustWin,
    safelyAhead,
    playedCardIds,
    unplayedCardIds,
    trumpsRemaining,
    iHoldHighestTrump,
    opponentTrumpsEstimate,
    partnerSignalSuit,
    partnerSeat,
  };
}

// ─── High trump check ─────────────────────────────────────────────────────────

/**
 * Returns true if the hand contains at least 2 high trump cards (A, K, or Q).
 * Used to gate trump extraction — we only extract when we have enough
 * firepower to flush out opponents' remaining trumps.
 */
function hasExtractionStrength(playable: Card[], trump: Suit | null): boolean {
  if (!trump) return false;
  const highTrumps = playable.filter(
    (c) => c.suit === trump && c.value >= 12, // Q=12, K=13, A=14
  );
  return highTrumps.length >= 2;
}

// ─── Main entry ───────────────────────────────────────────────────────────────

export function playHard(
  playable: Card[],
  trick: Trick,
  trump: Suit | null,
  trumpRevealed: boolean,
  gameState: GameState,
  seat: SeatPosition,
): Card {
  if (!gameState.highestBidder) return getLowestCard(playable);

  const ctx = buildContext(gameState, seat, playable);
  const trickPosition = getTrickPosition(trick);
  const partnerWinning = isMyPartnerWinning(trick, gameState, seat);

  // ── Cards by category ────────────────────────────────────────────────────
  const leadSuitCards = trick.leadSuit
    ? playable.filter((c) => c.suit === trick.leadSuit)
    : [];
  const trumpCards = trump ? playable.filter((c) => c.suit === trump) : [];
  const nonTrumpCards = trump
    ? playable.filter((c) => c.suit !== trump)
    : playable;

  // ── Position 1: Leading the trick ────────────────────────────────────────
  if (trickPosition === 1) {
    return getSmartLead(playable, trump, trumpRevealed, ctx);
  }

  // ── Can follow suit ──────────────────────────────────────────────────────
  if (leadSuitCards.length > 0) {
    return playFollowingSuit(
      leadSuitCards,
      playable,
      trick,
      trump,
      trumpRevealed,
      seat,
      trickPosition,
      partnerWinning,
      ctx,
      gameState,
    );
  }

  // ── Cannot follow suit ───────────────────────────────────────────────────
  return playVoid(
    playable,
    trumpCards,
    nonTrumpCards,
    trick,
    trump,
    trumpRevealed,
    seat,
    trickPosition,
    partnerWinning,
    ctx,
    gameState,
  );
}

// ─── Follow suit ──────────────────────────────────────────────────────────────

function playFollowingSuit(
  leadSuitCards: Card[],
  playable: Card[],
  trick: Trick,
  trump: Suit | null,
  trumpRevealed: boolean,
  seat: SeatPosition,
  trickPosition: 1 | 2 | 3 | 4,
  partnerWinning: boolean,
  ctx: PlayContext,
  gameState: GameState,
): Card {
  const winningCards = leadSuitCards.filter((c) =>
    canCardWinTrick(c, trick, trump, trumpRevealed, seat),
  );

  // ── Conservative mode: target already met, protect what we have ──────────
  if (ctx.safelyAhead) {
    return getLowestCard(leadSuitCards);
  }

  // ── Position 2 ───────────────────────────────────────────────────────────
  if (trickPosition === 2) {
    if (ctx.mustWin && winningCards.length > 0) {
      return getLowestCard(winningCards);
    }
    return getLowestCard(leadSuitCards);
  }

  // ── Positions 3 and 4 ────────────────────────────────────────────────────

  // Overtrump check (Gap B): opponent ruffs with trump while we can follow
  // suit — if trump is revealed and we hold a higher trump, steal it back.
  // Only applies when we're not already winning.
  if (
    trumpRevealed &&
    !partnerWinning &&
    isOpponentWinningWithTrump(trick, trump, gameState, seat)
  ) {
    const trumpCards = trump ? playable.filter((c) => c.suit === trump) : [];
    const winningTrumps = trumpCards.filter((c) =>
      canCardWinTrick(c, trick, trump, trumpRevealed, seat),
    );
    if (winningTrumps.length > 0) {
      // Overtrump with lowest winning trump to preserve the highest ones
      return getLowestCard(winningTrumps);
    }
    // Cannot overtrump — follow suit normally
  }

  // Partner support: partner led this suit, play highest to establish it
  if (
    trick.leadSuit &&
    isPartnerLeading(trick, ctx.partnerSeat) &&
    !partnerWinning
  ) {
    return winningCards.length > 0
      ? getHighestCard(winningCards)
      : getLowestCard(leadSuitCards);
  }

  if (partnerWinning) {
    // Partner already winning — don't waste a high card
    return getLowestCard(leadSuitCards);
  }

  if (winningCards.length > 0) {
    return getLowestCard(winningCards);
  }

  return getLowestCard(leadSuitCards);
}

// ─── Void in led suit ────────────────────────────────────────────────────────

function playVoid(
  playable: Card[],
  trumpCards: Card[],
  nonTrumpCards: Card[],
  trick: Trick,
  trump: Suit | null,
  trumpRevealed: boolean,
  seat: SeatPosition,
  trickPosition: 1 | 2 | 3 | 4,
  partnerWinning: boolean,
  ctx: PlayContext,
  gameState: GameState,
): Card {
  // Conservative mode: target already met — just discard cheapest
  if (ctx.safelyAhead) {
    return nonTrumpCards.length > 0
      ? getCheapestDiscard(nonTrumpCards, trump)
      : getCheapestDiscard(playable, trump);
  }

  // Overtrump check (Gap C): opponent is winning with a small trump,
  // we hold a higher trump and trump is revealed — always steal it back.
  if (
    trumpRevealed &&
    isOpponentWinningWithTrump(trick, trump, gameState, seat)
  ) {
    const winningTrumps = trumpCards.filter((c) =>
      canCardWinTrick(c, trick, trump, trumpRevealed, seat),
    );
    if (winningTrumps.length > 0) {
      return getLowestCard(winningTrumps);
    }
  }

  // Partner is winning — discard cheapest non-trump
  if (partnerWinning) {
    return nonTrumpCards.length > 0
      ? getCheapestDiscard(nonTrumpCards, trump)
      : getCheapestDiscard(playable, trump);
  }

  // Try to win with trump
  if (trumpCards.length > 0) {
    const winningTrumps = trumpCards.filter((c) =>
      canCardWinTrick(c, trick, trump, trumpRevealed, seat),
    );

    if (winningTrumps.length > 0) {
      // Position 3: only commit if safe (highest trump) or desperate
      if (trickPosition === 3) {
        if (ctx.iHoldHighestTrump || ctx.mustWin) {
          return getLowestCard(winningTrumps);
        }
        // Save trump — opponent in pos 4 might overtrump
        return nonTrumpCards.length > 0
          ? getCheapestDiscard(nonTrumpCards, trump)
          : getLowestCard(winningTrumps);
      }
      // Position 4: safe to trump, no one follows
      return getLowestCard(winningTrumps);
    }

    // Have trumps but none can win
    return getCheapestDiscard(playable, trump);
  }

  return getCheapestDiscard(playable, trump);
}

// ─── Smart lead ───────────────────────────────────────────────────────────────

function getSmartLead(
  playable: Card[],
  trump: Suit | null,
  trumpRevealed: boolean,
  ctx: PlayContext,
): Card {
  const nonTrump = trump ? playable.filter((c) => c.suit !== trump) : playable;
  const trumpCards = trump ? playable.filter((c) => c.suit === trump) : [];

  // ── Conservative mode: safely ahead — lead low, don't risk tricks ────────
  if (ctx.safelyAhead) {
    return nonTrump.length > 0
      ? getLowestCard(getLongestSuitCards(nonTrump, trump))
      : getLowestCard(trumpCards);
  }

  // ── P1: mustWin trump extraction ─────────────────────────────────────────
  // Desperate + bidding team + hold highest trump + opponents still have trumps
  if (
    ctx.mustWin &&
    ctx.isBiddingTeam &&
    trumpRevealed &&
    ctx.iHoldHighestTrump &&
    ctx.opponentTrumpsEstimate > 0 &&
    trumpCards.length >= 2
  ) {
    return getHighestCard(trumpCards);
  }

  // ── P2: Hand-strength trump extraction ───────────────────────────────────
  // Bidding team, trump revealed, hold 2+ high trumps (A/K/Q),
  // opponents still hold trumps worth extracting — lead highest trump
  if (
    ctx.isBiddingTeam &&
    trumpRevealed &&
    hasExtractionStrength(playable, trump) &&
    ctx.opponentTrumpsEstimate > 0
  ) {
    return getHighestCard(trumpCards);
  }

  // ── P3: Suit continuation — follow partner's signal ──────────────────────
  // Partner led a suit last trick and our team won it — continue that suit
  if (ctx.partnerSignalSuit && ctx.partnerSignalSuit !== trump) {
    const signalSuitCards = playable.filter(
      (c) => c.suit === ctx.partnerSignalSuit,
    );
    if (signalSuitCards.length >= 2) {
      // Still have 2+ cards in that suit — worth continuing
      return getHighestCard(signalSuitCards);
    }
  }

  // ── P4: Singleton lead — go void, gain trump entry later ─────────────────
  if (nonTrump.length > 0) {
    const shortSuit = getShortestSuitCards(nonTrump, trump);
    if (shortSuit.length === 1) {
      return shortSuit[0];
    }
  }

  // ── P5: Normal lead ───────────────────────────────────────────────────────
  if (ctx.isBiddingTeam) {
    if (nonTrump.length > 0) {
      return getHighestCard(getLongestSuitCards(nonTrump, trump));
    }
    return getLowestCard(trumpCards);
  }

  // Defending team: lead low from longest suit
  if (nonTrump.length > 0) {
    return getLowestCard(getLongestSuitCards(nonTrump, trump));
  }

  return getLowestCard(trumpCards);
}

// ─── Partner helpers ──────────────────────────────────────────────────────────

/**
 * Returns true if the first card played in the trick was by our partner.
 * Used to detect when partner is leading so we can play high to support them.
 */
function isPartnerLeading(trick: Trick, partnerSeat: SeatPosition): boolean {
  if (trick.cards.length === 0) return false;
  return trick.cards[0].player === partnerSeat;
}
