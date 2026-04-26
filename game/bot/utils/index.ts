import type { Card, Suit } from '@/constants/cards';
import type { GameState, SeatPosition, Trick } from '@/types/game-type';
import { getTrickWinner } from '../../trick';

export function getTrickPosition(trick: Trick): 1 | 2 | 3 | 4 {
  const pos = trick.cards.length + 1;
  return Math.min(4, Math.max(1, pos)) as 1 | 2 | 3 | 4;
}

export function isMyPartnerWinning(
  trick: Trick,
  gameState: GameState,
  seat: SeatPosition,
): boolean {
  if (trick.cards.length === 0) return false;
  const currentWinner = getTrickWinner(
    trick,
    gameState.trumpSuit,
    gameState.trumpRevealed,
  );
  return gameState.players[currentWinner].team === gameState.players[seat].team;
}

export function canCardWinTrick(
  card: Card,
  trick: Trick,
  trump: Suit | null,
  trumpRevealed: boolean,
  seat: SeatPosition,
): boolean {
  const simulatedTrick: Trick = {
    ...trick,
    leadSuit: trick.leadSuit ?? card.suit,
    cards: [...trick.cards, { player: seat, card }],
  };
  return getTrickWinner(simulatedTrick, trump, trumpRevealed) === seat;
}

export function getCheapestDiscard(playable: Card[], trump: Suit | null): Card {
  const nonTrump = trump ? playable.filter((c) => c.suit !== trump) : playable;
  if (nonTrump.length > 0) return getLowestCard(nonTrump);
  return getLowestCard(playable);
}

export function getLowestCard(cards: Card[]): Card {
  return cards.reduce((lowest, card) =>
    card.value < lowest.value ? card : lowest,
  );
}

export function getHighestCard(cards: Card[]): Card {
  return cards.reduce((highest, card) =>
    card.value > highest.value ? card : highest,
  );
}

export function getLongestSuitCards(cards: Card[], trump: Suit | null): Card[] {
  const suitGroups = new Map<Suit, Card[]>();
  for (const card of cards) {
    if (card.suit === trump) continue;
    const group = suitGroups.get(card.suit) ?? [];
    group.push(card);
    suitGroups.set(card.suit, group);
  }
  if (suitGroups.size === 0) return cards;
  return [...suitGroups.values()].reduce((longest, group) =>
    group.length > longest.length ? group : longest,
  );
}

// ─── New utils — append these to the bottom of your existing utils.ts ────────

import { ALL_RANKS } from '@/constants/cards';

/**
 * Returns the cards from `cards` that belong to the shortest non-trump suit.
 * Used to find singleton leads — deliberately going void to get trump entries.
 * Falls back to the full card list if all suits are equally short.
 */
export function getShortestSuitCards(
  cards: Card[],
  trump: Suit | null,
): Card[] {
  const suitGroups = new Map<Suit, Card[]>();
  for (const card of cards) {
    if (card.suit === trump) continue;
    const group = suitGroups.get(card.suit) ?? [];
    group.push(card);
    suitGroups.set(card.suit, group);
  }
  if (suitGroups.size === 0) return cards;
  return [...suitGroups.values()].reduce((shortest, group) =>
    group.length < shortest.length ? group : shortest,
  );
}

/**
 * Counts how many trump cards are still unplayed in the entire game
 * (i.e. not yet seen in any completed trick or the current trick).
 * Uses the pre-derived `unplayedCardIds` set from buildContext to avoid
 * recomputing every call.
 */
export function countTrumpsRemaining(
  trump: Suit | null,
  unplayedCardIds: Set<string>,
): number {
  if (!trump) return 0;
  let count = 0;
  for (const rank of ALL_RANKS) {
    if (unplayedCardIds.has(`${rank}-${trump}`)) count++;
  }
  return count;
}

/**
 * Returns true if the bot holds the highest trump card that has not yet
 * been played. Used to decide whether it is safe to lead trump or overtrump
 * without being beaten by a higher trump from an opponent.
 */
