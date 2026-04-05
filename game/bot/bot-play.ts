import type {
  BotPlayResult,
  Difficulty,
  GameState,
  SeatPosition,
} from '@/types/game-type';
import type { Card, Suit } from '../../constants/cards';
import { getPlayableCards, getTrickWinner, type Trick } from '../trick';
import { HIGH_CARD_THRESHOLD } from './bot-bidding';

// ─── Entry Point ──────────────────────────────────────────────────────────────

/**
 * Returns the card the bot will play, along with whether it intends to reveal
 * trump (wantsToTrump). The store passes wantsToTrump directly to playCard,
 * which is the sole trigger for revealing the trump suit.
 *
 * wantsToTrump is true only when ALL of the following hold:
 *   - trump is still hidden (trumpRevealed === false)
 *   - the bot cannot follow the led suit (void in leadSuit)
 *   - the strategy chose to play a trump card
 *
 * When trump is already revealed, wantsToTrump is always false — the bot
 * simply plays freely, no reveal logic needed.
 */
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
      card = playEasy(playable, trump, trick, trumpRevealed);
      break;
    case 'medium':
      card = playMedium(playable, trick, trump, trumpRevealed, gameState, seat);
      break;
    case 'hard':
      card = playHard(playable, trick, trump, trumpRevealed, gameState, seat);
      break;
    default:
      card = playEasy(playable, trump, trick, trumpRevealed);
      break;
  }

  return {
    card,
    wantsToTrump: botWantsToTrump(card, trick, trump, trumpRevealed),
  };
}

// ─── Trump Reveal ─────────────────────────────────────────────────────────────

/**
 * Determines whether a bot's chosen card constitutes a "want to trump"
 * decision, which triggers the trump reveal per game rules.
 *
 * Rule: trump is revealed the first time any player DECLARES INTENT to trump.
 * For bots: they are void in the led suit AND they chose to play a trump card.
 *
 * This is called inside getBotPlay after the card is selected, so the result
 * is always consistent with the actual card being played.
 */
export function botWantsToTrump(
  chosenCard: Card,
  trick: Trick,
  trump: Suit | null,
  trumpRevealed: boolean,
): boolean {
  // Already revealed — no action needed
  if (trumpRevealed || trump === null) return false;
  // Bot is leading the trick — not a trump decision
  if (!trick.leadSuit) return false;
  // Bot is following the led suit — not a trump decision
  if (chosenCard.suit === trick.leadSuit) return false;
  // Bot is void in led suit AND chose to play trump → intent to trump
  return chosenCard.suit === trump;
}

// ─── Easy ─────────────────────────────────────────────────────────────────────

/**
 * Easy bot: plays a mostly random card.
 * When void in the led suit it randomly decides whether to trump or discard,
 * modelling the rule that trumping is a voluntary choice even for easy bots.
 */
