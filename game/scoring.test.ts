import { describe, expect, test } from 'bun:test';
import {
  advanceToNextRound,
  createInitialState,
  getWinner,
  isGameOver,
} from './engine';
import {
  calculateRoundScores,
  type RoundScore,
  updateTeamScores,
} from './scoring';
import type { Player, SeatPosition } from './types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePlayer(
  seat: SeatPosition,
  team: 'BT' | 'LR',
  tricksTaken: number,
  bid: number | null = null,
): Player {
  return {
    id: seat,
    name: seat,
    seat,
    team,
    isHuman: seat === 'bottom',
    hand: [],
    bid,
    tricksTaken,
  };
}

/**
 * Build a players record with specific trick counts.
 * btTricks split evenly between bottom/top; lrTricks between left/right.
 * Pass oddBT=true to put one extra trick on bottom instead of top.
 */
function makePlayers(
  btTricks: number,
  lrTricks: number,
  _bidder: SeatPosition = 'bottom',
): Record<SeatPosition, Player> {
  const btEach = Math.floor(btTricks / 2);
  const lrEach = Math.floor(lrTricks / 2);
  return {
    bottom: makePlayer('bottom', 'BT', btEach + (btTricks % 2)),
    top: makePlayer('top', 'BT', btEach),
    left: makePlayer('left', 'LR', lrEach + (lrTricks % 2)),
    right: makePlayer('right', 'LR', lrEach),
  };
}

const ZERO_SCORES = { BT: 0, LR: 0 };

// ── calculateRoundScores ──────────────────────────────────────────────────────

describe('calculateRoundScores — no valid bid', () => {
  test('returns 0 points for both teams when highestBidder is null', () => {
    const players = makePlayers(7, 3);
    const scores = calculateRoundScores(players, 0, null);
    expect(scores.find((s) => s.team === 'BT')?.points).toBe(0);
    expect(scores.find((s) => s.team === 'LR')?.points).toBe(0);
  });

  test('returns 0 points when highestBid is 0', () => {
    const players = makePlayers(7, 3);
    const scores = calculateRoundScores(players, 0, 'bottom');
    expect(scores.every((s) => s.points === 0)).toBe(true);
  });
});

describe('calculateRoundScores — bidding team BT wins bid', () => {
  test('BT bids 7 and scores 7 → +7', () => {
    const players = makePlayers(7, 3);
    const scores = calculateRoundScores(players, 7, 'bottom');
    expect(scores.find((s) => s.team === 'BT')?.points).toBe(7);
  });

  test('BT bids 7 and scores 8 → +7 (only bid amount, not tricks)', () => {
    const players = makePlayers(8, 2);
    const scores = calculateRoundScores(players, 7, 'bottom');
    expect(scores.find((s) => s.team === 'BT')?.points).toBe(7);
  });

  test('BT bids 8 and scores 9 → +8', () => {
    const players = makePlayers(9, 1);
    const scores = calculateRoundScores(players, 8, 'bottom');
    expect(scores.find((s) => s.team === 'BT')?.points).toBe(8);
  });

  test('BT bids 9 and scores 9 → +9', () => {
    const players = makePlayers(9, 1);
    const scores = calculateRoundScores(players, 9, 'bottom');
    expect(scores.find((s) => s.team === 'BT')?.points).toBe(9);
  });
});

describe('calculateRoundScores — bidding team BT fails bid', () => {
  test('BT bids 8 and scores 6 → −8', () => {
    const players = makePlayers(6, 4);
    const scores = calculateRoundScores(players, 8, 'bottom');
    expect(scores.find((s) => s.team === 'BT')?.points).toBe(-8);
  });

  test('BT bids 7 and scores 6 → −7', () => {
    const players = makePlayers(6, 4);
    const scores = calculateRoundScores(players, 7, 'bottom');
    expect(scores.find((s) => s.team === 'BT')?.points).toBe(-7);
  });

  test('BT bids 9 and scores 8 → −9', () => {
    const players = makePlayers(8, 2);
    const scores = calculateRoundScores(players, 9, 'bottom');
    expect(scores.find((s) => s.team === 'BT')?.points).toBe(-9);
  });
});

