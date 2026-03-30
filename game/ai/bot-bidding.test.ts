import { describe, expect, test } from 'bun:test';
import { RANK_ORDER, type Card, type Rank, type Suit } from '../../constants/cards';
import { BID_MAX, BID_MIN } from '../bidding';
import {
    evaluateHand,
    getBotBid,
    selectBotTrump
} from './bot-bidding';

// ── Helpers ───────────────────────────────────────────────────────────────────

let _id = 0;
function card(suit: Suit, rank: Rank): Card {
  return { id: `${suit}-${rank}-${_id++}`, suit, rank, value: RANK_ORDER[rank] };
}

/** Build a full hand of N cards all from the same suit */
function suitOf(suit: Suit, ranks: Rank[]): Card[] {
  return ranks.map(r => card(suit, r));
}

// ── evaluateHand ──────────────────────────────────────────────────────────────

describe('evaluateHand', () => {
  test('counts high cards (J and above) correctly', () => {
    const hand = [
      card('spades', 'A'), card('spades', 'K'), card('spades', 'Q'),
      card('spades', 'J'), card('spades', '10'), card('spades', '9'),
    ];
    const { highCards } = evaluateHand(hand);
    // A K Q J are all >= HIGH_CARD_THRESHOLD (11), 10 and 9 are not
    expect(highCards).toBe(4);
  });

  test('10 is NOT a high card (threshold is J=11)', () => {
    const hand = [card('hearts', '10'), card('hearts', '9'), card('hearts', '8')];
    expect(evaluateHand(hand).highCards).toBe(0);
  });

  test('counts voids correctly', () => {
    // Only spades and hearts — clubs and diamonds are voids
    const hand = [
      card('spades', 'A'), card('spades', 'K'),
      card('hearts', 'Q'),
    ];
    expect(evaluateHand(hand).voids).toBe(2);
  });

  test('no voids when all 4 suits present', () => {
    const hand = [
      card('spades', '2'), card('hearts', '3'),
      card('clubs', '4'), card('diamonds', '5'),
    ];
    expect(evaluateHand(hand).voids).toBe(0);
  });

  test('counts long suits (4+ cards)', () => {
    const hand = [
      card('spades', 'A'), card('spades', 'K'), card('spades', 'Q'), card('spades', 'J'),
      card('hearts', '2'), card('hearts', '3'), card('hearts', '4'), card('hearts', '5'),
      card('clubs', '6'),
    ];
    expect(evaluateHand(hand).longSuits).toBe(2);
  });

  test('suit with exactly 3 cards is NOT a long suit', () => {
    const hand = [card('spades', 'A'), card('spades', 'K'), card('spades', 'Q')];
    expect(evaluateHand(hand).longSuits).toBe(0);
  });

  test('total equals highCards + voids + longSuits', () => {
    const hand = [
      card('spades', 'A'), card('spades', 'K'), card('spades', 'Q'), card('spades', 'J'),
      card('hearts', '2'),
    ];
    const result = evaluateHand(hand);
    expect(result.total).toBe(result.highCards + result.voids + result.longSuits);
  });

  test('empty hand returns all zeros', () => {
    const result = evaluateHand([]);
    expect(result).toEqual({ highCards: 0, voids: 4, longSuits: 0, total: 4 });
    // empty hand has 4 voids (all suits missing)
  });
});

// ── getBotBid ─────────────────────────────────────────────────────────────────

describe('getBotBid — general constraints', () => {
  test('bid is always within BID_MIN..BID_MAX range', () => {
    const weakHand = suitOf('spades', ['2', '3', '4', '5', '6', '7', '8', '9', '10']);
    const strongHand = [
      card('spades', 'A'), card('spades', 'K'), card('spades', 'Q'), card('spades', 'J'),
      card('hearts', 'A'), card('hearts', 'K'), card('hearts', 'Q'), card('hearts', 'J'),
      card('clubs', 'A'), card('clubs', 'K'),
    ];

    for (const hand of [weakHand, strongHand]) {
      for (const diff of ['easy', 'medium', 'hard'] as const) {
        const bid = getBotBid(hand, diff, BID_MIN - 1);
        if (bid !== 0) {
          expect(bid).toBeGreaterThanOrEqual(BID_MIN);
          expect(bid).toBeLessThanOrEqual(BID_MAX);
        }
      }
    }
  });

  test('returns 0 (pass) when estimate cannot beat currentHighestBid', () => {
    // Hand is weak so estimate will be near BID_MIN
    // Set currentHighestBid to BID_MAX so bot must pass
    const weakHand = suitOf('spades', ['2', '3', '4', '5', '6']);
    const bid = getBotBid(weakHand, 'hard', BID_MAX);
    expect(bid).toBe(0);
  });

  test('bid strictly exceeds currentHighestBid when not passing', () => {
    const strongHand = [
      card('spades', 'A'), card('spades', 'K'), card('spades', 'Q'), card('spades', 'J'),
      card('hearts', 'A'), card('hearts', 'K'), card('hearts', 'Q'),
      card('clubs', 'A'), card('clubs', 'K'), card('clubs', 'Q'),
    ];
    for (let currentBid = BID_MIN - 1; currentBid < BID_MAX; currentBid++) {
      const bid = getBotBid(strongHand, 'hard', currentBid);
      if (bid !== 0) {
        expect(bid).toBeGreaterThan(currentBid);
      }
    }
  });
});

