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

function getPlayedCardIds(gameState: GameState): Set<string> {
  const played = new Set<string>();
  for (const trick of gameState.completedTricks) {
    for (const tc of trick.cards) {
      played.add(tc.card.id);
    }
  }
  for (const tc of gameState.currentTrick.cards) {
    played.add(tc.card.id);
  }
  return played;
}

function getAllCardIds(): Set<string> {
  const all = new Set<string>();
  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      all.add(`${rank}-${suit}`);
    }
  }
  return all;
}

function getUnplayedCardIds(gameState: GameState): Set<string> {
  const played = getPlayedCardIds(gameState);
  const all = getAllCardIds();
  for (const id of played) all.delete(id);
  return all;
}

// ─── Suit & hand shape tracking ──────────────────────────────────────────────

/**
 * Returns the set of suits a given player is known to be void in, derived
 * from tricks where they failed to follow the led suit.
 *
 * Hidden-trump caveat: before trump is revealed, a player who cannot follow
 * the led suit may choose "Skip" and discard ANY card — including a trump-
 * suit card — without it proving a genuine void.  We therefore only trust
 * off-suit discards from tricks played AFTER trump was first revealed.
 *
 * Because `Trick` has no `trumpRevealedDuringTrick` field, we approximate
 * the reveal point as the index of the first completed trick in which any
 * player went off-suit (the earliest a reveal could have happened).  Every
 * trick from that index onward is treated as post-reveal.  If trump is not
 * yet globally revealed, we trust no voids at all.
 */
function getKnownVoids(
  gameState: GameState,
  targetSeat: SeatPosition,
): Set<Suit> {
  const voids = new Set<Suit>();

  // If trump has never been revealed, no discards can be trusted as real voids.
  if (!gameState.trumpRevealed) return voids;

  // Find the earliest trick where any player went off-suit — that is the
  // trick in which trump was first revealed (or the first one after).
  let revealTrickIndex = gameState.completedTricks.length;
  for (let i = 0; i < gameState.completedTricks.length; i++) {
    const t = gameState.completedTricks[i];
    if (!t.leadSuit) continue;
    if (t.cards.some((tc) => tc.card.suit !== t.leadSuit)) {
      revealTrickIndex = i;
      break;
    }
  }

  // Only scan tricks from the reveal point onward.
  for (let i = revealTrickIndex; i < gameState.completedTricks.length; i++) {
    const trick = gameState.completedTricks[i];
    if (!trick.leadSuit) continue;
    const played = trick.cards.find((tc) => tc.player === targetSeat);
    if (!played) continue;
    if (played.card.suit !== trick.leadSuit) {
      voids.add(trick.leadSuit);
    }
  }

  return voids;
}

// ─── Dynamic card evaluation ──────────────────────────────────────────────────

/**
 * Returns the "effective rank" of a card within its suit among remaining
 * opponent cards.  Rank 1 = boss (no higher card remains outside our hand),
 * rank 2 = second-highest, etc.
 *
 * This replaces static hardcoded thresholds (value >= 12) so that a Queen
 * is correctly treated as extraction-strength once the A and K are gone.
 */
function getEffectiveRank(
  card: Card,
  unplayedIds: Set<string>,
  myHand: Card[],
): number {
  const myIds = new Set(myHand.map((c) => c.id));
  let higherCount = 0;
  for (const id of unplayedIds) {
    if (!id.endsWith(`-${card.suit}`)) continue;
    if (myIds.has(id)) continue;
    const val = parseInt(id.split('-')[0], 10);
    if (!Number.isNaN(val) && val > card.value) higherCount++;
  }
  return higherCount + 1; // 1 = boss
}

/** True when the card has no higher card remaining in its suit (rank 1). */
function isBossCard(
  card: Card,
  unplayedIds: Set<string>,
  myHand: Card[],
): boolean {
  return getEffectiveRank(card, unplayedIds, myHand) === 1;
}

/**
 * True when a trump card can "extract" — it is the highest or second-highest
 * remaining trump (dynamic, not static value check).
 */
function isTrumpExtractionStrength(
  card: Card,
  trump: Suit | null,
  unplayedIds: Set<string>,
  myHand: Card[],
): boolean {
  if (!trump || card.suit !== trump) return false;
  return getEffectiveRank(card, unplayedIds, myHand) <= 2;
}

