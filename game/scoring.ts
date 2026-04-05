import type { Player, SeatPosition, TeamId } from '@/types/game-type';
import { BID_MAX } from './bidding';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Points awarded to the opposing team for successfully scoring 4+ tricks */
const OPPONENT_TARGET = 4;
const OPPONENT_REWARD = 4;
const OPPONENT_PENALTY = -4;

/** Bonus points for successfully making a bid of 10 (scores all tricks) */
const BID_MAX_BONUS = 3;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoundScore {
  team: TeamId;
  /**
   * The bid this team made this round, or null if they were the defending team.
   * null explicitly means "not the bidding team" — not an error.
   */
  bid: number | null;
  tricks: number;
  points: number;
}

// ─── Round Scoring ────────────────────────────────────────────────────────────

export function calculateRoundScores(
  players: Record<SeatPosition, Player>,
  highestBid: number,
  highestBidder: SeatPosition | null,
): RoundScore[] {
  const btTricks = players.bottom.tricksTaken + players.top.tricksTaken;
  const lrTricks = players.left.tricksTaken + players.right.tricksTaken;

  let btPoints = 0;
  let lrPoints = 0;
  let btBid: number | null = null;
  let lrBid: number | null = null;

  if (!highestBidder || highestBid <= 0) {
    // No valid bid — no scoring this round (shouldn't happen in normal play)
    return [
      { team: 'BT', bid: null, tricks: btTricks, points: 0 },
      { team: 'LR', bid: null, tricks: lrTricks, points: 0 },
    ];
  }

  const bidderTeam = players[highestBidder].team;

  const bidderTricks = bidderTeam === 'BT' ? btTricks : lrTricks;
  const opponentTricks = bidderTeam === 'BT' ? lrTricks : btTricks;

  // Label which team held the bid (for UI display)
  if (bidderTeam === 'BT') btBid = highestBid;
  else lrBid = highestBid;

  // ── Bidding team score ──
  const bidMet = bidderTricks >= highestBid;
  const bidMaxBonus =
    highestBid === BID_MAX && bidderTricks === BID_MAX ? BID_MAX_BONUS : 0;
  const bidderPoints = bidMet ? highestBid + bidMaxBonus : -highestBid;

  // ── Opposing team score ──
  // Evaluated independently of the bidding team result.
  // Note: if bidder scores all 10 tricks, opponents only have 3 —
  // they can never reach 4, so they always get OPPONENT_PENALTY in that case.
  // Both outcomes (+4 / -4) are possible and must both be applied.
  const opponentPoints =
    opponentTricks >= OPPONENT_TARGET ? OPPONENT_REWARD : OPPONENT_PENALTY;

  // Assign points to the correct teams
  if (bidderTeam === 'BT') {
    btPoints = bidderPoints;
    lrPoints = opponentPoints;
  } else {
    lrPoints = bidderPoints;
    btPoints = opponentPoints;
  }

  return [
    { team: 'BT', bid: btBid, tricks: btTricks, points: btPoints },
    { team: 'LR', bid: lrBid, tricks: lrTricks, points: lrPoints },
  ];
}

// ─── Score Accumulation ───────────────────────────────────────────────────────

export function updateTeamScores(
  currentScores: Record<TeamId, number>,
  roundScores: RoundScore[],
): Record<TeamId, number> {
  const newScores = { ...currentScores };
  for (const score of roundScores) {
    newScores[score.team] += score.points;
  }
  return newScores;
}
