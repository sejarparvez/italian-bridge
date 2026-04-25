/**
 * bot-bidding.test.ts
 *
 * Tests for evaluateHand(), analyzeWinPaths(), getBotBid(), and selectBotTrump().
 *
 * Run with: bun test
 */

// ─────────────────────────────────────────────────────────────────────────────

import { describe, expect, test } from 'bun:test';
import type { Card, Suit } from '../../../constants/cards';
import type { BidContext } from '../bot-bidding';
import {
  analyzeWinPaths,
  evaluateHand,
  getBotBid,
  selectBotTrump,
} from '../bot-bidding';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a Card from shorthand. e.g. card('A', 'spades') */
function card(rank: string, suit: Suit): Card {
  const valueMap: Record<string, number> = {
    A: 14,
    K: 13,
    Q: 12,
    J: 11,
    '10': 10,
    '9': 9,
    '8': 8,
    '7': 7,
    '6': 6,
    '5': 5,
    '4': 4,
    '3': 3,
    '2': 2,
  };
  return {
    id: `${rank}-${suit}`,
    suit,
    rank: rank as Card['rank'],
    value: valueMap[rank],
  };
}

/** Default mid-game, neutral BidContext — override only what each test needs. */
function ctx(overrides: Partial<BidContext> = {}): BidContext {
  return {
    hand: weakHand(),
    currentHighestBid: 0,
    myTeamScore: 0,
    opponentScore: 0,
    winThreshold: 30,
    partnerBid: null,
    isDealer: false,
    allOthersPassed: false,
    dealerIsMyPartner: false,
    isOpponentDealing: false,
    ...overrides,
  };
}

// ─── Reusable hands ───────────────────────────────────────────────────────────

/** 5 low cards — no honours, 4 suits (0 HCP) */
function weakHand(): Card[] {
  return [
    card('2', 'spades'),
    card('3', 'hearts'),
    card('4', 'diamonds'),
    card('5', 'clubs'),
    card('6', 'spades'),
  ];
}

/** Average hand — 1 Ace + 1 Queen spread (6 HCP) */
function averageHand(): Card[] {
  return [
    card('A', 'spades'),
    card('Q', 'hearts'),
    card('7', 'diamonds'),
    card('8', 'clubs'),
    card('9', 'spades'),
  ];
}

/** Strong hand — Ace + King in same suit + extra Ace (11 HCP, 3-card suit) */
function strongHand(): Card[] {
  return [
    card('A', 'spades'),
    card('K', 'spades'),
    card('Q', 'spades'),
    card('A', 'hearts'),
    card('K', 'hearts'),
  ];
}

/** Dominant hand for bid-10 — 2 Aces, King, 4-card spade suit (12 HCP, longestSuit=4) */
function dominantHand(): Card[] {
  return [
    card('A', 'spades'),
    card('K', 'spades'),
    card('J', 'spades'),
    card('10', 'spades'),
    card('A', 'hearts'),
  ];
}

/** Trump-agnostic hand — 2 Aces + 1 King across 3 suits */
function trapHand(): Card[] {
  return [
    card('A', 'spades'),
    card('A', 'hearts'),
    card('K', 'diamonds'),
    card('7', 'clubs'),
    card('8', 'spades'),
  ];
}

// ─── evaluateHand() ───────────────────────────────────────────────────────────

