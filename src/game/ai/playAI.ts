import { Card, Suit } from '../../constants/cards';
import { SeatPosition, GameState, Difficulty, Player } from '../types';
import { getPlayableCards, getTrickWinner, Trick } from '../trick';

export function getBotPlay(
  hand: Card[],
  trick: Trick,
  trump: Suit | null,
  gameState: GameState,
  difficulty: Difficulty,
  seat: SeatPosition
): Card | null {
  const playable = getPlayableCards(hand, trick, trump);

  if (playable.length === 0) return null;

  switch (difficulty) {
    case 'easy':
      return playEasy(playable, trick, trump, seat);
    case 'medium':
      return playMedium(playable, trick, trump, gameState, seat);
    case 'hard':
      return playHard(playable, trick, trump, gameState, seat);
    default:
      return playEasy(playable, trick, trump, seat);
  }
}

function playEasy(
  playable: Card[],
  _trick: Trick,
  _trump: Suit | null,
  _seat: SeatPosition
): Card {
  return playable[Math.floor(Math.random() * playable.length)];
}

function playMedium(
  playable: Card[],
  trick: Trick,
  trump: Suit | null,
  gameState: GameState,
  seat: SeatPosition
): Card {
  const highestBidder = gameState.highestBidder;
  const isPartnerWinning = isMyPartnerWinning(trick, gameState);

  if (!highestBidder) return playEasy(playable, trick, trump, seat);

  const myTeam = gameState.players[seat].team;
  const bidderTeam = gameState.players[highestBidder].team;
  const isBidderOnMyTeam = myTeam === bidderTeam;

  if (isPartnerWinning || !isBidderOnMyTeam) {
    return getLowestCard(playable);
  }

  if (trump && trick.cards.length < 3) {
    const trumpsInHand = playable.filter(c => c.suit === trump);
    if (trumpsInHand.length > 0) {
      const highTrumps = trumpsInHand.filter(c => c.value >= 12);
      if (highTrumps.length > 0) return highTrumps[0];
    }
  }

  const leadSuit = trick.leadSuit;
  if (leadSuit) {
    const leadSuitCards = playable.filter(c => c.suit === leadSuit);
    if (leadSuitCards.length > 0) {
      return leadSuitCards[leadSuitCards.length - 1];
    }
  }

  return playable[playable.length - 1];
}

function playHard(
  playable: Card[],
  trick: Trick,
  trump: Suit | null,
  gameState: GameState,
  seat: SeatPosition
): Card {
  const result = playMedium(playable, trick, trump, gameState, seat);
  
  if (!result) return playable[0];

  const canWinTrick = canWinWithCard(result, playable, trick, trump);
  
  if (canWinTrick && trick.cards.length === 3) {
    return result;
  }

  return result;
}

function isMyPartnerWinning(trick: Trick, gameState: GameState): boolean {
  if (trick.cards.length === 0) return false;

  const currentWinner = getTrickWinner(trick, gameState.trumpSuit);
  const mySeat = gameState.currentSeat;
  const myTeam = gameState.players[mySeat].team;

  return gameState.players[currentWinner].team === myTeam;
}

function getLowestCard(cards: Card[]): Card {
  return cards.reduce((lowest, card) => 
    card.value < lowest.value ? card : lowest
  );
}

function getHighestCard(cards: Card[]): Card {
  return cards.reduce((highest, card) => 
    card.value > highest.value ? card : highest
  );
}

function canWinWithCard(
  card: Card,
  allPlayable: Card[],
  trick: Trick,
  trump: Suit | null
): boolean {
  if (!trump) return false;

  const tempTrick = { ...trick, cards: [...trick.cards, { player: 'right' as SeatPosition, card }] };
  
  const existingWinners = trick.cards.map(c => c.player);
  
  for (const playable of allPlayable) {
    const testTrick = { 
      ...tempTrick, 
      cards: [...tempTrick.cards.filter(c => c.player !== 'right'), { player: 'right' as SeatPosition, card: playable }] 
    };
    const winner = getTrickWinner(testTrick, trump);
    if (winner === 'right') {
      return true;
    }
  }

  return false;
}