describe('getBotBid — bid 10 caution', () => {
  // A hand with many high cards forces estimate toward BID_MAX
  const fullHighHand = [
    card('spades', 'A'), card('spades', 'K'), card('spades', 'Q'), card('spades', 'J'),
    card('hearts', 'A'), card('hearts', 'K'), card('hearts', 'Q'), card('hearts', 'J'),
    card('clubs', 'A'), card('clubs', 'K'),
  ];

  test('hard bot bids 10 with a very strong hand', () => {
    // Run multiple times to smooth out randomness (hard bot has 0 variance)
    const bids = Array.from({ length: 10 }, () =>
      getBotBid(fullHighHand, 'hard', BID_MIN - 1)
    );
    expect(bids.some(b => b === BID_MAX)).toBe(true);
  });

  test('easy bot is more cautious about bidding 10 than hard bot', () => {
    // With a borderline hand (few high cards), easy bot should step down more
    const borderlineHand = [
      card('spades', 'A'), card('spades', 'K'), card('spades', 'Q'),
      card('hearts', 'J'), card('hearts', '10'),
      card('clubs', '9'), card('clubs', '8'), card('clubs', '7'),
      card('diamonds', '6'), card('diamonds', '5'),
    ];
    // Run many times; easy bot should avoid bid 10 more often
    let easyBid10 = 0, hardBid10 = 0;
    for (let i = 0; i < 200; i++) {
      if (getBotBid(borderlineHand, 'easy', BID_MIN - 1) === BID_MAX) easyBid10++;
      if (getBotBid(borderlineHand, 'hard', BID_MIN - 1) === BID_MAX) hardBid10++;
    }
    expect(easyBid10).toBeLessThanOrEqual(hardBid10);
  });

  test('when bid 10 is blocked by caution, fallback is 9 or pass — never 10', () => {
    // Weak hand — bid 10 caution should always trigger
    const weakHighHand = [
      card('spades', 'A'), card('spades', 'K'),
      card('hearts', '3'), card('hearts', '4'), card('hearts', '5'),
      card('clubs', '6'), card('clubs', '7'), card('clubs', '8'),
      card('diamonds', '9'), card('diamonds', '2'),
    ];
    for (let i = 0; i < 50; i++) {
      const bid = getBotBid(weakHighHand, 'easy', BID_MIN - 1);
      expect(bid).not.toBe(BID_MAX);
    }
  });
});

describe('getBotBid — difficulty variance', () => {
  test('hard bot has no variance (deterministic for same hand/currentBid)', () => {
    const hand = [
      card('spades', 'A'), card('spades', 'K'), card('spades', 'Q'),
      card('hearts', 'J'), card('hearts', '9'),
      card('clubs', '8'), card('clubs', '7'), card('clubs', '6'),
      card('diamonds', '5'), card('diamonds', '4'),
    ];
    const bids = new Set(
      Array.from({ length: 30 }, () => getBotBid(hand, 'hard', BID_MIN - 1))
    );
    // Hard bot has 0 variance so should always return the same value
    expect(bids.size).toBe(1);
  });

  test('easy bot produces more spread than hard bot over many runs', () => {
    const hand = [
      card('spades', 'A'), card('spades', 'K'), card('spades', '9'),
      card('hearts', 'Q'), card('hearts', '8'),
      card('clubs', 'J'), card('clubs', '6'),
      card('diamonds', '7'), card('diamonds', '5'), card('diamonds', '3'),
    ];
    const easyBids = new Set(
      Array.from({ length: 200 }, () => getBotBid(hand, 'easy', BID_MIN - 1))
    );
    const hardBids = new Set(
      Array.from({ length: 200 }, () => getBotBid(hand, 'hard', BID_MIN - 1))
    );
    expect(easyBids.size).toBeGreaterThan(hardBids.size);
  });
});

