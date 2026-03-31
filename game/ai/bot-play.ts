import { Card, Suit } from '../../constants/cards';
import { getPlayableCards, getTrickWinner, Trick } from '../trick';
import { Difficulty, GameState, SeatPosition } from '../types';
import { HIGH_CARD_THRESHOLD } from './bot-bidding';

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
    case 'easy':   return playEasy(playable, trump);
    case 'medium': return playMedium(playable, trick, trump, trumpRevealed, gameState, seat);
    case 'hard':   return playHard(playable, trick, trump, trumpRevealed, gameState, seat);
    default:       return playEasy(playable, trump);
  }
}

// ─── Trump Reveal ─────────────────────────────────────────────────────────────

/**
 * Determines whether a bot's chosen card constitutes a "want to trump"
 * decision, which triggers the trump reveal per game rules.
 *
 * Rule: trump is revealed the first time any player DECLARES INTENT to trump.
 * For bots this means: they are void in the led suit AND they choose to play
 * a trump card (or choose to trump even when holding none).
 *
 * Returns true if the engine should call revealTrump() after this play.
 */
export function botWantsToTrump(
  chosenCard: Card,
  trick: Trick,
  trump: Suit | null,
  trumpRevealed: boolean
): boolean {
  // Already revealed — no action needed
  if (trumpRevealed || trump === null) return false;
  // Bot is following the led suit — not a trump decision
  if (trick.leadSuit && chosenCard.suit === trick.leadSuit) return false;
  // Bot is leading — not a trump decision
  if (!trick.leadSuit) return false;
  // Bot is void in led suit AND chose to play trump → intent to trump
  return chosenCard.suit === trump;
}

// ─── Easy ─────────────────────────────────────────────────────────────────────

/**
 * Easy bot: plays a random card.
 * When void in the led suit it randomly decides whether to trump or discard,
 * modelling the rule that trumping is a voluntary choice even for easy bots.
 */