/**
 * True when we hold at least 2 trump cards of extraction strength.
 * Uses dynamic effective-rank, not a hardcoded face-value threshold.
 */
function hasExtractionStrength(
  playable: Card[],
  trump: Suit | null,
  unplayedIds: Set<string>,
): boolean {
  if (!trump) return false;
  const strong = playable.filter((c) =>
    isTrumpExtractionStrength(c, trump, unplayedIds, playable),
  );
  return strong.length >= 2;
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
  tricksNeeded: number;
  mustWin: boolean;
  safelyAhead: boolean;
  /** Bidding team bid all 10 tricks. */
  isBid10: boolean;
  /** Defending team is exactly one trick away from failing (has 3, needs 4). */
  defenseClutch: boolean;
  playedCardIds: Set<string>;
  unplayedCardIds: Set<string>;
  trumpsRemaining: number;
  iHoldHighestTrump: boolean;
  opponentTrumpsEstimate: number;
  partnerSignalSuit: Suit | null;
  partnerSeat: SeatPosition;
  leftOpponentSeat: SeatPosition;
  rightOpponentSeat: SeatPosition;
  leftOpponentVoids: Set<Suit>;
  rightOpponentVoids: Set<Suit>;
  /**
   * True when the highest bidder sits to our left (acts after us).
   * → "Lead through strength": prefer their strong suits to force them to
   *   commit before partner plays.
   */
  bidderOnLeft: boolean;
  /**
   * True when the highest bidder sits to our right (acts before us).
   * → "Lead to weakness": prefer suits they are short in so they can't
   *   win cheaply before we or partner play.
   */
  bidderOnRight: boolean;
}

function getSeatOrder(): SeatPosition[] {
  return ['bottom', 'left', 'top', 'right'];
}

function getLeftSeat(seat: SeatPosition): SeatPosition {
  const order = getSeatOrder();
  return order[(order.indexOf(seat) + 1) % 4];
}

function getRightSeat(seat: SeatPosition): SeatPosition {
  const order = getSeatOrder();
  return order[(order.indexOf(seat) + 3) % 4];
}

function buildContext(
  gameState: GameState,
  seat: SeatPosition,
  playable: Card[],
): PlayContext {
  const partnerSeat = getPartnerSeat(seat);
  const leftOpponentSeat = getLeftSeat(seat);
  const rightOpponentSeat = getRightSeat(seat);

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
      isBid10: false,
      defenseClutch: false,
      playedCardIds: new Set(),
      unplayedCardIds: getAllCardIds(),
      trumpsRemaining: 13,
      iHoldHighestTrump: false,
      opponentTrumpsEstimate: 13,
      partnerSignalSuit: null,
      partnerSeat,
      leftOpponentSeat,
      rightOpponentSeat,
      leftOpponentVoids: new Set(),
      rightOpponentVoids: new Set(),
      bidderOnLeft: false,
      bidderOnRight: false,
    };
  }

  const myTeam = gameState.players[seat].team;
  const opponentTeam = myTeam === 'BT' ? 'LR' : 'BT';
  const bidderTeam = gameState.players[gameState.highestBidder].team;
  const isBiddingTeam = myTeam === bidderTeam;
  const bid = gameState.highestBid;
  const isBid10 = bid === 10;

  const myTeamTricks = getTeamTrickCount(myTeam, gameState);
  const opponentTricks = getTeamTrickCount(opponentTeam, gameState);
  const tricksPlayed = gameState.completedTricks.length;
  const tricksRemaining = 10 - tricksPlayed;

  const target = isBiddingTeam ? bid : 4;
  const tricksNeeded = Math.max(0, target - myTeamTricks);
  const mustWin = tricksNeeded >= tricksRemaining;
  const safelyAhead = myTeamTricks >= target;

  const defenseClutch =
    !isBiddingTeam && myTeamTricks === 3 && tricksRemaining > 0;

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

  const partnerSignalSuit = getPartnerLastLedSuit(
    gameState.completedTricks,
    partnerSeat,
    myTeam,
    gameState,
  );

  const leftOpponentVoids = getKnownVoids(gameState, leftOpponentSeat);
  const rightOpponentVoids = getKnownVoids(gameState, rightOpponentSeat);

  const bidderOnLeft = gameState.highestBidder === leftOpponentSeat;
  const bidderOnRight = gameState.highestBidder === rightOpponentSeat;

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
    isBid10,
    defenseClutch,
    playedCardIds,
    unplayedCardIds,
    trumpsRemaining,
    iHoldHighestTrump,
    opponentTrumpsEstimate,
    partnerSignalSuit,
    partnerSeat,
    leftOpponentSeat,
    rightOpponentSeat,
    leftOpponentVoids,
    rightOpponentVoids,
    bidderOnLeft,
    bidderOnRight,
  };
}