function playEasy(
  playable: Card[],
  trump: Suit | null,
  trick: Trick,
  _trumpRevealed: boolean,
): Card {
  const isVoidInLedSuit =
    trick.leadSuit !== null && !playable.some((c) => c.suit === trick.leadSuit);

  // Only apply the trump/discard split when void in led suit and trump is
  // relevant — otherwise just pick randomly from all playable cards.
  if (isVoidInLedSuit && trump !== null) {
    const trumpCards = playable.filter((c) => c.suit === trump);
    const nonTrumpCards = playable.filter((c) => c.suit !== trump);

    if (trumpCards.length > 0 && nonTrumpCards.length > 0) {
      // Randomly decide to trump (~40% of the time) or discard
      const wantsToTrump = Math.random() < 0.4;
      const pool = wantsToTrump ? trumpCards : nonTrumpCards;
      return pool[Math.floor(Math.random() * pool.length)];
    }
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
  seat: SeatPosition,
): Card {
  if (!gameState.highestBidder)
    return playEasy(playable, trump, trick, trumpRevealed);

  const myTeam = gameState.players[seat].team;
  const bidderTeam = gameState.players[gameState.highestBidder].team;
  const isBiddingTeam = myTeam === bidderTeam;
  const partnerWinning = isMyPartnerWinning(trick, gameState, seat);
  const trickPosition = getTrickPosition(trick);

  // ── Leading the trick ─────────────────────────────────────────────────────
  // Bidding team leads high (aggressive, building toward bid target).
  // Defending team leads low (passive, probing without committing strength).
  if (trickPosition === 1) {
    return isBiddingTeam ? getHighestCard(playable) : getLowestCard(playable);
  }

  // ── Follow the led suit if possible ──────────────────────────────────────
  const leadSuitCards = trick.leadSuit
    ? playable.filter((c) => c.suit === trick.leadSuit)
    : [];

  if (leadSuitCards.length > 0) {
    if (!isBiddingTeam || partnerWinning) return getLowestCard(leadSuitCards);
    if (trickPosition === 2) return getLowestCard(leadSuitCards);
    return getHighestCard(leadSuitCards);
  }

  // ── Void in led suit — make the "want to trump?" decision ────────────────
  const trumpCards = trump ? playable.filter((c) => c.suit === trump) : [];
  const nonTrumpCards = trump
    ? playable.filter((c) => c.suit !== trump)
    : playable;

  // Defending team: prefer discarding to preserve trump
  if (!isBiddingTeam) {
    if (nonTrumpCards.length > 0) return getLowestCard(nonTrumpCards);
    return getLowestCard(playable);
  }

  // Bidding team, partner already winning — discard cheaply, don't trump
  if (partnerWinning) {
    if (nonTrumpCards.length > 0) return getLowestCard(nonTrumpCards);
    return getLowestCard(playable);
  }

  // Bidding team, partner not winning — consider trumping
  if (trumpCards.length > 0) {
    const highTrumps = trumpCards.filter((c) => c.value >= HIGH_CARD_THRESHOLD);
    if (highTrumps.length > 0) return getLowestCard(highTrumps);
    return getLowestCard(trumpCards);
  }

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
  seat: SeatPosition,
): Card {
  if (!gameState.highestBidder) {
    return playMedium(playable, trick, trump, trumpRevealed, gameState, seat);
  }

  const myTeam = gameState.players[seat].team;
  const bidderTeam = gameState.players[gameState.highestBidder].team;
  const isBiddingTeam = myTeam === bidderTeam;
  const partnerWinning = isMyPartnerWinning(trick, gameState, seat);
  const trickPosition = getTrickPosition(trick);

  // ── Follow the led suit if possible ──────────────────────────────────────
  const leadSuitCards = trick.leadSuit
    ? playable.filter((c) => c.suit === trick.leadSuit)
    : [];

  if (leadSuitCards.length > 0) {
    if (trickPosition === 4) {
      if (partnerWinning) return getLowestCard(leadSuitCards);
      const winning = leadSuitCards.filter((c) =>
        canCardWinTrick(c, trick, trump, seat),
      );
      return winning.length > 0
        ? getLowestCard(winning)
        : getLowestCard(leadSuitCards);
    }
    if (trickPosition === 3) {
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

  // ── 1st player (leading the trick) ───────────────────────────────────────
  if (trickPosition === 1) {
    return getSmartLead(
      playable,
      trump,
      trumpRevealed,
      gameState,
      isBiddingTeam,
    );
  }

  // ── Void in led suit — make the "want to trump?" decision ────────────────
  const trumpCards = trump ? playable.filter((c) => c.suit === trump) : [];
  const nonTrumpCards = trump
    ? playable.filter((c) => c.suit !== trump)
    : playable;

  if (trickPosition === 4) {
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

  if (trickPosition === 3) {
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

  if (trickPosition === 2) {
    return getCheapestDiscard(playable, trump);
  }

  return getCheapestDiscard(playable, trump);
}

// ─── Hard Bot: Smart Lead ─────────────────────────────────────────────────────

function getSmartLead(
  playable: Card[],
  trump: Suit | null,
  _trumpRevealed: boolean,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTrickPosition(trick: Trick): 1 | 2 | 3 | 4 {
  const pos = trick.cards.length + 1;
  return Math.min(4, Math.max(1, pos)) as 1 | 2 | 3 | 4;
}

function isMyPartnerWinning(
  trick: Trick,
  gameState: GameState,
  seat: SeatPosition,
): boolean {
  if (trick.cards.length === 0) return false;
  const currentWinner = getTrickWinner(trick, gameState.trumpSuit);
  return gameState.players[currentWinner].team === gameState.players[seat].team;
}

function canCardWinTrick(
  card: Card,
  trick: Trick,
  trump: Suit | null,
  seat: SeatPosition,
): boolean {
  const simulatedTrick: Trick = {
    ...trick,
    leadSuit: trick.leadSuit ?? card.suit,
    cards: [...trick.cards, { player: seat, card }],
  };
  return getTrickWinner(simulatedTrick, trump) === seat;
}

function getCheapestDiscard(playable: Card[], trump: Suit | null): Card {
  const nonTrump = trump ? playable.filter((c) => c.suit !== trump) : playable;
  if (nonTrump.length > 0) return getLowestCard(nonTrump);
  return getLowestCard(playable);
}

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
    group.length > longest.length ? group : longest,
  );
}

function getLowestCard(cards: Card[]): Card {
  return cards.reduce((lowest, card) =>
    card.value < lowest.value ? card : lowest,
  );
}

function getHighestCard(cards: Card[]): Card {
  return cards.reduce((highest, card) =>
    card.value > highest.value ? card : highest,
  );
}
