import { describe, expect, test } from 'bun:test';
import { type Card, RANK_ORDER, type Rank, type Suit } from '@/constants/cards';
import { sortHandAlternating } from './card-sort';

// ── Helpers ──────────────────────────────────────────────────────────────────

let _id = 0;
function card(suit: Suit, rank: Rank): Card {
  return {
    id: `${suit}-${rank}-${_id++}`,
    suit,
    rank,
    value: RANK_ORDER[rank],
  };
}

function ranks(hand: Card[]): Rank[] {
  return hand.map((c) => c.rank);
}

function suits(hand: Card[]): Suit[] {
  return hand.map((c) => c.suit);
}

function colors(hand: Card[]): ('R' | 'B')[] {
  return hand.map((c) =>
    c.suit === 'hearts' || c.suit === 'diamonds' ? 'R' : 'B',
  );
}

// ── Within-suit rank sorting ──────────────────────────────────────────────────

describe('rank sorting within a suit', () => {
  test('sorts descending by value within the same suit', () => {
    const hand = [
      card('spades', '7'),
      card('spades', 'A'),
      card('spades', '9'),
    ];
    const result = sortHandAlternating(hand);
    expect(ranks(result)).toEqual(['A', '9', '7']);
  });

  test('sorts all ranks correctly', () => {
    const hand = [
      card('hearts', '3'),
      card('hearts', 'K'),
      card('hearts', '7'),
      card('hearts', 'A'),
      card('hearts', 'J'),
      card('hearts', '2'),
    ];
    const result = sortHandAlternating(hand);
    expect(ranks(result)).toEqual(['A', 'K', 'J', '7', '3', '2']);
  });

  test('handles a single card', () => {
    const hand = [card('hearts', '10')];
    const result = sortHandAlternating(hand);
    expect(result).toHaveLength(1);
    expect(result[0].rank).toBe('10');
  });

  test('returns empty array for empty hand', () => {
    expect(sortHandAlternating([])).toEqual([]);
  });
});

// ── Single color scenarios ────────────────────────────────────────────────────

describe('only black suits', () => {
  test('spades only — sorted by rank descending', () => {
    const hand = [
      card('spades', '8'),
      card('spades', 'K'),
      card('spades', '2'),
    ];
    const result = sortHandAlternating(hand);
    expect(colors(result).every((c) => c === 'B')).toBe(true);
    expect(ranks(result)).toEqual(['K', '8', '2']);
  });

  test('clubs only — sorted by rank descending', () => {
    const hand = [card('clubs', '5'), card('clubs', 'J')];
    const result = sortHandAlternating(hand);
    expect(suits(result)).toEqual(['clubs', 'clubs']);
    expect(ranks(result)).toEqual(['J', '5']);
  });

  test('spades + clubs — spades first (preferred), then clubs', () => {
    const hand = [
      card('clubs', '10'),
      card('clubs', '7'),
      card('spades', '9'),
      card('spades', 'A'),
    ];
    const result = sortHandAlternating(hand);
    expect(suits(result)).toEqual(['spades', 'spades', 'clubs', 'clubs']);
    expect(ranks(result)).toEqual(['A', '9', '10', '7']);
  });
});

describe('only red suits', () => {
  test('hearts only — sorted by rank descending', () => {
    const hand = [
      card('hearts', '3'),
      card('hearts', 'A'),
      card('hearts', '8'),
    ];
    const result = sortHandAlternating(hand);
    expect(suits(result)).toEqual(['hearts', 'hearts', 'hearts']);
    expect(ranks(result)).toEqual(['A', '8', '3']);
  });

  test('hearts + diamonds — hearts first, then diamonds', () => {
    const hand = [
      card('diamonds', 'Q'),
      card('diamonds', '6'),
      card('hearts', '10'),
      card('hearts', 'A'),
    ];
    const result = sortHandAlternating(hand);
    expect(suits(result)).toEqual(['hearts', 'hearts', 'diamonds', 'diamonds']);
    expect(ranks(result)).toEqual(['A', '10', 'Q', '6']);
  });
});

// ── Two suits, different colors ───────────────────────────────────────────────

describe('1 red + 1 black → R B', () => {
  test('hearts + spades', () => {
    const hand = [
      card('spades', '9'),
      card('spades', 'A'),
      card('hearts', '7'),
      card('hearts', 'J'),
    ];
    const result = sortHandAlternating(hand);
    expect(colors(result)).toEqual(['R', 'R', 'B', 'B']);
    expect(
      suits(result)
        .slice(0, 2)
        .every((s) => s === 'hearts'),
    ).toBe(true);
    expect(
      suits(result)
        .slice(2)
        .every((s) => s === 'spades'),
    ).toBe(true);
  });

  test('diamonds + clubs', () => {
    const hand = [card('clubs', '5'), card('diamonds', '8')];
    const result = sortHandAlternating(hand);
    expect(colors(result)).toEqual(['R', 'B']);
    expect(suits(result)).toEqual(['diamonds', 'clubs']);
  });

  test('hearts + clubs', () => {
    const hand = [card('clubs', 'K'), card('hearts', 'A'), card('hearts', '3')];
    const result = sortHandAlternating(hand);
    expect(colors(result)).toEqual(['R', 'R', 'B']);
  });
});

// ── Three suits ───────────────────────────────────────────────────────────────

