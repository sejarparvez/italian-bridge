/**
 * bot-bidding.ts
 *
 * Human-like bot bidding intelligence for the card game.
 *
 * ─── Four reasoning layers ────────────────────────────────────────────────────
 *
 *   Layer 1 — Hand strength      What cards do I hold? How are they distributed?
 *   Layer 2 — Score context      Where are both teams vs the win threshold?
 *   Layer 3 — Table reading      What have other bids signalled about hand strength?
 *   Layer 4 — Risk calibration   What does winning / losing this bid actually do?
 *
 * ─── Must-Bid Rule ───────────────────────────────────────────────────────────
 *
 * The dealer MUST bid if all other players pass. Every bot at the table
 * factors this into their strategy.
 *
 * ─── Forced Bid Trap ─────────────────────────────────────────────────────────
 *
 * When the opponent team is dealing, Team B can deliberately pass to force
 * the dealer into a bid-7 commitment, then try to win 7 tricks and inflict
 * a −7 penalty. Fires only when very specific conditions are met.
 * See shouldAttemptForcedBidTrap().
 *
 * ─── Silent Coordination ─────────────────────────────────────────────────────
 *
 * Both bots on the same team receive the same BidContext. All decisions are
 * deterministic (no per-bot randomness) so teammates reach the same conclusion
 * independently — simulating coordination without explicit communication.
 */

import type { Card, Suit } from '../../constants/cards';
import { ALL_SUITS } from '../../constants/cards';
import { BID_MAX, BID_MIN } from '../bidding';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BidContext {
  hand: Card[];
  currentHighestBid: number;
  myTeamScore: number;
  opponentScore: number;
  /**
   * User-selected win/loss threshold (e.g. 30, 50, 70, 100).
   * All score comparisons use ratios (score / threshold) so logic scales to any game length.
   */
  winThreshold: number;
  /** Partner's bid this round: a number if they bid, 0 if they passed, null if not yet bid. */
  partnerBid: number | null;
  isDealer: boolean;
  /** True if every player who bid before this bot has passed. */
  allOthersPassed: boolean;
  /** True if our partner is the dealer this round (enables partner-shield pass). */
  dealerIsMyPartner: boolean;
  /** True if an opponent is the dealer this round (enables forced-bid trap). */
  isOpponentDealing: boolean;
}

interface WinPaths {
  weWinOnDefense: boolean;
  weWinByBidding: boolean;
  weMustWinBid: boolean;
  oppWinsOnDefense: boolean;
  oppWinsByBidding: boolean;
  simultaneousWinRisk: boolean;
}