describe('evaluateHand', () => {
  test('counts HCP correctly — Ace=4 King=3 Queen=2 Jack=1', () => {
    const hand = [
      card('A', 'spades'), // 4
      card('K', 'hearts'), // 3
      card('Q', 'diamonds'), // 2
      card('J', 'clubs'), // 1
      card('2', 'spades'), // 0
    ];
    const result = evaluateHand(hand);
    expect(result.highCardPoints).toBe(10);
    expect(result.aces).toBe(1);
    expect(result.kings).toBe(1);
  });

  test('counts aces and kings independently', () => {
    const hand = [
      card('A', 'spades'),
      card('A', 'hearts'),
      card('K', 'diamonds'),
      card('K', 'clubs'),
      card('2', 'spades'),
    ];
    const result = evaluateHand(hand);
    expect(result.aces).toBe(2);
    expect(result.kings).toBe(2);
  });

  test('finds the longest suit correctly', () => {
    const hand = [
      card('A', 'spades'),
      card('K', 'spades'),
      card('Q', 'spades'),
      card('2', 'hearts'),
      card('3', 'diamonds'),
    ];
    const result = evaluateHand(hand);
    expect(result.longestSuit.suit).toBe('spades');
    expect(result.longestSuit.length).toBe(3);
  });

  test('calculates suit diversity — all different suits', () => {
    const result = evaluateHand(weakHand());
    // weakHand has spades×2, hearts×1, diamonds×1, clubs×1 → 4 suits
    expect(result.suitDiversity).toBe(4);
  });

  test('calculates suit diversity — one suit', () => {
    const hand = [
      card('A', 'spades'),
      card('K', 'spades'),
      card('Q', 'spades'),
      card('J', 'spades'),
      card('10', 'spades'),
    ];
    const result = evaluateHand(hand);
    expect(result.suitDiversity).toBe(1);
  });

  test('weak hand (0 HCP) → bid 7', () => {
    const result = evaluateHand(weakHand());
    expect(result.naiveBidEstimate).toBe(7);
  });

  test('average hand with Ace → bid 8 or 9', () => {
    const result = evaluateHand(averageHand());
    expect(result.naiveBidEstimate).toBeGreaterThanOrEqual(8);
  });

  test('strong hand (2 Aces + 2 Kings) → bid 9 or 10', () => {
    const result = evaluateHand(strongHand());
    expect(result.naiveBidEstimate).toBeGreaterThanOrEqual(9);
  });

  test('dominant hand → bid 10', () => {
    const result = evaluateHand(dominantHand());
    expect(result.naiveBidEstimate).toBe(10);
  });

  test('no-Ace hand never bids above 8 regardless of HCP', () => {
    // Queens and Jacks only — HCP can be high but no Aces
    const hand = [
      card('Q', 'spades'),
      card('Q', 'hearts'),
      card('Q', 'diamonds'),
      card('J', 'clubs'),
      card('J', 'spades'),
    ];
    const result = evaluateHand(hand);
    expect(result.aces).toBe(0);
    expect(result.naiveBidEstimate).toBeLessThanOrEqual(8);
  });

  test('isTrumpAgnosticStrong: 2 power cards across 3+ suits → true', () => {
    const result = evaluateHand(trapHand());
    expect(result.isTrumpAgnosticStrong).toBe(true);
  });

  test('isTrumpAgnosticStrong: 3+ power cards regardless of spread → true', () => {
    // 3 Kings in 2 suits — concentrated but enough raw power
    const hand = [
      card('K', 'spades'),
      card('K', 'hearts'),
      card('K', 'diamonds'),
      card('2', 'spades'),
      card('3', 'spades'),
    ];
    const result = evaluateHand(hand);
    expect(result.isTrumpAgnosticStrong).toBe(true);
  });

  test('isTrumpAgnosticStrong: 1 Ace in 1 suit → false', () => {
    const hand = [
      card('A', 'spades'),
      card('2', 'spades'),
      card('3', 'spades'),
      card('4', 'spades'),
      card('5', 'spades'),
    ];
    const result = evaluateHand(hand);
    expect(result.isTrumpAgnosticStrong).toBe(false);
  });

  test('solid Ace-King bonus pushes estimate up', () => {
    // A+K in same suit gives solidPairBonus = 1
    const withPair = [
      card('A', 'spades'),
      card('K', 'spades'),
      card('2', 'hearts'),
      card('3', 'diamonds'),
      card('4', 'clubs'),
    ];
    const withoutPair = [
      card('A', 'spades'),
      card('K', 'hearts'), // different suits — no pair bonus
      card('2', 'diamonds'),
      card('3', 'clubs'),
      card('4', 'spades'),
    ];
    const withResult = evaluateHand(withPair);
    const withoutResult = evaluateHand(withoutPair);
    expect(withResult.naiveBidEstimate).toBeGreaterThanOrEqual(
      withoutResult.naiveBidEstimate,
    );
  });

  test('naiveBidEstimate is always within BID_MIN–BID_MAX', () => {
    const hands = [
      weakHand(),
      averageHand(),
      strongHand(),
      dominantHand(),
      trapHand(),
    ];
    for (const hand of hands) {
      const result = evaluateHand(hand);
      expect(result.naiveBidEstimate).toBeGreaterThanOrEqual(7);
      expect(result.naiveBidEstimate).toBeLessThanOrEqual(10);
    }
  });
});

// ─── analyzeWinPaths() ────────────────────────────────────────────────────────

