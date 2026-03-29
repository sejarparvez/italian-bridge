import { Card, Suit } from '../../constants/cards';
import { getPlayableCards, getTrickWinner, Trick } from '../trick';
import { Difficulty, GameState, SeatPosition } from '../types';
import { HIGH_CARD_THRESHOLD } from './bidAI';

// ─── Entry Point ──────────────────────────────────────────────────────────────

export function getBotPlay(
  hand: Card[],
  trick: Trick,
  trump: Suit | null,
  trumpRevealed: boolean,
  gameState: GameState,
  difficulty: Difficulty,
  seat: SeatPosition
): Card | null {
  const playable = getPlayableCards(hand, trick, trump, trumpRevealed);
  if (playable.length === 0) return null;

  switch (difficulty) {
    case 'easy':   return playEasy(playable);
    case 'medium': return playMedium(playable, trick, trump, trumpRevealed, gameState, seat);
    case 'hard':   return playHard(playable, trick, trump, trumpRevealed, gameState, seat);
    default:       return playEasy(playable);
  }
}

// ─── Easy ─────────────────────────────────────────────────────────────────────

function playEasy(playable: Card[]): Card {
  return playable[Math.floor(Math.random() * playable.length)];
}

// ─── Medium ───────────────────────────────────────────────────────────────────

function playMedium(
  playable: Card[],
  trick: Trick,
  trump: Suit | null,
  trumpRevealed: boolean,
  gameState: GameState,
  seat: SeatPosition
): Card {
  if (!gameState.highestBidder) return playEasy(playable);

  const myTeam        = gameState.players[seat].team;
  const bidderTeam    = gameState.players[gameState.highestBidder].team;
  const isBiddingTeam = myTeam === bidderTeam;
  const partnerWinning = isMyPartnerWinning(trick, gameState, seat);
  const trickPosition  = getTrickPosition(trick, seat);

  // Defending or partner is already winning — play low to preserve hand
  if (!isBiddingTeam || partnerWinning) {
    return getLowestCard(playable);
  }

  // 2nd player: generally play low (don't commit high cards before seeing others)
  if (trickPosition === 2) {
    return getLowestCard(playable);
  }

  // Follow lead suit first — trump is only an option when void in lead suit
  const leadSuitCards = trick.leadSuit
    ? playable.filter(c => c.suit === trick.leadSuit)
    : [];

  if (leadSuitCards.length > 0) {
    // 3rd or 4th player: try to win with highest in suit
    return getHighestCard(leadSuitCards);
  }

  // Void in lead suit — now consider trumping
  // FIX: trump block moved after follow-suit check. Playing trump when you
  // can follow suit is both illegal in many variants and always bad strategy.
  if (trump !== null && trumpRevealed) {
    const trumpsInHand = playable.filter(c => c.suit === trump);
    if (trumpsInHand.length > 0) {
      // FIX: threshold corrected to HIGH_CARD_THRESHOLD (11 = Jack).
      // Previous code used 12 (Queen), incorrectly excluding Jacks.
      const highTrumps = trumpsInHand.filter(c => c.value >= HIGH_CARD_THRESHOLD);
      if (highTrumps.length > 0) return getLowestCard(highTrumps);
      return getLowestCard(trumpsInHand);
    }
  }

  // Leading the trick (no lead suit yet) — play highest card
  return getHighestCard(playable);
}

// ─── Hard ─────────────────────────────────────────────────────────────────────

function playHard(
  playable: Card[],
  trick: Trick,
  trump: Suit | null,
  trumpRevealed: boolean,
  gameState: GameState,
  seat: SeatPosition
): Card {
  if (!gameState.highestBidder) return playMedium(playable, trick, trump, trumpRevealed, gameState, seat);

  const myTeam         = gameState.players[seat].team;
  const bidderTeam     = gameState.players[gameState.highestBidder].team;
  const isBiddingTeam  = myTeam === bidderTeam;
  const partnerWinning = isMyPartnerWinning(trick, gameState, seat);
  const trickPosition  = getTrickPosition(trick, seat);

  // ── 4th player: always win if you can (last to play, no risk) ──
  if (trickPosition === 4) {
    if (partnerWinning) return getLowestCard(playable); // partner wins — don't waste high cards
    const winningCards = playable.filter(c => canCardWinTrick(c, trick, trump, seat));
    if (winningCards.length > 0) return getLowestCard(winningCards);
    return getLowestCard(playable); // can't win — discard cheapest
  }

  // ── 3rd player: try to win for partner ──
  if (trickPosition === 3) {
    if (partnerWinning) return getLowestCard(playable);
    const winningCards = playable.filter(c => canCardWinTrick(c, trick, trump, seat));
    if (winningCards.length > 0) return getLowestCard(winningCards);
    // Can't win — discard cheapest non-trump if possible
    return getCheapestDiscard(playable, trump);
  }

  // ── 2nd player: play low (don't commit before seeing partner and opponents) ──
  if (trickPosition === 2) {
    return getLowestCard(playable);
  }

  // ── 1st player (leading): use remaining card knowledge for smart leads ──
  return getSmartLead(playable, trump, trumpRevealed, gameState, isBiddingTeam);
}

