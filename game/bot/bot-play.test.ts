import { describe, expect, test } from 'bun:test';
import { RANK_ORDER, type Card, type Rank, type Suit } from '../../constants/cards';
import type { Trick } from '../trick';
import type { GameState, Player, SeatPosition } from '../types';
import { getBotPlay } from './bot-play';

// ── Helpers ───────────────────────────────────────────────────────────────────

let _id = 0;
function card(suit: Suit, rank: Rank): Card {
  return { id: `${suit}-${rank}-${_id++}`, suit, rank, value: RANK_ORDER[rank] };
}

function emptyTrick(): Trick {
  return { cards: [], leadSuit: null, winningSeat: null };
}

function trickWith(
  plays: { player: SeatPosition; card: Card }[],
  leadSuit?: Suit
): Trick {
  return {
    cards: plays,
    leadSuit: leadSuit ?? plays[0]?.card.suit ?? null,
    winningSeat: null,
  };
}

/** Full Player factory — satisfies every required field */
function makePlayer(
  seat: SeatPosition,
  team: 'BT' | 'LR',
  bid: number | null = null
): Player {
  return {
    id: seat,
    seat,
    name: seat,
    team,
    isHuman: seat === 'bottom',
    hand: [],
    bid,
    tricksTaken: 0,
  };
}

/** Default players: bottom+top = BT, left+right = LR */
function defaultPlayers(): Record<SeatPosition, Player> {
  return {
    bottom: makePlayer('bottom', 'BT', 7),
    top:    makePlayer('top',    'BT'),
    left:   makePlayer('left',   'LR'),
    right:  makePlayer('right',  'LR'),
  };
}

/**
 * Swapped players: bottom+right = BT, top+left = LR.
 * Used when we need right to be on the bidding team (BT).
 */
function swappedPlayers(bidder: SeatPosition = 'bottom'): Record<SeatPosition, Player> {
  return {
    bottom: makePlayer('bottom', 'BT', bidder === 'bottom' ? 7 : null),
    top:    makePlayer('top',    'LR'),
    left:   makePlayer('left',   'LR'),
    right:  makePlayer('right',  'BT'),
  };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: 'playing',
    round: 1,
    currentSeat: 'bottom',
    highestBidder: 'bottom',
    highestBid: 7,
    trumpSuit: null,
    trumpRevealed: false,
    currentTrick: emptyTrick(),
    teamScores: { BT: 0, LR: 0 },
    players: defaultPlayers(),
    ...overrides,
  } as GameState;
}

// ── Guards ────────────────────────────────────────────────────────────────────

describe('getBotPlay — guards', () => {
  test('returns null when hand is empty', () => {
    const result = getBotPlay([], emptyTrick(), null, false, makeState(), 'hard', 'bottom');
    expect(result).toBeNull();
  });

  test('returned card is always from the provided hand', () => {
    const hand = [card('hearts', 'A'), card('hearts', 'K'), card('clubs', '2')];
    for (const diff of ['easy', 'medium', 'hard'] as const) {
      const played = getBotPlay(hand, emptyTrick(), null, false, makeState(), diff, 'bottom');
      expect(played).not.toBeNull();
      expect(hand.some(c => c.id === played!.id)).toBe(true);
    }
  });
});

// ── Easy bot ──────────────────────────────────────────────────────────────────

describe('playEasy', () => {
  test('returns a card from the hand', () => {
    const hand = [card('hearts', '7'), card('clubs', '3'), card('diamonds', 'A')];
    const played = getBotPlay(hand, emptyTrick(), null, false, makeState(), 'easy', 'left');
    expect(hand.some(c => c.id === played!.id)).toBe(true);
  });

  test('is random — produces multiple distinct cards over 100 draws', () => {
    const hand = [
      card('hearts', '2'), card('clubs', '5'), card('diamonds', 'K'),
      card('hearts', '9'), card('clubs', 'A'),
    ];
    const results = new Set(
      Array.from({ length: 100 }, () =>
        getBotPlay(hand, emptyTrick(), null, false, makeState(), 'easy', 'left')!.id
      )
    );
    expect(results.size).toBeGreaterThan(1);
  });
});

// ── Medium bot ────────────────────────────────────────────────────────────────

describe('playMedium — defending team plays low', () => {
  test('defender plays lowest card', () => {
    const hand = [card('hearts', 'A'), card('hearts', '3'), card('hearts', 'J')];
    // left = LR (defending), bottom = BT (bidding)
    const played = getBotPlay(hand, emptyTrick(), null, false, makeState(), 'medium', 'left');
    expect(played!.rank).toBe('3');
  });
});

describe('playMedium — partner winning → play low', () => {
  test('plays lowest when BT partner is already winning the trick', () => {
    // top (BT partner of bottom) played A♥ and is currently winning
    const trick = trickWith([{ player: 'top', card: card('hearts', 'A') }], 'hearts');
    const hand = [card('hearts', 'K'), card('hearts', '2'), card('hearts', 'J')];
    const played = getBotPlay(hand, trick, null, false, makeState(), 'medium', 'bottom');
    expect(played!.rank).toBe('2');
  });
});