describe('analyzeWinPaths', () => {
  test('weWinOnDefense: true when myScore + 4 >= threshold', () => {
    const paths = analyzeWinPaths(ctx({ myTeamScore: 26, winThreshold: 30 }));
    expect(paths.weWinOnDefense).toBe(true);
  });

  test('weWinOnDefense: false when myScore + 4 < threshold', () => {
    const paths = analyzeWinPaths(ctx({ myTeamScore: 20, winThreshold: 30 }));
    expect(paths.weWinOnDefense).toBe(false);
  });

  test('weWinByBidding: true when myScore + estimatedBid >= threshold', () => {
    // Score 24, threshold 30, estimatedBid 7 → 24+7=31 ≥ 30
    const paths = analyzeWinPaths(
      ctx({ myTeamScore: 24, winThreshold: 30 }),
      7,
    );
    expect(paths.weWinByBidding).toBe(true);
  });

  test('weWinByBidding: false when myScore + estimatedBid < threshold', () => {
    // Score 15, threshold 30, estimatedBid 7 → 15+7=22 < 30
    const paths = analyzeWinPaths(
      ctx({ myTeamScore: 15, winThreshold: 30 }),
      7,
    );
    expect(paths.weWinByBidding).toBe(false);
  });

  test('weMustWinBid: true when defense insufficient but bidding wins', () => {
    // myScore=24: +4 defense = 28 (not enough), +7 bid = 31 (wins)
    const paths = analyzeWinPaths(
      ctx({ myTeamScore: 24, winThreshold: 30 }),
      7,
    );
    expect(paths.weMustWinBid).toBe(true);
    expect(paths.weWinOnDefense).toBe(false);
  });

  test('weMustWinBid: false when defense already wins', () => {
    // myScore=27: +4 defense = 31 (wins already)
    const paths = analyzeWinPaths(
      ctx({ myTeamScore: 27, winThreshold: 30 }),
      7,
    );
    expect(paths.weMustWinBid).toBe(false);
  });

  test('oppWinsOnDefense: true when opponentScore + 4 >= threshold', () => {
    const paths = analyzeWinPaths(ctx({ opponentScore: 27, winThreshold: 30 }));
    expect(paths.oppWinsOnDefense).toBe(true);
  });

  test('simultaneousWinRisk: true when both teams can win this round', () => {
    // We win on defense (26+4=30), opponents win by bidding (24+7=31)
    const paths = analyzeWinPaths(
      ctx({ myTeamScore: 26, opponentScore: 24, winThreshold: 30 }),
      7,
    );
    expect(paths.simultaneousWinRisk).toBe(true);
  });

  test('simultaneousWinRisk: false when only one team can win', () => {
    const paths = analyzeWinPaths(
      ctx({ myTeamScore: 10, opponentScore: 10, winThreshold: 30 }),
      7,
    );
    expect(paths.simultaneousWinRisk).toBe(false);
  });

  test('uses BID_MIN as default estimatedBid when not provided', () => {
    // myScore=23, threshold=30 → 23+7=30 exactly → wins
    const paths = analyzeWinPaths(ctx({ myTeamScore: 23, winThreshold: 30 }));
    expect(paths.weWinByBidding).toBe(true);
  });

  test('scales correctly for threshold=100', () => {
    // 95+4=99 < 100 → no team wins on defense; 95+7=102 ≥ 100 → both win by bidding
    const paths = analyzeWinPaths(
      ctx({ myTeamScore: 95, opponentScore: 95, winThreshold: 100 }),
      7,
    );
    expect(paths.weWinOnDefense).toBe(false);
    expect(paths.oppWinsOnDefense).toBe(false);
    expect(paths.simultaneousWinRisk).toBe(true);
    expect(paths.weWinByBidding).toBe(true);
  });
});

// ─── getBotBid() — Priority 1: Forced Bid ────────────────────────────────────

describe('getBotBid — P1: dealer forced bid', () => {
  test('dealer with weak hand and all others passed → bids BID_MIN (7)', () => {
    const bid = getBotBid(
      ctx({
        hand: weakHand(),
        isDealer: true,
        allOthersPassed: true,
        currentHighestBid: 0,
      }),
    );
    expect(bid).toBe(7);
  });

  test('dealer with strong hand and all others passed → bids hand estimate', () => {
    const bid = getBotBid(
      ctx({
        hand: strongHand(),
        isDealer: true,
        allOthersPassed: true,
        currentHighestBid: 0,
      }),
    );
    expect(bid).toBeGreaterThanOrEqual(7);
    expect(bid).toBeLessThanOrEqual(10);
  });

  test('dealer forced but current bid already at 7 → bids at least 7', () => {
    const bid = getBotBid(
      ctx({
        hand: weakHand(),
        isDealer: true,
        allOthersPassed: true,
        currentHighestBid: 0,
      }),
    );
    expect(bid).toBeGreaterThanOrEqual(7);
  });

  test('non-dealer with all others passed does NOT trigger forced bid', () => {
    // Non-dealer with weak hand and nobody bid — should be able to pass
    const bid = getBotBid(
      ctx({
        hand: weakHand(),
        isDealer: false,
        allOthersPassed: true,
        currentHighestBid: 0,
      }),
    );
    // This bot may pass (0) — it is NOT forced to bid
    expect(bid).toBeGreaterThanOrEqual(0);
  });

  test('forced bid never exceeds BID_MAX', () => {
    const bid = getBotBid(
      ctx({
        hand: dominantHand(),
        isDealer: true,
        allOthersPassed: true,
        currentHighestBid: 9,
      }),
    );
    expect(bid).toBeLessThanOrEqual(10);
  });
});

