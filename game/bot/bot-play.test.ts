import { describe, expect, test } from 'bun:test';
import {
  type Card,
  RANK_ORDER,
  type Rank,
  type Suit,
} from '../../constants/cards';
import type { Trick } from '../trick';
import type { BotPlayResult, GameState, Player, SeatPosition } from '../types';
import { getBotPlay } from './bot-play';

// ── Helpers ───────────────────────────────────────────────────────────────────

let _id = 0;
function card(suit: Suit, rank: Rank): Card {
  return {
    id: `${suit}-${rank}-${_id++}`,
    suit,
    rank,
    value: RANK_ORDER[rank],
  };
}

function emptyTrick(): Trick {
  return { cards: [], leadSuit: null, winningSeat: null };
}

function trickWith(
  plays: { player: SeatPosition; card: Card }[],
  leadSuit?: Suit,
): Trick {
  return {
    cards: plays,
    leadSuit: leadSuit ?? plays[0]?.card.suit ?? null,
    winningSeat: null,
  };
}

function makePlayer(
  seat: SeatPosition,
  team: 'BT' | 'LR',
  bid: number | null = null,
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

function defaultPlayers(): Record<SeatPosition, Player> {
  return {
    bottom: makePlayer('bottom', 'BT', 7),
    top: makePlayer('top', 'BT'),
    left: makePlayer('left', 'LR'),
    right: makePlayer('right', 'LR'),
  };
}

function swappedPlayers(
  bidder: SeatPosition = 'bottom',
): Record<SeatPosition, Player> {
  return {
    bottom: makePlayer('bottom', 'BT', bidder === 'bottom' ? 7 : null),
    top: makePlayer('top', 'LR'),
    left: makePlayer('left', 'LR'),
    right: makePlayer('right', 'BT'),
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

// ── Result helpers ─────────────────────────────────────────────────────────────

/** Unwrap the card from a BotPlayResult, asserting it is non-null. */
function played(result: BotPlayResult | null): Card {
  expect(result).not.toBeNull();
  return result!.card;
}

// ── Guards ────────────────────────────────────────────────────────────────────

describe('getBotPlay — guards', () => {
  test('returns null when hand is empty', () => {
    const result = getBotPlay(
      [],
      emptyTrick(),
      null,
      false,
      makeState(),
      'hard',
      'bottom',
    );
    expect(result).toBeNull();
  });

  test('returned card is always from the provided hand', () => {
    const hand = [card('hearts', 'A'), card('hearts', 'K'), card('clubs', '2')];
    for (const diff of ['easy', 'medium', 'hard'] as const) {
      const result = getBotPlay(
        hand,
        emptyTrick(),
        null,
        false,
        makeState(),
        diff,
        'bottom',
      );
      expect(result).not.toBeNull();
      expect(hand.some((c) => c.id === result!.card.id)).toBe(true);
    }
  });

  test('result always has card and wantsToTrump fields', () => {
    const hand = [card('hearts', 'A'), card('clubs', '3')];
    for (const diff of ['easy', 'medium', 'hard'] as const) {
      const result = getBotPlay(
        hand,
        emptyTrick(),
        null,
        false,
        makeState(),
        diff,
        'bottom',
      );
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('card');
      expect(result).toHaveProperty('wantsToTrump');
      expect(typeof result!.wantsToTrump).toBe('boolean');
    }
  });
});

// ── wantsToTrump flag ─────────────────────────────────────────────────────────

describe('getBotPlay — wantsToTrump flag', () => {
  test('is false when trump is already revealed', () => {
    // Bot is void in hearts, has trump (spades) — but trump already revealed
    const trick = trickWith(
      [{ player: 'left', card: card('hearts', 'K') }],
      'hearts',
    );
    const hand = [card('spades', 'A'), card('clubs', '3')];
    const state = makeState({ trumpSuit: 'spades', trumpRevealed: true });
    const result = getBotPlay(
      hand,
      trick,
      'spades',
      true,
      state,
      'medium',
      'bottom',
    );
    expect(result!.wantsToTrump).toBe(false);
  });

  test('is false when bot follows the led suit', () => {
    const trick = trickWith(
      [{ player: 'left', card: card('hearts', 'K') }],
      'hearts',
    );
    const hand = [card('hearts', 'A'), card('spades', '3')];
    const state = makeState({ trumpSuit: 'spades', trumpRevealed: false });
    const result = getBotPlay(
      hand,
      trick,
      'spades',
      false,
      state,
      'medium',
      'bottom',
    );
    // Bot has hearts — must follow suit, so wantsToTrump must be false
    expect(result!.wantsToTrump).toBe(false);
    expect(result!.card.suit).toBe('hearts');
  });

  test('is false when bot is void and discards a non-trump card', () => {
    // Void in hearts, has clubs (non-trump) and spades (trump) — medium bot
    // on defending team prefers discarding non-trump
    const trick = trickWith(
      [{ player: 'left', card: card('hearts', 'K') }],
      'hearts',
    );
    const hand = [card('clubs', '3'), card('spades', '2')];
    const state = makeState({
      trumpSuit: 'spades',
      trumpRevealed: false,
      highestBidder: 'top', // bot is NOT on bidding team → prefers discard
    });
    const result = getBotPlay(
      hand,
      trick,
      'spades',
      false,
      state,
      'medium',
      'bottom',
    );
    expect(result!.card.suit).toBe('clubs');
    expect(result!.wantsToTrump).toBe(false);
  });

  test('is true when bot is void and plays a trump card while trump is hidden', () => {
    // Bot on bidding team, partner not winning, has trump — should trump
    const trick = trickWith(
      [
        { player: 'left', card: card('hearts', 'K') },
        { player: 'top', card: card('hearts', '3') }, // partner losing
      ],
      'hearts',
    );
    const hand = [card('spades', 'A'), card('clubs', '2')];
    const state = makeState({
      trumpSuit: 'spades',
      trumpRevealed: false,
      highestBidder: 'bottom',
    });
    const result = getBotPlay(
      hand,
      trick,
      'spades',
      false,
      state,
      'medium',
      'bottom',
    );
    expect(result!.card.suit).toBe('spades');
    expect(result!.wantsToTrump).toBe(true);
  });

  test('is false when bot is leading the trick', () => {
    const hand = [card('hearts', 'A'), card('clubs', '3')];
    const state = makeState({ trumpSuit: 'spades', trumpRevealed: false });
    const result = getBotPlay(
      hand,
      emptyTrick(),
      'spades',
      false,
      state,
      'medium',
      'bottom',
    );
    expect(result!.wantsToTrump).toBe(false);
  });
});

// ── Easy bot ──────────────────────────────────────────────────────────────────

describe('playEasy', () => {
  test('returns a card from the hand', () => {
    const hand = [
      card('hearts', '7'),
      card('clubs', '3'),
      card('diamonds', 'A'),
    ];
    const result = getBotPlay(
      hand,
      emptyTrick(),
      null,
      false,
      makeState(),
      'easy',
      'left',
    );
    expect(hand.some((c) => c.id === played(result).id)).toBe(true);
  });

  test('is random — produces multiple distinct cards over 100 draws', () => {
    const hand = [
      card('hearts', '2'),
      card('clubs', '5'),
      card('diamonds', 'K'),
      card('hearts', '9'),
      card('clubs', 'A'),
    ];
    const results = new Set(
      Array.from(
        { length: 100 },
        () =>
          getBotPlay(
            hand,
            emptyTrick(),
            null,
            false,
            makeState(),
            'easy',
            'left',
          )!.card.id,
      ),
    );
    expect(results.size).toBeGreaterThan(1);
  });
});

// ── Medium bot ────────────────────────────────────────────────────────────────

describe('playMedium — defending team plays low', () => {
  test('defender plays lowest card', () => {
    const hand = [
      card('hearts', 'A'),
      card('hearts', '3'),
      card('hearts', 'J'),
    ];
    const result = getBotPlay(
      hand,
      emptyTrick(),
      null,
      false,
      makeState(),
      'medium',
      'left',
    );
    expect(played(result).rank).toBe('3');
  });
});

describe('playMedium — partner winning → play low', () => {
  test('plays lowest when BT partner is already winning the trick', () => {
    const trick = trickWith(
      [{ player: 'top', card: card('hearts', 'A') }],
      'hearts',
    );
    const hand = [
      card('hearts', 'K'),
      card('hearts', '2'),
      card('hearts', 'J'),
    ];
    const result = getBotPlay(
      hand,
      trick,
      null,
      false,
      makeState(),
      'medium',
      'bottom',
    );
    expect(played(result).rank).toBe('2');
  });
});

describe('playMedium — 2nd player plays low', () => {
  test('2nd in trick plays lowest card even on bidding team', () => {
    const trick = trickWith(
      [{ player: 'left', card: card('hearts', '7') }],
      'hearts',
    );
    const hand = [
      card('hearts', 'A'),
      card('hearts', '3'),
      card('hearts', 'Q'),
    ];
    const state = makeState({
      highestBidder: 'top',
      players: { ...defaultPlayers(), top: makePlayer('top', 'BT', 7) },
    });
    const result = getBotPlay(hand, trick, null, false, state, 'medium', 'top');
    expect(played(result).rank).toBe('3');
  });
});

describe('playMedium — 3rd/4th player follows suit with highest', () => {
  test('3rd player on bidding team follows lead suit with highest card', () => {
    const trick = trickWith(
      [
        { player: 'left', card: card('hearts', '7') },
        { player: 'bottom', card: card('hearts', '4') },
      ],
      'hearts',
    );
    const hand = [card('hearts', 'K'), card('hearts', '3'), card('clubs', 'A')];
    const state = makeState({
      highestBidder: 'bottom',
      players: swappedPlayers(),
    });
    const result = getBotPlay(
      hand,
      trick,
      null,
      false,
      state,
      'medium',
      'right',
    );
    expect(played(result).suit).toBe('hearts');
    expect(played(result).rank).toBe('K');
  });
});

describe('playMedium — void in lead suit, trump available', () => {
  test('plays lowest high trump when void in lead suit', () => {
    const trick = trickWith(
      [
        { player: 'left', card: card('hearts', 'K') },
        { player: 'top', card: card('hearts', '5') },
      ],
      'hearts',
    );
    const hand = [
      card('spades', 'A'),
      card('spades', 'J'),
      card('spades', '3'),
      card('clubs', '2'),
    ];
    const state = makeState({
      highestBidder: 'bottom',
      trumpSuit: 'spades',
      trumpRevealed: true,
    });
    const result = getBotPlay(
      hand,
      trick,
      'spades',
      true,
      state,
      'medium',
      'bottom',
    );
    expect(played(result).suit).toBe('spades');
    expect(played(result).rank).toBe('J');
  });

  test('plays lowest trump when void and no high trumps available', () => {
    const trick = trickWith(
      [
        { player: 'left', card: card('hearts', 'K') },
        { player: 'top', card: card('hearts', '5') },
      ],
      'hearts',
    );
    const hand = [card('spades', '5'), card('spades', '3'), card('clubs', '2')];
    const state = makeState({
      highestBidder: 'bottom',
      trumpSuit: 'spades',
      trumpRevealed: true,
    });
    const result = getBotPlay(
      hand,
      trick,
      'spades',
      true,
      state,
      'medium',
      'bottom',
    );
    expect(played(result).suit).toBe('spades');
    expect(played(result).rank).toBe('3');
  });
});

describe('playMedium — leading the trick', () => {
  test('plays highest card when leading', () => {
    const hand = [card('hearts', '3'), card('hearts', 'K'), card('clubs', 'J')];
    const result = getBotPlay(
      hand,
      emptyTrick(),
      null,
      false,
      makeState(),
      'medium',
      'bottom',
    );
    expect(played(result).rank).toBe('K');
  });
});

// ── Hard bot — position logic ─────────────────────────────────────────────────

describe('playHard — 2nd player plays low', () => {
  test('plays lowest card as 2nd player', () => {
    const trick = trickWith(
      [{ player: 'left', card: card('hearts', '8') }],
      'hearts',
    );
    const hand = [
      card('hearts', 'A'),
      card('hearts', '4'),
      card('hearts', 'Q'),
    ];
    const result = getBotPlay(
      hand,
      trick,
      null,
      false,
      makeState(),
      'hard',
      'top',
    );
    expect(played(result).rank).toBe('4');
  });
});

describe('playHard — 3rd player tries to win', () => {
  test('plays lowest winning card as 3rd player', () => {
    const trick = trickWith(
      [
        { player: 'left', card: card('hearts', '7') },
        { player: 'bottom', card: card('hearts', '4') },
      ],
      'hearts',
    );
    const hand = [
      card('hearts', 'K'),
      card('hearts', 'A'),
      card('hearts', 'J'),
    ];
    const state = makeState({
      highestBidder: 'bottom',
      players: swappedPlayers(),
    });
    const result = getBotPlay(hand, trick, null, false, state, 'hard', 'right');
    expect(played(result).suit).toBe('hearts');
    expect(played(result).rank).toBe('J');
  });

  test('discards cheapest non-trump when 3rd and cannot win', () => {
    const trick = trickWith(
      [
        { player: 'left', card: card('hearts', 'A') },
        { player: 'bottom', card: card('hearts', 'K') },
      ],
      'hearts',
    );
    const hand = [
      card('spades', '2'),
      card('clubs', '3'),
      card('diamonds', '4'),
    ];
    const state = makeState({
      highestBidder: 'bottom',
      trumpSuit: null,
      players: swappedPlayers(),
    });
    const result = getBotPlay(hand, trick, null, false, state, 'hard', 'right');
    expect(played(result).value).toBe(Math.min(...hand.map((c) => c.value)));
  });
});

describe('playHard — 4th player', () => {
  test('wins cheaply when partner is not winning', () => {
    const trick = trickWith(
      [
        { player: 'left', card: card('hearts', 'Q') },
        { player: 'top', card: card('hearts', '3') },
        { player: 'right', card: card('hearts', '9') },
      ],
      'hearts',
    );
    const hand = [
      card('hearts', 'K'),
      card('hearts', 'A'),
      card('hearts', 'J'),
    ];
    const result = getBotPlay(
      hand,
      trick,
      null,
      false,
      makeState(),
      'hard',
      'bottom',
    );
    expect(played(result).suit).toBe('hearts');
    expect(played(result).rank).toBe('K');
  });

  test('plays lowest when partner is already winning as 4th player', () => {
    const trick = trickWith(
      [
        { player: 'left', card: card('hearts', '3') },
        { player: 'top', card: card('hearts', 'A') },
        { player: 'right', card: card('hearts', '5') },
      ],
      'hearts',
    );
    const hand = [
      card('hearts', 'K'),
      card('hearts', '2'),
      card('hearts', 'J'),
    ];
    const result = getBotPlay(
      hand,
      trick,
      null,
      false,
      makeState(),
      'hard',
      'bottom',
    );
    expect(played(result).rank).toBe('2');
  });

  test('plays lowest card when 4th and cannot win', () => {
    const trick = trickWith(
      [
        { player: 'left', card: card('spades', 'A') },
        { player: 'top', card: card('spades', 'K') },
        { player: 'right', card: card('spades', 'Q') },
      ],
      'spades',
    );
    const hand = [
      card('spades', '2'),
      card('spades', '3'),
      card('hearts', '4'),
    ];
    const state = makeState({ trumpSuit: 'spades', trumpRevealed: true });
    const result = getBotPlay(
      hand,
      trick,
      'spades',
      true,
      state,
      'hard',
      'bottom',
    );
    expect(played(result).value).toBe(Math.min(...hand.map((c) => c.value)));
  });
});

// ── Hard bot — smart lead ─────────────────────────────────────────────────────

describe('playHard — smart lead (1st player)', () => {
  test('bidding team leads highest of longest non-trump suit', () => {
    const hand = [
      card('hearts', 'K'),
      card('hearts', 'Q'),
      card('hearts', '7'),
      card('clubs', 'A'),
      card('spades', '2'),
    ];
    const state = makeState({ trumpSuit: 'spades', trumpRevealed: true });
    const result = getBotPlay(
      hand,
      emptyTrick(),
      'spades',
      true,
      state,
      'hard',
      'bottom',
    );
    expect(played(result).suit).toBe('hearts');
    expect(played(result).rank).toBe('K');
  });

  test('defending team leads lowest non-trump card', () => {
    const hand = [
      card('hearts', 'A'),
      card('hearts', '3'),
      card('clubs', 'K'),
      card('clubs', '7'),
      card('spades', '5'),
    ];
    const state = makeState({ trumpSuit: 'spades', trumpRevealed: true });
    const result = getBotPlay(
      hand,
      emptyTrick(),
      'spades',
      true,
      state,
      'hard',
      'left',
    );
    expect(played(result).suit).not.toBe('spades');
    expect(played(result).rank).toBe('3');
  });

  test('leads lowest trump when only trump cards remain (bidding team)', () => {
    const hand = [
      card('spades', 'A'),
      card('spades', '5'),
      card('spades', '3'),
    ];
    const state = makeState({ trumpSuit: 'spades', trumpRevealed: true });
    const result = getBotPlay(
      hand,
      emptyTrick(),
      'spades',
      true,
      state,
      'hard',
      'bottom',
    );
    expect(played(result).suit).toBe('spades');
    expect(played(result).rank).toBe('3');
  });
});

// ── Cross-difficulty invariant ────────────────────────────────────────────────

describe('all difficulties — played card always belongs to hand', () => {
  test('card is always from the provided hand across all seats and difficulties', () => {
    const hand = [
      card('hearts', 'A'),
      card('hearts', '5'),
      card('clubs', 'K'),
      card('clubs', '3'),
    ];
    const trick = trickWith(
      [{ player: 'left', card: card('hearts', '7') }],
      'hearts',
    );

    for (const diff of ['easy', 'medium', 'hard'] as const) {
      for (const seat of ['bottom', 'top', 'left', 'right'] as SeatPosition[]) {
        const result = getBotPlay(
          hand,
          trick,
          null,
          false,
          makeState(),
          diff,
          seat,
        );
        if (result !== null) {
          expect(hand.some((c) => c.id === result.card.id)).toBe(true);
        }
      }
    }
  });
});