describe('playMedium — 2nd player plays low', () => {
  test('2nd in trick plays lowest card even on bidding team', () => {
    // left led; top is 2nd — top is BT (bidding team), still plays low at position 2
    const trick = trickWith([{ player: 'left', card: card('hearts', '7') }], 'hearts');
    const hand = [card('hearts', 'A'), card('hearts', '3'), card('hearts', 'Q')];
    // make top the bidder so top is on the bidding team
    const state = makeState({
      highestBidder: 'top',
      players: {
        ...defaultPlayers(),
        top: makePlayer('top', 'BT', 7),
      },
    });
    const played = getBotPlay(hand, trick, null, false, state, 'medium', 'top');
    expect(played!.rank).toBe('3');
  });
});

describe('playMedium — 3rd/4th player follows suit with highest', () => {
  test('3rd player on bidding team follows lead suit with highest card', () => {
    // left led hearts, bottom played hearts — right is 3rd
    // right is BT (bidding team), left(LR) is currently winning → not right's partner
    const trick = trickWith([
      { player: 'left',   card: card('hearts', '7') },
      { player: 'bottom', card: card('hearts', '4') },
    ], 'hearts');
    const hand = [card('hearts', 'K'), card('hearts', '3'), card('clubs', 'A')];
    // Use swapped teams so right is on BT
    const state = makeState({
      highestBidder: 'bottom',
      players: swappedPlayers(),
    });
    const played = getBotPlay(hand, trick, null, false, state, 'medium', 'right');
    expect(played!.suit).toBe('hearts');
    expect(played!.rank).toBe('K');
  });
});

describe('playMedium — void in lead suit, trump available', () => {
  test('plays lowest high trump when void in lead suit', () => {
    // bottom is 3rd (left led, top played) — position 3, not 2
    const trick = trickWith([
      { player: 'left', card: card('hearts', 'K') },
      { player: 'top',  card: card('hearts', '5') },
    ], 'hearts');
    // no hearts in hand — void in lead suit
    const hand = [
      card('spades', 'A'), card('spades', 'J'), card('spades', '3'),
      card('clubs', '2'),
    ];
    const state = makeState({
      highestBidder: 'bottom',
      trumpSuit: 'spades',
      trumpRevealed: true,
    });
    const played = getBotPlay(hand, trick, 'spades', true, state, 'medium', 'bottom');
    expect(played!.suit).toBe('spades');
    // lowest of high trumps: J(11) and A(14) → J
    expect(played!.rank).toBe('J');
  });

  test('plays lowest trump when void and no high trumps available', () => {
    const trick = trickWith([
      { player: 'left', card: card('hearts', 'K') },
      { player: 'top',  card: card('hearts', '5') },
    ], 'hearts');
    const hand = [card('spades', '5'), card('spades', '3'), card('clubs', '2')];
    const state = makeState({
      highestBidder: 'bottom',
      trumpSuit: 'spades',
      trumpRevealed: true,
    });
    const played = getBotPlay(hand, trick, 'spades', true, state, 'medium', 'bottom');
    expect(played!.suit).toBe('spades');
    expect(played!.rank).toBe('3');
  });
});

describe('playMedium — leading the trick', () => {
  test('plays highest card when leading', () => {
    const hand = [card('hearts', '3'), card('hearts', 'K'), card('clubs', 'J')];
    const played = getBotPlay(hand, emptyTrick(), null, false, makeState(), 'medium', 'bottom');
    expect(played!.rank).toBe('K');
  });
});

// ── Hard bot — position logic ─────────────────────────────────────────────────

describe('playHard — 2nd player plays low', () => {
  test('plays lowest card as 2nd player', () => {
    const trick = trickWith([{ player: 'left', card: card('hearts', '8') }], 'hearts');
    const hand = [card('hearts', 'A'), card('hearts', '4'), card('hearts', 'Q')];
    // top is 2nd; top is BT (bidding team)
    const played = getBotPlay(hand, trick, null, false, makeState(), 'hard', 'top');
    expect(played!.rank).toBe('4');
  });
});

describe('playHard — 3rd player tries to win', () => {
  test('plays lowest winning card as 3rd player', () => {
    const trick = trickWith([
      { player: 'left',   card: card('hearts', '7') },
      { player: 'bottom', card: card('hearts', '4') },
    ], 'hearts');
    const hand = [card('hearts', 'K'), card('hearts', 'A'), card('hearts', 'J')];
    // right is 3rd; use swapped teams so right is BT (bidding team)
    // left(LR) is currently winning (led 7) — not right's partner → right tries to win
    const state = makeState({
      highestBidder: 'bottom',
      players: swappedPlayers(),
    });
    // lowest winner over 7: J(11) < K(13) < A(14) → J
    const played = getBotPlay(hand, trick, null, false, state, 'hard', 'right');
    expect(played!.suit).toBe('hearts');
    expect(played!.rank).toBe('J');
  });

  test('discards cheapest non-trump when 3rd and cannot win', () => {
    // hearts led; right has no hearts (void) — can play anything
    // hearts A is winning; no trump — right cannot win
    const trick = trickWith([
      { player: 'left',   card: card('hearts', 'A') },
      { player: 'bottom', card: card('hearts', 'K') },
    ], 'hearts');
    const hand = [card('spades', '2'), card('clubs', '3'), card('diamonds', '4')];
    const state = makeState({
      highestBidder: 'bottom',
      trumpSuit: null,
      players: swappedPlayers(),
    });
    // right(BT) tries to win but can't → getCheapestDiscard → lowest card = spades 2
    const played = getBotPlay(hand, trick, null, false, state, 'hard', 'right');
    expect(played!.value).toBe(Math.min(...hand.map(c => c.value)));
  });
});

