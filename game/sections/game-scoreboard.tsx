import { Button, ButtonIcon, ButtonText } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { C } from '@/constants/theme';
import { getWinner } from '@/game/engine';
import { useGameStore } from '@/store/gameStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, RotateCcw, Trophy } from 'lucide-react-native';
import { MotiView } from 'moti';
import { Dimensions, View } from 'react-native';
import { Easing } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const SCREEN_H = Math.min(width, height);
const SCREEN_W = Math.max(width, height);

interface GameScoreboardProps {
  phase: 'roundEnd' | 'gameEnd';
  teamScores: { BT: number; LR: number };
}

// ── Thin decorative rule with a diamond pip centred on it ─────────────────────
function GoldRule({ delay }: { delay: number }) {
  return (
    <MotiView
      from={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{
        type: 'timing',
        duration: 600,
        delay,
        easing: Easing.out(Easing.cubic),
      }}
      className='flex-row items-center gap-2 my-5'
    >
      <View
        className='flex-1 h-px'
        style={{ backgroundColor: 'rgba(200,168,64,0.25)' }}
      />
      <Text style={{ fontSize: 10, color: 'rgba(200,168,64,0.5)' }}>♦</Text>
      <View
        className='flex-1 h-px'
        style={{ backgroundColor: 'rgba(200,168,64,0.25)' }}
      />
    </MotiView>
  );
}

// ── Score badge — the big animated number ─────────────────────────────────────
function ScoreBadge({
  score,
  isWinner,
  isEliminated,
  delay,
}: {
  score: number;
  isWinner: boolean;
  isEliminated: boolean;
  delay: number;
}) {
  const color = isEliminated
    ? 'rgba(248,113,113,0.45)'
    : isWinner
      ? C.gold
      : 'rgba(255,255,255,0.10)';

  const glowColor = isWinner ? C.gold : 'transparent';

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.2, rotate: '-8deg' }}
      animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
      transition={{ type: 'spring', damping: 11, stiffness: 120, delay }}
    >
      <Text
        className='font-black'
        style={{
          fontSize: 52,
          lineHeight: 56,
          color,
          textShadowColor: glowColor,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: isWinner ? 20 : 0,
          fontVariant: ['tabular-nums'],
        }}
      >
        {score > 0 ? `+${score}` : score}
      </Text>
    </MotiView>
  );
}

