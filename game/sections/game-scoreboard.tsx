import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { C } from '@/constants/theme';
import { getWinner } from '@/game/engine';
import { useGameStore } from '@/store/gameStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Dimensions, Pressable, View } from 'react-native';
import { Easing } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const SCREEN_H = Math.min(width, height);
const SCREEN_W = Math.max(width, height);

interface GameScoreboardProps {
  phase: 'roundEnd' | 'gameEnd';
  teamScores: { BT: number; LR: number };
}

export default function GameScoreboard({ phase, teamScores }: GameScoreboardProps) {
  const router = useRouter();
  const { startNewGame, nextRound } = useGameStore();
  const isGameEnd = phase === 'gameEnd';
  const winner = getWinner(teamScores);
  const btEliminated = teamScores.BT <= -30;
  const lrEliminated = teamScores.LR <= -30;
  const eliminationMode = isGameEnd && (btEliminated || lrEliminated);

  const handlePress = () => {
    if (isGameEnd) {
      startNewGame();
      router.replace('/');
    } else {
      nextRound();
      router.replace('/bid');
    }
  };

  return (
    <View className='flex-1' style={{ backgroundColor: C.bg }}>
      <LinearGradient colors={[C.bg, C.felt, C.bg]} className='absolute inset-0' />
      <MotiView
        from={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 0.1, scale: 3 }}
        transition={{
          type: 'timing',
          duration: 1400,
          easing: Easing.out(Easing.cubic),
        }}
        style={{
          position: 'absolute',
          width: SCREEN_W,
          height: SCREEN_W,
          borderRadius: SCREEN_W / 2,
          backgroundColor: C.gold,
          alignSelf: 'center',
          top: SCREEN_H * 0.05,
        }}
      />
      <MotiView
        from={{ opacity: 0, translateY: 50 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 22, delay: 80 }}
        className='flex-1 justify-center items-center px-10'
      >
        <MotiView
          from={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 13, delay: 180 }}
          className='mb-6 items-center'
        >
          <Text
            className='font-bold uppercase mb-1'
            style={{
              fontSize: 10,
              color: 'rgba(200,168,64,0.5)',
              letterSpacing: 3,
            }}
          >
            {isGameEnd
              ? eliminationMode
                ? 'Eliminated'
                : 'Final Results'
              : 'Round Summary'}
          </Text>
          <Text
            className='font-black'
            style={{
              fontSize: 42,
              color: 'rgba(240,220,160,0.95)',
              letterSpacing: -1,
              textShadowColor: C.goldGlow,
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 20,
            }}
          >
            {isGameEnd ? 'Game Over' : 'Round Over'}
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 28 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, delay: 320 }}
          className='w-full'
          style={{ maxWidth: 440 }}
        >
          <View
            className='rounded-3xl px-5 border'
            style={{
              backgroundColor: C.white05,
              borderColor: 'rgba(200,168,64,0.15)',
              shadowColor: C.gold,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.18,
              shadowRadius: 28,
            }}
          >
            {(
              [
                { teamId: 'BT' as const, names: 'You & Alex', score: teamScores.BT },
                { teamId: 'LR' as const, names: 'Jordan & Sam', score: teamScores.LR },
              ] as const
            ).map((row, i) => {
              const isWinner = winner === row.teamId;
              const isEliminated =
                isGameEnd &&
                ((row.teamId === 'BT' && btEliminated) ||
                  (row.teamId === 'LR' && lrEliminated));

              return (
                <MotiView
                  key={row.teamId}
                  from={{ opacity: 0, translateX: -24 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{
                    type: 'spring',
                    damping: 18,
                    delay: 440 + i * 130,
                  }}
                >
                  {i > 0 && (
                    <View className='h-px' style={{ backgroundColor: 'rgba(200,168,64,0.08)' }} />
                  )}
                  <HStack className='justify-between items-center py-4'>
                    <HStack className='items-center gap-3'>
                      <View
                        className='w-11 h-11 rounded-xl items-center justify-center border'
                        style={
                          isWinner
                            ? {
                                backgroundColor: C.gold,
                                borderColor: C.gold,
                                shadowColor: C.gold,
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.7,
                                shadowRadius: 14,
                              }
                            : isEliminated
                              ? {
                                  backgroundColor: 'rgba(248,113,113,0.1)',
                                  borderColor: C.dangerDim,
                                }
                              : {
                                  backgroundColor: C.goldAccent,
                                  borderColor: C.goldDim,
                                }
                        }
                      >
                        <Text
                          className='text-xs font-black'
                          style={{
                            color: isWinner
                              ? C.bg
                              : isEliminated
                                ? C.danger
                                : C.gold,
                          }}
                        >
                          {row.teamId}
                        </Text>
                      </View>
                      <VStack>
                        <Text
                          className='text-sm font-medium'
                          style={{
                            color: isWinner
                              ? 'white'
                              : 'rgba(255,255,255,0.55)',
                          }}
                        >
                          {row.names}
                        </Text>
                        {isWinner && (
                          <Text
                            className='font-bold uppercase mt-0.5'
                            style={{
                              fontSize: 9,
                              color: C.gold,
                              letterSpacing: 1.5,
                            }}
                          >
                            {isGameEnd ? '🏆 Winner' : 'Round Win'}
                          </Text>
                        )}
                        {isEliminated && (
                          <Text
                            className='font-bold uppercase mt-0.5'
                            style={{
                              fontSize: 9,
                              color: C.danger,
                              letterSpacing: 1.5,
                            }}
                          >
                            Eliminated (−30)
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                    <MotiView
                      from={{ opacity: 0, scale: 0.3 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        type: 'spring',
                        damping: 9,
                        delay: 580 + i * 130,
                      }}
                    >
                      <Text
                        className='font-black'
                        style={{
                          fontSize: 42,
                          color: isEliminated
                            ? C.dangerDim
                            : !isWinner
                              ? 'rgba(255,255,255,0.12)'
                              : C.gold,
                          textShadowColor: isWinner ? C.gold : 'transparent',
                          textShadowOffset: { width: 0, height: 0 },
                          textShadowRadius: 14,
                        }}
                      >
                        {row.score > 0 ? `+${row.score}` : row.score}
                      </Text>
                    </MotiView>
                  </HStack>
                </MotiView>
              );
            })}
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, delay: 700 }}
          className='w-full mt-5'
          style={{ maxWidth: 440 }}
        >
          <Pressable
            className='h-14 rounded-2xl items-center justify-center overflow-hidden'
            style={{
              backgroundColor: C.gold,
              shadowColor: C.gold,
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.55,
              shadowRadius: 18,
              elevation: 14,
            }}
            onPress={handlePress}
          >
            <MotiView
              from={{ translateX: -200 }}
              animate={{ translateX: 450 }}
              transition={{
                loop: true,
                duration: 1800,
                type: 'timing',
                delay: 900,
                easing: Easing.inOut(Easing.sin),
              }}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: 70,
                backgroundColor: 'rgba(255,255,255,0.22)',
                transform: [{ skewX: '-18deg' }],
              }}
            />
            <Text
              className='font-black uppercase'
              style={{ color: '#07130D', fontSize: 14, letterSpacing: 2 }}
            >
              {isGameEnd ? 'New Game' : 'Next Round →'}
            </Text>
          </Pressable>
        </MotiView>
      </MotiView>
    </View>
  );
}