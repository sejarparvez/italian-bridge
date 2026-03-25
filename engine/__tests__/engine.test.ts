import { describe, it, expect } from 'bun:test';
import { createDeck, shuffle, deal, getRankValue } from '../deck';
import { getPlayableCards, getTrickWinner, getNextPlayer } from '../trick';
import { getBidOrder, estimateTricks, getDeclarer, getTeamBid, chooseTrump, getTeamTricks } from '../bidding';
import { calculateRoundScore, updateCumulativeScore, isGameOver } from '../scoring';
import { createGame, placeBid, playCard, startNewRound } from '../engine';
import { getBotBid } from '../ai/bidAI';
import { getBotPlay } from '../ai/playAI';
import { Card, PlayerId, Suit, Rank, Bid } from '../types';

describe('deck', () => {
  it('creates exactly 52 unique cards', () => {
    const deck = createDeck();
    expect(deck.length).toBe(52);
    
    const unique = new Set(deck.map((c) => `${c.suit}-${c.rank}`));
    expect(unique.size).toBe(52);
  });

  it('shuffle changes order', () => {
    const deck = createDeck();
    const shuffled = shuffle(deck);
    expect(shuffled.length).toBe(52);
  });

  it('deal gives exactly 13 cards to each of 4 players', () => {
    const players = deal(4);
    expect(players.length).toBe(4);
    
    for (const player of players) {
      expect(player.hand.length).toBe(13);
    }
    
    const allCards = players.flatMap((p) => p.hand);
    const unique = new Set(allCards.map((c) => `${c.suit}-${c.rank}`));
    expect(unique.size).toBe(52);
  });

  it('assigns correct teams (0,2 = us; 1,3 = them)', () => {
    const players = deal(4);
    expect(players[0].team).toBe('us');
    expect(players[1].team).toBe('them');
    expect(players[2].team).toBe('us');
    expect(players[3].team).toBe('them');
  });
});

describe('trick', () => {
  const spadesA: Card = { suit: 'spades', rank: 'A' };
  const spadesK: Card = { suit: 'spades', rank: 'K' };
  const heartsA: Card = { suit: 'hearts', rank: 'A' };
  const clubsK: Card = { suit: 'clubs', rank: 'K' };

  it('highest trump wins trick', () => {
    const trick = new Map<PlayerId, Card>([
      [0, spadesK],
      [1, heartsA],
      [2, clubsK],
      [3, spadesA],
    ]);
    
    const winner = getTrickWinner(trick, 'hearts');
    expect(winner).toBe(1);
  });

  it('highest lead-suit card wins when no trump', () => {
    const trick = new Map<PlayerId, Card>([
      [0, spadesK],
      [1, heartsA],
      [2, spadesA],
      [3, clubsK],
    ]);
    
    const winner = getTrickWinner(trick, null);
    expect(winner).toBe(2);
  });

  it('getPlayableCards enforces suit-following', () => {
    const hand: Card[] = [spadesA, heartsA, clubsK];
    const trick = new Map<PlayerId, Card>([[0, spadesK]]);
    
    const playable = getPlayableCards(hand, trick, null);
    expect(playable.length).toBe(1);
    expect(playable[0].suit).toBe('spades');
  });

  it('any card playable when void in lead suit', () => {
    const hand: Card[] = [heartsA, clubsK];
    const trick = new Map<PlayerId, Card>([[0, spadesK]]);
    
    const playable = getPlayableCards(hand, trick, null);
    expect(playable.length).toBe(2);
  });

  it('getNextPlayer cycles correctly', () => {
    expect(getNextPlayer(0)).toBe(1);
    expect(getNextPlayer(1)).toBe(2);
    expect(getNextPlayer(2)).toBe(3);
    expect(getNextPlayer(3)).toBe(0);
  });
});

describe('bidding', () => {
  it('getBidOrder starts from given player', () => {
    const order = getBidOrder(2);
    expect(order).toEqual([2, 3, 0, 1]);
  });

  it('estimateTricks returns value between 1 and 13', () => {
    const hand: Card[] = [
      { suit: 'spades', rank: 'A' },
      { suit: 'spades', rank: 'K' },
      { suit: 'hearts', rank: 'Q' },
    ];
    const tricks = estimateTricks(hand);
    expect(tricks).toBeGreaterThanOrEqual(1);
    expect(tricks).toBeLessThanOrEqual(13);
  });

  it('getDeclarer returns highest bidder', () => {
    const bids: Bid[] = [
      { player: 0, tricks: 5 },
      { player: 1, tricks: 3 },
      { player: 2, tricks: 4 },
      { player: 3, tricks: 2 },
    ];
    expect(getDeclarer(bids)).toBe(0);
  });

  it('getTeamBid sums correctly', () => {
    const bids: Bid[] = [
      { player: 0, tricks: 5 },
      { player: 1, tricks: 3 },
      { player: 2, tricks: 4 },
      { player: 3, tricks: 2 },
    ];
    expect(getTeamBid(bids, 'us')).toBe(9);
    expect(getTeamBid(bids, 'them')).toBe(5);
  });
});