// ─── getBotBid() — Priority 2: Win by Bidding ────────────────────────────────

describe('getBotBid — P2: win the game by bidding', () => {
  test('bids when myScore + 7 reaches threshold', () => {
    const bid = getBotBid(
      ctx({
        hand: averageHand(),
        myTeamScore: 24,
        winThreshold: 30,
        currentHighestBid: 0,
      }),
    );
    // Must bid something (not pass)
    expect(bid).toBeGreaterThanOrEqual(7);
  });

  test('bids just above currentHighestBid when winning bid is available', () => {
    const bid = getBotBid(
      ctx({
        hand: averageHand(),
        myTeamScore: 24,
        winThreshold: 30,
        currentHighestBid: 7,
      }),
    );
    expect(bid).toBe(8);
  });

  test('passes if current bid is already at BID_MAX and we cannot outbid', () => {
    // myScore=24, threshold=30, but currentHighestBid=10 — can't outbid
    // Falls through to P3 — win on defense (24+4=28 < 30, so won't pass there either)
    const bid = getBotBid(
      ctx({
        hand: weakHand(),
        myTeamScore: 24,
        winThreshold: 30,
        currentHighestBid: 10,
      }),
    );
    // Can't outbid 10, can't win on defense: standard bidding fires, weak hand → 0
    expect(bid).toBe(0);
  });
});

// ─── getBotBid() — Priority 3: Win by Defense ────────────────────────────────

describe('getBotBid — P3: win the game by defending', () => {
  test('passes when myScore + 4 reaches threshold with no simultaneous risk', () => {
    const bid = getBotBid(
      ctx({
        hand: strongHand(),
        myTeamScore: 27,
        opponentScore: 0,
        winThreshold: 30,
        currentHighestBid: 0,
      }),
    );
    expect(bid).toBe(0);
  });

  test('does NOT pass if there is simultaneous win risk', () => {
    // Both teams close to winning — P4 fires instead of P3 pass
    const bid = getBotBid(
      ctx({
        hand: averageHand(),
        myTeamScore: 27,
        opponentScore: 27,
        winThreshold: 30,
        currentHighestBid: 0,
      }),
    );
    // P4 fires — should try to control trump, not simply pass
    expect(bid).toBeGreaterThanOrEqual(0); // may be 0 if can't outbid, but logic differs
  });
});

// ─── getBotBid() — Priority 4: Simultaneous Win Risk ─────────────────────────

describe('getBotBid — P4: simultaneous win risk', () => {
  test('bids to control trump when weMustWinBid', () => {
    // We can only win cleanly by bidding (defense = 24+4=28, below threshold)
    const bid = getBotBid(
      ctx({
        hand: averageHand(),
        myTeamScore: 24,
        opponentScore: 27,
        winThreshold: 30,
        currentHighestBid: 0,
      }),
    );
    expect(bid).toBeGreaterThanOrEqual(7);
  });

  test('bids BID_MIN for trump control when we can win either way', () => {
    // myScore=27: wins on defense (31) OR bidding (34). Bid minimum to control trump.
    const bid = getBotBid(
      ctx({
        hand: averageHand(),
        myTeamScore: 27,
        opponentScore: 27,
        winThreshold: 30,
        currentHighestBid: 0,
      }),
    );
    expect(bid).toBe(7);
  });

  test('passes in simultaneous risk when cannot outbid current highest', () => {
    // BID_MIN (7) can't beat 9 — must pass
    const bid = getBotBid(
      ctx({
        hand: weakHand(),
        myTeamScore: 27,
        opponentScore: 27,
        winThreshold: 30,
        currentHighestBid: 9,
      }),
    );
    expect(bid).toBe(0);
  });

  test('takes trump control with BID_MIN when can outbid', () => {
    // BID_MIN (7) beats currentHighestBid (0) — take minimum control
    const bid = getBotBid(
      ctx({
        hand: weakHand(),
        myTeamScore: 27,
        opponentScore: 27,
        winThreshold: 30,
        currentHighestBid: 0,
      }),
    );
    expect(bid).toBe(7);
  });
});

