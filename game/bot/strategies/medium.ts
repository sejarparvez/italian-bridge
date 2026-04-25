import type { Card, Suit } from '@/constants/cards';
import type { GameState, SeatPosition, Trick } from '@/types/game-type';
import { HIGH_CARD_THRESHOLD } from '../bot-bidding';
import {
  getHighestCard,
  getLowestCard,
  getTrickPosition,
  isMyPartnerWinning,
} from '../utils';

export function playMedium(
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

  if (trickPosition === 1) {
    return isBiddingTeam ? getHighestCard(playable) : getLowestCard(playable);
  }

  const leadSuitCards = trick.leadSuit
    ? playable.filter((c) => c.suit === trick.leadSuit)
    : [];

  if (leadSuitCards.length > 0) {
    if (!isBiddingTeam || partnerWinning) return getLowestCard(leadSuitCards);
    if (trickPosition === 2) return getLowestCard(leadSuitCards);
    return getHighestCard(leadSuitCards);
  }

  const trumpCards = trump ? playable.filter((c) => c.suit === trump) : [];
  const nonTrumpCards = trump
    ? playable.filter((c) => c.suit !== trump)
    : playable;

  if (!isBiddingTeam) {
    if (nonTrumpCards.length > 0) return getLowestCard(nonTrumpCards);
    return getLowestCard(playable);
  }

  if (partnerWinning) {
    if (nonTrumpCards.length > 0) return getLowestCard(nonTrumpCards);
    return getLowestCard(playable);
  }

  if (trumpCards.length > 0) {
    const highTrumps = trumpCards.filter((c) => c.value >= HIGH_CARD_THRESHOLD);
    if (highTrumps.length > 0) return getLowestCard(highTrumps);
    return getLowestCard(trumpCards);
  }

  if (nonTrumpCards.length > 0) return getLowestCard(nonTrumpCards);
  return getLowestCard(playable);
}
