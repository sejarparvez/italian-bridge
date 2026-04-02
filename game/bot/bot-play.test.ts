import { describe, expect, test } from 'bun:test';
import {
  type Card,
  RANK_ORDER,
  type Rank,
  type Suit,
} from '../../constants/cards';
import type { Trick } from '../trick';
import type { BotPlayResult, GameState, Player, SeatPosition } from '../types';
import { botWantsToTrump, getBotPlay } from './bot-play';

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

/**
 * Default team layout:
 *   BT = bottom + top
 *   LR = left + right
 * highestBidder defaults to 'bottom' (BT team)
 */
function defaultPlayers(): Record<SeatPosition, Player> {
  return {
    bottom: makePlayer('bottom', 'BT', 7),
    top: makePlayer('top', 'BT'),
    left: makePlayer('left', 'LR'),
    right: makePlayer('right', 'LR'),
  };
}

/**
 * Swapped layout used when we need 'bottom' and 'right' on the same team (BT),
 * while 'top' and 'left' are on the opposing team (LR).
 */
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

/** Unwrap the card from a BotPlayResult, asserting it is non-null. */
function played(result: BotPlayResult | null): Card {
  expect(result).not.toBeNull();
  // biome-ignore lint/style/noNonNullAssertion: asserted above
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
      expect(hand.some((c) => c.id === result?.card.id)).toBe(true);
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
      expect(typeof result?.wantsToTrump).toBe('boolean');
    }
  });

  test('returns null when playable cards would be empty (cannot follow any rule)', () => {
    // Empty hand always results in null regardless of difficulty
    for (const diff of ['easy', 'medium', 'hard'] as const) {
      const result = getBotPlay(
        [],
        trickWith([{ player: 'left', card: card('hearts', 'A') }], 'hearts'),
        'spades',
        true,
        makeState(),
        diff,
        'bottom',
      );
      expect(result).toBeNull();
    }
  });
});

// ── botWantsToTrump (unit tests for the exported helper) ─────────────────────

describe('botWantsToTrump', () => {
  test('false when trump is already revealed', () => {
    const c = card('spades', 'A');
    expect(
      botWantsToTrump(
        c,
        trickWith([{ player: 'left', card: card('hearts', 'K') }], 'hearts'),
        'spades',
        true,
      ),
    ).toBe(false);
  });

  test('false when trump is null', () => {
    const c = card('spades', 'A');
    expect(
      botWantsToTrump(
        c,
        trickWith([{ player: 'left', card: card('hearts', 'K') }], 'hearts'),
        null,
        false,
      ),
    ).toBe(false);
  });

  test('false when leading the trick (no leadSuit)', () => {
    const c = card('spades', 'A');
    expect(botWantsToTrump(c, emptyTrick(), 'spades', false)).toBe(false);
  });

  test('false when card follows the led suit', () => {
    const c = card('hearts', 'A');
    expect(
      botWantsToTrump(
        c,
        trickWith([{ player: 'left', card: card('hearts', 'K') }], 'hearts'),
        'spades',
        false,
      ),
    ).toBe(false);
  });

  test('true when void in led suit and playing trump while trump is hidden', () => {
    const c = card('spades', 'A');
    expect(
      botWantsToTrump(
        c,
        trickWith([{ player: 'left', card: card('hearts', 'K') }], 'hearts'),
        'spades',
        false,
      ),
    ).toBe(true);
  });

  test('false when void in led suit but playing a non-trump off-suit card', () => {
    const c = card('clubs', '3');
    expect(
      botWantsToTrump(
        c,
        trickWith([{ player: 'left', card: card('hearts', 'K') }], 'hearts'),
        'spades',
        false,
      ),
    ).toBe(false);
  });
});

// ── wantsToTrump flag (via getBotPlay integration) ───────────────────────────

