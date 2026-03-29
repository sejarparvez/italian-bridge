import { beforeEach, describe, expect, it } from 'bun:test';
import { Card, Suit } from '../../constants/cards';
import {
    createDeck,
    dealCards,
    dealRemainingCards,
    shuffleDeck,
} from '../../game/deck';
import { advanceToNextRound, createInitialState, selectTrump } from '../../game/engine';
import { calculateRoundScores } from '../../game/scoring';
import { getPlayableCards, getTrickWinner } from '../../game/trick';

describe('deck.ts', () => {
  it('creates 52 unique cards', () => {
    const deck = createDeck();
    expect(deck.length).toBe(52);
    const ids = deck.map((c: Card) => c.id);
    expect(new Set(ids).size).toBe(52);
  });

  it('shuffles changes order', () => {
    const deck1 = createDeck();
    const deck2 = shuffleDeck([...deck1]);
    const sameOrder = deck1.every((c: Card, i: number) => c.id === deck2[i]!.id);
    expect(sameOrder).toBe(false);
  });

  it('deals 5 cards to each player', () => {
    const deck = createDeck();
    const dealt = dealCards(deck, 5);
    expect(dealt.bottom.length).toBe(5);
    expect(dealt.top.length).toBe(5);
    expect(dealt.left.length).toBe(5);
    expect(dealt.right.length).toBe(5);
  });

  it('deals remaining cards correctly', () => {
    const deck = createDeck();
    const firstDeal = dealCards(deck, 5);
    const fullDeal = dealRemainingCards(deck, firstDeal);
    expect(fullDeal.bottom.length).toBe(13);
    expect(fullDeal.top.length).toBe(13);
    expect(fullDeal.left.length).toBe(13);
    expect(fullDeal.right.length).toBe(13);
  });
});

describe('trick.ts', () => {
  it('highest trump wins', () => {
    const trick = {
      cards: [
        { player: 'bottom' as const, card: { id: '1', suit: 'hearts' as Suit, rank: 'A', value: 14 } },
        { player: 'top' as const, card: { id: '2', suit: 'hearts' as Suit, rank: 'K', value: 13 } },
        { player: 'left' as const, card: { id: '3', suit: 'spades' as Suit, rank: 'A', value: 14 } },
        { player: 'right' as const, card: { id: '4', suit: 'hearts' as Suit, rank: '10', value: 10 } },
      ],
      leadSuit: 'hearts' as Suit,
      winningSeat: null,
    };
    const winner = getTrickWinner(trick, 'hearts');
    expect(winner).toBe('bottom');
  });

  it('highest lead-suit wins when no trump', () => {
    const trick = {
      cards: [
        { player: 'bottom' as const, card: { id: '1', suit: 'spades' as Suit, rank: 'A', value: 14 } },
        { player: 'top' as const, card: { id: '2', suit: 'spades' as Suit, rank: 'K', value: 13 } },
        { player: 'left' as const, card: { id: '3', suit: 'hearts' as Suit, rank: 'A', value: 14 } },
        { player: 'right' as const, card: { id: '4', suit: 'hearts' as Suit, rank: '10', value: 10 } },
      ],
      leadSuit: 'spades' as Suit,
      winningSeat: null,
    };
    const winner = getTrickWinner(trick, null);
    expect(winner).toBe('bottom');
  });

  it('returns playable cards - must follow suit', () => {
    const hand: Card[] = [
      { id: '1', suit: 'spades', rank: 'A', value: 14 },
      { id: '2', suit: 'hearts', rank: 'K', value: 13 },
      { id: '3', suit: 'clubs', rank: 'Q', value: 12 },
    ];
    const trick = {
      cards: [{ player: 'bottom' as const, card: { id: 'x', suit: 'spades' as Suit, rank: '10', value: 10 } }],
      leadSuit: 'spades' as Suit,
      winningSeat: null,
    };
    const playable = getPlayableCards(hand, trick, null);
    expect(playable.length).toBe(1);
    expect(playable[0]!.suit).toBe('spades');
  });

  it('returns all cards when void in lead suit', () => {
    const hand: Card[] = [
      { id: '1', suit: 'hearts', rank: 'A', value: 14 },
      { id: '2', suit: 'diamonds', rank: 'K', value: 13 },
    ];
    const trick = {
      cards: [{ player: 'bottom' as const, card: { id: 'x', suit: 'spades' as Suit, rank: '10', value: 10 } }],
      leadSuit: 'spades' as Suit,
      winningSeat: null,
    };
    const playable = getPlayableCards(hand, trick, null);
    expect(playable.length).toBe(2);
  });
});