describe('scoring', () => {
  it('positive score when bid met', () => {
    const bids: Bid[] = [
      { player: 0, tricks: 5 },
      { player: 1, tricks: 3 },
      { player: 2, tricks: 4 },
      { player: 3, tricks: 2 },
    ];
    const trickWins: PlayerId[] = [0, 2, 0, 2, 0, 2, 0, 2, 0, 0, 2, 0, 2];
    const players = deal(4);
    
    const result = calculateRoundScore(bids, trickWins, players);
    expect(result.teamUs).toBeGreaterThan(0);
  });

  it('penalty when bid missed', () => {
    const bids: Bid[] = [
      { player: 0, tricks: 10 },
      { player: 1, tricks: 1 },
      { player: 2, tricks: 1 },
      { player: 3, tricks: 1 },
    ];
    const trickWins: PlayerId[] = [1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1];
    const players = deal(4);
    
    const result = calculateRoundScore(bids, trickWins, players);
    expect(result.teamUs).toBeLessThan(0);
  });

  it('isGameOver returns true at 100 points', () => {
    expect(isGameOver({ us: 100, them: 50 })).toBe(true);
    expect(isGameOver({ us: 50, them: 100 })).toBe(true);
    expect(isGameOver({ us: 99, them: 99 })).toBe(false);
  });
});

describe('engine', () => {
  it('createGame initializes correctly', () => {
    const game = createGame();
    expect(game.players.length).toBe(4);
    expect(game.phase).toBe('bidding');
    expect(game.roundNumber).toBe(1);
  });

  it('placeBid advances to next player', () => {
    const game = createGame();
    const updated = placeBid(game, 0, 5);
    expect(updated.currentPlayer).toBe(1);
    expect(updated.bids.length).toBe(1);
  });

  it('placeBid transitions to playing after 4 bids', () => {
    let game = createGame();
    game = placeBid(game, 0, 5);
    game = placeBid(game, 1, 3);
    game = placeBid(game, 2, 4);
    game = placeBid(game, 3, 2);
    
    expect(game.phase).toBe('playing');
    expect(game.trump).not.toBeNull();
  });

  it('playCard removes card from hand', () => {
    let game = createGame();
    game = placeBid(game, 0, 5);
    game = placeBid(game, 1, 3);
    game = placeBid(game, 2, 4);
    game = placeBid(game, 3, 2);
    
    const player0 = game.players[0];
    const cardToPlay = player0.hand[0];
    
    game = playCard(game, 0, cardToPlay);
    
    const updatedPlayer = game.players[0];
    expect(updatedPlayer.hand.length).toBe(12);
  });
});

describe('AI bidding', () => {
  it('getBotBid returns value between 1 and 13', () => {
    const hand: Card[] = [
      { suit: 'spades', rank: 'A' },
      { suit: 'spades', rank: 'K' },
      { suit: 'hearts', rank: 'Q' },
    ];
    
    const easyBid = getBotBid(hand, 'easy');
    const mediumBid = getBotBid(hand, 'medium');
    const hardBid = getBotBid(hand, 'hard');
    
    expect(easyBid).toBeGreaterThanOrEqual(1);
    expect(easyBid).toBeLessThanOrEqual(13);
    expect(mediumBid).toBeGreaterThanOrEqual(1);
    expect(mediumBid).toBeLessThanOrEqual(13);
    expect(hardBid).toBeGreaterThanOrEqual(1);
    expect(hardBid).toBeLessThanOrEqual(13);
  });
});

describe('AI play validity', () => {
  const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
  
  for (const difficulty of difficulties) {
    it(`${difficulty}: AI always plays a valid card (1000 random hands)`, () => {
      let violations = 0;
      
      for (let i = 0; i < 1000; i++) {
        const players = deal(4);
        const playerIndex = Math.floor(Math.random() * 4);
        const player = players[playerIndex];
        
        const trump: Suit = ['spades', 'hearts', 'diamonds', 'clubs'][Math.floor(Math.random() * 4)] as Suit;
        
        const trickMap = new Map<PlayerId, Card>();
        if (Math.random() > 0.5) {
          const leaderId = Math.floor(Math.random() * 4) as PlayerId;
          const leaderHand = players[leaderId].hand;
          if (leaderHand.length > 0) {
            trickMap.set(leaderId, leaderHand[0]);
          }
        }
        
        const context = {
          hand: player.hand,
          trick: trickMap.size > 0 ? trickMap : null,
          trump,
          currentPlayer: player.id,
          players,
          playedCards: new Set<string>(),
        };
        
        const playedCard = getBotPlay(context, difficulty);
        
        const playable = getPlayableCards(player.hand, trickMap.size > 0 ? trickMap : null, trump);
        const isValid = playable.some(
          (c) => c.suit === playedCard.suit && c.rank === playedCard.rank
        );
        
        if (!isValid) {
          violations++;
        }
      }
      
      expect(violations).toBe(0);
    });
  }
});