describe('getBotPlay — wantsToTrump flag', () => {
  test('is false when trump is already revealed', () => {
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
    expect(result?.wantsToTrump).toBe(false);
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
    // Bot has hearts — must follow suit → wantsToTrump must be false
    expect(result?.wantsToTrump).toBe(false);
    expect(result?.card.suit).toBe('hearts');
  });

  test('is false when bot is void and discards a non-trump card', () => {
    // FIX: highestBidder must be on a DIFFERENT team than 'bottom' for the
    // defending-team branch to fire. 'left' is on LR, 'bottom' is on BT.
    const trick = trickWith(
      [{ player: 'left', card: card('hearts', 'K') }],
      'hearts',
    );
    const hand = [card('clubs', '3'), card('spades', '2')];
    const state = makeState({
      trumpSuit: 'spades',
      trumpRevealed: false,
      highestBidder: 'left', // ← LR team is bidder; bottom (BT) is defender
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
    expect(result?.card.suit).toBe('clubs');
    expect(result?.wantsToTrump).toBe(false);
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
    expect(result?.card.suit).toBe('spades');
    expect(result?.wantsToTrump).toBe(true);
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
    expect(result?.wantsToTrump).toBe(false);
  });

  test('is false across all difficulties when trump is already revealed', () => {
    const trick = trickWith(
      [{ player: 'left', card: card('hearts', 'K') }],
      'hearts',
    );
    const hand = [card('spades', 'A'), card('clubs', '3')];
    const state = makeState({ trumpSuit: 'spades', trumpRevealed: true });
    for (const diff of ['easy', 'medium', 'hard'] as const) {
      const result = getBotPlay(
        hand,
        trick,
        'spades',
        true,
        state,
        diff,
        'bottom',
      );
      expect(result?.wantsToTrump).toBe(false);
    }
  });

  test('defender (LR team) never wants to trump when bidder is BT', () => {
    // left is LR, highestBidder is bottom (BT) — left is defender
    const trick = trickWith(
      [{ player: 'right', card: card('hearts', 'K') }],
      'hearts',
    );
    const hand = [card('spades', 'A'), card('clubs', '3')];
    const state = makeState({
      trumpSuit: 'spades',
      trumpRevealed: false,
      highestBidder: 'bottom', // BT team
    });
    // Defender should discard clubs, not trump
    const result = getBotPlay(
      hand,
      trick,
      'spades',
      false,
      state,
      'medium',
      'left',
    );
    expect(result?.wantsToTrump).toBe(false);
    expect(result?.card.suit).toBe('clubs');
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
          )?.card.id,
      ),
    );
    expect(results.size).toBeGreaterThan(1);
  });

  test('when void in led suit, sometimes trumps and sometimes discards', () => {
    const trick = trickWith(
      [{ player: 'left', card: card('hearts', 'K') }],
      'hearts',
    );
    const hand = [card('spades', 'A'), card('clubs', '3')]; // spades = trump, clubs = discard
    const state = makeState({ trumpSuit: 'spades' });

    const suits = new Set(
      Array.from(
        { length: 200 },
        () =>
          getBotPlay(hand, trick, 'spades', false, state, 'easy', 'bottom')
            ?.card.suit,
      ),
    );
    // Easy bot should sometimes play trump and sometimes discard
    expect(suits.has('spades')).toBe(true);
    expect(suits.has('clubs')).toBe(true);
  });

  test('when void and only trump available, plays trump', () => {
    const trick = trickWith(
      [{ player: 'left', card: card('hearts', 'K') }],
      'hearts',
    );
    const hand = [card('spades', 'A'), card('spades', '3')]; // only trump cards
    const state = makeState({ trumpSuit: 'spades' });

    for (let i = 0; i < 20; i++) {
      const result = getBotPlay(
        hand,
        trick,
        'spades',
        false,
        state,
        'easy',
        'bottom',
      );
      expect(result?.card.suit).toBe('spades');
    }
  });

  test('must follow led suit even on easy difficulty', () => {
    const trick = trickWith(
      [{ player: 'left', card: card('hearts', 'K') }],
      'hearts',
    );
    const hand = [card('hearts', '3'), card('clubs', 'A'), card('spades', '2')];
    const state = makeState({ trumpSuit: 'spades' });

    for (let i = 0; i < 20; i++) {
      const result = getBotPlay(
        hand,
        trick,
        'spades',
        false,
        state,
        'easy',
        'bottom',
      );
      // Must follow hearts since hand contains hearts
      expect(result?.card.suit).toBe('hearts');
    }
  });
});

