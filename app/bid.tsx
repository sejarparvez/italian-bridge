import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card } from '@/components/cards';
import { ScoreBar } from '@/components/hud';
import { BidPanel } from '@/components/hud/BidPanel';
import { GameTable } from '@/components/table';
import { COLORS } from '@/constants/theme';
import { estimateTricksAdvanced } from '@/engine/ai/bidAI';
import { useGameStore } from '@/store';

// biome-ignore lint/suspicious/noExplicitAny: this is fien
function getInitialBid(hand: any[]): number {
  if (!hand || hand.length === 0) return 5;
  return Math.max(1, Math.min(estimateTricksAdvanced(hand), 13));
}

export default function BidScreen() {
  const router = useRouter();
  const { state, submitBid, initGame } = useGameStore();
  const [bid, setBid] = useState(() => getInitialBid(state.players[0]?.hand));
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    if (isFirstRender) {
      initGame();
      setIsFirstRender(false);
    }
  }, [isFirstRender, initGame]);

  useEffect(() => {
    if (state.phase === 'playing') {
      router.replace('/game');
    }
  }, [state.phase, router.replace]);

  const handleConfirm = () => {
    submitBid(bid);
  };

  const isHumanTurn = state.currentPlayer === 0;

  const getPlayerName = (id: number): string => {
    switch (id) {
      case 0:
        return 'You';
      case 1:
        return 'Right';
      case 2:
        return 'Partner';
      case 3:
        return 'Left';
      default:
        return 'Unknown';
    }
  };

  const playerMap = {
    bottom: {
      ...state.players[0],
      seat: 'bottom' as const,
      isHuman: true,
      name: getPlayerName(0),
      bid: null,
      tricksTaken: 0,
    },
    top: {
      ...state.players[2],
      seat: 'top' as const,
      isHuman: false,
      name: getPlayerName(2),
      bid: null,
      tricksTaken: 0,
    },
    left: {
      ...state.players[3],
      seat: 'left' as const,
      isHuman: false,
      name: getPlayerName(3),
      bid: null,
      tricksTaken: 0,
    },
    right: {
      ...state.players[1],
      seat: 'right' as const,
      isHuman: false,
      name: getPlayerName(1),
      bid: null,
      tricksTaken: 0,
    },
  };

  return (
    <View className='flex-1 bg-felt-dark'>
      <ScoreBar
        usScore={state.scores.us}
        themScore={state.scores.them}
        roundNumber={state.roundNumber}
      />
      <GameTable players={playerMap}>
        <View className='absolute inset-0 items-center justify-center'>
          <View className='bg-felt-dark/95 border border-gold-primary/50 rounded-2xl p-6 items-center min-w-72'>
            {!isHumanTurn ? (
              <>
                <Text className='text-gold-light text-base mb-1'>
                  {state.currentPlayer === 1
                    ? 'Right'
                    : state.currentPlayer === 2
                      ? 'Partner'
                      : 'Left'}{' '}
                  is bidding...
                </Text>
                <Text className='text-gold text-2xl font-bold mt-2'>...</Text>
              </>
            ) : (
              <>
                <Text className='text-gold-light text-sm mb-3 font-medium tracking-wide'>
                  Your turn to bid
                </Text>
                <BidPanel value={bid} onChange={setBid} min={1} max={13} />
                <Pressable
                  className='mt-4 px-8 py-3 rounded-lg border-2'
                  style={{
                    backgroundColor: COLORS.goldPrimary,
                    borderColor: COLORS.goldLight,
                  }}
                  onPress={handleConfirm}
                >
                  <Text
                    className='text-lg font-bold tracking-widest'
                    style={{ color: COLORS.feltDark }}
                  >
                    CONFIRM BID
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        <View className='absolute bottom-4 left-0 right-0 items-center'>
          <Text className='text-gold text-xs mb-1'>Your Hand</Text>
          <View className='flex-row flex-wrap justify-center -space-x-2 px-2'>
            {state.players[0].hand.slice(0, 6).map((card, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey:  this is fine
              <Card key={i} suit={card.suit} rank={card.rank} width={38} />
            ))}
          </View>
        </View>
      </GameTable>
    </View>
  );
}
