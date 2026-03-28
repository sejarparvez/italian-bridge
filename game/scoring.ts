import { Player, SeatPosition, TeamId } from './types';

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


  let btBid: number | null = null;
  let lrBid: number | null = null;

  if (highestBidder) {
    const bidderTeam = players[highestBidder].team;
    const bidderTricks = bidderTeam === btTeam ? btTricks : lrTricks;
    const opponentTricks = bidderTeam === btTeam ? lrTricks : btTricks;

    // Assign bid label to the correct team
    if (bidderTeam === btTeam) {
      btBid = highestBid;
    } else {
      lrBid = highestBid;
    }

    if (bidderTricks >= highestBid) {
      // Bidder met their bid
      if (bidderTeam === btTeam) {
        btPoints = highestBid;
        if (highestBid === 10) btPoints += 3; // 10-bid bonus
      } else {
        lrPoints = highestBid;
        if (highestBid === 10) lrPoints += 3;
      }
    } else {
      // Bidder failed — lose the bid amount
      if (bidderTeam === btTeam) {
        btPoints = -highestBid;
      } else {
        lrPoints = -highestBid;
      }
    }

    // Opponent penalty: if opponents took fewer than 4 tricks
    if (opponentTricks < 4) {
      if (bidderTeam === btTeam) {
        lrPoints += -4;
      } else {
        btPoints += -4;
      }
    }
  }

  return [
    { team: btTeam, bid: btBid, tricks: btTricks, points: btPoints },
    { team: lrTeam, bid: lrBid, tricks: lrTricks, points: lrPoints },
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