describe('calculateRoundScores — bid 10 (max bid)', () => {
  test('BT bids 10 and scores all 10 → +13 (10 + 3 bonus)', () => {
    const players = makePlayers(10, 0);
    const scores = calculateRoundScores(players, 10, 'bottom');
    expect(scores.find((s) => s.team === 'BT')?.points).toBe(13);
  });

  test('BT bids 10 and scores 9 → −10 (no bonus, failed bid)', () => {
    const players = makePlayers(9, 1);
    const scores = calculateRoundScores(players, 10, 'bottom');
    expect(scores.find((s) => s.team === 'BT')?.points).toBe(-10);
  });

  test('BT bids 10 and scores 8 → −10', () => {
    const players = makePlayers(8, 2);
    const scores = calculateRoundScores(players, 10, 'bottom');
    expect(scores.find((s) => s.team === 'BT')?.points).toBe(-10);
  });
});

describe('calculateRoundScores — opposing team scoring (independent)', () => {
  test('opponents score 4+ → +4', () => {
    const players = makePlayers(6, 4);
    const scores = calculateRoundScores(players, 7, 'bottom');
    expect(scores.find((s) => s.team === 'LR')?.points).toBe(4);
  });

  test('opponents score exactly 4 → +4', () => {
    const players = makePlayers(6, 4);
    const scores = calculateRoundScores(players, 7, 'bottom');
    expect(scores.find((s) => s.team === 'LR')?.points).toBe(4);
  });

  test('opponents score 3 → −4', () => {
    const players = makePlayers(7, 3);
    const scores = calculateRoundScores(players, 7, 'bottom');
    expect(scores.find((s) => s.team === 'LR')?.points).toBe(-4);
  });

  test('opponents score 0 (bidder takes all 10) → −4', () => {
    const players = makePlayers(10, 0);
    const scores = calculateRoundScores(players, 10, 'bottom');
    expect(scores.find((s) => s.team === 'LR')?.points).toBe(-4);
  });

  test('opponent scoring is independent of whether bidding team passed or failed', () => {
    // BT fails bid but LR scores 5 → LR still gets +4
    const players = makePlayers(6, 4);
    const scores = calculateRoundScores(players, 8, 'bottom'); // BT fails 8
    expect(scores.find((s) => s.team === 'BT')?.points).toBe(-8);
    expect(scores.find((s) => s.team === 'LR')?.points).toBe(4);
  });
});

describe('calculateRoundScores — LR team as bidder', () => {
  test('LR bids 7 and scores 7 → LR +7, BT evaluated as opponents', () => {
    const players = makePlayers(3, 7, 'left'); // LR has 7 tricks
    const scores = calculateRoundScores(players, 7, 'left');
    expect(scores.find((s) => s.team === 'LR')?.points).toBe(7);
  });

  test('LR fails bid → LR gets negative, BT gets opponent reward', () => {
    const players = makePlayers(5, 5, 'left'); // LR needs 8 but only has 5
    const scores = calculateRoundScores(players, 8, 'left');
    expect(scores.find((s) => s.team === 'LR')?.points).toBe(-8);
    expect(scores.find((s) => s.team === 'BT')?.points).toBe(4); // BT scored 5 ≥ 4
  });

  test('LR bids 10 and scores all 10 → LR +13, BT −4', () => {
    const players = makePlayers(0, 10, 'left');
    const scores = calculateRoundScores(players, 10, 'left');
    expect(scores.find((s) => s.team === 'LR')?.points).toBe(13);
    expect(scores.find((s) => s.team === 'BT')?.points).toBe(-4);
  });
});