function playEasy(playable: Card[], trump: Suit | null): Card {
  // If all playable cards are non-trump (either following suit or no trump),
  // just pick randomly — no decision needed.
  const trumpCards    = trump ? playable.filter(c => c.suit === trump) : [];
  const nonTrumpCards = trump ? playable.filter(c => c.suit !== trump) : playable;

  // If hand contains both trump and non-trump options while void in led suit,
  // randomly decide to trump (~40% of the time) or discard.
  if (trumpCards.length > 0 && nonTrumpCards.length > 0) {
    const wantsToTrump = Math.random() < 0.4;
    const pool = wantsToTrump ? trumpCards : nonTrumpCards;
    return pool[Math.floor(Math.random() * pool.length)];
  }

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
  if (!gameState.highestBidder) return playEasy(playable, trump);

  const myTeam         = gameState.players[seat].team;
  const bidderTeam     = gameState.players[gameState.highestBidder].team;
  const isBiddingTeam  = myTeam === bidderTeam;
  const partnerWinning = isMyPartnerWinning(trick, gameState, seat);
  const trickPosition  = getTrickPosition(trick, seat);

  // ── Follow the led suit if possible ──────────────────────────────────────
  // This is always correct and never involves a trump decision.
  const leadSuitCards = trick.leadSuit
    ? playable.filter(c => c.suit === trick.leadSuit)
    : [];

  if (leadSuitCards.length > 0) {
    // Defending or partner winning — play low to preserve hand
    if (!isBiddingTeam || partnerWinning) return getLowestCard(leadSuitCards);
    // 2nd player — play low before seeing partner and opponents
    if (trickPosition === 2) return getLowestCard(leadSuitCards);
    // 3rd / 4th player on bidding team — try to win with highest in suit
    return getHighestCard(leadSuitCards);
  }

  // ── Void in led suit — make the "want to trump?" decision ────────────────
  //
  // Rule: bot may choose to trump OR discard. It is never forced to trump.
  // Bots know their own trump suit even before it is publicly revealed
  // (they either selected it or can infer it). The reveal fires when the
  // engine receives the chosen trump card back from this function.

  const trumpCards    = trump ? playable.filter(c => c.suit === trump) : [];
  const nonTrumpCards = trump ? playable.filter(c => c.suit !== trump) : playable;

  // Defending team: prefer discarding to preserve trump and avoid helping
  // the bidding team reveal information about trump suits early.
  if (!isBiddingTeam) {
    if (nonTrumpCards.length > 0) return getLowestCard(nonTrumpCards);
    // No non-trump left — must play from what remains
    return getLowestCard(playable);
  }

  // Bidding team, partner already winning — discard cheaply, don't trump
  if (partnerWinning) {
    if (nonTrumpCards.length > 0) return getLowestCard(nonTrumpCards);
    return getLowestCard(playable);
  }

  // Bidding team, partner not winning — consider trumping to take the trick
  if (trumpCards.length > 0) {
    // Prefer a high trump to make the play worthwhile
    const highTrumps = trumpCards.filter(c => c.value >= HIGH_CARD_THRESHOLD);
    if (highTrumps.length > 0) return getLowestCard(highTrumps);
    return getLowestCard(trumpCards);
  }

  // No trump in hand — discard cheapest non-trump
  if (nonTrumpCards.length > 0) return getLowestCard(nonTrumpCards);
  return getLowestCard(playable);
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
  if (!gameState.highestBidder) {
    return playMedium(playable, trick, trump, trumpRevealed, gameState, seat);
  }

  const myTeam         = gameState.players[seat].team;
  const bidderTeam     = gameState.players[gameState.highestBidder].team;
  const isBiddingTeam  = myTeam === bidderTeam;
  const partnerWinning = isMyPartnerWinning(trick, gameState, seat);
  const trickPosition  = getTrickPosition(trick, seat);

  // ── Follow the led suit if possible ──────────────────────────────────────
  const leadSuitCards = trick.leadSuit
    ? playable.filter(c => c.suit === trick.leadSuit)
    : [];

  if (leadSuitCards.length > 0) {
    // 4th player: always win cheaply if you can
    if (trickPosition === 4) {
      if (partnerWinning) return getLowestCard(leadSuitCards);
      const winning = leadSuitCards.filter(c => canCardWinTrick(c, trick, trump, seat));
      return winning.length > 0 ? getLowestCard(winning) : getLowestCard(leadSuitCards);
    }
    // 3rd player: try to win for partner
    if (trickPosition === 3) {
      if (partnerWinning) return getLowestCard(leadSuitCards);
      const winning = leadSuitCards.filter(c => canCardWinTrick(c, trick, trump, seat));
      return winning.length > 0 ? getLowestCard(winning) : getLowestCard(leadSuitCards);
    }
    // 2nd player: play low
    if (trickPosition === 2) return getLowestCard(leadSuitCards);
    // 1st player (leading): handled below
  }

  // ── 1st player (leading the trick) ───────────────────────────────────────
  if (trickPosition === 1) {
    return getSmartLead(playable, trump, trumpRevealed, gameState, isBiddingTeam);
  }

  // ── Void in led suit — make the "want to trump?" decision ────────────────
  const trumpCards    = trump ? playable.filter(c => c.suit === trump) : [];
  const nonTrumpCards = trump ? playable.filter(c => c.suit !== trump) : playable;

  // 4th player: trump only if needed to win and partner isn't winning
  if (trickPosition === 4) {
    if (partnerWinning) {
      // Partner wins — cheap discard, avoid trump
      return nonTrumpCards.length > 0
        ? getLowestCard(nonTrumpCards)
        : getLowestCard(playable);
    }
    // Need to win — try trump
    if (trumpCards.length > 0) {
      const winningTrumps = trumpCards.filter(c => canCardWinTrick(c, trick, trump, seat));
      if (winningTrumps.length > 0) return getLowestCard(winningTrumps);
    }
    // Can't win either way — cheapest discard
    return getCheapestDiscard(playable, trump);
  }

  // 3rd player: trump if partner isn't winning and we have trump
  if (trickPosition === 3) {
    if (partnerWinning) {
      return nonTrumpCards.length > 0
        ? getLowestCard(nonTrumpCards)
        : getLowestCard(playable);
    }
    if (trumpCards.length > 0) {
      const winningTrumps = trumpCards.filter(c => canCardWinTrick(c, trick, trump, seat));
      if (winningTrumps.length > 0) return getLowestCard(winningTrumps);
    }
    return getCheapestDiscard(playable, trump);
  }

  // 2nd player: almost never trump — play cheapest discard
  if (trickPosition === 2) {
    return getCheapestDiscard(playable, trump);
  }

  // Fallback
  return getCheapestDiscard(playable, trump);
}

// ─── Hard Bot: Smart Lead ─────────────────────────────────────────────────────

/**
 * Hard bot lead strategy.
 * - Bidding team: lead highest card in longest suit to establish tricks.
 * - Defending team: lead a safe low card to probe without giving away tricks.
 * - Avoid leading trump unless hand is trump-heavy or no other option.
 */
function getSmartLead(
  playable: Card[],
  trump: Suit | null,
  trumpRevealed: boolean,
  gameState: GameState,
  isBiddingTeam: boolean
): Card {
  const nonTrump   = trump ? playable.filter(c => c.suit !== trump) : playable;
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
 * When discarding (can't win or don't want to trump), prefer throwing off the
 * cheapest non-trump card. Only discard a trump if there is nothing else.
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
  if (suitGroups.size === 0) return cards;
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