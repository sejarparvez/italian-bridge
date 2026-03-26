import { Bid, Player, PlayerId, RoundResult, Team } from './types';
import { getTeamTricks, getTeamBid, getHighestBid, getDeclarer, OPPONENT_TARGET } from './bidding';

export function calculateRoundScore(
  bids: Bid[],
  trickWins: PlayerId[],
  players: Player[]
): RoundResult {
  const highestBid = getHighestBid(bids);
  
  if (!highestBid) {
    return {
      teamUs: 0,
      teamThem: 0,
      usMade: 0,
      usBid: 0,
      themMade: 0,
      themBid: 0,
    };
  }

  const declarer = highestBid.player;
  const declarerTeam: Team = declarer % 2 === 0 ? 'us' : 'them';
  const opponentTeam: Team = declarerTeam === 'us' ? 'them' : 'us';
  const bidAmount = highestBid.tricks;

  const declarerMade = getTeamTricks(players, declarerTeam, trickWins);
  const opponentMade = getTeamTricks(players, opponentTeam, trickWins);

  let declarerScore = 0;
  let opponentScore = 0;

  if (declarerMade >= bidAmount) {
    declarerScore = bidAmount === 10 ? 13 : bidAmount;
  } else {
    declarerScore = -bidAmount;
  }

  if (opponentMade < OPPONENT_TARGET) {
    opponentScore = -OPPONENT_TARGET;
  }

  if (declarerTeam === 'us') {
    return {
      teamUs: declarerScore,
      teamThem: opponentScore,
      usMade: declarerMade,
      usBid: bidAmount,
      themMade: opponentMade,
      themBid: OPPONENT_TARGET,
    };
  } else {
    return {
      teamUs: opponentScore,
      teamThem: declarerScore,
      usMade: opponentMade,
      usBid: OPPONENT_TARGET,
      themMade: declarerMade,
      themBid: bidAmount,
    };
  }
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