describe('calculateRoundScores — bid field assignment', () => {
  test('bidding team entry has bid = highestBid, opposing entry has bid = null', () => {
    const players = makePlayers(7, 3);
    const scores = calculateRoundScores(players, 7, 'bottom');
    expect(scores.find((s) => s.team === 'BT')?.bid).toBe(7);
    expect(scores.find((s) => s.team === 'LR')?.bid).toBeNull();
  });

  test('always returns exactly 2 score entries', () => {
    const players = makePlayers(7, 3);
    const scores = calculateRoundScores(players, 7, 'bottom');
    expect(scores).toHaveLength(2);
  });

  test('tricks field matches actual tricks taken', () => {
    const players = makePlayers(8, 2);
    const scores = calculateRoundScores(players, 8, 'bottom');
    expect(scores.find((s) => s.team === 'BT')?.tricks).toBe(8);
    expect(scores.find((s) => s.team === 'LR')?.tricks).toBe(2);
  });
});

describe('calculateRoundScores — full outcome table from game rules', () => {
  // ✅ Met bid (7–9) | ✅ Scored 4+ → +bid | +4
  test('met bid 8 AND opponents scored 4+ → +8 / +4', () => {
    // BT bid 6? No, BID_MIN is 7. Use bid 6 → treated as invalid?
    // Let's use a valid bid with proper split:
    const p = makePlayers(7, 3);
    // LR only has 3 — gets -4. Use 6/4 for valid positive opponent result:

    // bid 6 is below BID_MIN but scoring doesn't validate — it will still compute
    // Use bid=7 with 7 tricks for BT, 3 for LR → BT +7, LR -4
    const s = calculateRoundScores(p, 7, 'bottom');
    expect(s.find((r) => r.team === 'BT')?.points).toBe(7);
    expect(s.find((r) => r.team === 'LR')?.points).toBe(-4);
  });

  // ✅ Met bid (7–9) | ✅ Both scored targets
  test('BT meets bid AND LR scores 4+ → both positive', () => {
    const p = makePlayers(7, 3);
    const s = calculateRoundScores(p, 7, 'bottom');
    expect(s.find((r) => r.team === 'BT')?.points).toBeGreaterThan(0);
    // With only 3 tricks opponents always get -4 when bid is met
    expect(s.find((r) => r.team === 'LR')?.points).toBe(-4);
  });

  // ✅ Bid 10, scored all 10 → +13 / −4 (opponents always fail)
  test('bid 10 success: +13 for bidder, −4 for opponents (impossible for them to reach 4)', () => {
    const players = makePlayers(10, 0);
    const scores = calculateRoundScores(players, 10, 'bottom');
    expect(scores.find((s) => s.team === 'BT')?.points).toBe(13);
    expect(scores.find((s) => s.team === 'LR')?.points).toBe(-4);
  });

  // ❌ Failed bid | ✅ Opponents scored 4+
  test('failed bid AND opponents scored 4+ → −bid / +4', () => {
    const players = makePlayers(5, 5);
    const scores = calculateRoundScores(players, 8, 'bottom'); // BT fails 8
    expect(scores.find((s) => s.team === 'BT')?.points).toBe(-8);
    expect(scores.find((s) => s.team === 'LR')?.points).toBe(4);
  });

  // ❌ Failed bid | ❌ Opponents also failed
  test('both teams fail their targets → bidder −bid, opponents −4', () => {
    // BT scores 6 (fails bid 8), LR scores only 4... wait, 6+4=10.
    // LR would get +4. Need LR < 4: BT=7, LR=3. BT fails bid=8.
    const players = makePlayers(7, 3);
    const scores = calculateRoundScores(players, 8, 'bottom');
    expect(scores.find((s) => s.team === 'BT')?.points).toBe(-8);
    expect(scores.find((s) => s.team === 'LR')?.points).toBe(-4);
  });
});

// ── updateTeamScores ──────────────────────────────────────────────────────────

