import { Bid, Player, PlayerId, RoundResult, Team } from './types';
import { getTeamTricks, getTeamBid } from './bidding';

const BID_BONUS = 1;
const PENALTY_PER_TRICK_SHORT = -1;

export function calculateRoundScore(
  bids: Bid[],
  trickWins: PlayerId[],
  players: Player[]
): RoundResult {
  const usBid = getTeamBid(bids, 'us');
  const themBid = getTeamBid(bids, 'them');

  const usMade = getTeamTricks(players, 'us', trickWins);
  const themMade = getTeamTricks(players, 'them', trickWins);

  const usScore = calculateTeamScore(usMade, usBid);
  const themScore = calculateTeamScore(themMade, themBid);

  return {
    teamUs: usScore,
    teamThem: themScore,
    usMade,
    usBid,
    themMade,
    themBid,
  };
}

function calculateTeamScore(made: number, bid: number): number {
  if (made >= bid) {
    return made + BID_BONUS;
  }
  const shortfall = bid - made;
  return made + (shortfall * PENALTY_PER_TRICK_SHORT);
}

export function updateCumulativeScore(
  currentScores: { us: number; them: number },
  roundResult: RoundResult
): { us: number; them: number } {
  return {
    us: currentScores.us + roundResult.teamUs,
    them: currentScores.them + roundResult.teamThem,
  };
}

export function isGameOver(scores: { us: number; them: number }): boolean {
  const TARGET_SCORE = 100;
  return scores.us >= TARGET_SCORE || scores.them >= TARGET_SCORE;
}

export function getWinner(scores: { us: number; them: number }): Team | 'tie' {
  if (scores.us > scores.them) return 'us';
  if (scores.them > scores.us) return 'them';
  return 'tie';
}

export type { PlayerId };
