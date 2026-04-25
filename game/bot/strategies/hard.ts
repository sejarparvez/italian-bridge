import { ALL_RANKS, ALL_SUITS, type Card, type Suit } from '@/constants/cards';
import type { GameState, SeatPosition, Trick } from '@/types/game-type';
import {
  canCardWinTrick,
  countTrumpsRemaining,
  getCheapestDiscard,
  getHighestCard,
  getLongestSuitCards,
  getLowestCard,
  getShortestSuitCards,
  getTrickPosition,
  holdingHighestRemainingTrump,
  isMyPartnerWinning,
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
}

function buildContext(
  gameState: GameState,
  seat: SeatPosition,
  playable: Card[],
): PlayContext {
  if (!gameState.highestBidder) {
    // Fallback — should never happen in practice
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

  // Target: bidding team needs `bid` tricks; defending team needs 4
  const target = isBiddingTeam ? bid : 4;
  const tricksNeeded = Math.max(0, target - myTeamTricks);
  const mustWin = tricksNeeded >= tricksRemaining;

  // Safely ahead: we have enough tricks already, or will win even losing all remaining
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
  };
}

// ─── Main entry ───────────────────────────────────────────────────────────────

export function playHard(
  playable: Card[],
  trick: Trick,
  trump: Suit | null,
  _trumpRevealed: boolean,
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
    return getSmartLead(playable, trump, ctx);
  }

  // ── Can follow suit ──────────────────────────────────────────────────────
  if (leadSuitCards.length > 0) {
    return playFollowingSuit(
      leadSuitCards,
      trick,
      trump,
      seat,
      trickPosition,
      partnerWinning,
      ctx,
    );
  }

  // ── Cannot follow suit ───────────────────────────────────────────────────
  return playVoid(
    playable,
    trumpCards,
    nonTrumpCards,
    trick,
    trump,
    seat,
    trickPosition,
    partnerWinning,
    ctx,
  );
}

// ─── Follow suit ──────────────────────────────────────────────────────────────

function playFollowingSuit(
  leadSuitCards: Card[],
  trick: Trick,
  trump: Suit | null,
  seat: SeatPosition,
  trickPosition: 1 | 2 | 3 | 4,
  partnerWinning: boolean,
  ctx: PlayContext,
): Card {
  const winningCards = leadSuitCards.filter((c) =>
    canCardWinTrick(c, trick, trump, seat),
  );

  // ── Position 2 (second to play) ──────────────────────────────────────────
  if (trickPosition === 2) {
    // Default: duck (play low, save high cards for later)
    // Exception: if we're desperate AND we hold the only winning card, take it
    if (ctx.mustWin && winningCards.length > 0) {
      return getLowestCard(winningCards);
    }
    return getLowestCard(leadSuitCards);
  }

  // ── Position 3 or 4 (late position) ─────────────────────────────────────
  if (partnerWinning) {
    // Partner is already winning — don't waste a high card
    return getLowestCard(leadSuitCards);
  }

  // We need to win this trick
  if (winningCards.length > 0) {
    // Play the cheapest card that still wins
    return getLowestCard(winningCards);
  }

  // Cannot beat the current winner — discard lowest
  return getLowestCard(leadSuitCards);
}

// ─── Void in led suit ────────────────────────────────────────────────────────

function playVoid(
  playable: Card[],
  trumpCards: Card[],
  nonTrumpCards: Card[],
  trick: Trick,
  trump: Suit | null,
  seat: SeatPosition,
  trickPosition: 1 | 2 | 3 | 4,
  partnerWinning: boolean,
  ctx: PlayContext,
): Card {
  // Partner is already winning — discard cheapest non-trump
  if (partnerWinning) {
    return nonTrumpCards.length > 0
      ? getCheapestDiscard(nonTrumpCards, trump)
      : getCheapestDiscard(playable, trump);
  }

  // We need to win — try to trump
  if (trumpCards.length > 0) {
    const winningTrumps = trumpCards.filter((c) =>
      canCardWinTrick(c, trick, trump, seat),
    );

    if (winningTrumps.length > 0) {
      // In position 3 with position 4 still to play, only overcommit if
      // we're holding the highest remaining trump (safe) or desperately need it
      if (trickPosition === 3) {
        if (ctx.iHoldHighestTrump || ctx.mustWin) {
          return getLowestCard(winningTrumps);
        }
        // Otherwise save the trump — opponent in pos 4 might overtrump anyway
        return nonTrumpCards.length > 0
          ? getCheapestDiscard(nonTrumpCards, trump)
          : getLowestCard(winningTrumps); // forced — no other option
      }
      // Position 4: safe to trump, no one after us
      return getLowestCard(winningTrumps);
    }

    // Have trumps but none can win (opponent already played higher trump)
    return getCheapestDiscard(playable, trump);
  }

  // No trumps at all — discard cheapest
  return getCheapestDiscard(playable, trump);
}

// ─── Smart lead ───────────────────────────────────────────────────────────────

function getSmartLead(
  playable: Card[],
  trump: Suit | null,
  ctx: PlayContext,
): Card {
  const nonTrump = trump ? playable.filter((c) => c.suit !== trump) : playable;
  const trumpCards = trump ? playable.filter((c) => c.suit === trump) : [];

  // ── Desperate mode: draw trumps aggressively ─────────────────────────────
  // If we're the bidding team, running out of tricks, and hold many trumps,
  // leading trump forces opponents to spend theirs
  if (ctx.mustWin && ctx.isBiddingTeam && trumpCards.length >= 3) {
    // Only lead trump if we hold the highest remaining — safe extraction
    if (ctx.iHoldHighestTrump) {
      return getHighestCard(trumpCards);
    }
  }

  // ── Singleton lead: dump a lone card to go void, gain trump entries later ─
  if (nonTrump.length > 0) {
    const shortSuit = getShortestSuitCards(nonTrump, trump);
    if (shortSuit.length === 1) {
      // Singleton — lead it to become void in that suit
      return shortSuit[0];
    }
  }

  // ── Bidding team: lead high from longest suit to establish tricks ─────────
  if (ctx.isBiddingTeam) {
    if (nonTrump.length > 0) {
      const longestSuitCards = getLongestSuitCards(nonTrump, trump);
      return getHighestCard(longestSuitCards);
    }
    // Only trump cards left — lead lowest to preserve high trumps
    return getLowestCard(trumpCards);
  }

  // ── Defending team: lead low to stay safe, avoid handing tricks away ──────
  if (nonTrump.length > 0) {
    // Lead low from longest suit — safer than leading short
    const longestSuitCards = getLongestSuitCards(nonTrump, trump);
    return getLowestCard(longestSuitCards);
  }

  return getLowestCard(trumpCards);
}
