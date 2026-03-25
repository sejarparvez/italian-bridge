import { Card, PlayerId, Suit, SuitOrNull, Player } from '../types';
import { getRankValue } from '../deck';
import { getPlayableCards } from '../trick';

export type Difficulty = 'easy' | 'medium' | 'hard';

interface PlayContext {
  hand: Card[];
  trick: Map<PlayerId, Card> | null;
  trump: SuitOrNull;
  currentPlayer: PlayerId;
  players: Player[];
  playedCards: Set<string>;
}

function cardToString(card: Card): string {
  return `${card.suit}-${card.rank}`;
}

function hasCard(hand: Card[], card: Card): boolean {
  return hand.some((c) => c.suit === card.suit && c.rank === card.rank);
}

function getSuitCards(hand: Card[], suit: Suit): Card[] {
  return hand.filter((c) => c.suit === suit);
}

function getHighestCard(cards: Card[]): Card | null {
  if (cards.length === 0) return null;
  return cards.reduce((highest, card) =>
    getRankValue(card.rank) > getRankValue(highest.rank) ? card : highest
  );
}

function getLowestCard(cards: Card[]): Card | null {
  if (cards.length === 0) return null;
  return cards.reduce((lowest, card) =>
    getRankValue(card.rank) < getRankValue(lowest.rank) ? card : lowest
  );
}

function getTrickLeaderCard(trick: Map<PlayerId, Card>): Card | null {
  for (let i = 0; i <= 3; i++) {
    const card = trick.get(i as PlayerId);
    if (card) return card;
  }
  return null;
}

function isPartnerWinning(trick: Map<PlayerId, Card>, players: Player[], currentPlayer: PlayerId, trump: SuitOrNull): boolean {
  const leaderCard = getTrickLeaderCard(trick);
  if (!leaderCard) return false;
  
  const currentTeam = players[currentPlayer].team;
  let bestCard = leaderCard;
  let bestPlayer = -1;
  
  for (const [playerId, card] of trick) {
    if (playerId === currentPlayer) continue;
    
    const isTrump = trump !== null && card.suit === trump;
    const bestIsTrump = trump !== null && bestCard.suit === trump;
    const isLeadSuit = card.suit === leaderCard.suit;
    const bestIsLeadSuit = bestCard.suit === leaderCard.suit;
    
    if (isTrump && !bestIsTrump) {
      bestCard = card;
      bestPlayer = playerId;
    } else if ((isTrump && bestIsTrump) || (isLeadSuit && bestIsLeadSuit)) {
      if (getRankValue(card.rank) > getRankValue(bestCard.rank)) {
        bestCard = card;
        bestPlayer = playerId;
      }
    }
  }
  
  if (bestPlayer === -1) return false;
  return players[bestPlayer].team === currentTeam;
}

export function getBotPlay(context: PlayContext, difficulty: Difficulty): Card {
  const { hand, trick, trump, currentPlayer, players, playedCards } = context;
  const playable = getPlayableCards(hand, trick, trump);
  
  if (playable.length === 0) {
    return hand[0];
  }
  
  switch (difficulty) {
    case 'easy':
      return playEasy(playable, trick, trump, currentPlayer, players);
    case 'medium':
      return playMedium(playable, trick, trump, currentPlayer, players);
    case 'hard':
      return playHard(playable, trick, trump, currentPlayer, players, playedCards);
    default:
      return playEasy(playable, trick, trump, currentPlayer, players);
  }
}

function playEasy(
  playable: Card[],
  trick: Map<PlayerId, Card> | null,
  trump: SuitOrNull,
  currentPlayer: PlayerId,
  players: Player[]
): Card {
  const idx = Math.floor(Math.random() * playable.length);
  return playable[idx];
}

