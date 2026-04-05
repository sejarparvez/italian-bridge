import type { SeatPosition } from '@/types/game-type';
import type { Card, Suit } from '../constants/cards';
import { logger } from '../utils/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrickCard {
  player: SeatPosition;
  card: Card;
}

export interface Trick {
  cards: TrickCard[];
  leadSuit: Suit | null;
  winningSeat: SeatPosition | null;
}

// ─── Trick Management ─────────────────────────────────────────────────────────

export function createEmptyTrick(): Trick {
  return {
    cards: [],
    leadSuit: null,
    winningSeat: null,
  };
}

export function addCardToTrick(
  trick: Trick,
  player: SeatPosition,
  card: Card,
): Trick {
  logger.debug(
    'Trick',
    `addCardToTrick: player=${player}, card=${card.id}, trickCards=${trick.cards.length}`,
  );

  // Guard: prevent duplicate players in the same trick
  if (trick.cards.some((tc) => tc.player === player)) {
    logger.error(
      'Trick',
      `Player '${player}' has already played in this trick`,
    );
    throw new Error(`Player '${player}' has already played in this trick.`);
  }

  // Guard: prevent more than 4 cards in a trick
  if (trick.cards.length >= 4) {
    logger.error('Trick', 'Trick is already complete');
    throw new Error('Trick is already complete — cannot add more cards.');
  }

  // Lead suit is set by the first card played and never changes
  const leadSuit = trick.leadSuit ?? card.suit;
  logger.debug('Trick', `Lead suit set: ${leadSuit}`);

  return {
    ...trick,
    cards: [...trick.cards, { player, card }],
    leadSuit,
  };
}

// ─── Trick Winner ─────────────────────────────────────────────────────────────

/**
 * Determines the winner of a completed trick.
 *
 * Rules:
 * - If any trump cards were played, the highest trump wins.
 * - Otherwise, the highest card of the lead suit wins.
 * - Off-suit, non-trump cards can never win.
 *
 * @throws if the trick has no cards (no winner possible).
 * @throws if no lead suit cards are found (data integrity error).
 */
export function getTrickWinner(trick: Trick, trump: Suit | null): SeatPosition {
  logger.debug(
    'Trick',
    `getTrickWinner: cards=${trick.cards.length}, trump=${trump}`,
  );

  if (trick.cards.length === 0) {
    logger.error('Trick', 'Cannot determine winner of an empty trick');
    throw new Error('Cannot determine winner of an empty trick.');
  }

  // Trump cards beat all non-trump; highest trump wins
  if (trump !== null) {
    const trumpCards = trick.cards.filter((tc) => tc.card.suit === trump);
    if (trumpCards.length > 0) {
      const winner = highestCard(trumpCards).player;
      logger.debug('Trick', `Trick winner (trump): ${winner}`);
      return winner;
    }
  }

  // No trump played — highest card of lead suit wins
  if (trick.leadSuit === null) {
    logger.error('Trick', 'Trick has cards but no lead suit');
    throw new Error('Trick has cards but no lead suit — data integrity error.');
  }

  const leadSuitCards = trick.cards.filter(
    (tc) => tc.card.suit === trick.leadSuit,
  );

  if (leadSuitCards.length === 0) {
    throw new Error(
      `No cards found for lead suit '${trick.leadSuit}' — data integrity error.`,
    );
  }

  return highestCard(leadSuitCards).player;
}

// ─── Playable Cards ───────────────────────────────────────────────────────────

/**
 * Returns the subset of cards in `hand` that are legal to play.
 *
 * Rules:
 * 1. Leading the trick: any card is playable.
 * 2. Has cards in the led suit: must follow suit — only those cards are playable.
 * 3. Void in led suit, NOT wanting to trump: any card is playable (player is
 *    free to discard any suit, including trump if that's all they have).
 * 4. Void in led suit, HAS declared intent to trump (`wantsToTrump = true`):
 *    - If the hand contains trump cards → only trump cards are playable.
 *      The player committed to trumping; they cannot back out by playing
 *      a non-trump card while holding one.
 *    - If the hand contains NO trump cards → any card is playable.
 *      The player wanted to trump but is genuinely void in trump too.
 *
 * The trump reveal itself is handled by the engine (`wantsToTrump` flag on
 * `playCard`), not here. This function only enforces what cards are legal
 * given the declared intent.
 */
export function getPlayableCards(
  hand: Card[],
  trick: Trick,
  trump: Suit | null,
  _trumpRevealed: boolean,
  wantsToTrump = false,
): Card[] {
  // Leading — all cards are playable
  if (trick.cards.length === 0) return hand;

  if (trick.leadSuit === null) {
    // Shouldn't happen if addCardToTrick is used correctly, but fail safely
    return hand;
  }

  const leadSuitCards = hand.filter((c) => c.suit === trick.leadSuit);

  if (leadSuitCards.length > 0) {
    // Player has cards in lead suit — must follow suit regardless of intent
    return leadSuitCards;
  }

  // ── Void in led suit ──────────────────────────────────────────────────────

  // Player declared intent to trump — enforce the commitment if they hold trump
  // FIX: previously the function returned the full hand when void, with no
  // regard for whether the player had committed to trumping. This allowed a
  // player to say "I want to trump" and then legally play a non-trump discard
  // while holding trump cards — violating the rule:
  // "If they have it, they must play it."
  if (wantsToTrump && trump !== null) {
    const trumpCards = hand.filter((c) => c.suit === trump);
    if (trumpCards.length > 0) {
      // Has trump — only trump cards are legal
      return trumpCards;
    }
    // Wanted to trump but holds no trump — any card is playable
    return hand;
  }

  // Player is void but did NOT declare intent to trump — any card is playable
  // (they may freely discard any suit, including accidentally holding trump)
  return hand;
}

// ─── Card Validation ──────────────────────────────────────────────────────────

/**
 * Returns true if `card` is a legal play given the current hand, trick,
 * trump state, and the player's declared intent.
 *
 * `wantsToTrump` must match the value passed to `playCard` in the engine —
 * both must agree on whether the player has declared trump intent this turn.
 */
export function isValidCard(
  card: Card,
  hand: Card[],
  trick: Trick,
  trump: Suit | null,
  trumpRevealed: boolean,
  wantsToTrump = false,
): boolean {
  // Card must actually be in the player's hand
  if (!hand.some((c) => c.id === card.id)) return false;

  const playable = getPlayableCards(
    hand,
    trick,
    trump,
    trumpRevealed,
    wantsToTrump,
  );
  return playable.some((c) => c.id === card.id);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the TrickCard with the highest card value from a non-empty array.
 * Uses `card.value` (pre-resolved in createDeck) instead of re-resolving rank.
 */
function highestCard(cards: TrickCard[]): TrickCard {
  return cards.reduce((best, curr) =>
    curr.card.value > best.card.value ? curr : best,
  );
}