interface HandStrength {
  highCardPoints: number;
  aces: number;
  kings: number;
  longestSuit: { suit: Suit; length: number };
  suitDiversity: number;
  /** Hand wins tricks regardless of trump — Aces+Kings ≥ 2 spread across 3+ suits. */
  isTrumpAgnosticStrong: boolean;
  /** Estimated bid based purely on card quality, before any contextual adjustment. */
  naiveBidEstimate: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HCP_VALUES: Record<number, number> = {
  14: 4, // Ace
  13: 3, // King
  12: 2, // Queen
  11: 1, // Jack
};

const SCORE_RATIOS = {
  /** Either team is close to winning — game becomes high-stakes. */
  DANGER_ZONE: 0.7,
  /** We're so far behind that conservative play is counterproductive. */
  DESPERATION_ZONE: -0.65,
} as const;

// ─── Layer 1: Hand Strength ───────────────────────────────────────────────────

/**
 * Evaluates the bot's 5-card hand.
 *
 * Called before Phase 2 dealing, so only 5 cards are visible.
 * Voids are NOT counted as strength — in a 5-card hand they just mean
 * undealt cards, not real ruffing ability. Voids matter in selectBotTrump()
 * after all 13 cards are dealt.
 *
 * HCP scale calibrated for 5-card samples (max possible ≈ 16 pts):
 *   0–3 pts → bid 7   (weak — minimum commitment)
 *   4–5 pts → bid 8   (average — can contribute)
 *   6–8 pts → bid 9   (good — likely trick-taker)
 *   9+ pts  → bid 10  (dominant — strong suit + top honours)
 *
 * A +1 suit-concentration bonus applies when the longest suit has 3+ cards,
 * since that gives trump control when the bot wins the bid.
 */
export function evaluateHand(hand: Card[]): HandStrength {
  const suitCounts = new Map<Suit, number>();
  for (const card of hand) {
    suitCounts.set(card.suit, (suitCounts.get(card.suit) ?? 0) + 1);
  }

  const highCardPoints = hand.reduce(
    (total, card) => total + (HCP_VALUES[card.value] ?? 0),
    0,
  );

  const aces = hand.filter((c) => c.value === 14).length;
  const kings = hand.filter((c) => c.value === 13).length;
  const queens = hand.filter((c) => c.value === 12).length;

  let longestSuit: { suit: Suit; length: number } = {
    suit: ALL_SUITS[0],
    length: 0,
  };
  for (const [suit, count] of suitCounts.entries()) {
    if (count > longestSuit.length) longestSuit = { suit, length: count };
  }

  const suitDiversity = suitCounts.size;

  // Trump-agnostic strength: enough top cards spread across suits that
  // any trump the opponent picks still leaves us with winners.
  // Threshold: 2+ Aces/Kings across 3+ suits, or 3+ Aces/Kings regardless.
  const powerCards = aces + kings;
  const isTrumpAgnosticStrong =
    (powerCards >= 2 && suitDiversity >= 3) || powerCards >= 3;

  // Suit-concentration bonus: long suit → trump control when we win the bid.
  const suitConcentrationBonus = longestSuit.length >= 3 ? 1 : 0;

  // Additional quality signals for more accurate naive estimate:
  // Having both Ace+King of same suit is extremely powerful (guaranteed 2 tricks).
  const hasSolidAceKing = ALL_SUITS.some((s) => {
    const inSuit = hand.filter((c) => c.suit === s);
    return (
      inSuit.some((c) => c.value === 14) && inSuit.some((c) => c.value === 13)
    );
  });
  const solidPairBonus = hasSolidAceKing ? 1 : 0;

  const rawScore = highCardPoints + suitConcentrationBonus + solidPairBonus;

  // Map raw score → naive bid. Thresholds tuned for 5-card HCP distribution:
  // a 5-card hand rarely exceeds 12 pts, so the scale is compressed vs bridge.
  let naiveBidEstimate: number;
  if (rawScore <= 3) naiveBidEstimate = 7;
  else if (rawScore <= 5) naiveBidEstimate = 8;
  else if (rawScore <= 8) naiveBidEstimate = 9;
  else naiveBidEstimate = 10;

  // Ace-count safety check: bid 9+ only if we hold at least one Ace.
  // High HCP from Queens/Jacks alone is unreliable for trick prediction.
  if (naiveBidEstimate >= 9 && aces === 0) {
    naiveBidEstimate -= 1;
  }

  // Extra quality signal: 2 Aces + a King is a genuinely dominant 5-card hand.
  // Bump to 10 if the raw score isn't already there and we have 3 power cards.
  if (aces >= 2 && kings >= 1 && suitDiversity >= 2) {
    naiveBidEstimate = Math.max(naiveBidEstimate, 10);
  }

  // Suppress 10 if we lack suit depth — even dominant honours need a long
  // trump suit to convert them into all-10 tricks.
  if (naiveBidEstimate === 10 && longestSuit.length < 3 && queens === 0) {
    naiveBidEstimate = 9;
  }

  return {
    highCardPoints,
    aces,
    kings,
    longestSuit,
    suitDiversity,
    isTrumpAgnosticStrong,
    naiveBidEstimate: Math.min(BID_MAX, Math.max(BID_MIN, naiveBidEstimate)),
  };
}

// ─── Layer 2: Score Context ───────────────────────────────────────────────────

/**
 * Analyses what each team can achieve this round given current scores.
 *
 * Uses ratios (score / winThreshold) throughout so logic scales correctly
 * for any user-selected game length.
 *
 * Winning bid is projected at +bid (not always the minimum +7) by using
 * the naiveBidEstimate — this avoids always assuming the bot bids the floor.
 */
export function analyzeWinPaths(
  ctx: BidContext,
  estimatedBid?: number,
): WinPaths {
  const { myTeamScore, opponentScore, winThreshold } = ctx;

  // Use the bot's estimated bid value if available, else fall back to minimum.
  const bidGain = estimatedBid ?? BID_MIN;

  const weWinOnDefense = myTeamScore + 4 >= winThreshold;
  const weWinByBidding = myTeamScore + bidGain >= winThreshold;
  const oppWinsOnDefense = opponentScore + 4 >= winThreshold;
  const oppWinsByBidding = opponentScore + BID_MIN >= winThreshold;

  // Must-win-bid: defense alone won't win us the game, but bidding will.
  const weMustWinBid = !weWinOnDefense && weWinByBidding;

  const simultaneousWinRisk =
    (weWinOnDefense || weWinByBidding) &&
    (oppWinsOnDefense || oppWinsByBidding);

  return {
    weWinOnDefense,
    weWinByBidding,
    weMustWinBid,
    oppWinsOnDefense,
    oppWinsByBidding,
    simultaneousWinRisk,
  };
}

/**
 * Returns the urgency level of the game from this bot's perspective.
 *
 *   'desperate' — We're far behind or opponents are close to winning.
 *                 Conservative play will lose. Taking risks is correct.
 *   'cautious'  — We're close to winning. Protect the lead.
 *   'normal'    — Mid-game. Standard hand-based bidding.
 */
function getUrgencyLevel(ctx: BidContext): 'desperate' | 'cautious' | 'normal' {
  const { myTeamScore, opponentScore, winThreshold } = ctx;
  const myProgress = myTeamScore / winThreshold;
  const oppProgress = opponentScore / winThreshold;

  if (myProgress <= SCORE_RATIOS.DESPERATION_ZONE) return 'desperate';
  if (oppProgress >= SCORE_RATIOS.DANGER_ZONE) return 'desperate';
  if (myProgress >= SCORE_RATIOS.DANGER_ZONE) return 'cautious';
  return 'normal';
}

// ─── Layer 3: Table Reading ───────────────────────────────────────────────────

/**
 * Reads what other players' bidding behaviour signals about hand strength,
 * and returns an integer adjustment to apply to the naive bid estimate.
 *
 * Adjustment is capped: never pushes the final bid below BID_MIN or above BID_MAX.
 * Positive = bid higher, negative = bid lower, 0 = no change.
 *
 * Key signals:
 *   Partner passed        → Combined strength is limited. Be conservative.
 *   Partner bid 8         → They committed already. Don't stack on top.
 *   Partner bid 9+        → They're very committed. Only trump if forced.
 *   All others passed     → Weak field. Bid confidently at our estimate.
 *   Opponent bid 9+       → They're strong. Don't overbid unless our hand is too.
 *   Opponent bid 8        → Moderate signal. Slight caution.
 */
function getTableReadingAdjustment(
  ctx: BidContext,
  hand: HandStrength,
): number {
  const { partnerBid, currentHighestBid, allOthersPassed } = ctx;

  let adjustment = 0;

  if (partnerBid === 0) {
    // Partner passed: their hand is weak. Lower our ambition.
    adjustment -= 1;
  } else if (partnerBid !== null && partnerBid >= 9) {
    // Partner committed at 9+. Adding to that risks overshooting team capacity.
    adjustment -= 2;
  } else if (partnerBid !== null && partnerBid === 8) {
    adjustment -= 1;
  }

  if (allOthersPassed) {
    // Weak field — nobody else wants the bid. Bid confidently at our estimate,
    // and give a slight upward nudge if our hand is good enough.
    if (hand.highCardPoints >= 5) adjustment += 1;
  }

  if (currentHighestBid >= 9) {
    // Someone bid very high. Only contest if our hand genuinely supports it.
    if (hand.highCardPoints < 6) adjustment -= 1;
  } else if (currentHighestBid === 8) {
    // Moderate contest. Slight caution unless we're clearly stronger.
    if (hand.highCardPoints < 5) adjustment -= 1;
  }

  return adjustment;
}

// ─── Trap Strategy ────────────────────────────────────────────────────────────

/**
 * Determines whether Team B should attempt the "forced bid trap":
 * pass to force the opponent dealer into bid-7, then win 7 tricks
 * as opponents to inflict a −7 penalty on the dealer team.
 *
 * All five conditions must hold:
 *
 *   1. Opponents are dealing — only they are subject to the must-bid rule.
 *   2. We can't win the game just by bidding this round — if we can, just bid.
 *   3. Hand is trump-agnostic strong — we don't pick trump when we pass,
 *      so our hand must win tricks regardless of whatever suit they pick.
 *   4. The −7 penalty is actually meaningful — it must drop opponents below
 *      30% progress, otherwise the trap has low strategic value.
 *   5. (Implicit) Both Team B bots reach this conclusion independently
 *      because the function is deterministic — silent coordination.
 */
function shouldAttemptForcedBidTrap(
  ctx: BidContext,
  hand: HandStrength,
  paths: WinPaths,
): boolean {
  if (!ctx.isOpponentDealing) return false;
  if (paths.weWinByBidding) return false;
  if (!hand.isTrumpAgnosticStrong) return false;

  // Trap is only worth it if the penalty meaningfully damages opponents.
  const oppAfterPenalty = ctx.opponentScore - BID_MIN;
  const penaltyIsMeaningful = oppAfterPenalty / ctx.winThreshold < 0.3;
  if (!penaltyIsMeaningful) return false;

  // Extra safety: we need genuine trick-taking confidence, not just spread.
  // Require at least 2 Aces OR 1 Ace + 2 Kings to project 7-trick capacity.
  const sufficientPower = hand.aces >= 2 || (hand.aces >= 1 && hand.kings >= 2);
  if (!sufficientPower) return false;

  return true;
}

// ─── Bid-10 Gate ──────────────────────────────────────────────────────────────

/**
 * Returns true only when the hand genuinely justifies a bid-10 commitment.
 *
 * Bid 10 means winning ALL 10 tricks. Failing costs −10 — a catastrophic swing.
 * The bar is intentionally strict in normal play.
 *
 * Desperation mode (opponents win on defense regardless):
 *   Bid 10 is the ONLY way to stop them — winning all tricks leaves them with 3,
 *   which triggers −4 for opponents. Lower bar: Ace + solid HCP is enough.
 *
 * Normal mode:
 *   Requires Ace + King (two near-guaranteed tricks), high HCP, and long-suit
 *   depth for trump control throughout all 10 tricks.
 */
function shouldBidTen(hand: HandStrength, paths: WinPaths): boolean {
  if (paths.oppWinsOnDefense) {
    return hand.aces >= 1 && hand.highCardPoints >= 6;
  }
  return (
    hand.aces >= 1 &&
    hand.kings >= 1 &&
    hand.highCardPoints >= 8 &&
    hand.longestSuit.length >= 3
  );
}

// ─── Forced Bid Handling ──────────────────────────────────────────────────────

/**
 * Called when this bot is the dealer and everyone else passed — must bid.
 *
 * Bids honestly at or just above the current highest bid.
 * The forced bid is an obligation, not an opportunity to bluff.
 */
function getForcedBid(hand: HandStrength, currentHighestBid: number): number {
  const minimumRequiredBid =
    currentHighestBid === 0 ? BID_MIN : currentHighestBid + 1;
  const honestBid = Math.max(minimumRequiredBid, hand.naiveBidEstimate);
  return Math.min(BID_MAX, honestBid);
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

/**
 * Returns the bot's bid (7–10) or 0 to pass.
 *
 * Decisions are evaluated in strict priority order — higher priorities
 * override lower ones. This mirrors expert human thinking: resolve the
 * most critical game-state questions first, then fall back to hand evaluation.
 *
 *   P1  Forced bid      — Dealer must-bid rule: bid honestly at minimum.
 *   P2  Win by bidding  — Our bid gets us to the threshold: just bid.
 *   P3  Win by defense  — Scoring +4 as opponents wins it: pass freely.
 *   P4  Simultaneous    — Both teams can win this round: control trump.
 *   P5  Forced trap     — Opponent dealing + strong hand: pass to trap.
 *   P6  Partner shield  — Weak hand + dealer partner: let them take it.
 *   P7  Desperation     — Opponents win on defense: bid 10 or accept loss.
 *   P8  Standard        — Hand + urgency + table reading = final bid.
 */
export function getBotBid(ctx: BidContext): number {
  const { currentHighestBid, isDealer, allOthersPassed, dealerIsMyPartner } =
    ctx;

  const hand = evaluateHand(ctx.hand);
  const paths = analyzeWinPaths(ctx, hand.naiveBidEstimate);

  // P1 — Must-bid rule
  if (isDealer && allOthersPassed) {
    return getForcedBid(hand, currentHighestBid);
  }

  // P2 — Win the game by bidding
  if (paths.weWinByBidding) {
    if (!paths.weWinOnDefense) {
      const requiredBid = Math.max(BID_MIN, currentHighestBid + 1);
      if (requiredBid <= BID_MAX) return requiredBid;
    }
  }

  // P3 — Win the game by defending (no simultaneous-win complication)
  if (paths.weWinOnDefense && !paths.simultaneousWinRisk) {
    return 0;
  }

  // P4 — Simultaneous win risk: both teams can hit the threshold this round
  if (paths.simultaneousWinRisk) {
    if (paths.weMustWinBid) {
      // Only clean win is taking the bid — bid as high as hand justifies.
      const urgentBid = Math.min(
        BID_MAX,
        Math.max(BID_MIN, hand.naiveBidEstimate),
      );
      return urgentBid > currentHighestBid ? urgentBid : 0;
    } else {
      // We can win either way — take minimum control of trump to prevent
      // opponents winning on defense in the same round.
      return BID_MIN > currentHighestBid ? BID_MIN : 0;
    }
  }

  // P5 — Forced bid trap
  if (shouldAttemptForcedBidTrap(ctx, hand, paths)) {
    return 0;
  }

  // P6 — Partner shield: partner is dealer, our hand is minimum, let them take it
  if (
    dealerIsMyPartner &&
    ctx.partnerBid === null &&
    hand.naiveBidEstimate === BID_MIN
  ) {
    return 0;
  }

  // P7 — Desperation block: opponents will win by defending regardless
  if (paths.oppWinsOnDefense) {
    if (shouldBidTen(hand, paths)) {
      return BID_MAX > currentHighestBid ? BID_MAX : 0;
    }
    return 0; // can't stop them — accept the loss
  }

  // P8 — Standard urgency-adjusted bidding
  const urgency = getUrgencyLevel(ctx);
  const tableAdj = getTableReadingAdjustment(ctx, hand);

  let estimate = hand.naiveBidEstimate + tableAdj;

  if (urgency === 'desperate') estimate += 1;
  else if (urgency === 'cautious') estimate -= 1;

  estimate = Math.min(BID_MAX, Math.max(BID_MIN, estimate));

  // Bid-10 gate: even if estimate reaches BID_MAX, only commit if justified.
  // Failing bid 10 costs −10 — never overbid into it on marginal hands.
  if (estimate === BID_MAX && !shouldBidTen(hand, paths)) {
    estimate = BID_MAX - 1;
  }

  return estimate > currentHighestBid ? estimate : 0;
}

// ─── Trump Selection ──────────────────────────────────────────────────────────

/**
 * Selects the best trump suit after the bot wins the bid.
 *
 * Called AFTER Phase 2 dealing — all 13 cards are known. Voids are now
 * meaningful (a real ruffing advantage, not just undealt cards).
 *
 * Scoring per suit:
 *   Length  — more cards = more trump tricks = more control.
 *             At bid 9–10, length weighted more heavily.
 *   HCP     — Ace/King of trump = almost guaranteed trump control.
 *   Voids   — each void in a side suit = ruffing opportunity with trump.
 *
 * Safety minimum: at bid 9–10, enforce at least 4 trump cards.
 * Running out of trump at a high bid is almost always fatal.
 */
export function selectBotTrump(hand: Card[], bid: number): Suit {
  const suitData = new Map<Suit, { length: number; hcp: number }>();

  for (const suit of ALL_SUITS) {
    const suitCards = hand.filter((c) => c.suit === suit);
    suitData.set(suit, {
      length: suitCards.length,
      hcp: suitCards.reduce((pts, c) => pts + (HCP_VALUES[c.value] ?? 0), 0),
    });
  }

  const voidCount = [...suitData.values()].filter((d) => d.length === 0).length;

  const scoreSuit = (suit: Suit): number => {
    // biome-ignore lint/style/noNonNullAssertion: this is fine
    const data = suitData.get(suit)!;
    if (data.length === 0) return -Infinity;

    const minLength = bid >= 9 ? 4 : bid === 8 ? 3 : 2;
    if (data.length < minLength) return -Infinity;

    const lengthWeight = bid >= 9 ? 3 : 2;

    return data.length * lengthWeight + data.hcp * 3 + voidCount;
  };

  const ranked = (ALL_SUITS as Suit[])
    .slice()
    .sort((a, b) => scoreSuit(b) - scoreSuit(a));

  // Safety fallback: if min-length filter eliminated everything (very rare),
  // just pick the longest suit outright.
  if (scoreSuit(ranked[0]) === -Infinity) {
    return (ALL_SUITS as Suit[])
      .slice()
      .sort(
        (a, b) =>
          hand.filter((c) => c.suit === b).length -
          hand.filter((c) => c.suit === a).length,
      )[0];
  }

  return ranked[0];
}