describe('2 red + 1 black → R B R', () => {
  test('hearts + diamonds + spades', () => {
    const hand = [
      card('hearts', 'A'),
      card('hearts', '9'),
      card('diamonds', '10'),
      card('diamonds', '3'),
      card('spades', 'J'),
    ];
    const result = sortHandAlternating(hand);
    expect(colors(result)).toEqual(['R', 'R', 'B', 'R', 'R']);
    // hearts (preferred red) → spades → diamonds
    expect(suits(result)[0]).toBe('hearts');
    expect(suits(result)[2]).toBe('spades');
    expect(suits(result)[3]).toBe('diamonds');
  });

  test('hearts + diamonds + clubs', () => {
    const hand = [
      card('hearts', 'K'),
      card('diamonds', '7'),
      card('diamonds', '4'),
      card('clubs', 'A'),
      card('clubs', '9'),
    ];
    const result = sortHandAlternating(hand);
    expect(colors(result)).toEqual(['R', 'B', 'B', 'R', 'R']);
    // 1 red (hearts) + 2 black → B R B: clubs/spades first
    // wait — hearts + diamonds = 2 red, clubs = 1 black → R B R
    expect(suits(result)[0]).toBe('hearts');
    expect(suits(result)[2]).toBe('clubs');
    expect(suits(result)[3]).toBe('diamonds');
  });
});

describe('1 red + 2 black → B R B', () => {
  test('hearts + spades + clubs', () => {
    const hand = [
      card('hearts', 'A'),
      card('spades', '10'),
      card('spades', '7'),
      card('clubs', '9'),
      card('clubs', '3'),
    ];
    const result = sortHandAlternating(hand);
    expect(colors(result)).toEqual(['B', 'B', 'R', 'B', 'B']);
    // spades (preferred black) → hearts → clubs
    expect(suits(result)[0]).toBe('spades');
    expect(suits(result)[2]).toBe('hearts');
    expect(suits(result)[3]).toBe('clubs');
  });

  test('diamonds + spades + clubs', () => {
    const hand = [
      card('diamonds', 'Q'),
      card('spades', 'K'),
      card('spades', '2'),
      card('clubs', 'J'),
    ];
    const result = sortHandAlternating(hand);
    expect(colors(result)).toEqual(['B', 'B', 'R', 'B']);
    expect(suits(result)[0]).toBe('spades');
    expect(suits(result)[2]).toBe('diamonds');
    expect(suits(result)[3]).toBe('clubs');
  });
});

// ── Four suits → R B R B ──────────────────────────────────────────────────────

describe('all 4 suits → R B R B', () => {
  test('alternates red/black: hearts → spades → diamonds → clubs', () => {
    const hand = [
      card('clubs', '8'),
      card('clubs', '3'),
      card('diamonds', '6'),
      card('diamonds', 'Q'),
      card('hearts', 'A'),
      card('hearts', '9'),
      card('spades', 'J'),
      card('spades', '5'),
    ];
    const result = sortHandAlternating(hand);
    expect(colors(result)).toEqual(['R', 'R', 'B', 'B', 'R', 'R', 'B', 'B']);

    const suitGroups = [
      suits(result).slice(0, 2),
      suits(result).slice(2, 4),
      suits(result).slice(4, 6),
      suits(result).slice(6, 8),
    ];
    expect(suitGroups[0].every((s) => s === 'hearts')).toBe(true);
    expect(suitGroups[1].every((s) => s === 'spades')).toBe(true);
    expect(suitGroups[2].every((s) => s === 'diamonds')).toBe(true);
    expect(suitGroups[3].every((s) => s === 'clubs')).toBe(true);
  });

  test('within each suit cards are sorted highest to lowest', () => {
    const hand = [
      card('hearts', '3'),
      card('hearts', 'A'),
      card('hearts', '7'),
      card('spades', '9'),
      card('spades', '2'),
      card('diamonds', 'J'),
      card('diamonds', '5'),
      card('clubs', 'K'),
      card('clubs', '6'),
    ];
    const result = sortHandAlternating(hand);

    const grouped: Partial<Record<Suit, number[]>> = {};
    for (const c of result) {
      if (!grouped[c.suit]) grouped[c.suit] = [];
      grouped[c.suit]?.push(c.value);
    }
    for (const values of Object.values(grouped)) {
      for (let i = 0; i < values?.length - 1; i++) {
        expect(values?.[i]).toBeGreaterThanOrEqual(values?.[i + 1]);
      }
    }
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('edge cases', () => {
  test('duplicate ranks within a suit', () => {
    const hand = [
      card('hearts', '10'),
      card('hearts', '10'),
      card('hearts', '10'),
    ];
    const result = sortHandAlternating(hand);
    expect(result).toHaveLength(3);
    expect(result.every((c) => c.suit === 'hearts' && c.rank === '10')).toBe(
      true,
    );
  });

  test('single card of each suit', () => {
    const hand = [
      card('spades', '5'),
      card('hearts', '5'),
      card('clubs', '5'),
      card('diamonds', '5'),
    ];
    const result = sortHandAlternating(hand);
    expect(colors(result)).toEqual(['R', 'B', 'R', 'B']);
  });

  test('does not mutate the original hand array', () => {
    const hand = [card('spades', '9'), card('hearts', 'A'), card('clubs', '7')];
    const originalIds = hand.map((c) => c.id);
    sortHandAlternating(hand);
    expect(hand.map((c) => c.id)).toEqual(originalIds);
  });

  test('face cards sort correctly: A K Q J', () => {
    const hand = [
      card('spades', 'J'),
      card('spades', 'A'),
      card('spades', 'Q'),
      card('spades', 'K'),
    ];
    const result = sortHandAlternating(hand);
    expect(ranks(result)).toEqual(['A', 'K', 'Q', 'J']);
  });
});
