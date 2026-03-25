import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card, CardBack } from '@/components/cards';
import { BidPanel } from '@/components/hud/BidPanel';
import { GameTable } from '@/components/table';
import { COLORS } from '@/constants/theme';
import { estimateTricksAdvanced } from '@/engine/ai/bidAI';
import { useGameStore } from '@/store';

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
  }, [isFirstRender]);

  useEffect(() => {
    if (state.phase === 'playing') {
      router.replace('/game');
    }
  }, [state.phase]);

  const handleConfirm = () => {
    submitBid(bid);
  };

  const _currentBidder = state.players[state.currentPlayer];
  const isHumanTurn = state.currentPlayer === 0;

  return (
    <View className='flex-1 bg-felt-dark'>
      <GameTable>
        <View className='absolute top-4 left-0 right-0 flex-row justify-center'>
          <Text className='text-gold-light text-lg font-bold'>
            Round {state.roundNumber}
          </Text>
        </View>

        <View className='absolute top-16 left-0 right-0 items-center'>
          <Text className='text-gold text-sm'>Partner</Text>
          <CardBack width={50} />
        </View>

        <View className='absolute bottom-32 left-8 items-center'>
          <Text className='text-gold text-sm'>Left</Text>
          <View className='rotate-90'>
            <CardBack width={40} />
          </View>
        </View>

        <View className='absolute bottom-32 right-8 items-center'>
          <Text className='text-gold text-sm'>Right</Text>
          <View className='-rotate-90'>
            <CardBack width={40} />
          </View>
        </View>

        <View className='absolute inset-0 items-center justify-center'>
          <View className='bg-felt-mid/90 border-2 border-gold-primary rounded-2xl p-8 items-center min-w-80'>
            {!isHumanTurn ? (
              <>
                <Text className='text-gold-light text-lg mb-2'>
                  {state.currentPlayer === 1
                    ? 'Right Bot'
                    : state.currentPlayer === 2
                      ? 'Partner'
                      : 'Left Bot'}{' '}
                  is bidding...
                </Text>
                <Text className='text-gold text-3xl font-bold mt-4'>...</Text>
              </>
            ) : (
              <>
                <Text className='text-gold-light text-lg mb-4 font-semibold tracking-wide'>
                  Your turn to bid
                </Text>
                <BidPanel value={bid} onChange={setBid} />
                <Pressable
                  className='mt-6 px-10 py-4 rounded-lg border-2'
                  style={{
                    backgroundColor: COLORS.goldPrimary,
                    borderColor: COLORS.goldLight,
                  }}
                  onPress={handleConfirm}
                >
                  <Text
                    className='text-xl font-bold tracking-widest'
                    style={{ color: COLORS.feltDark }}
                  >
                    CONFIRM BID
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        <View className='absolute bottom-8 right-0 left-0 items-center'>
          <Text className='text-gold text-sm mb-2'>Your Hand</Text>
          <View className='flex-row flex-wrap justify-center gap-1 max-w-2xl'>
            {state.players[0].hand.slice(0, 6).map((card, i) => (
              <Card key={i} suit={card.suit} rank={card.rank} width={35} />
            ))}
          </View>
          <View className='flex-row flex-wrap justify-center gap-1 max-w-2xl mt-1'>
            {state.players[0].hand.slice(6).map((card, i) => (
              <Card key={i + 6} suit={card.suit} rank={card.rank} width={35} />
            ))}
          </View>
        </View>
      </GameTable>
    </View>
  );
}