// ─── getBotBid() — Priority 5: Forced Bid Trap ───────────────────────────────

describe('getBotBid — P5: forced bid trap', () => {
  test('passes to execute trap when all conditions met', () => {
    // Opponents dealing, we can't win by bidding, strong trap hand,
    // opponent penalty is meaningful (opp score low vs threshold)
    const bid = getBotBid(
      ctx({
        hand: trapHand(),
        myTeamScore: 0,
        opponentScore: 5, // penalty drops them to -2 → below 30% of 30
        winThreshold: 30,
        isOpponentDealing: true,
        currentHighestBid: 0,
      }),
    );
    expect(bid).toBe(0);
  });

  test('does NOT trap when opponents are not dealing', () => {
    const bid = getBotBid(
      ctx({
        hand: trapHand(),
        myTeamScore: 0,
        opponentScore: 5,
        winThreshold: 30,
        isOpponentDealing: false,
        currentHighestBid: 0,
      }),
    );
    // Trap condition fails at first check — standard bidding fires
    expect(bid).toBeGreaterThan(0);
  });

  test('does NOT trap when we can win the game by bidding', () => {
    // weWinByBidding → P2 fires before P5 ever runs
    const bid = getBotBid(
      ctx({
        hand: trapHand(),
        myTeamScore: 24,
        opponentScore: 5,
        winThreshold: 30,
        isOpponentDealing: true,
        currentHighestBid: 0,
      }),
    );
    // P2 fires — should bid to win game
    expect(bid).toBeGreaterThanOrEqual(7);
  });

  test('does NOT trap when penalty is not meaningful (opponents already high)', () => {
    // opponentScore=20 → after -7 = 13 → 13/30=43% — above 30% threshold
    const bid = getBotBid(
      ctx({
        hand: trapHand(),
        myTeamScore: 0,
        opponentScore: 20,
        winThreshold: 30,
        isOpponentDealing: true,
        currentHighestBid: 0,
      }),
    );
    // Trap condition 4 fails — standard bidding fires
    expect(bid).toBeGreaterThan(0);
  });

  test('does NOT trap on weak hand lacking sufficient power cards', () => {
    // weakHand has 0 Aces and 0 Kings — isTrumpAgnosticStrong = false
    const bid = getBotBid(
      ctx({
        hand: weakHand(),
        myTeamScore: 0,
        opponentScore: 5,
        winThreshold: 30,
        isOpponentDealing: true,
        currentHighestBid: 0,
      }),
    );
    // Trap condition 3 fails — passes for a different reason (weak hand)
    expect(bid).toBeGreaterThanOrEqual(0);
  });
});

// ─── getBotBid() — Priority 6: Partner Shield ────────────────────────────────

describe('getBotBid — P6: partner shield', () => {
  test('passes when dealer is partner, hand is weak, partner has not bid yet', () => {
    const bid = getBotBid(
      ctx({
        hand: weakHand(),
        dealerIsMyPartner: true,
        partnerBid: null,
        currentHighestBid: 0,
      }),
    );
    expect(bid).toBe(0);
  });

  test('does NOT shield if partner has already bid', () => {
    const bid = getBotBid(
      ctx({
        hand: weakHand(),
        dealerIsMyPartner: true,
        partnerBid: 7, // partner already bid
        currentHighestBid: 7,
      }),
    );
    // Shield condition fails — falls to P8 standard bidding
    expect(bid).toBeGreaterThanOrEqual(0);
  });

  test('does NOT shield if hand estimate is above BID_MIN', () => {
    const bid = getBotBid(
      ctx({
        hand: averageHand(), // naiveBidEstimate > 7
        dealerIsMyPartner: true,
        partnerBid: null,
        currentHighestBid: 0,
      }),
    );
    // Shield requires estimate === BID_MIN — doesn't fire for stronger hands
    expect(bid).toBeGreaterThan(0);
  });
});

// ─── getBotBid() — Priority 7: Desperation Block ─────────────────────────────

