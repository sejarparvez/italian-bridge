import type { Card, Suit } from '@/constants/cards';
import type { GameState, SeatPosition, Trick } from '@/types/game-type';
import {
  canCardWinTrick,
  getCheapestDiscard,
  getHighestCard,
  getLongestSuitCards,
  getLowestCard,
  getTrickPosition,
  isMyPartnerWinning,
} from '../utils';

export function playHard(
  playable: Card[],
  trick: Trick,
  trump: Suit | null,
  _trumpRevealed: boolean,
  gameState: GameState,
  seat: SeatPosition,
): Card {
  if (!gameState.highestBidder) {
    return getLowestCard(playable);
  }

  const myTeam = gameState.players[seat].team;
  const bidderTeam = gameState.players[gameState.highestBidder].team;
  const isBiddingTeam = myTeam === bidderTeam;
  const partnerWinning = isMyPartnerWinning(trick, gameState, seat);
  const trickPosition = getTrickPosition(trick);

  const leadSuitCards = trick.leadSuit
    ? playable.filter((c) => c.suit === trick.leadSuit)
    : [];

  if (leadSuitCards.length > 0) {
    if (trickPosition === 4 || trickPosition === 3) {
      if (partnerWinning) return getLowestCard(leadSuitCards);
      const winning = leadSuitCards.filter((c) =>
        canCardWinTrick(c, trick, trump, seat),
      );
      return winning.length > 0
        ? getLowestCard(winning)
        : getLowestCard(leadSuitCards);
    }
    if (trickPosition === 2) return getLowestCard(leadSuitCards);
  }

  if (trickPosition === 1) {
    return getSmartLead(playable, trump, gameState, isBiddingTeam);
  }

  const trumpCards = trump ? playable.filter((c) => c.suit === trump) : [];
  const nonTrumpCards = trump
    ? playable.filter((c) => c.suit !== trump)
    : playable;

  if (trickPosition === 4 || trickPosition === 3) {
    if (partnerWinning) {
      return nonTrumpCards.length > 0
        ? getLowestCard(nonTrumpCards)
        : getLowestCard(playable);
    }
    if (trumpCards.length > 0) {
      const winningTrumps = trumpCards.filter((c) =>
        canCardWinTrick(c, trick, trump, seat),
      );
      if (winningTrumps.length > 0) return getLowestCard(winningTrumps);
    }
    return getCheapestDiscard(playable, trump);
  }

  return getCheapestDiscard(playable, trump);
}

function getSmartLead(
  playable: Card[],
  trump: Suit | null,
  _gameState: GameState,
  isBiddingTeam: boolean,
): Card {
  const nonTrump = trump ? playable.filter((c) => c.suit !== trump) : playable;
  const trumpCards = trump ? playable.filter((c) => c.suit === trump) : [];

  if (isBiddingTeam) {
    if (nonTrump.length > 0) {
      const longestSuitCards = getLongestSuitCards(nonTrump, trump);
      return getHighestCard(longestSuitCards);
    }
    return getLowestCard(trumpCards);
  } else {
    if (nonTrump.length > 0) return getLowestCard(nonTrump);
    return getLowestCard(trumpCards);
  }
}