// ─── Suit establishment helpers ───────────────────────────────────────────────

/**
 * Scores and returns the best non-trump suit group to establish / lead from.
 *
 * Factors:
 * - Length (more cards = more potential tricks)
 * - Boss card present (guaranteed winner)
 * - Effective rank of best card (dynamic — queen can be boss if A+K gone)
 * - Partner signal
 * - Opponent void penalty (they can ruff it)
 * - "Lead through" bonus: bidder on left → prefer their strong suits to
 *   force them high before partner plays.
 * - "Lead to weakness" bonus: bidder on right → prefer suits they are short
 *   in so they cannot win cheaply before we respond.
 */
function getBestEstablishmentSuit(
  playable: Card[],
  trump: Suit | null,
  ctx: PlayContext,
): Card[] {
  const nonTrump = trump ? playable.filter((c) => c.suit !== trump) : playable;
  if (nonTrump.length === 0) return [];

  const bySuit = new Map<Suit, Card[]>();
  for (const c of nonTrump) {
    const group = bySuit.get(c.suit) ?? [];
    group.push(c);
    bySuit.set(c.suit, group);
  }

  let bestSuit: Card[] | null = null;
  let bestScore = -Infinity;

  for (const [suit, cards] of bySuit) {
    let score = 0;

    score += cards.length * 2;

    const hasBoss = cards.some((c) =>
      isBossCard(c, ctx.unplayedCardIds, playable),
    );
    if (hasBoss) score += 5;

    // Effective rank of the best card in this suit (lower rank = stronger)
    const bestRank = Math.min(
      ...cards.map((c) => getEffectiveRank(c, ctx.unplayedCardIds, playable)),
    );
    score += Math.max(0, 4 - bestRank); // rank1→+3, rank2→+2, rank3→+1

    if (suit === ctx.partnerSignalSuit) score += 3;

    if (ctx.leftOpponentVoids.has(suit) || ctx.rightOpponentVoids.has(suit)) {
      score -= 4;
    }

    // Lead through: bidder on left — prefer suits they haven't shown void in
    if (ctx.bidderOnLeft && !ctx.leftOpponentVoids.has(suit)) {
      score += 1;
    }

    // Lead to weakness: bidder on right — prefer suits they are short in
    if (ctx.bidderOnRight && ctx.rightOpponentVoids.has(suit)) {
      score += 2;
    }

    if (score > bestScore) {
      bestScore = score;
      bestSuit = cards;
    }
  }

  return bestSuit ?? getLongestSuitCards(nonTrump, trump);
}

/**
 * Picks the best card to lead from a chosen suit:
 * - Boss card → lead it to cash the winner
 * - Top of a touching sequence (A from A-K, K from K-Q) → unblocks the suit
 * - Otherwise → lead low (invitation / suit setup)
 */
function getBestLeadFromSuit(
  cards: Card[],
  ctx: PlayContext,
  playable: Card[],
): Card {
  if (cards.length === 0) return getLowestCard(playable);

  const bossCards = cards.filter((c) =>
    isBossCard(c, ctx.unplayedCardIds, playable),
  );
  if (bossCards.length > 0) return getHighestCard(bossCards);

  const sorted = [...cards].sort((a, b) => b.value - a.value);
  if (sorted.length >= 2 && sorted[0].value - sorted[1].value === 1) {
    return sorted[0]; // top of touching sequence
  }

  return getLowestCard(cards);
}