describe('scoring.ts', () => {
  it('bid met - positive score', () => {
    const players = {
      bottom: { id: 'bottom', name: 'You', seat: 'bottom', team: 'BT', isHuman: true, hand: [], bid: 8, tricksTaken: 9 },
      top: { id: 'top', name: 'Alex', seat: 'top', team: 'BT', isHuman: false, hand: [], bid: 7, tricksTaken: 4 },
      left: { id: 'left', name: 'Jordan', seat: 'left', team: 'LR', isHuman: false, hand: [], bid: null, tricksTaken: 2 },
      right: { id: 'right', name: 'Sam', seat: 'right', team: 'LR', isHuman: false, hand: [], bid: null, tricksTaken: 1 },
    };
    const scores = calculateRoundScores(players, 8, 'bottom');
    const btScore = scores.find((s) => s.team === 'BT');
    expect(btScore?.points).toBe(8);
  });

  it('bid failed - negative score', () => {
    const players = {
      bottom: { id: 'bottom', name: 'You', seat: 'bottom' as const, team: 'BT' as const, isHuman: true, hand: [], bid: 8, tricksTaken: 6 },
      top: { id: 'top', name: 'Alex', seat: 'top' as const, team: 'BT' as const, isHuman: false, hand: [], bid: 7, tricksTaken: 1 },
      left: { id: 'left', name: 'Jordan', seat: 'left' as const, team: 'LR' as const, isHuman: false, hand: [], bid: null, tricksTaken: 4 },
      right: { id: 'right', name: 'Sam', seat: 'right' as const, team: 'LR' as const, isHuman: false, hand: [], bid: null, tricksTaken: 2 },
    };
    const scores = calculateRoundScores(players, 8, 'bottom');
    const btScore = scores.find((s) => s.team === 'BT');
    expect(btScore?.points).toBe(-8);
  });

  it('bid 10 met gives +13 with bonus', () => {
    const players = {
      bottom: { id: 'bottom', name: 'You', seat: 'bottom', team: 'BT', isHuman: true, hand: [], bid: 10, tricksTaken: 10 },
      top: { id: 'top', name: 'Alex', seat: 'top', team: 'BT', isHuman: false, hand: [], bid: 7, tricksTaken: 0 },
      left: { id: 'left', name: 'Jordan', seat: 'left', team: 'LR', isHuman: false, hand: [], bid: null, tricksTaken: 3 },
      right: { id: 'right', name: 'Sam', seat: 'right', team: 'LR', isHuman: false, hand: [], bid: null, tricksTaken: 0 },
    };
    const scores = calculateRoundScores(players, 10, 'bottom');
    const btScore = scores.find((s) => s.team === 'BT');
    expect(btScore?.points).toBe(13);
  });

  it('opponents get -4 when they fail to get 4 tricks', () => {
    const players = {
      bottom: { id: 'bottom', name: 'You', seat: 'bottom', team: 'BT', isHuman: true, hand: [], bid: 8, tricksTaken: 8 },
      top: { id: 'top', name: 'Alex', seat: 'top', team: 'BT', isHuman: false, hand: [], bid: 7, tricksTaken: 0 },
      left: { id: 'left', name: 'Jordan', seat: 'left', team: 'LR', isHuman: false, hand: [], bid: null, tricksTaken: 2 },
      right: { id: 'right', name: 'Sam', seat: 'right', team: 'LR', isHuman: false, hand: [], bid: null, tricksTaken: 1 },
    };
    const scores = calculateRoundScores(players, 8, 'bottom');
    const lrScore = scores.find((s) => s.team === 'LR');
    expect(lrScore?.points).toBe(-4);
  });
});

describe('engine.ts', () => {
  let state: ReturnType<typeof createInitialState>;

  beforeEach(() => {
    state = createInitialState();
  });

  it('creates initial state with 5 cards each', () => {
    expect(state.players.bottom.hand.length).toBe(5);
    expect(state.players.top.hand.length).toBe(5);
    expect(state.players.left.hand.length).toBe(5);
    expect(state.players.right.hand.length).toBe(5);
  });

  it('starts in bidding phase', () => {
    expect(state.phase).toBe('bidding');
  });

  it('can select trump and move to playing', () => {
    const newState = selectTrump(state, 'hearts');
    expect(newState.trumpSuit).toBe('hearts');
    expect(newState.phase).toBe('playing');
  });

  it('advances to next round', () => {
    const nextState = advanceToNextRound(state);
    expect(nextState.round).toBe(2);
    expect(nextState.players.bottom.hand.length).toBe(5);
  });
});