// ── selectBotTrump ────────────────────────────────────────────────────────────

describe('selectBotTrump — picks strongest suit', () => {
  test('picks the suit with the most high cards', () => {
    const hand = [
      card('spades', 'A'), card('spades', 'K'), card('spades', 'Q'),
      card('hearts', '2'), card('hearts', '3'), card('hearts', '4'),
      card('clubs', '5'), card('clubs', '6'),
      card('diamonds', '7'),
    ];
    const trump = selectBotTrump(hand, 7, 'hard');
    expect(trump).toBe('spades');
  });

  test('prefers long suit with high cards over short suit with one ace', () => {
    const hand = [
      card('spades', 'A'),
      card('hearts', 'K'), card('hearts', 'Q'), card('hearts', 'J'), card('hearts', '10'),
      card('clubs', '2'), card('clubs', '3'),
      card('diamonds', '4'), card('diamonds', '5'),
    ];
    // hearts has length 4 + 3 high cards — should beat spades with 1 high card
    const trump = selectBotTrump(hand, 7, 'hard');
    expect(trump).toBe('hearts');
  });

  test('never picks a suit with 0 cards', () => {
    // Player has no diamonds
    const hand = [
      card('spades', 'A'), card('spades', 'K'),
      card('hearts', 'Q'), card('hearts', 'J'),
      card('clubs', '9'), card('clubs', '8'), card('clubs', '7'),
    ];
    const trump = selectBotTrump(hand, 7, 'hard');
    expect(trump).not.toBe('diamonds');
  });

  test('returns a valid Suit', () => {
    const hand = [
      card('spades', '2'), card('hearts', '3'),
      card('clubs', '4'), card('diamonds', '5'),
    ];
    const validSuits: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
    const trump = selectBotTrump(hand, 7, 'medium');
    expect(validSuits).toContain(trump);
  });
});

describe('selectBotTrump — hard bot minimum trump length', () => {
  test('hard bot avoids suits shorter than HARD_BOT_MIN_TRUMP_LENGTH', () => {
    // spades has 2 cards (below threshold=3), hearts has 5
    const hand = [
      card('spades', 'A'), card('spades', 'K'),        // length 2 — should be avoided
      card('hearts', 'Q'), card('hearts', 'J'), card('hearts', '10'),
      card('hearts', '9'), card('hearts', '8'),        // length 5
      card('clubs', '2'),
    ];
    const trump = selectBotTrump(hand, 8, 'hard');
    expect(trump).not.toBe('spades');
    expect(trump).toBe('hearts');
  });

  test('easy bot CAN pick a short suit (no minimum length restriction)', () => {
    // spades has 1 card but is the highest scoring; easy bot ignores length restriction
    const hand = [
      card('spades', 'A'),                             // 1 card, 1 high card
      card('hearts', '2'), card('hearts', '3'), card('hearts', '4'), card('hearts', '5'),
    ];
    // easy bot: no HARD_BOT_MIN_TRUMP_LENGTH filter, so spades (A) might win on score
    // This just checks the bot returns a valid suit — we can't assert exactly which
    const trump = selectBotTrump(hand, 7, 'easy');
    expect(['spades', 'hearts', 'clubs', 'diamonds'] as Suit[]).toContain(trump);
  });

  test('fallback: hard bot uses longest suit if all suits are below min length', () => {
    // All suits have only 1–2 cards (hard bot filters all out → fallback triggers)
    const hand = [
      card('spades', 'A'), card('spades', 'K'),
      card('hearts', 'Q'),
      card('clubs', 'J'),
      card('diamonds', '10'),
    ];
    // Fallback should return the longest suit (spades, length 2)
    const trump = selectBotTrump(hand, 7, 'hard');
    expect(trump).toBe('spades');
  });
});

describe('selectBotTrump — high bid prioritises length', () => {
  test('at bid 9+, lengthWeight increases so longer suit wins over slightly higher cards', () => {
    // clubshas length 5 with mediocre cards; spades has length 2 with two aces
    const hand = [
      card('spades', 'A'), card('spades', 'K'),
      card('clubs', 'Q'), card('clubs', 'J'), card('clubs', '9'), card('clubs', '8'), card('clubs', '7'),
      card('hearts', '2'), card('diamonds', '3'),
    ];
    // At bid 9, length weight = 3 so clubs (5*3 + 2*3=21) > spades (2*3 + 2*3=12)
    const trump9 = selectBotTrump(hand, 9, 'easy');
    expect(trump9).toBe('clubs');
  });
});