/**
 * Chooses a strategic discard when we are void in the led suit and either
 * the trick is already won by our partner or we cannot win it.
 *
 * Signalling convention:
 *   HIGH discard (rank ≤ 2 in a suit) → "I have strength here — lead it to me."
 *   LOW discard  (rank ≥ 3)           → "Nothing here — avoid this suit."
 *
 * Priority: discard from the shortest, weakest non-trump suit (no boss cards,
 * not the partner signal suit) to go void in a useless suit while preserving
 * our strong suits intact.
 */
function chooseStrategicDiscard(
  nonTrumpCards: Card[],
  playable: Card[],
  trump: Suit | null,
  ctx: PlayContext,
): Card {
  if (nonTrumpCards.length === 0) return getCheapestDiscard(playable, trump);

  const bySuit = new Map<Suit, Card[]>();
  for (const c of nonTrumpCards) {
    const group = bySuit.get(c.suit) ?? [];
    group.push(c);
    bySuit.set(c.suit, group);
  }

  // Score each suit — lower = better candidate to discard from
  let worstSuit: Card[] | null = null;
  let worstScore = Infinity;

  for (const [suit, cards] of bySuit) {
    let score = 0;
    score += cards.length * 2; // longer suit = keep it

    const hasBoss = cards.some((c) =>
      isBossCard(c, ctx.unplayedCardIds, playable),
    );
    if (hasBoss) score += 6; // never discard from a boss suit

    if (suit === ctx.partnerSignalSuit) score += 4; // partner wants this

    if (score < worstScore) {
      worstScore = score;
      worstSuit = cards;
    }
  }

  if (!worstSuit) return getCheapestDiscard(nonTrumpCards, trump);

  // From the worst suit, throw the lowest card (signal: "nothing here")
  return getLowestCard(worstSuit);
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

  const leadSuitCards = trick.leadSuit
    ? playable.filter((c) => c.suit === trick.leadSuit)
    : [];
  const trumpCards = trump ? playable.filter((c) => c.suit === trump) : [];
  const nonTrumpCards = trump
    ? playable.filter((c) => c.suit !== trump)
    : playable;

  if (trickPosition === 1) {
    return getSmartLead(playable, trump, trumpRevealed, ctx);
  }

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

  // ── Conservative: target already met ─────────────────────────────────────
  if (ctx.safelyAhead) {
    // Cash a boss card rather than let it die later; otherwise play low
    const boss = leadSuitCards.find((c) =>
      isBossCard(c, ctx.unplayedCardIds, playable),
    );
    return boss ?? getLowestCard(leadSuitCards);
  }

  // ── Bid 10 defense: fight every trick without exception ───────────────────
  if (ctx.isBid10 && !ctx.isBiddingTeam) {
    if (winningCards.length > 0) return getLowestCard(winningCards);
    return getLowestCard(leadSuitCards);
  }

  // ── Overtrump: opponent ruffs while we can still follow suit ──────────────
  if (
    trumpRevealed &&
    !partnerWinning &&
    isOpponentWinningWithTrump(trick, trump, gameState, seat)
  ) {
    const localTrumps = trump ? playable.filter((c) => c.suit === trump) : [];
    const winningTrumps = localTrumps.filter((c) =>
      canCardWinTrick(c, trick, trump, trumpRevealed, seat),
    );
    if (winningTrumps.length > 0) return getLowestCard(winningTrumps);
  }

  // ── Position 2: second hand plays low (classic bridge principle) ──────────
  if (trickPosition === 2) {
    if (ctx.mustWin && winningCards.length > 0) {
      return getLowestCard(winningCards);
    }
    if (ctx.defenseClutch && winningCards.length > 0) {
      // Burn a high card if needed — this trick is critical
      return getLowestCard(winningCards);
    }
    // Play boss card rather than surrender a free trick
    const boss = leadSuitCards.find((c) =>
      isBossCard(c, ctx.unplayedCardIds, playable),
    );
    if (boss) return boss;
    return getLowestCard(leadSuitCards);
  }

  // ── Partner already winning ───────────────────────────────────────────────
  if (partnerWinning) {
    // Late game: cash boss cards now — no time to set up
    if (ctx.tricksRemaining <= 3) {
      const boss = leadSuitCards.find((c) =>
        isBossCard(c, ctx.unplayedCardIds, playable),
      );
      if (boss) return boss;
    }
    return getLowestCard(leadSuitCards);
  }

  // ── Third hand plays high: partner led, we support ───────────────────────
  if (trick.leadSuit && isPartnerLeading(trick, ctx.partnerSeat)) {
    if (winningCards.length > 0) return getHighestCard(winningCards);
    return getLowestCard(leadSuitCards);
  }

  // ── General: beat the current winner with the cheapest winning card ───────
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
  // ── Conservative: target met — strategic discard ──────────────────────────
  if (ctx.safelyAhead) {
    return nonTrumpCards.length > 0
      ? chooseStrategicDiscard(nonTrumpCards, playable, trump, ctx)
      : getCheapestDiscard(playable, trump);
  }

  // ── Bid 10 defense: ruff every single trick ───────────────────────────────
  if (ctx.isBid10 && !ctx.isBiddingTeam && trumpCards.length > 0) {
    const winningTrumps = trumpCards.filter((c) =>
      canCardWinTrick(c, trick, trump, trumpRevealed, seat),
    );
    if (winningTrumps.length > 0) return getLowestCard(winningTrumps);
    return nonTrumpCards.length > 0
      ? chooseStrategicDiscard(nonTrumpCards, playable, trump, ctx)
      : getCheapestDiscard(playable, trump);
  }

  // ── Overtrump: opponent winning with a trump — steal with higher ──────────
  if (
    trumpRevealed &&
    isOpponentWinningWithTrump(trick, trump, gameState, seat)
  ) {
    const winningTrumps = trumpCards.filter((c) =>
      canCardWinTrick(c, trick, trump, trumpRevealed, seat),
    );
    if (winningTrumps.length > 0) return getLowestCard(winningTrumps);
  }

  // ── Partner winning: strategic discard to signal good suits ──────────────
  if (partnerWinning) {
    return nonTrumpCards.length > 0
      ? chooseStrategicDiscard(nonTrumpCards, playable, trump, ctx)
      : getCheapestDiscard(playable, trump);
  }

  // ── Try to win with trump ─────────────────────────────────────────────────
  if (trumpCards.length > 0) {
    const winningTrumps = trumpCards.filter((c) =>
      canCardWinTrick(c, trick, trump, trumpRevealed, seat),
    );

    if (winningTrumps.length > 0) {
      if (trickPosition === 3) {
        // Right-hand opponent still to play — only commit when it is safe
        const rhVoidInTrump =
          trump !== null && ctx.rightOpponentVoids.has(trump);
        const shouldRuff =
          ctx.iHoldHighestTrump ||
          ctx.mustWin ||
          ctx.defenseClutch ||
          rhVoidInTrump;

        if (shouldRuff) return getLowestCard(winningTrumps);

        // Hidden trump + bidding team + not desperate → use "Skip":
        // discard cheapest non-trump to conceal our trump suit.
        if (!trumpRevealed && ctx.isBiddingTeam && !ctx.mustWin) {
          return nonTrumpCards.length > 0
            ? chooseStrategicDiscard(nonTrumpCards, playable, trump, ctx)
            : getCheapestDiscard(playable, trump);
        }

        // Save trump in case we need it later
        return nonTrumpCards.length > 0
          ? chooseStrategicDiscard(nonTrumpCards, playable, trump, ctx)
          : getLowestCard(winningTrumps);
      }

      // Position 4: last to play — safe to ruff, nobody can overtrump
      return getLowestCard(winningTrumps);
    }

    // Hold trumps but none can win — discard strategically
    return nonTrumpCards.length > 0
      ? chooseStrategicDiscard(nonTrumpCards, playable, trump, ctx)
      : getCheapestDiscard(playable, trump);
  }

  return chooseStrategicDiscard(
    nonTrumpCards.length > 0 ? nonTrumpCards : playable,
    playable,
    trump,
    ctx,
  );
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

  // ── Conservative: target met — cash winners, otherwise play low ───────────
  if (ctx.safelyAhead) {
    const bossNonTrump = nonTrump.find((c) =>
      isBossCard(c, ctx.unplayedCardIds, playable),
    );
    if (bossNonTrump) return bossNonTrump;
    return nonTrump.length > 0
      ? getLowestCard(getLongestSuitCards(nonTrump, trump))
      : getLowestCard(trumpCards);
  }

  // ── Bid 10 offense: extract all trumps, then cash suit winners ────────────
  if (
    ctx.isBid10 &&
    ctx.isBiddingTeam &&
    trumpRevealed &&
    trumpCards.length > 0
  ) {
    if (ctx.opponentTrumpsEstimate > 0) {
      return getHighestCard(trumpCards);
    }
    const boss = nonTrump.find((c) =>
      isBossCard(c, ctx.unplayedCardIds, playable),
    );
    if (boss) return boss;
    return nonTrump.length > 0
      ? getHighestCard(getLongestSuitCards(nonTrump, trump))
      : getLowestCard(trumpCards);
  }

  // ── Bid 10 defense: lead trump to drain opponents' ruffing power ──────────
  if (
    ctx.isBid10 &&
    !ctx.isBiddingTeam &&
    trumpRevealed &&
    trumpCards.length > 0
  ) {
    return getLowestCard(trumpCards);
  }

  // ── Late game (≤ 3 tricks left): cash winners immediately ────────────────
  if (ctx.tricksRemaining <= 3) {
    const boss = nonTrump.find((c) =>
      isBossCard(c, ctx.unplayedCardIds, playable),
    );
    if (boss) return boss;
    if (ctx.iHoldHighestTrump && trumpCards.length > 0) {
      return getHighestCard(trumpCards);
    }
  }

  // ── Trump extraction (bidding team with dynamically computed strength) ─────
  if (ctx.isBiddingTeam && trumpRevealed && ctx.opponentTrumpsEstimate > 0) {
    // Desperate: must win all remaining tricks and hold highest trump
    if (ctx.mustWin && ctx.iHoldHighestTrump && trumpCards.length >= 2) {
      return getHighestCard(trumpCards);
    }
    // Strong: 2+ trump cards of extraction strength (dynamic rank check)
    if (
      hasExtractionStrength(playable, trump, ctx.unplayedCardIds) &&
      trumpCards.length > 0
    ) {
      return getHighestCard(trumpCards);
    }
    // Small-trump assist: partner is the bidder and we hold small trumps →
    // lead one to help them "pull" the opponents' remaining trumps.
    const partnerIsBidder = !ctx.bidderOnLeft && !ctx.bidderOnRight;
    if (
      partnerIsBidder &&
      trumpCards.length > 0 &&
      ctx.opponentTrumpsEstimate >= 2
    ) {
      return getLowestCard(trumpCards);
    }
  }

  // ── Partner signal: continue their chosen suit ────────────────────────────
  if (ctx.partnerSignalSuit && ctx.partnerSignalSuit !== trump) {
    const signalCards = playable.filter(
      (c) => c.suit === ctx.partnerSignalSuit,
    );
    if (signalCards.length >= 1) {
      return getBestLeadFromSuit(signalCards, ctx, playable);
    }
  }

  // ── Singleton lead: create a void for ruffing (early/mid game only) ───────
  if (nonTrump.length > 0 && ctx.tricksRemaining >= 4) {
    const shortSuit = getShortestSuitCards(nonTrump, trump);
    if (shortSuit.length === 1) {
      return shortSuit[0];
    }
  }

  // ── Defense: lead through strength / to weakness ──────────────────────────
  if (!ctx.isBiddingTeam) {
    if (nonTrump.length > 0) {
      // Scoring in getBestEstablishmentSuit already applies bidderOnLeft/Right
      const bestSuit = getBestEstablishmentSuit(playable, trump, ctx);
      return getLowestCard(bestSuit); // defenders lead low to invite partner
    }
    return getLowestCard(trumpCards);
  }

  // ── Bidding team: establish best suit ────────────────────────────────────
  if (nonTrump.length > 0) {
    const bestSuit = getBestEstablishmentSuit(playable, trump, ctx);
    return getBestLeadFromSuit(bestSuit, ctx, playable);
  }

  return getLowestCard(trumpCards);
}

// ─── Partner helpers ──────────────────────────────────────────────────────────

function isPartnerLeading(trick: Trick, partnerSeat: SeatPosition): boolean {
  if (trick.cards.length === 0) return false;
  return trick.cards[0].player === partnerSeat;
}