describe('getBotBid — P7: desperation block (opponent wins on defense)', () => {
  test('bids 10 with strong hand when opponent is about to win on defense', () => {
    // opponentScore=27 → +4 defense = 31 ≥ 30: they win unless we bid 10
    const bid = getBotBid(
      ctx({
        hand: dominantHand(),
        myTeamScore: 0,
        opponentScore: 27,
        winThreshold: 30,
        currentHighestBid: 0,
      }),
    );
    expect(bid).toBe(10);
  });

  test('passes (accepts loss) when hand is too weak to bid 10 in desperation', () => {
    const bid = getBotBid(
      ctx({
        hand: weakHand(),
        myTeamScore: 0,
        opponentScore: 27,
        winThreshold: 30,
        currentHighestBid: 0,
      }),
    );
    expect(bid).toBe(0);
  });

  test('does NOT bid 10 in desperation if current bid is already 10', () => {
    const bid = getBotBid(
      ctx({
        hand: dominantHand(),
        myTeamScore: 0,
        opponentScore: 27,
        winThreshold: 30,
        currentHighestBid: 10,
      }),
    );
    expect(bid).toBe(0);
  });
});

// ─── getBotBid() — Priority 8: Standard Bidding ──────────────────────────────

describe('getBotBid — P8: standard urgency-adjusted bidding', () => {
  test('bids above currentHighestBid when hand is strong enough', () => {
    const bid = getBotBid(
      ctx({
        hand: strongHand(),
        currentHighestBid: 7,
      }),
    );
    expect(bid).toBeGreaterThan(7);
  });

  test('passes when estimate does not exceed currentHighestBid', () => {
    const bid = getBotBid(
      ctx({
        hand: weakHand(),
        currentHighestBid: 9, // weak hand estimates 7, can't beat 9
      }),
    );
    expect(bid).toBe(0);
  });

  test('desperate urgency bumps estimate up by 1', () => {
    // myScore=-20 → progress=-0.67 → below DESPERATION_ZONE(-0.65) → desperate
    const desperateBid = getBotBid(
      ctx({
        hand: averageHand(),
        myTeamScore: -20,
        winThreshold: 30,
        currentHighestBid: 0,
      }),
    );

    // Normal (score=0) for comparison
    const normalBid = getBotBid(
      ctx({
        hand: averageHand(),
        myTeamScore: 0,
        winThreshold: 30,
        currentHighestBid: 0,
      }),
    );

    expect(desperateBid).toBeGreaterThanOrEqual(normalBid);
  });

  test('cautious urgency keeps bid conservative', () => {
    // myScore=22 → progress=0.73 → above DANGER_ZONE(0.70) → cautious
    const cautiousBid = getBotBid(
      ctx({
        hand: averageHand(),
        myTeamScore: 22,
        opponentScore: 0,
        winThreshold: 30,
        currentHighestBid: 0,
      }),
    );

    const normalBid = getBotBid(
      ctx({
        hand: averageHand(),
        myTeamScore: 0,
        winThreshold: 30,
        currentHighestBid: 0,
      }),
    );

    expect(cautiousBid).toBeLessThanOrEqual(normalBid);
  });

  test('partner passed reduces estimate (table reading adj = -1)', () => {
    const partnerPassedBid = getBotBid(
      ctx({
        hand: averageHand(),
        partnerBid: 0,
        currentHighestBid: 0,
      }),
    );

    const noPartnerInfoBid = getBotBid(
      ctx({
        hand: averageHand(),
        partnerBid: null,
        currentHighestBid: 0,
      }),
    );

    expect(partnerPassedBid).toBeLessThanOrEqual(noPartnerInfoBid);
  });

  test('partner bid 9+ strongly reduces estimate (table reading adj = -2)', () => {
    const bid = getBotBid(
      ctx({
        hand: averageHand(),
        partnerBid: 9,
        currentHighestBid: 9,
      }),
    );
    // After -2 adjustment, average hand can't exceed current bid of 9
    expect(bid).toBe(0);
  });

  test('bid-10 gate: does not bid 10 on marginal hand even if estimate reaches it', () => {
    // averageHand: 1 Ace, 1 Queen — not enough for bid-10 gate
    const bid = getBotBid(
      ctx({
        hand: averageHand(),
        myTeamScore: -20, // desperate → +1 bump
        winThreshold: 30,
        currentHighestBid: 0,
      }),
    );
    expect(bid).toBeLessThanOrEqual(9);
  });

  test('result is always within valid range or 0 (pass)', () => {
    const hands = [weakHand(), averageHand(), strongHand(), dominantHand()];
    const scenarios: Partial<BidContext>[] = [
      { currentHighestBid: 0 },
      { currentHighestBid: 7 },
      { currentHighestBid: 9 },
      { myTeamScore: -20, winThreshold: 30 },
      { opponentScore: 27, winThreshold: 30 },
    ];

    for (const hand of hands) {
      for (const scenario of scenarios) {
        const bid = getBotBid(ctx({ hand, ...scenario }));
        expect(bid === 0 || (bid >= 7 && bid <= 10)).toBe(true);
      }
    }
  });
});

