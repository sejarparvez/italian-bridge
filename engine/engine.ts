import { Bid, Card, GameState, Player, PlayerId, Suit, SuitOrNull } from './types';
import { deal } from './deck';
import { getPlayableCards, getTrickWinner, getNextPlayer } from './trick';
import { getBidOrder, estimateTricks, getDeclarer, chooseTrump, getTeamBid } from './bidding';
import { calculateRoundScore, updateCumulativeScore, isGameOver, getWinner } from './scoring';

export function createGame(): GameState {
  const players = deal(4);
  return {
    players,
    currentPlayer: 0,
    trick: null,
    trump: null,
    bids: [],
    roundNumber: 1,
    scores: { us: 0, them: 0 },
    phase: 'bidding',
    trickWins: [],
    roundResult: null,
  };
}

export function startBidding(state: GameState): GameState {
  return {
    ...state,
    phase: 'bidding',
    bids: [],
  };
}

export function placeBid(
  state: GameState,
  playerId: PlayerId,
  tricks: number
): GameState {
  const newBids = [...state.bids, { player: playerId, tricks }];
  
  if (newBids.length >= 4) {
    const declarer = getDeclarer(newBids);
    if (declarer === null) {
      return startNewRound(state);
    }
    const trump = chooseTrump(state.players, declarer);
    return {
      ...state,
      bids: newBids,
      trump,
      phase: 'playing',
      currentPlayer: declarer,
      trick: null,
    };
  }

  const bidOrder = getBidOrder(state.currentPlayer);
  const nextBidder = bidOrder[newBids.length];

  return {
    ...state,
    bids: newBids,
    currentPlayer: nextBidder,
  };
}

export function aiBid(state: GameState): number {
  const player = state.players.find((p) => p.id === state.currentPlayer);
  if (!player) return 1;
  return Math.min(Math.max(estimateTricks(player.hand), 1), 13);
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

  if (newTrickCards.size >= 4) {
    const winner = getTrickWinner(newTrickCards, state.trump);
    const trickWins = [...(state as any).trickWins ?? [], winner];
    
    if (newPlayers.every((p) => p.hand.length === 0)) {
      return endRound(state, newPlayers, newTrickCards);
    }

    return {
      ...state,
      players: newPlayers,
      trick: { cards: newTrickCards, leader },
      currentPlayer: winner,
      trickWins,
      phase: 'playing',
    };
  }

  return {
    ...state,
    players: newPlayers,
    trick: { cards: newTrickCards, leader },
    currentPlayer: getNextPlayer(playerId),
  };
}

function endRound(
  state: GameState,
  players: Player[],
  finalTrick: Map<PlayerId, Card>
): GameState {
  const trickWins = (state as any).trickWins ?? [];
  trickWins.push(getTrickWinner(finalTrick, state.trump));

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
  const players = deal(4);
  return {
    ...state,
    players,
    currentPlayer: 0,
    trick: null,
    trump: null,
    bids: [],
    roundNumber: state.roundNumber + 1,
    phase: 'bidding',
    trickWins: [],
  };
}

export function getPlayableCardsForPlayer(state: GameState): Card[] {
  const player = state.players.find((p) => p.id === state.currentPlayer);
  if (!player) return [];
  return getPlayableCards(player.hand, state.trick?.cards ?? null, state.trump);
}

export { getDeclarer, getTeamBid, estimateTricks, chooseTrump };
