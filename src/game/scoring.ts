import { TeamId, Player } from './types';
import { SeatPosition } from './types';

export interface RoundScore {
  team: TeamId;
  bid: number | null;
  tricks: number;
  points: number;
}

export function calculateRoundScores(
  players: Record<SeatPosition, Player>,
  highestBid: number,
  highestBidder: SeatPosition | null
): RoundScore[] {
  const btTricks = players.bottom.tricksTaken + players.top.tricksTaken;
  const lrTricks = players.left.tricksTaken + players.right.tricksTaken;

  const btTeam: TeamId = 'BT';
  const lrTeam: TeamId = 'LR';

  let btPoints = 0;
  let lrPoints = 0;

  if (highestBidder) {
    const bidderTeam = players[highestBidder].team;
    const bidderTricks = bidderTeam === btTeam ? btTricks : lrTricks;
    const opponentTricks = bidderTeam === btTeam ? lrTricks : btTricks;

    if (bidderTricks >= highestBid) {
      if (bidderTeam === btTeam) {
        btPoints = highestBid;
        if (highestBid === 10) btPoints += 3;
      } else {
        lrPoints = highestBid;
        if (highestBid === 10) lrPoints += 3;
      }
    } else {
      if (bidderTeam === btTeam) {
        btPoints = -highestBid;
      } else {
        lrPoints = -highestBid;
      }
    }

    if (opponentTricks < 4) {
      const opponentPenalty = -4;
      if (bidderTeam === btTeam) {
        lrPoints += opponentPenalty;
      } else {
        btPoints += opponentPenalty;
      }
    }
  }

  return [
    { team: btTeam, bid: highestBid, tricks: btTricks, points: btPoints },
    { team: lrTeam, bid: null, tricks: lrTricks, points: lrPoints },
  ];
}

export function updateTeamScores(
  currentScores: Record<TeamId, number>,
  roundScores: RoundScore[]
): Record<TeamId, number> {
  const newScores = { ...currentScores };
  for (const score of roundScores) {
    newScores[score.team] += score.points;
  }
  return newScores;
}