import { Bid, Card, GameState, Player, PlayerId, Suit, SuitOrNull } from './types';
import { deal, dealPartial } from './deck';
import { getPlayableCards, getTrickWinner, getNextPlayer } from './trick';
import { getBidOrder, estimateTricks, getDeclarer, chooseTrump, getTeamBid, getHighestBid, getValidBids, MIN_BID } from './bidding';
import { calculateRoundScore, updateCumulativeScore, isGameOver, getWinner } from './scoring';

export function createGame(): GameState {
  const { players, remainingDeck } = dealPartial();
  return {
    players,
    currentPlayer: 0,
    trick: null,
    trump: null,
    trumpRevealed: false,
    bids: [],
    roundNumber: 1,
    scores: { us: 0, them: 0 },
    phase: 'bidding',
    trickWins: [],
    roundResult: null,
    remainingDeck,
  };
}

export function startBidding(state: GameState): GameState {
  return {
    ...state,
    phase: 'bidding',
    bids: [],
    trumpRevealed: false,
  };
}

export function placeBid(
  state: GameState,
  playerId: PlayerId,
  tricks: number | null
): GameState {
  const newBids = [...state.bids, { player: playerId, tricks: tricks ?? 0 }];
  
  const passCount = newBids.filter(b => b.tricks === 0).length;
  
  if (passCount >= 3 && newBids.some(b => b.tricks > 0)) {
    const declarer = getDeclarer(newBids);
    if (declarer !== null) {
      return startPlaying(state, newBids, declarer);
    }
  }
  
  if (newBids.length >= 4) {
    const declarer = getDeclarer(newBids);
    if (declarer === null) {
      return startNewRound(state);
    }
    return startPlaying(state, newBids, declarer);
  }

  const bidOrder = getBidOrder(state.currentPlayer);
  const nextBidder = bidOrder[newBids.length % 4];

  return {
    ...state,
    bids: newBids,
    currentPlayer: nextBidder,
  };
}

function startPlaying(
  state: GameState,
  bids: Bid[],
  declarer: PlayerId
): GameState {
  const trump = chooseTrump(state.players, declarer);
  const fullHand = deal(4, 13);
  const playersWithFullHand = state.players.map((p, i) => ({
    ...p,
    hand: fullHand[i].hand,
  }));

  return {
    ...state,
    players: playersWithFullHand,
    bids,
    trump,
    trumpRevealed: false,
    phase: 'playing',
    currentPlayer: declarer,
    trick: null,
    remainingDeck: [],
  };
}

export function aiBid(state: GameState): number | null {
  const player = state.players.find((p) => p.id === state.currentPlayer);
  if (!player) return null;
  
  const validBids = getValidBids(state.bids);
  const estimated = estimateTricks(player.hand);
  
  const bidOptions = validBids.filter((b): b is number => b !== null);
  
  if (bidOptions.length === 0) {
    return null;
  }
  
  if (estimated >= MIN_BID) {
    const bestBid = Math.min(Math.max(estimated, 7), 10);
    return bidOptions.includes(bestBid) ? bestBid : bidOptions[bidOptions.length - 1];
  }
  
  return null;
}

export function playCard(
  state: GameState,
  playerId: PlayerId,
  card: Card
): GameState {
  const playerIndex = state.players.findIndex((p) => p.id === playerId);
  if (playerIndex === -1) return state;

  const player = state.players[playerIndex];
  const playable = getPlayableCards(player.hand, state.trick?.cards ?? null, state.trump);
  
  if (!playable.some((c) => c.suit === card.suit && c.rank === card.rank)) {
    return state;
  }

  const newHand = player.hand.filter(
    (c) => !(c.suit === card.suit && c.rank === card.rank)
  );
  const newPlayers = [...state.players];
  newPlayers[playerIndex] = { ...player, hand: newHand };

  const newTrickCards = state.trick?.cards ?? new Map<PlayerId, Card>();
  newTrickCards.set(playerId, card);

  const leader = state.trick?.leader ?? playerId;
  
  const isTrumpPlayed = card.suit === state.trump;
  const shouldRevealTrump = !state.trumpRevealed && isTrumpPlayed;

  if (newTrickCards.size >= 4) {
    const winner = getTrickWinner(newTrickCards, state.trump);
    const newTrickWins = [...state.trickWins, winner];
    
    if (newPlayers.every((p) => p.hand.length === 0)) {
      return endRound(state, newPlayers, newTrickCards, newTrickWins);
    }

    return {
      ...state,
      players: newPlayers,
      trick: { cards: newTrickCards, leader },
      currentPlayer: winner,
      trickWins: newTrickWins,
      phase: 'playing',
      trumpRevealed: shouldRevealTrump || state.trumpRevealed,
    };
  }

  return {
    ...state,
    players: newPlayers,
    trick: { cards: newTrickCards, leader },
    currentPlayer: getNextPlayer(playerId),
    trumpRevealed: shouldRevealTrump || state.trumpRevealed,
  };
}

function endRound(
  state: GameState,
  players: Player[],
  finalTrick: Map<PlayerId, Card>,
  trickWins: PlayerId[]
): GameState {
  const roundResult = calculateRoundScore(state.bids, trickWins, players);
  const newScores = updateCumulativeScore(state.scores, roundResult);
  const gameOver = isGameOver(newScores);

  return {
    ...state,
    players,
    trick: null,
    scores: newScores,
    phase: gameOver ? 'result' : 'bidding',
    roundResult,
    trickWins: [],
  };
}

export function startNewRound(state: GameState): GameState {
  const { players, remainingDeck } = dealPartial();
  return {
    ...state,
    players,
    currentPlayer: 0,
    trick: null,
    trump: null,
    trumpRevealed: false,
    bids: [],
    roundNumber: state.roundNumber + 1,
    phase: 'bidding',
    trickWins: [],
    remainingDeck,
  };
}

export function getPlayableCardsForPlayer(state: GameState): Card[] {
  const player = state.players.find((p) => p.id === state.currentPlayer);
  if (!player) return [];
  return getPlayableCards(player.hand, state.trick?.cards ?? null, state.trump);
}

export { getDeclarer, getTeamBid, estimateTricks, chooseTrump };