function playMedium(
  playable: Card[],
  trick: Map<PlayerId, Card> | null,
  trump: SuitOrNull,
  currentPlayer: PlayerId,
  players: Player[]
): Card {
  if (!trick || trick.size === 0) {
    const longestSuit = getLongestSuit(playable);
    if (longestSuit) {
      const suitCards = getSuitCards(playable, longestSuit);
      return getHighestCard(suitCards) || playable[0];
    }
    return playable[0];
  }
  
  const leaderCard = getTrickLeaderCard(trick);
  if (!leaderCard) return playable[0];
  
  const trickIsEmpty = trick.size === 0;
  const canWin = canWinTrick(playable, leaderCard, trump);
  
  if (!trickIsEmpty && canWin && !isPartnerWinning(trick, players, currentPlayer, trump)) {
    const winningCard = getWinningCard(playable, leaderCard, trump);
    if (winningCard) return winningCard;
  }
  
  if (!trickIsEmpty && isPartnerWinning(trick, players, currentPlayer, trump)) {
    const lowestValid = getLowestCard(playable);
    if (lowestValid) return lowestValid;
  }
  
  const lowest = getLowestCard(playable);
  return lowest || playable[0];
}

function playHard(
  playable: Card[],
  trick: Map<PlayerId, Card> | null,
  trump: SuitOrNull,
  currentPlayer: PlayerId,
  players: Player[],
  playedCards: Set<string>
): Card {
  if (!trick || trick.size === 0) {
    const longestSuit = getLongestSuit(playable);
    if (longestSuit) {
      const suitCards = getSuitCards(playable, longestSuit);
      return getHighestCard(suitCards) || playable[0];
    }
    return playable[0];
  }
  
  const leaderCard = getTrickLeaderCard(trick);
  if (!leaderCard) return playable[0];
  
  const canWin = canWinTrick(playable, leaderCard, trump);
  const partnerWinning = isPartnerWinning(trick, players, currentPlayer, trump);
  
  if (!partnerWinning && canWin) {
    const winningCard = getWinningCard(playable, leaderCard, trump);
    if (winningCard) return winningCard;
  }
  
  if (partnerWinning) {
    const lowest = getLowestCard(playable);
    return lowest || playable[0];
  }
  
  const trumpCards = trump ? getSuitCards(playable, trump) : [];
  const remainingTrumps = countRemainingTrumps(trump, playedCards);
  
  if (trumpCards.length > 0 && remainingTrumps <= 2) {
    return getHighestCard(trumpCards) || playable[0];
  }
  
  const lowest = getLowestCard(playable);
  return lowest || playable[0];
}

function getLongestSuit(cards: Card[]): Suit | null {
  const counts: Record<Suit, number> = {
    spades: 0,
    hearts: 0,
    diamonds: 0,
    clubs: 0,
  };
  
  for (const card of cards) {
    counts[card.suit]++;
  }
  
  let maxSuit: Suit = 'spades';
  let maxCount = 0;
  
  for (const [suit, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxSuit = suit as Suit;
    }
  }
  
  return maxCount > 0 ? maxSuit : null;
}

function canWinTrick(playable: Card[], leaderCard: Card, trump: SuitOrNull): boolean {
  if (trump && playable.some((c) => c.suit === trump)) {
    return true;
  }
  
  const leadSuit = leaderCard.suit;
  const leadSuitCards = playable.filter((c) => c.suit === leadSuit);
  
  if (leadSuitCards.length > 0) {
    const highestLead = getHighestCard(leadSuitCards);
    if (highestLead && getRankValue(highestLead.rank) > getRankValue(leaderCard.rank)) {
      return true;
    }
  }
  
  return false;
}

function getWinningCard(playable: Card[], leaderCard: Card, trump: SuitOrNull): Card | null {
  if (trump) {
    const trumpCards = getSuitCards(playable, trump);
    if (trumpCards.length > 0) {
      return getHighestCard(trumpCards);
    }
  }
  
  const leadSuit = leaderCard.suit;
  const leadSuitCards = playable.filter((c) => c.suit === leadSuit);
  
  if (leadSuitCards.length > 0) {
    const highestLead = getHighestCard(leadSuitCards);
    if (highestLead && getRankValue(highestLead.rank) > getRankValue(leaderCard.rank)) {
      return highestLead;
    }
  }
  
  return null;
}

function countRemainingTrumps(trump: SuitOrNull, playedCards: Set<string>): number {
  if (!trump) return 0;
  
  const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
  let count = 0;
  
  for (const rank of ranks) {
    if (!playedCards.has(`${trump}-${rank}`)) {
      count++;
    }
  }
  
  return count;
}