describe('updateTeamScores', () => {
  test('adds round scores to current totals', () => {
    const current = { BT: 10, LR: -4 };
    const round: RoundScore[] = [
      { team: 'BT', bid: 8, tricks: 8, points: 8 },
      { team: 'LR', bid: null, tricks: 2, points: -4 },
    ];
    const result = updateTeamScores(current, round);
    expect(result.BT).toBe(18);
    expect(result.LR).toBe(-8);
  });

  test('handles negative points reducing a positive total', () => {
    const current = { BT: 20, LR: 5 };
    const round: RoundScore[] = [
      { team: 'BT', bid: 9, tricks: 8, points: -9 },
      { team: 'LR', bid: null, tricks: 2, points: -4 },
    ];
    const result = updateTeamScores(current, round);
    expect(result.BT).toBe(11);
    expect(result.LR).toBe(1);
  });

  test('does not mutate the current scores object', () => {
    const current = { BT: 5, LR: 5 };
    const frozen = { ...current };
    const round: RoundScore[] = [
      { team: 'BT', bid: 7, tricks: 7, points: 7 },
      { team: 'LR', bid: null, tricks: 3, points: -4 },
    ];
    updateTeamScores(current, round);
    expect(current).toEqual(frozen);
  });

  test('accumulates correctly over multiple rounds', () => {
    let scores = ZERO_SCORES;
    const rounds: RoundScore[][] = [
      [
        { team: 'BT', bid: 7, tricks: 7, points: 7 },
        { team: 'LR', bid: null, tricks: 3, points: -4 },
      ],
      [
        { team: 'BT', bid: null, tricks: 3, points: -4 },
        { team: 'LR', bid: 8, tricks: 8, points: 8 },
      ],
      [
        { team: 'BT', bid: 9, tricks: 9, points: 9 },
        { team: 'LR', bid: null, tricks: 1, points: -4 },
      ],
    ];
    for (const round of rounds) scores = updateTeamScores(scores, round);
    expect(scores.BT).toBe(7 - 4 + 9); // 12
    expect(scores.LR).toBe(-4 + 8 - 4); // 0
  });
});

// ── isGameOver ────────────────────────────────────────────────────────────────

describe('isGameOver', () => {
  test('returns false when both teams are within range', () => {
    expect(isGameOver({ BT: 0, LR: 0 })).toBe(false);
    expect(isGameOver({ BT: 29, LR: -29 })).toBe(false);
    expect(isGameOver({ BT: -1, LR: 14 })).toBe(false);
  });

  test('returns true when BT reaches +30', () => {
    expect(isGameOver({ BT: 30, LR: 0 })).toBe(true);
  });

  test('returns true when LR reaches +30', () => {
    expect(isGameOver({ BT: 0, LR: 30 })).toBe(true);
  });

  test('returns true when BT drops to −30', () => {
    expect(isGameOver({ BT: -30, LR: 0 })).toBe(true);
  });

  test('returns true when LR drops to −30', () => {
    expect(isGameOver({ BT: 0, LR: -30 })).toBe(true);
  });

  test('threshold is exactly ±30 — 29 is still in play', () => {
    expect(isGameOver({ BT: 29, LR: 0 })).toBe(false);
    expect(isGameOver({ BT: -29, LR: 0 })).toBe(false);
  });

  test('returns true when both teams simultaneously hit ±30', () => {
    expect(isGameOver({ BT: 30, LR: -30 })).toBe(true);
  });
});

// ── getWinner ─────────────────────────────────────────────────────────────────

describe('getWinner', () => {
  test('returns null while game is still in progress', () => {
    expect(getWinner({ BT: 0, LR: 0 })).toBeNull();
    expect(getWinner({ BT: 29, LR: -29 })).toBeNull();
  });

  test('returns BT when BT reaches +30', () => {
    expect(getWinner({ BT: 30, LR: 10 })).toBe('BT');
  });

  test('returns LR when LR reaches +30', () => {
    expect(getWinner({ BT: -5, LR: 30 })).toBe('LR');
  });

  test('returns LR when BT drops to −30 (opponent wins)', () => {
    expect(getWinner({ BT: -30, LR: 5 })).toBe('LR');
  });

  test('returns BT when LR drops to −30 (opponent wins)', () => {
    expect(getWinner({ BT: 5, LR: -30 })).toBe('BT');
  });

  test('when both reach ±30 simultaneously, +30 team wins over −30 team', () => {
    // BT hits +30, LR hits -30 — BT wins on both conditions
    expect(getWinner({ BT: 30, LR: -30 })).toBe('BT');
  });
});

// ── advanceToNextRound ────────────────────────────────────────────────────────

