import type { Card, Suit } from '@/constants/cards';
import type {
  BotPlayResult,
  Difficulty,
  GameState,
  SeatPosition,
} from '@/types/game-type';
import { getPlayableCards, type Trick } from '../trick';
import { playEasy, playHard } from './strategies';

export function getBotPlay(
  hand: Card[],
  trick: Trick,
  trump: Suit | null,
  trumpRevealed: boolean,
  gameState: GameState,
  difficulty: Difficulty,
  seat: SeatPosition,
): BotPlayResult | null {
  const playable = getPlayableCards(hand, trick, trump, trumpRevealed);
  if (playable.length === 0) return null;

  let card: Card;
  switch (difficulty) {
    case 'easy':
      card = playEasy(playable, trump, trick);
      break;
    case 'hard':
      card = playHard(playable, trick, trump, trumpRevealed, gameState, seat);
      break;
    default:
      card = playHard(playable, trick, trump, trumpRevealed, gameState, seat);
      break;
  }

  return {
    card,
    wantsToTrump: botWantsToTrump(card, trick, trump, trumpRevealed),
  };
}

export function botWantsToTrump(
  chosenCard: Card,
  trick: Trick,
  trump: Suit | null,
  trumpRevealed: boolean,
): boolean {
  if (trumpRevealed || trump === null) return false;
  if (!trick.leadSuit) return false;
  if (chosenCard.suit === trick.leadSuit) return false;
  return chosenCard.suit === trump;
}