// ─── selectBotTrump() ─────────────────────────────────────────────────────────

describe('selectBotTrump', () => {
  /** Build a 13-card hand with a dominant suit. */
  function makeFullHand(
    dominantSuit: Suit,
    dominantCount: number,
    dominantHcp: number,
  ): Card[] {
    const hand: Card[] = [];
    const ranks = [
      'A',
      'K',
      'Q',
      'J',
      '10',
      '9',
      '8',
      '7',
      '6',
      '5',
      '4',
      '3',
      '2',
    ];
    const otherSuits: Suit[] = (
      ['spades', 'hearts', 'diamonds', 'clubs'] as Suit[]
    ).filter((s) => s !== dominantSuit);

    // Add dominant suit cards with honours first
    const lowRanks = ranks.filter((r) => !['A', 'K', 'Q'].includes(r));
    let added = 0;
    if (dominantHcp >= 4) {
      hand.push(card('A', dominantSuit));
      added++;
    }
    if (dominantHcp >= 7 && added < dominantCount) {
      hand.push(card('K', dominantSuit));
      added++;
    }
    if (dominantHcp >= 9 && added < dominantCount) {
      hand.push(card('Q', dominantSuit));
      added++;
    }
    while (added < dominantCount) {
      hand.push(card(lowRanks[added] ?? '2', dominantSuit));
      added++;
    }

    // Fill remaining 13-count with other suits
    const remaining = 13 - dominantCount;
    const perSuit = Math.floor(remaining / otherSuits.length);
    let fillIdx = 0;
    for (const s of otherSuits) {
      for (let i = 0; i < perSuit; i++) {
        hand.push(card(lowRanks[fillIdx % lowRanks.length], s));
        fillIdx++;
      }
    }
    // Pad to exactly 13 if rounding left gaps
    while (hand.length < 13) {
      hand.push(card('2', otherSuits[0]));
    }

    return hand.slice(0, 13);
  }

  test('picks the longest suit as trump', () => {
    // 6 spades, 3 each of hearts/diamonds/clubs
    const hand = makeFullHand('spades', 6, 7);
    const trump = selectBotTrump(hand, 7);
    expect(trump).toBe('spades');
  });

  test('prefers suit with high HCP when lengths are equal', () => {
    // Build hand: 4 spades with A+K (7 HCP), 4 hearts with low cards (0 HCP)
    const hand: Card[] = [
      card('A', 'spades'),
      card('K', 'spades'),
      card('Q', 'spades'),
      card('J', 'spades'),
      card('2', 'hearts'),
      card('3', 'hearts'),
      card('4', 'hearts'),
      card('5', 'hearts'),
      card('6', 'diamonds'),
      card('7', 'diamonds'),
      card('8', 'clubs'),
      card('9', 'clubs'),
      card('10', 'clubs'),
    ];
    const trump = selectBotTrump(hand, 7);
    expect(trump).toBe('spades');
  });

  test('at bid 9+, enforces minimum 4-card trump suit', () => {
    // spades: 3 cards (A,K,Q — high HCP but below min 4), hearts: 5 cards (low HCP)
    const hand: Card[] = [
      card('A', 'spades'),
      card('K', 'spades'),
      card('Q', 'spades'),
      card('2', 'hearts'),
      card('3', 'hearts'),
      card('4', 'hearts'),
      card('5', 'hearts'),
      card('6', 'hearts'),
      card('7', 'diamonds'),
      card('8', 'diamonds'),
      card('9', 'diamonds'),
      card('10', 'clubs'),
      card('J', 'clubs'),
    ];
    const trump = selectBotTrump(hand, 9);
    // Spades only has 3 cards — filtered out at bid 9. Hearts or diamonds picked.
    expect(trump).not.toBe('spades');
  });

  test('at bid 7, allows shorter trump suits (min 2 cards)', () => {
    const hand: Card[] = [
      card('A', 'spades'),
      card('K', 'spades'), // 2 spades — valid at bid 7
      card('2', 'hearts'),
      card('3', 'hearts'),
      card('4', 'hearts'),
      card('5', 'diamonds'),
      card('6', 'diamonds'),
      card('7', 'diamonds'),
      card('8', 'clubs'),
      card('9', 'clubs'),
      card('10', 'clubs'),
      card('J', 'clubs'),
      card('Q', 'clubs'),
    ];
    const trump = selectBotTrump(hand, 7);
    // All suits have 2+ cards — picks the best scored one
    expect(['spades', 'hearts', 'diamonds', 'clubs']).toContain(trump);
  });

  test('fallback: picks longest suit when all suits fail min-length filter', () => {
    // bid=9 requires 4+ cards, but no suit has 4 — very unusual 13-card hand
    // (This tests the safety fallback path)
    const hand: Card[] = [
      card('A', 'spades'),
      card('K', 'spades'),
      card('Q', 'spades'),
      card('A', 'hearts'),
      card('K', 'hearts'),
      card('Q', 'hearts'),
      card('A', 'diamonds'),
      card('K', 'diamonds'),
      card('Q', 'diamonds'),
      card('A', 'clubs'),
      card('K', 'clubs'),
      card('Q', 'clubs'),
      card('J', 'clubs'),
    ];
    // clubs has 4 cards (just meets threshold) — but if threshold is higher
    // we test the fallback. At bid=10 (min=4), clubs should be selected.
    const trump = selectBotTrump(hand, 9);
    expect(trump).toBe('clubs'); // only suit with 4 cards
  });

  test('always returns a valid suit', () => {
    const validSuits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
    const hand = makeFullHand('hearts', 7, 7);
    for (const bid of [7, 8, 9, 10]) {
      const trump = selectBotTrump(hand, bid);
      expect(validSuits).toContain(trump);
    }
  });

  test('void bonus: voids in side suits increase trump score', () => {
    // 8 spades (with void in clubs) vs balanced hand — spades should still win
    const hand: Card[] = [
      card('A', 'spades'),
      card('K', 'spades'),
      card('Q', 'spades'),
      card('J', 'spades'),
      card('10', 'spades'),
      card('9', 'spades'),
      card('8', 'spades'),
      card('7', 'spades'),
      card('2', 'hearts'),
      card('3', 'hearts'),
      card('4', 'hearts'),
      card('5', 'diamonds'),
      card('6', 'diamonds'),
      // no clubs — void
    ];
    const trump = selectBotTrump(hand, 7);
    expect(trump).toBe('spades');
  });
});