// ─── Hard Bot: Smart Lead ─────────────────────────────────────────────────────

/**
 * Hard bot lead strategy.
 * - Bidding team: lead highest card in longest suit to establish tricks.
 * - Defending team: lead a safe low card to probe without giving away tricks.
 * - If trump is revealed, avoid leading trump unless hand is trump-heavy.
 */
function getSmartLead(
  playable: Card[],
  trump: Suit | null,
  trumpRevealed: boolean,
  gameState: GameState,
  isBiddingTeam: boolean
): Card {
  // Separate trump and non-trump cards
  const nonTrump = trump ? playable.filter(c => c.suit !== trump) : playable;
  const trumpCards = trump ? playable.filter(c => c.suit === trump) : [];

  if (isBiddingTeam) {
    // Lead from longest non-trump suit to establish tricks
    if (nonTrump.length > 0) {
      const longestSuitCards = getLongestSuitCards(nonTrump, trump);
      return getHighestCard(longestSuitCards);
    }
    // Only trump left — lead lowest trump
    return getLowestCard(trumpCards);
  } else {
    // Defending: lead safe low card, avoid trump unless it's all we have
    if (nonTrump.length > 0) return getLowestCard(nonTrump);
    return getLowestCard(trumpCards);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns which position in the trick this seat is playing (1st, 2nd, 3rd, 4th).
 * 1 = leading the trick, 4 = last to play.
 */
function getTrickPosition(trick: Trick, seat: SeatPosition): 1 | 2 | 3 | 4 {
  const pos = trick.cards.length + 1;
  return Math.min(4, Math.max(1, pos)) as 1 | 2 | 3 | 4;
}

/**
 * Returns true if the current trick winner is on the same team as `seat`.
 */
function isMyPartnerWinning(trick: Trick, gameState: GameState, seat: SeatPosition): boolean {
  if (trick.cards.length === 0) return false;
  const currentWinner = getTrickWinner(trick, gameState.trumpSuit);
  return gameState.players[currentWinner].team === gameState.players[seat].team;
}

/**
 * Simulates playing `card` and checks if `seat` would win the trick.
 */
function canCardWinTrick(
  card: Card,
  trick: Trick,
  trump: Suit | null,
  seat: SeatPosition
): boolean {
  const simulatedTrick: Trick = {
    ...trick,
    leadSuit: trick.leadSuit ?? card.suit,
    cards: [...trick.cards, { player: seat, card }],
  };
  return getTrickWinner(simulatedTrick, trump) === seat;
}

/**
 * When discarding (can't win), prefer throwing off the cheapest non-trump card.
 * Only discard a trump if there's nothing else to play.
 */
function getCheapestDiscard(playable: Card[], trump: Suit | null): Card {
  const nonTrump = trump ? playable.filter(c => c.suit !== trump) : playable;
  if (nonTrump.length > 0) return getLowestCard(nonTrump);
  return getLowestCard(playable);
}

/**
 * Returns the cards from the longest non-trump suit in the playable hand.
 * Used by hard bot to lead from its strongest established suit.
 */
function getLongestSuitCards(cards: Card[], trump: Suit | null): Card[] {
  const suitGroups = new Map<Suit, Card[]>();
  for (const card of cards) {
    if (card.suit === trump) continue;
    const group = suitGroups.get(card.suit) ?? [];
    group.push(card);
    suitGroups.set(card.suit, group);
  }
  if (suitGroups.size === 0) return cards; // fallback
  return [...suitGroups.values()].reduce((longest, group) =>
    group.length > longest.length ? group : longest
  );
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