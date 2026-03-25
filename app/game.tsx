import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card, CardBack } from '@/components/cards';
import { ScoreBar } from '@/components/hud';
import { GameTable, TrumpBadge } from '@/components/table';
import type { Card as CardType, PlayerId } from '@/engine/types';
import { useGameStore } from '@/store';

function getPlayerName(id: PlayerId): string {
  switch (id) {
    case 0:
      return 'You';
    case 1:
      return 'Right';
    case 2:
      return 'Partner';
    case 3:
      return 'Left';
  }
}

export default function GameScreen() {
  const router = useRouter();
  const {
    state,
    playCard,
    getHumanHand,
    getPlayableCards,
    isHumanTurn,
    getCurrentTrick,
  } = useGameStore();
  const [_selectedCard, _setSelectedCard] = useState<CardType | null>(null);

  useEffect(() => {
    if (state.phase === 'bidding') {
      router.replace('/bid');
    } else if (state.phase === 'result') {
      router.replace('/result');
    }
  }, [state.phase, router.replace]);

  const humanHand = getHumanHand();
  const playableCards = getPlayableCards();
  const currentTrick = getCurrentTrick();
  const isHumanPlaying = isHumanTurn();

  const handleCardPress = (card: CardType) => {
    if (!isHumanPlaying) return;
    const isPlayable = playableCards.some(
      (c) => c.suit === card.suit && c.rank === card.rank,
    );
    if (isPlayable) {
      playCard(card);
    }
  };

  const getCardPosition = (playerId: PlayerId): string => {
    switch (playerId) {
      case 2:
        return 'top';
      case 1:
        return 'right';
      case 3:
        return 'left';
      default:
        return 'bottom';
    }
  };

  return (
    <View className='flex-1 bg-felt-dark'>
      <ScoreBar
        usScore={state.scores.us}
        themScore={state.scores.them}
        roundNumber={state.roundNumber}
      />

      <GameTable>
        {state.trump && (
          <View className='absolute top-4 left-4 z-10'>
            <TrumpBadge suit={state.trump} />
          </View>
        )}

        <View className='absolute top-8 left-0 right-0 items-center'>
          <Text className='text-gold-light text-sm'>Partner</Text>
          <View className='flex-row mt-2 gap-1'>
            {state.players[2].hand.slice(0, 6).map((_, i) => (
              <CardBack key={i} width={30} />
            ))}
          </View>
          <View className='flex-row mt-1 gap-1'>
            {state.players[2].hand.slice(6).map((_, i) => (
              <CardBack key={i + 6} width={30} />
            ))}
          </View>
        </View>

        <View className='absolute right-4 top-1/2 -translate-y-1/2 items-center'>
          <Text className='text-gold-light text-sm mb-2'>Right</Text>
          <View className='-rotate-90 gap-1'>
            {state.players[1].hand.slice(0, 6).map((_, i) => (
              <CardBack key={i} width={25} />
            ))}
          </View>
          <View className='-rotate-90 gap-1 mt-1'>
            {state.players[1].hand.slice(6).map((_, i) => (
              <CardBack key={i + 6} width={25} />
            ))}
          </View>
        </View>

        <View className='absolute left-4 top-1/2 -translate-y-1/2 items-center'>
          <Text className='text-gold-light text-sm mb-2'>Left</Text>
          <View className='rotate-90 gap-1'>
            {state.players[3].hand.slice(0, 6).map((_, i) => (
              <CardBack key={i} width={25} />
            ))}
          </View>
          <View className='rotate-90 gap-1 mt-1'>
            {state.players[3].hand.slice(6).map((_, i) => (
              <CardBack key={i + 6} width={25} />
            ))}
          </View>
        </View>

        <View className='absolute inset-0 items-center justify-center'>
          <View className='w-48 h-32 border-2 border-gold-primary/50 rounded-full items-center justify-center bg-felt-mid/30'>
            {currentTrick && currentTrick.size > 0 && (
              <View className='flex-row gap-4 flex-wrap justify-center items-center'>
                {Array.from(currentTrick.entries()).map(([playerId, card]) => {
                  const pos = getCardPosition(playerId);
                  const offsetClass =
                    pos === 'top'
                      ? '-top-8'
                      : pos === 'right'
                        ? '-right-8'
                        : pos === 'left'
                          ? '-left-8'
                          : '';
                  return (
                    <View key={playerId} className={`absolute ${offsetClass}`}>
                      <Card suit={card.suit} rank={card.rank} width={40} />
                    </View>
                  );
                })}
              </View>
            )}
            <Text className='text-gold text-xs mt-16'>
              Trick {13 - state.players[0].hand.length}/13
            </Text>
          </View>
        </View>

        {state.currentPlayer !== null && (
          <View className='absolute top-20 left-1/2 -translate-x-1/2 bg-gold-primary/20 px-4 py-2 rounded-full'>
            <Text className='text-gold text-sm font-bold'>
              {getPlayerName(state.currentPlayer)}'s turn
            </Text>
          </View>
        )}

        <View className='absolute bottom-4 left-0 right-0 items-center'>
          <Text className='text-gold-light text-sm mb-2'>
            {isHumanPlaying ? 'Tap a card to play' : 'Bot is thinking...'}
          </Text>
          <View className='flex-row flex-wrap justify-center gap-1 max-w-3xl px-4'>
            {humanHand.map((card, i) => {
              const isPlayable = playableCards.some(
                (c) => c.suit === card.suit && c.rank === card.rank,
              );
              return (
                <Pressable
                  key={`${card.suit}-${card.rank}-${i}`}
                  onPress={() => handleCardPress(card)}
                  className={`${isPlayable ? 'opacity-100' : 'opacity-40'} ${isHumanPlaying ? 'active:scale-95' : ''}`}
                  disabled={!isHumanPlaying}
                >
                  <Card suit={card.suit} rank={card.rank} width={50} />
                </Pressable>
              );
            })}
          </View>
        </View>
      </GameTable>
    </View>
  );
}