// ── Medium bot ────────────────────────────────────────────────────────────────

describe('playMedium — leading the trick', () => {
  test('bidding team plays highest card when leading', () => {
    // FIX: The original test failed because playMedium had no leading branch.
    // bottom is BT (bidding team) — should lead highest.
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

  test('defending team plays lowest card when leading', () => {
    // left is LR, highestBidder is bottom (BT) → left is defender → leads low
    const hand = [card('hearts', 'A'), card('hearts', '3'), card('clubs', 'K')];
    const state = makeState({ highestBidder: 'bottom' });
    const result = getBotPlay(
      hand,
      emptyTrick(),
      null,
      false,
      state,
      'medium',
      'left',
    );
    expect(played(result).rank).toBe('3');
  });

  test('bidding team leads highest overall card when no trump is set', () => {
    const hand = [card('spades', 'Q'), card('hearts', 'A'), card('clubs', '7')];
    const result = getBotPlay(
      hand,
      emptyTrick(),
      null,
      false,
      makeState(),
      'medium',
      'bottom',
    );
    expect(played(result).rank).toBe('A');
  });
});

describe('playMedium — defending team plays low', () => {
  test('defender plays lowest card when following lead suit', () => {
    const trick = trickWith(
      [{ player: 'bottom', card: card('hearts', '5') }],
      'hearts',
    );
    const hand = [
      card('hearts', 'A'),
      card('hearts', '3'),
      card('hearts', 'J'),
    ];
    // left is LR, so it's defending
    const result = getBotPlay(
      hand,
      trick,
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

  test('plays lowest when LR partner is already winning', () => {
    const trick = trickWith(
      [{ player: 'right', card: card('hearts', 'A') }],
      'hearts',
    );
    const hand = [
      card('hearts', 'K'),
      card('hearts', '2'),
      card('hearts', 'J'),
    ];
    const state = makeState({ highestBidder: 'bottom' });
    const result = getBotPlay(
      hand,
      trick,
      null,
      false,
      state,
      'medium',
      'left',
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
  test('plays lowest high trump when void in lead suit (bidding team)', () => {
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

  test('defending team discards cheaply instead of trumping when void', () => {
    const trick = trickWith(
      [{ player: 'bottom', card: card('hearts', 'K') }],
      'hearts',
    );
    const hand = [card('clubs', '2'), card('spades', 'A')]; // spades = trump
    const state = makeState({
      highestBidder: 'bottom', // BT is bidder; left is LR (defender)
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
      'left',
    );
    // Defender should discard clubs rather than waste the trump ace
    expect(played(result).suit).toBe('clubs');
  });
});

describe('playMedium — partner winning while void, play low non-trump', () => {
  test('discards cheapest non-trump when partner is already winning', () => {
    const trick = trickWith(
      [
        { player: 'left', card: card('hearts', 'Q') },
        { player: 'top', card: card('hearts', 'A') }, // partner winning
      ],
      'hearts',
    );
    const hand = [card('spades', '2'), card('clubs', '8')]; // void in hearts; spades = trump
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
    // Partner is winning → don't waste trump, discard the cheapest non-trump
    expect(played(result).suit).toBe('clubs');
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

  test('plays lowest when 2nd even with high cards available', () => {
    const trick = trickWith(
      [{ player: 'left', card: card('clubs', '6') }],
      'clubs',
    );
    const hand = [card('clubs', 'A'), card('clubs', 'K'), card('clubs', '2')];
    const result = getBotPlay(
      hand,
      trick,
      null,
      false,
      makeState(),
      'hard',
      'top',
    );
    expect(played(result).rank).toBe('2');
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
      trumpSuit: undefined,
      players: swappedPlayers(),
    });
    const result = getBotPlay(hand, trick, null, false, state, 'hard', 'right');
    expect(played(result).value).toBe(Math.min(...hand.map((c) => c.value)));
  });

  test('3rd player does not over-commit — plays J not A to win trick', () => {
    const trick = trickWith(
      [
        { player: 'left', card: card('hearts', '7') },
        { player: 'right', card: card('hearts', '5') },
      ],
      'hearts',
    );
    // J already beats the trick — no need to waste the A
    const hand = [
      card('hearts', 'J'),
      card('hearts', 'A'),
      card('hearts', 'Q'),
    ];
    const state = makeState({ players: swappedPlayers() });
    const result = getBotPlay(
      hand,
      trick,
      null,
      false,
      state,
      'hard',
      'bottom',
    );
    expect(played(result).suit).toBe('hearts');
    // Should play the lowest card that wins (J), not the A
    expect(played(result).rank).toBe('J');
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

  test('4th player prefers cheapest winning card over throwing away trump', () => {
    const trick = trickWith(
      [
        { player: 'left', card: card('hearts', '8') },
        { player: 'top', card: card('hearts', '3') }, // partner losing
        { player: 'right', card: card('hearts', '6') },
      ],
      'hearts',
    );
    // J beats the trick; A would waste a high card
    const hand = [card('hearts', 'J'), card('hearts', 'A'), card('clubs', '2')];
    const result = getBotPlay(
      hand,
      trick,
      null,
      false,
      makeState(),
      'hard',
      'bottom',
    );
    expect(played(result).rank).toBe('J');
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

  test('bidding team with equal-length suits leads highest of first suit encountered', () => {
    // Two suits of equal length — just confirm it leads high from one of them
    const hand = [
      card('hearts', 'K'),
      card('hearts', 'Q'),
      card('clubs', 'A'),
      card('clubs', '9'),
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
    // Either suit is fine — just confirm it plays the highest of that suit's cards
    const suitPlayed = played(result).suit;
    const suitCards = hand.filter((c) => c.suit === suitPlayed);
    const highestInSuit = suitCards.reduce((h, c) =>
      c.value > h.value ? c : h,
    );
    expect(played(result).id).toBe(highestInSuit.id);
  });

  test('defending team avoids leading trump even when trump is known', () => {
    const hand = [
      card('spades', 'A'), // trump
      card('hearts', 'K'),
      card('clubs', 'Q'),
    ];
    const state = makeState({
      trumpSuit: 'spades',
      trumpRevealed: true,
      highestBidder: 'bottom',
    });
    const result = getBotPlay(
      hand,
      emptyTrick(),
      'spades',
      true,
      state,
      'hard',
      'left',
    );
    // Defender should not lead trump
    expect(played(result).suit).not.toBe('spades');
  });
});

// ── Hard bot — void in led suit ───────────────────────────────────────────────

describe('playHard — void in led suit', () => {
  test('3rd player trumps when void and partner not winning', () => {
    const trick = trickWith(
      [
        { player: 'left', card: card('hearts', 'K') },
        { player: 'right', card: card('hearts', '5') },
      ],
      'hearts',
    );
    const hand = [card('spades', 'J'), card('clubs', '2')]; // void in hearts; spades = trump
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
      'hard',
      'bottom',
    );
    expect(played(result).suit).toBe('spades');
  });

  test('4th player discards when partner is already winning and void in led suit', () => {
    const trick = trickWith(
      [
        { player: 'left', card: card('hearts', '4') },
        { player: 'top', card: card('hearts', 'A') }, // partner winning
        { player: 'right', card: card('hearts', '6') },
      ],
      'hearts',
    );
    const hand = [card('spades', 'K'), card('clubs', '2')]; // void in hearts; spades = trump
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
      'hard',
      'bottom',
    );
    // Partner already winning → discard cheapest, don't waste trump K
    expect(played(result).suit).toBe('clubs');
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

  test('played card is always from hand even with trump hidden across all positions', () => {
    const hand = [
      card('spades', 'A'),
      card('clubs', '4'),
      card('diamonds', '7'),
    ];
    const trick = trickWith(
      [{ player: 'left', card: card('hearts', 'K') }],
      'hearts',
    );
    const state = makeState({ trumpSuit: 'spades', trumpRevealed: false });

    for (const diff of ['easy', 'medium', 'hard'] as const) {
      for (const seat of ['bottom', 'top', 'right'] as SeatPosition[]) {
        const result = getBotPlay(
          hand,
          trick,
          'spades',
          false,
          state,
          diff,
          seat,
        );
        if (result !== null) {
          expect(hand.some((c) => c.id === result.card.id)).toBe(true);
        }
      }
    }
  });

  test('wantsToTrump is always a boolean across all difficulties and positions', () => {
    const hand = [card('spades', 'A'), card('clubs', '3'), card('hearts', '7')];
    const trick = trickWith(
      [{ player: 'left', card: card('diamonds', 'K') }],
      'diamonds',
    );
    const state = makeState({ trumpSuit: 'spades', trumpRevealed: false });

    for (const diff of ['easy', 'medium', 'hard'] as const) {
      for (const seat of ['bottom', 'top', 'right'] as SeatPosition[]) {
        const result = getBotPlay(
          hand,
          trick,
          'spades',
          false,
          state,
          diff,
          seat,
        );
        if (result !== null) {
          expect(typeof result.wantsToTrump).toBe('boolean');
        }
      }
    }
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('edge cases', () => {
  test('single card hand — bot always plays that card', () => {
    const hand = [card('clubs', '5')];
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
      expect(played(result).id).toBe(hand[0].id);
    }
  });

  test('no trump set — bot never sets wantsToTrump to true', () => {
    const hand = [card('hearts', 'A'), card('clubs', '3')];
    const trick = trickWith(
      [{ player: 'left', card: card('diamonds', 'K') }],
      'diamonds',
    );
    for (const diff of ['easy', 'medium', 'hard'] as const) {
      const result = getBotPlay(
        hand,
        trick,
        null,
        false,
        makeState(),
        diff,
        'bottom',
      );
      expect(result?.wantsToTrump).toBe(false);
    }
  });

  test('bot with all trump cards still plays a valid card when leading', () => {
    const hand = [
      card('spades', 'A'),
      card('spades', 'K'),
      card('spades', '3'),
    ];
    const state = makeState({ trumpSuit: 'spades', trumpRevealed: true });
    for (const diff of ['easy', 'medium', 'hard'] as const) {
      const result = getBotPlay(
        hand,
        emptyTrick(),
        'spades',
        true,
        state,
        diff,
        'bottom',
      );
      expect(result).not.toBeNull();
      expect(hand.some((c) => c.id === result?.card.id)).toBe(true);
    }
  });

  test('state with no highestBidder falls back gracefully', () => {
    const hand = [card('hearts', 'A'), card('clubs', '3')];
    // biome-ignore lint/suspicious/noExplicitAny: this is fine
    const state = makeState({ highestBidder: null } as any);
    for (const diff of ['easy', 'medium', 'hard'] as const) {
      const result = getBotPlay(
        hand,
        emptyTrick(),
        null,
        false,
        state,
        diff,
        'bottom',
      );
      expect(result).not.toBeNull();
      expect(hand.some((c) => c.id === result?.card.id)).toBe(true);
    }
  });

  test('all-trump hand with revealed trump — hard bot leads lowest trump', () => {
    const hand = [
      card('spades', 'A'),
      card('spades', '5'),
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
    expect(played(result).suit).toBe('spades');
    expect(played(result).rank).toBe('2');
  });
});