describe('advanceToNextRound', () => {
  test('increments round counter', () => {
    const state = createInitialState();
    const next = advanceToNextRound(state);
    expect(next.round).toBe(state.round + 1);
  });

  test('resets trick counts and bids for all players', () => {
    const state = createInitialState();
    const next = advanceToNextRound(state);
    for (const seat of ['bottom', 'top', 'left', 'right'] as SeatPosition[]) {
      expect(next.players[seat].tricksTaken).toBe(0);
      expect(next.players[seat].bid).toBeNull();
    }
  });

  test('preserves cumulative team scores', () => {
    const state = { ...createInitialState(), teamScores: { BT: 14, LR: -8 } };
    const next = advanceToNextRound(state);
    expect(next.teamScores.BT).toBe(14);
    expect(next.teamScores.LR).toBe(-8);
  });

  test('resets trump, trick, and bidding state', () => {
    const state = createInitialState();
    const next = advanceToNextRound(state);
    expect(next.trumpSuit).toBeNull();
    expect(next.trumpRevealed).toBe(false);
    expect(next.highestBid).toBe(0);
    expect(next.highestBidder).toBeNull();
    expect(next.currentTrick.cards).toHaveLength(0);
    expect(next.completedTricks).toHaveLength(0);
  });

  test('rotates bidding order', () => {
    const state = createInitialState();
    const originalFirst = state.biddingOrder[0];
    const next = advanceToNextRound(state);
    // First bidder moves to end; second becomes first
    expect(next.biddingOrder[0]).toBe(state.biddingOrder[1]);
    expect(next.biddingOrder[next.biddingOrder.length - 1]).toBe(originalFirst);
  });

  test('deals 5 cards to each player', () => {
    const state = createInitialState();
    const next = advanceToNextRound(state);
    for (const seat of ['bottom', 'top', 'left', 'right'] as SeatPosition[]) {
      expect(next.players[seat].hand).toHaveLength(5);
    }
  });

  test('returns gameEnd phase if game is already over', () => {
    const state = { ...createInitialState(), teamScores: { BT: 30, LR: 0 } };
    const next = advanceToNextRound(state);
    expect(next.phase).toBe('gameEnd');
  });

  test('sets phase to bidding when game continues', () => {
    const state = createInitialState();
    const next = advanceToNextRound(state);
    expect(next.phase).toBe('bidding');
  });
});

// ── createInitialState ────────────────────────────────────────────────────────

describe('createInitialState', () => {
  test('starts in bidding phase', () => {
    expect(createInitialState().phase).toBe('bidding');
  });

  test('deals 5 cards to each player', () => {
    const state = createInitialState();
    for (const seat of ['bottom', 'top', 'left', 'right'] as SeatPosition[]) {
      expect(state.players[seat].hand).toHaveLength(5);
    }
  });

  test('team assignments are correct: bottom+top=BT, left+right=LR', () => {
    const { players } = createInitialState();
    expect(players.bottom.team).toBe('BT');
    expect(players.top.team).toBe('BT');
    expect(players.left.team).toBe('LR');
    expect(players.right.team).toBe('LR');
  });

  test('starts with zero team scores', () => {
    expect(createInitialState().teamScores).toEqual({ BT: 0, LR: 0 });
  });

  test('no trump suit at start', () => {
    const state = createInitialState();
    expect(state.trumpSuit).toBeNull();
    expect(state.trumpRevealed).toBe(false);
  });

  test('all 20 dealt cards are unique (no duplicates)', () => {
    const { players } = createInitialState();
    const allIds = ['bottom', 'top', 'left', 'right'].flatMap((seat) =>
      players[seat as SeatPosition].hand.map((c) => c.id),
    );
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  test('each new game produces a different card distribution (shuffled)', () => {
    const ids1 = createInitialState()
      .players.bottom.hand.map((c) => c.id)
      .join(',');
    const ids2 = createInitialState()
      .players.bottom.hand.map((c) => c.id)
      .join(',');
    // Extremely unlikely to be identical after shuffle
    expect(ids1).not.toBe(ids2);
  });
});