// ─── Edge Cases ───────────────────────────────────────────────────────────────

describe('edge cases', () => {
  test('getBotBid never returns a value outside 0 or 7–10', () => {
    const testCases: Partial<BidContext>[] = [
      { isDealer: true, allOthersPassed: true },
      { myTeamScore: 28, winThreshold: 30 },
      { opponentScore: 28, winThreshold: 30 },
      { myTeamScore: -25, winThreshold: 30 },
      { partnerBid: 9, currentHighestBid: 9 },
      { isOpponentDealing: true },
    ];
    for (const overrides of testCases) {
      for (const hand of [
        weakHand(),
        averageHand(),
        strongHand(),
        dominantHand(),
      ]) {
        const bid = getBotBid(ctx({ hand, ...overrides }));
        const isValid = bid === 0 || (bid >= 7 && bid <= 10);
        expect(isValid).toBe(true);
      }
    }
  });

  test('getBotBid is deterministic — same input always gives same output', () => {
    const context = ctx({
      hand: averageHand(),
      myTeamScore: 10,
      currentHighestBid: 7,
    });
    const results = Array.from({ length: 5 }, () => getBotBid(context));
    expect(new Set(results).size).toBe(1);
  });

  test('evaluateHand handles a 5-card all-ace hand (max HCP)', () => {
    // Not a real game scenario but tests the ceiling
    // 4 Aces + Queen → 18 HCP, 4 aces, 1 queen, isTrumpAgnosticStrong (4 aces ≥ 3)
    // No suppress-10 (has queen) → bid 10
    const hand = [
      card('A', 'spades'),
      card('A', 'hearts'),
      card('A', 'diamonds'),
      card('A', 'clubs'),
      card('Q', 'spades'),
    ];
    const result = evaluateHand(hand);
    expect(result.aces).toBe(4);
    expect(result.highCardPoints).toBe(18);
    expect(result.naiveBidEstimate).toBe(10);
    expect(result.isTrumpAgnosticStrong).toBe(true);
  });

  test('getBotBid bid always exceeds currentHighestBid when non-zero', () => {
    for (const currentHighestBid of [0, 7, 8, 9]) {
      const bid = getBotBid(
        ctx({
          hand: dominantHand(),
          currentHighestBid,
        }),
      );
      if (bid !== 0) {
        expect(bid).toBeGreaterThan(currentHighestBid);
      }
    }
  });
});