export function holdingHighestRemainingTrump(
  hand: Card[],
  trump: Suit | null,
  unplayedCardIds: Set<string>,
): boolean {
  if (!trump) return false;

  // Find the highest rank still unplayed in the trump suit
  // ALL_RANKS is ordered A → 2 (high to low), so first match is the highest live trump
  for (const rank of ALL_RANKS) {
    const id = `${rank}-${trump}`;
    if (unplayedCardIds.has(id)) {
      // Is this card in our hand?
      return hand.some((c) => c.id === id);
    }
  }
  return false;
}

// ─── New utils — append these to the bottom of your existing utils.ts ─────────
// (keep existing imports at the top of utils.ts — these functions use types
//  already imported there: Card, Suit, Trick, TrickCard, SeatPosition, GameState)

// ─── Partner seat ─────────────────────────────────────────────────────────────

/**
 * Returns the seat directly across from `seat`.
 * Teams: bottom+top (BT) and left+right (LR).
 */
export function getPartnerSeat(seat: SeatPosition): SeatPosition {
  const partners: Record<SeatPosition, SeatPosition> = {
    bottom: 'top',
    top: 'bottom',
    left: 'right',
    right: 'left',
  };
  return partners[seat];
}

// ─── Partner trump spend tracker ──────────────────────────────────────────────

/**
 * Counts how many trump cards our partner has already played this round.
 * Derived from completedTricks — every card is visible in the trick history.
 * Used to refine the opponent trump estimate:
 *   opponentTrumps ≈ trumpsRemaining − myTrumpCount − partnerTrumpsSpent
 */
export function countPartnerTrumpsSpent(
  completedTricks: Trick[],
  partnerSeat: SeatPosition,
  trump: Suit | null,
): number {
  if (!trump) return 0;
  let count = 0;
  for (const trick of completedTricks) {
    for (const tc of trick.cards) {
      if (tc.player === partnerSeat && tc.card.suit === trump) {
        count++;
      }
    }
  }
  return count;
}

// ─── Partner lead signal ──────────────────────────────────────────────────────

/**
 * Finds the suit our partner led in the most recent completed trick that was
 * won by our team. This is the "signal" suit — partner showed strength there
 * and we should continue it when leading.
 *
 * Conditions for a valid signal:
 *   1. The trick was won by our team (either us or partner)
 *   2. The first card in that trick was played by partner (they led it)
 *   3. The led suit is not trump (trump leads are extraction, not signals)
 *
 * Returns null if no such trick exists or the signal suit is trump.
 */
export function getPartnerLastLedSuit(
  completedTricks: Trick[],
  partnerSeat: SeatPosition,
  myTeam: 'BT' | 'LR',
  gameState: GameState,
): Suit | null {
  for (let i = completedTricks.length - 1; i >= 0; i--) {
    const trick = completedTricks[i];

    if (!trick.winningSeat) continue;
    if (gameState.players[trick.winningSeat].team !== myTeam) continue;

    if (trick.cards.length === 0) continue;
    if (trick.cards[0].player !== partnerSeat) continue;

    const ledSuit = trick.leadSuit;
    if (!ledSuit || ledSuit === gameState.trumpSuit) continue;

    return ledSuit;
  }
  return null;
}

// ─── Opponent trump detection ─────────────────────────────────────────────────

/**
 * Returns true if the current trick winner is an opponent AND they won it
 * by playing a trump card.
 *
 * Used to detect the overtrump scenario:
 *   - Opponent ruffs with a small trump
 *   - We hold a higher trump and trump is already revealed
 *   - We should overtrump to steal the trick back
 *
 * Only call this when trumpRevealed is true.
 */
export function isOpponentWinningWithTrump(
  trick: Trick,
  trump: Suit | null,
  gameState: GameState,
  seat: SeatPosition,
): boolean {
  if (!trump || trick.cards.length === 0) return false;

  const trumpCards = trick.cards.filter((tc) => tc.card.suit === trump);
  if (trumpCards.length === 0) return false;

  const winningTrickCard = trumpCards.reduce((best, curr) =>
    curr.card.value > best.card.value ? curr : best,
  );

  const winnerTeam = gameState.players[winningTrickCard.player].team;
  const myTeam = gameState.players[seat].team;

  return winnerTeam !== myTeam;
}