// ── Team row ──────────────────────────────────────────────────────────────────
function TeamRow({
  teamId,
  names,
  score,
  isWinner,
  isEliminated,
  isGameEnd,
  index,
}: {
  teamId: 'BT' | 'LR';
  names: string;
  score: number;
  isWinner: boolean;
  isEliminated: boolean;
  isGameEnd: boolean;
  index: number;
}) {
  const rowDelay = 420 + index * 150;

  return (
    <MotiView
      from={{ opacity: 0, translateX: index === 0 ? -32 : 32 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'spring', damping: 20, delay: rowDelay }}
    >
      {/* Winner pulse ring */}
      {isWinner && (
        <MotiView
          from={{ opacity: 0.6, scale: 0.96 }}
          animate={{ opacity: 0, scale: 1.04 }}
          transition={{
            type: 'timing',
            duration: 1600,
            loop: true,
            repeatReverse: false,
          }}
          style={{
            position: 'absolute',
            inset: -2,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: C.gold,
          }}
        />
      )}

      <View
        className='rounded-2xl px-4 py-4 mb-3'
        style={
          isWinner
            ? {
                backgroundColor: 'rgba(200,168,64,0.10)',
                borderWidth: 1,
                borderColor: 'rgba(200,168,64,0.45)',
                shadowColor: C.gold,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.35,
                shadowRadius: 20,
              }
            : isEliminated
              ? {
                  backgroundColor: 'rgba(248,113,113,0.06)',
                  borderWidth: 1,
                  borderColor: 'rgba(248,113,113,0.20)',
                }
              : {
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.07)',
                }
        }
      >
        <HStack className='justify-between items-center'>
          {/* Left: avatar pill + names */}
          <HStack className='items-center gap-3 flex-1'>
            {/* Team pill */}
            <View
              className='rounded-xl items-center justify-center'
              style={{
                width: 44,
                height: 44,
                backgroundColor: isWinner
                  ? C.gold
                  : isEliminated
                    ? 'rgba(248,113,113,0.15)'
                    : 'rgba(200,168,64,0.10)',
                borderWidth: 1,
                borderColor: isWinner
                  ? C.gold
                  : isEliminated
                    ? 'rgba(248,113,113,0.35)'
                    : 'rgba(200,168,64,0.25)',
                shadowColor: isWinner ? C.gold : 'transparent',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 10,
              }}
            >
              <Text
                className='font-black'
                style={{
                  fontSize: 12,
                  letterSpacing: 0.5,
                  color: isWinner ? C.bg : isEliminated ? '#f87171' : C.gold,
                }}
              >
                {teamId}
              </Text>
            </View>

            <VStack className='flex-1'>
              <Text
                className='font-semibold'
                style={{
                  fontSize: 15,
                  color: isWinner
                    ? 'rgba(255,255,255,0.95)'
                    : 'rgba(255,255,255,0.50)',
                  letterSpacing: 0.2,
                }}
              >
                {names}
              </Text>

              {/* Status tag */}
              {isWinner ? (
                <HStack className='items-center gap-1 mt-0.5'>
                  <Trophy size={9} color={C.gold} />
                  <Text
                    className='font-bold uppercase'
                    style={{ fontSize: 9, color: C.gold, letterSpacing: 2 }}
                  >
                    {isGameEnd ? 'Champion' : 'Round Win'}
                  </Text>
                </HStack>
              ) : isEliminated ? (
                <Text
                  className='font-bold uppercase mt-0.5'
                  style={{ fontSize: 9, color: '#f87171', letterSpacing: 2 }}
                >
                  Eliminated · −30
                </Text>
              ) : null}
            </VStack>
          </HStack>

          {/* Right: score */}
          <ScoreBadge
            score={score}
            isWinner={isWinner}
            isEliminated={isEliminated}
            delay={rowDelay + 120}
          />
        </HStack>

        {/* Progress bar toward ±30 target */}
        <MotiView
          from={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{
            type: 'timing',
            duration: 700,
            delay: rowDelay + 200,
            easing: Easing.out(Easing.cubic),
          }}
          style={{ transformOrigin: 'left' }}
        >
          <View
            className='mt-3 rounded-full overflow-hidden'
            style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.06)' }}
          >
            <View
              className='h-full rounded-full'
              style={{
                width: `${Math.min(100, (Math.abs(score) / 30) * 100)}%`,
                backgroundColor: isEliminated
                  ? '#f87171'
                  : isWinner
                    ? C.gold
                    : 'rgba(200,168,64,0.30)',
              }}
            />
          </View>
          <HStack className='justify-between mt-1'>
            <Text
              style={{
                fontSize: 8,
                color: 'rgba(255,255,255,0.18)',
                letterSpacing: 1,
              }}
            >
              {score < 0 ? '−30' : '0'}
            </Text>
            <Text
              style={{
                fontSize: 8,
                color: 'rgba(255,255,255,0.18)',
                letterSpacing: 1,
              }}
            >
              WIN · +30
            </Text>
          </HStack>
        </MotiView>
      </View>
    </MotiView>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GameScoreboard({
  phase,
  teamScores,
}: GameScoreboardProps) {
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

  const rows = [
    { teamId: 'BT' as const, names: 'You & Alex', score: teamScores.BT },
    { teamId: 'LR' as const, names: 'Jordan & Sam', score: teamScores.LR },
  ];

  return (
    <View className='flex-1' style={{ backgroundColor: C.bg }}>
      {/* ── Layered background ── */}
      <LinearGradient
        colors={[C.bg, C.felt, C.bg]}
        locations={[0, 0.5, 1]}
        className='absolute inset-0'
      />

      {/* Radial glow behind card */}
      <MotiView
        from={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.13, scale: 2.8 }}
        transition={{
          type: 'timing',
          duration: 1600,
          easing: Easing.out(Easing.cubic),
        }}
        style={{
          position: 'absolute',
          width: SCREEN_W,
          height: SCREEN_W,
          borderRadius: SCREEN_W / 2,
          backgroundColor: C.gold,
          alignSelf: 'center',
          top: SCREEN_H * 0.08,
        }}
      />

      {/* ── Content ── */}
      <MotiView
        from={{ opacity: 0, translateY: 40 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 22, delay: 60 }}
        className='flex-1 justify-center px-6'
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 14, delay: 150 }}
          className='items-center mb-2'
        >
          <Text
            className='font-bold uppercase mb-2'
            style={{
              fontSize: 10,
              color: 'rgba(200,168,64,0.55)',
              letterSpacing: 4,
            }}
          >
            {isGameEnd
              ? eliminationMode
                ? '⚑ Eliminated'
                : '✦ Final Results'
              : '✦ Round Summary'}
          </Text>

          <Text className='uppercase text-center font-extrabold text-4xl'>
            {isGameEnd ? 'Game Over' : 'Round Over'}
          </Text>
        </MotiView>

        <GoldRule delay={300} />

        {/* Team rows */}
        <View className='mb-2'>
          {rows.map((row, i) => {
            const isWinner = winner === row.teamId;
            const isEliminated =
              isGameEnd &&
              ((row.teamId === 'BT' && btEliminated) ||
                (row.teamId === 'LR' && lrEliminated));

            return (
              <TeamRow
                key={row.teamId}
                teamId={row.teamId}
                names={row.names}
                score={row.score}
                isWinner={isWinner}
                isEliminated={isEliminated}
                isGameEnd={isGameEnd}
                index={i}
              />
            );
          })}
        </View>

        <GoldRule delay={680} />

        {/* CTA button */}
        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, delay: 760 }}
        >
          <Button
            onPress={handlePress}
            className='h-16 rounded-full bg-felt-dark'
            style={{
              backgroundColor: '#8B6914',
            }}
          >
            {isGameEnd ? (
              <>
                <ButtonText className='text-xl font-bold tracking-widest'>
                  New Game
                </ButtonText>
                <ButtonIcon as={RotateCcw} />
              </>
            ) : (
              <>
                <ButtonText className='text-xl font-bold tracking-widest'>
                  Next Round
                </ButtonText>
                <ButtonIcon as={ArrowRight} />
              </>
            )}
          </Button>
        </MotiView>
      </MotiView>
    </View>
  );
}
