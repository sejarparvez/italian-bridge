import { Bid, Card, Player, PlayerId, Suit, SuitOrNull, Team } from './types';
import { getRankValue } from './deck';

export function getBidOrder(startingPlayer: PlayerId): PlayerId[] {
  const order: PlayerId[] = [];
  for (let i = 0; i < 4; i++) {
    order.push(((startingPlayer + i) % 4) as PlayerId);
  }
  return order;
}

export function estimateTricks(hand: Card[]): number {
  let tricks = 0;

  const suitCounts: Record<string, Card[]> = {
    spades: [],
    hearts: [],
    diamonds: [],
    clubs: [],
  };

  for (const card of hand) {
    suitCounts[card.suit].push(card);
  }

  for (const cards of Object.values(suitCounts)) {
    if (cards.length === 0) {
      tricks += 0.5;
    } else if (cards.length === 1) {
      const card = cards[0];
      if (getRankValue(card.rank) >= 12) tricks += 1;
      else tricks += 0.5;
    } else {
      const sorted = [...cards].sort(
        (a, b) => getRankValue(b.rank) - getRankValue(a.rank)
      );
      let suitTricks = 0;
      let topRank = 0;
      for (const card of sorted) {
        const rank = getRankValue(card.rank);
        if (rank > topRank + 2) {
          suitTricks++;
          topRank = rank;
        }
      }
      tricks += Math.max(0, suitTricks - 1);
    }
  }

  return Math.round(tricks);
}

export function getHighestBid(bids: Bid[]): Bid | null {
  if (bids.length === 0) return null;
  return bids.reduce((highest, bid) =>
    bid.tricks > highest.tricks ? bid : highest
  );
}

export function getDeclarer(bids: Bid[]): PlayerId | null {
  const highest = getHighestBid(bids);
  return highest?.player ?? null;
}

export function getDeclarerPartner(declarer: PlayerId): PlayerId {
  return ((declarer + 2) % 4) as PlayerId;
}

export function chooseTrump(players: Player[], declarer: PlayerId): Suit {
  const declarerHand = players[findPlayer(players, declarer)].hand;
  const suitCounts: Record<Suit, number> = {
    spades: 0,
    hearts: 0,
    diamonds: 0,
    clubs: 0,
  };

  for (const card of declarerHand) {
    suitCounts[card.suit]++;
  }

  let bestSuit: Suit = 'spades';
  let bestCount = 0;

  for (const [suit, count] of Object.entries(suitCounts)) {
    if (count > bestCount) {
      bestCount = count;
      bestSuit = suit as Suit;
    }
  }

  return bestSuit;
}

function findPlayer(players: Player[], id: PlayerId): number {
  return players.findIndex((p) => p.id === id);
}

export function getTeamTricks(
  players: Player[],
  team: Team,
  trickWins: PlayerId[]
): number {
  let tricks = 0;
  for (const id of trickWins) {
    const player = players[findPlayer(players, id)];
    if (player.team === team) {
      tricks++;
    }
  }
  return tricks;
}

export function getTeamBid(bids: Bid[], team: Team): number {
  let total = 0;
  for (const bid of bids) {
    const playerId = bid.player;
    const playerTeam: Team = playerId % 2 === 0 ? 'us' : 'them';
    if (playerTeam === team) {
      total += bid.tricks;
    }
  }
  return total;
}
