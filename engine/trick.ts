import { Card, PlayerId, Suit, SuitOrNull } from './types';
import { getRankValue } from './deck';

export function getPlayableCards(
  hand: Card[],
  trick: Map<PlayerId, Card> | null,
  trump: SuitOrNull
): Card[] {
  if (!trick || trick.size === 0) {
    return hand;
  }

  const leaderId = getTrickLeader(trick);
  const leaderCard = trick.get(leaderId);
  if (!leaderCard) return hand;

  const leadSuit = leaderCard.suit;
  const leadSuitCards = hand.filter((c) => c.suit === leadSuit);

  if (leadSuitCards.length > 0) {
    return leadSuitCards;
  }

  if (trump) {
    const trumpCards = hand.filter((c) => c.suit === trump);
    if (trumpCards.length > 0) {
      const leadTrumpCards = leadSuit === trump ? trumpCards : [];
      if (leadTrumpCards.length > 0) {
        return leadTrumpCards;
      }
      const hasTrumpBeenPlayed = Array.from(trick.values()).some(
        (c) => c.suit === trump
      );
      if (!hasTrumpBeenPlayed && trumpCards.length > 0) {
        return trumpCards;
      }
      return trumpCards;
    }
  }

  return hand;
}

export function getTrickLeader(trick: Map<PlayerId, Card>): PlayerId {
  for (let i = 0; i <= 3; i++) {
    if (trick.has(i as PlayerId)) {
      return i as PlayerId;
    }
  }
  return 0;
}

export function getTrickWinner(
  trick: Map<PlayerId, Card>,
  trump: SuitOrNull
): PlayerId {
  const leader = getTrickLeader(trick);
  const leaderCard = trick.get(leader);
  if (!leaderCard) return leader;

  let winner = leader;
  let winningCard = leaderCard;

  const leadSuit = leaderCard.suit;

  for (const [playerId, card] of trick) {
    if (playerId === leader) continue;

    const isTrump = trump !== null && card.suit === trump;
    const isLeadSuit = card.suit === leadSuit;
    const winningIsTrump = trump !== null && winningCard.suit === trump;

    if (isTrump && !winningIsTrump) {
      winner = playerId;
      winningCard = card;
    } else if (isTrump === winningIsTrump && isLeadSuit) {
      if (getRankValue(card.rank) > getRankValue(winningCard.rank)) {
        winner = playerId;
        winningCard = card;
      }
    }
  }

  return winner;
}

export function getNextPlayer(current: PlayerId): PlayerId {
  return ((current + 1) % 4) as PlayerId;
}