describe('playHard — 4th player', () => {
  test('wins cheaply when partner is not winning', () => {
    const trick = trickWith([
      { player: 'left',  card: card('hearts', 'Q') },
      { player: 'top',   card: card('hearts', '3') }, // top (BT partner of bottom) losing
      { player: 'right', card: card('hearts', '9') },
    ], 'hearts');
    const hand = [card('hearts', 'K'), card('hearts', 'A'), card('hearts', 'J')];
    // left(LR) winning with Q; bottom(BT) 4th → plays lowest winner: K beats Q
    const played = getBotPlay(hand, trick, null, false, makeState(), 'hard', 'bottom');
    expect(played!.suit).toBe('hearts');
    expect(played!.rank).toBe('K');
  });

  test('plays lowest when partner is already winning as 4th player', () => {
    const trick = trickWith([
      { player: 'left',  card: card('hearts', '3') },
      { player: 'top',   card: card('hearts', 'A') }, // top (BT partner) winning
      { player: 'right', card: card('hearts', '5') },
    ], 'hearts');
    const hand = [card('hearts', 'K'), card('hearts', '2'), card('hearts', 'J')];
    const played = getBotPlay(hand, trick, null, false, makeState(), 'hard', 'bottom');
    expect(played!.rank).toBe('2');
  });

  test('plays lowest card when 4th and cannot win', () => {
    const trick = trickWith([
      { player: 'left',  card: card('spades', 'A') },
      { player: 'top',   card: card('spades', 'K') },
      { player: 'right', card: card('spades', 'Q') },
    ], 'spades');
    const hand = [card('spades', '2'), card('spades', '3'), card('hearts', '4')];
    const state = makeState({ trumpSuit: 'spades', trumpRevealed: true });
    const played = getBotPlay(hand, trick, 'spades', true, state, 'hard', 'bottom');
    expect(played!.value).toBe(Math.min(...hand.map(c => c.value)));
  });
});

// ── Hard bot — smart lead ─────────────────────────────────────────────────────

describe('playHard — smart lead (1st player)', () => {
  test('bidding team leads highest of longest non-trump suit', () => {
    const hand = [
      card('hearts', 'K'), card('hearts', 'Q'), card('hearts', '7'), // 3 hearts
      card('clubs', 'A'),                                             // 1 club
      card('spades', '2'),                                            // 1 trump
    ];
    const state = makeState({ trumpSuit: 'spades', trumpRevealed: true });
    const played = getBotPlay(hand, emptyTrick(), 'spades', true, state, 'hard', 'bottom');
    expect(played!.suit).toBe('hearts');
    expect(played!.rank).toBe('K');
  });

  test('defending team leads lowest non-trump card', () => {
    const hand = [
      card('hearts', 'A'), card('hearts', '3'),
      card('clubs', 'K'),  card('clubs', '7'),
      card('spades', '5'), // trump
    ];
    const state = makeState({ trumpSuit: 'spades', trumpRevealed: true });
    // left = LR (defending)
    const played = getBotPlay(hand, emptyTrick(), 'spades', true, state, 'hard', 'left');
    expect(played!.suit).not.toBe('spades');
    expect(played!.rank).toBe('3');
  });

  test('leads lowest trump when only trump cards remain (bidding team)', () => {
    const hand = [card('spades', 'A'), card('spades', '5'), card('spades', '3')];
    const state = makeState({ trumpSuit: 'spades', trumpRevealed: true });
    const played = getBotPlay(hand, emptyTrick(), 'spades', true, state, 'hard', 'bottom');
    expect(played!.suit).toBe('spades');
    expect(played!.rank).toBe('3');
  });
});

// ── Cross-difficulty invariant ────────────────────────────────────────────────

describe('all difficulties — played card always belongs to hand', () => {
  test('card is always from the provided hand across all seats and difficulties', () => {
    const hand = [
      card('hearts', 'A'), card('hearts', '5'),
      card('clubs', 'K'),  card('clubs', '3'),
    ];
    const trick = trickWith([{ player: 'left', card: card('hearts', '7') }], 'hearts');

    for (const diff of ['easy', 'medium', 'hard'] as const) {
      for (const seat of ['bottom', 'top', 'left', 'right'] as SeatPosition[]) {
        const played = getBotPlay(hand, trick, null, false, makeState(), diff, seat);
        if (played !== null) {
          expect(hand.some(c => c.id === played.id)).toBe(true);
        }
      }
    }
  });
});