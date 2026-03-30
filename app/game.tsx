import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Home, RefreshCw, Settings, X } from 'lucide-react-native';
import { MotiView } from 'moti';
import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, View } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/cards/Card';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Menu, MenuItem, MenuItemLabel } from '@/components/ui/menu';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { SUIT_SYMBOLS } from '@/constants/cards';
import { getWinner } from '@/game/engine';
import { getPlayableCards } from '@/game/trick';
import type { SeatPosition } from '@/game/types';
import { useGameStore } from '@/store/gameStore';
import { sortHandAlternating } from '@/utils/card-sort';

// ── Constants ─────────────────────────────────────────────────────────────────

const { width, height } = Dimensions.get('window');
const SCREEN_H = Math.min(width, height);
const SCREEN_W = Math.max(width, height);

const CARD_W = SCREEN_H * 0.17;
const CARD_H = CARD_W * 1.45;
const CARD_OVERLAP = CARD_W * 0.52;
const TRICK_CARD_W = SCREEN_H * 0.13;
const TRICK_CARD_H = TRICK_CARD_W * 1.55;
const TRICK_OFFSET = SCREEN_H * 0.18;

// ── Colour palette ────────────────────────────────────────────────────────────

const C = {
  bg: '#06110A',
  felt: '#0A1C0F',
  gold: '#C8A840',
  goldBright: '#E8C84A',
  goldDim: 'rgba(200,168,64,0.25)',
  goldFaint: 'rgba(200,168,64,0.08)',
  goldAccent: 'rgba(200,168,64,0.12)',
  goldGlow: 'rgba(200,168,64,0.35)',
  white10: 'rgba(255,255,255,0.10)',
  white05: 'rgba(255,255,255,0.05)',
  danger: 'rgba(248,113,113,0.7)',
  dangerDim: 'rgba(248,113,113,0.5)',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function stableRot(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return ((h % 100) - 50) / 10;
}

function getHandLayout(count: number) {
  const totalWidth = CARD_W + (count - 1) * CARD_OVERLAP;
  const startX = (SCREEN_W - totalWidth) / 2;
  return Array.from({ length: count }, (_, i) => {
    const norm = count > 1 ? i / (count - 1) : 0.5;
    const center = norm - 0.5;
    return {
      x: startX + i * CARD_OVERLAP,
      rotate: center * 27,
      y: Math.abs(center) * 17,
    };
  });
}

const slotFor = (p: SeatPosition) => {
  const o = TRICK_OFFSET;
  return p === 'bottom'
    ? { x: 0, y: o }
    : p === 'top'
      ? { x: 0, y: -o }
      : p === 'left'
        ? { x: -o * 1.2, y: 0 }
        : { x: o * 1.2, y: 0 };
};

// ── useShimmer — reusable looping shimmer ─────────────────────────────────────

function useShimmer(duration = 2000, delay = 0) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, duration, delay]);
  return anim;
}

// ── PulseRing — expands outward and fades ────────────────────────────────────

function PulseRing({
  size,
  color,
  duration = 1400,
  delay = 0,
}: {
  size: number;
  color: string;
  duration?: number;
  delay?: number;
}) {
  return (
    <MotiView
      from={{ opacity: 0.7, scale: 0.5 }}
      animate={{ opacity: 0, scale: 1.1 }}
      transition={{
        loop: true,
        duration,
        type: 'timing',
        delay,
        easing: Easing.out(Easing.quad),
      }}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: color,
        alignSelf: 'center',
      }}
    />
  );
}

// ── OrbitDot — a dot that orbits a center point ──────────────────────────────

function OrbitDot({
  radius,
  duration,
  startAngle = 0,
  color,
}: {
  radius: number;
  duration: number;
  startAngle?: number;
  color: string;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, duration]);

  // Build x/y from many interpolation steps for smooth circular orbit
  const steps = 60;
  const inputRange = Array.from({ length: steps + 1 }, (_, i) => i / steps);
  const xRange = inputRange.map((t) => {
    const angle = startAngle * (Math.PI / 180) + t * 2 * Math.PI;
    return radius * Math.cos(angle);
  });
  const yRange = inputRange.map((t) => {
    const angle = startAngle * (Math.PI / 180) + t * 2 * Math.PI;
    return radius * Math.sin(angle);
  });

  const translateX = progress.interpolate({ inputRange, outputRange: xRange });
  const translateY = progress.interpolate({ inputRange, outputRange: yRange });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: color,
        opacity: 0.7,
        transform: [{ translateX }, { translateY }],
      }}
    />
  );
}

// ── ActiveHalo — layered glow + orbit for active seats ───────────────────────

function ActiveHalo({ size = 34 }: { size?: number }) {
  return (
    <View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <PulseRing size={size * 2.2} color={C.goldGlow} duration={1800} />
      <PulseRing size={size * 1.6} color={C.gold} duration={1400} delay={300} />
      <OrbitDot
        radius={size * 0.82}
        duration={3000}
        startAngle={0}
        color={C.gold}
      />
      <OrbitDot
        radius={size * 0.82}
        duration={3000}
        startAngle={180}
        color={C.goldBright}
      />
    </View>
  );
}

// ── DealCard — cards fan in from deck on mount ────────────────────────────────

function DealCard({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  return (
    <MotiView
      from={{
        opacity: 0,
        translateY: -CARD_H * 1.4,
        scale: 0.55,
      }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{
        type: 'spring',
        damping: 16,
        stiffness: 110,
        delay: index * 55,
      }}
    >
      {children}
    </MotiView>
  );
}

// ── TrickCard — card played onto table with cinematic arc ─────────────────────

function TrickCard({
  cardId,
  player,
  isLatest,
  children,
}: {
  cardId: string;
  player: SeatPosition;
  isLatest: boolean;
  children: React.ReactNode;
}) {
  const s = slotFor(player);
  const rot = stableRot(cardId);

  return (
    <MotiView
      key={cardId}
      from={{
        scale: isLatest ? 0.45 : 0.8,
        opacity: isLatest ? 0 : 0.7,
        rotate: `${rot + (isLatest ? 20 : 6)}deg`,
      }}
      animate={{
        scale: 1,
        opacity: 1,
        rotate: `${rot}deg`,
        transform: [
          { translateX: s.x - TRICK_CARD_W / 2 },
          { translateY: s.y - TRICK_CARD_H / 2 },
          { rotate: `${rot}deg` },
        ],
      }}
      transition={{
        type: 'spring',
        damping: isLatest ? 13 : 20,
        stiffness: isLatest ? 170 : 220,
        mass: isLatest ? 0.75 : 1,
      }}
      style={{ position: 'absolute', top: '50%', left: '50%' }}
    >
      {/* Flash glow for newest card */}
      {isLatest && (
        <MotiView
          from={{ opacity: 0.85, scale: 1.4 }}
          animate={{ opacity: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 500 }}
          style={{
            position: 'absolute',
            inset: -10,
            borderRadius: 14,
            backgroundColor: C.goldGlow,
          }}
        />
      )}
      {children}
    </MotiView>
  );
}

// ── TeamScoreBadge ─────────────────────────────────────────────────────────────

function TeamScoreBadge({
  tricks,
  bid,
  isBiddingTeam,
  active,
}: {
  tricks: number;
  bid: number | null;
  isBiddingTeam: boolean;
  active: boolean;
}) {
  const numericTarget = isBiddingTeam ? (bid ?? 0) : 4;
  const target = isBiddingTeam ? (bid ?? '?') : 4;
  const onTrack = numericTarget === 0 || tricks >= numericTarget;

  const valueColor = active
    ? C.gold
    : onTrack
      ? 'rgba(100,200,120,0.85)'
      : 'rgba(220,100,80,0.85)';

  const shimmer = useShimmer(1800, 300);

  return (
    <View
      className='mt-0.5 px-1.5 py-0.5 rounded-xl overflow-hidden'
      style={active ? { backgroundColor: C.goldAccent } : undefined}
    >
      {active && (
        <Animated.View
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: C.gold,
            opacity: shimmer.interpolate({
              inputRange: [0, 1],
              outputRange: [0.08, 0.25],
            }),
            borderRadius: 8,
          }}
        />
      )}
      <Text className='text-xs font-black' style={{ color: valueColor }}>
        {tricks}
        <Text style={{ opacity: 0.45, color: 'rgba(240,220,160,0.35)' }}>
          /{target}
        </Text>
      </Text>
    </View>
  );
}

// ── OpponentSeat ──────────────────────────────────────────────────────────────

function OpponentSeat({
  name,
  active,
  orientation = 'vertical',
  scoreBadge,
}: {
  name: string;
  active: boolean;
  orientation?: 'vertical' | 'horizontal';
  scoreBadge?: React.ReactNode;
}) {
  const isH = orientation === 'horizontal';
  const borderShimmer = useShimmer(2200, 100);

  return (
    <View
      className={[
        'items-center p-2 rounded-2xl border relative',
        isH ? 'flex-row px-2.5' : '',
        active ? 'border-[rgba(200,168,64,0.25)]' : 'border-transparent',
      ].join(' ')}
      style={[
        { minWidth: 64 },
        active ? { backgroundColor: C.goldFaint } : undefined,
      ]}
    >
      {/* Animated border shimmer */}
      {active && (
        <Animated.View
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: C.gold,
            opacity: borderShimmer.interpolate({
              inputRange: [0, 1],
              outputRange: [0.1, 0.5],
            }),
          }}
        />
      )}

      {/* Active halo sits behind the avatar */}
      {active && (
        <View
          style={{
            position: 'absolute',
            left: isH ? 8 : undefined,
            alignSelf: isH ? undefined : 'center',
            top: isH ? 8 : 8,
            width: 34,
            height: 34,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActiveHalo size={34} />
        </View>
      )}

      {/* Avatar */}
      <View
        className='items-center justify-center rounded-full'
        style={[
          { width: 34, height: 34, borderRadius: 17, borderWidth: 2 },
          active
            ? { borderColor: C.gold, backgroundColor: C.goldAccent }
            : { borderColor: C.white10, backgroundColor: C.white05 },
        ]}
      >
        <Text
          className='font-black text-xs'
          style={{ color: 'rgba(240,220,160,0.6)' }}
        >
          {name[0].toUpperCase()}
        </Text>
      </View>

      {/* Name + score */}
      <View className={isH ? 'ml-2' : 'mt-1.5 items-center'}>
        <Text
          className='text-[9px] font-bold uppercase tracking-wide'
          style={{
            maxWidth: 60,
            color: active ? 'rgba(240,220,160,0.9)' : 'rgba(255,255,255,0.3)',
          }}
          numberOfLines={1}
        >
          {name}
        </Text>
        {scoreBadge}
      </View>

      {/* Live indicator dot + halo */}
      {active && (
        <>
          <MotiView
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ loop: true, duration: 900, type: 'timing' }}
            className='absolute top-1.5 right-1.5 w-2 h-2 rounded-full'
            style={{ backgroundColor: C.gold }}
          />
          <MotiView
            from={{ opacity: 0.6, scale: 0.5 }}
            animate={{ opacity: 0, scale: 2.2 }}
            transition={{ loop: true, duration: 1100, type: 'timing' }}
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: C.gold,
            }}
          />
        </>
      )}
    </View>
  );
}

// ── ScorePanel ────────────────────────────────────────────────────────────────

function ScorePanel({
  btScore,
  lrScore,
}: {
  btScore: number;
  lrScore: number;
}) {
  const fmt = (n: number) => (n > 0 ? `+${n}` : String(n));

  return (
    <View
      className='flex-row items-center rounded-xl border overflow-hidden'
      style={{ borderColor: C.white10, backgroundColor: C.white05 }}
    >
      <View className='px-2.5 py-1 items-center' style={{ minWidth: 52 }}>
        <Text
          className='text-[7px] font-bold uppercase tracking-widest'
          style={{ color: 'rgba(200,168,64,0.45)' }}
        >
          US
        </Text>
        <Text
          className='text-sm font-black'
          style={{
            color:
              btScore > 0
                ? C.gold
                : btScore <= -20
                  ? C.danger
                  : 'rgba(240,220,160,0.4)',
          }}
        >
          {fmt(btScore)}
        </Text>
      </View>

      <View
        className='w-px self-stretch'
        style={{ backgroundColor: C.white10, marginVertical: '15%' }}
      />

      <View className='px-2.5 py-1 items-center' style={{ minWidth: 52 }}>
        <Text
          className='text-[7px] font-bold uppercase tracking-widest'
          style={{ color: 'rgba(200,168,64,0.45)' }}
        >
          THEM
        </Text>
        <Text
          className='text-sm font-black'
          style={{
            color:
              lrScore > 0
                ? 'rgba(255,255,255,0.5)'
                : lrScore <= -20
                  ? C.danger
                  : 'rgba(240,220,160,0.4)',
          }}
        >
          {fmt(lrScore)}
        </Text>
      </View>
    </View>
  );
}

// ── TrumpMiniCard ─────────────────────────────────────────────────────────────

function TrumpMiniCard({
  suit,
  revealed,
  canPeek,
  onPeek,
}: {
  suit: string;
  revealed: boolean;
  canPeek: boolean;
  onPeek?: () => void;
}) {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const symbol = SUIT_SYMBOLS[suit as keyof typeof SUIT_SYMBOLS];
  const faceColor = isRed ? '#FFF5F5' : '#F5F7FF';
  const suitColor = isRed ? '#D42B2B' : '#1A1A2E';
  const borderColor = isRed ? 'rgba(212,43,43,0.3)' : 'rgba(26,26,46,0.25)';
  const cardStyle = { width: 44, height: 62, borderRadius: 7 };
  const shimmer = useShimmer(2600);

  if (!revealed && canPeek) {
    return (
      <MotiView
        from={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 13, stiffness: 180 }}
      >
        {/* Gold aura */}
        <Animated.View
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: 15,
            backgroundColor: C.gold,
            opacity: shimmer.interpolate({
              inputRange: [0, 1],
              outputRange: [0.08, 0.28],
            }),
          }}
        />
        <Pressable
          onPress={onPeek}
          className='items-center justify-center overflow-hidden border border-[rgba(255,255,255,0.15)]'
          style={[cardStyle, { elevation: 10 }]}
        >
          <LinearGradient
            colors={['#1A3A22', '#0F2216', '#1A3A22']}
            className='absolute inset-0'
            style={{ borderRadius: 7 }}
          />
          {/* Decorative lines */}
          <View className='absolute inset-0 items-center justify-evenly p-1'>
            {[...Array(3)].map((_, i) => (
              <View
                // biome-ignore lint/suspicious/noArrayIndexKey: decorative
                key={i}
                style={{
                  width: '80%',
                  height: 1,
                  backgroundColor: 'rgba(200,168,64,0.2)',
                  borderRadius: 1,
                }}
              />
            ))}
          </View>
          {/* Sweep shimmer across card back */}
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 18,
              backgroundColor: 'rgba(255,255,255,0.06)',
              transform: [
                {
                  translateX: shimmer.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-44, 88],
                  }),
                },
              ],
            }}
          />
          <Text
            style={{
              fontSize: 7,
              color: 'rgba(200,168,64,0.65)',
              fontWeight: '900',
              letterSpacing: 0.5,
              textAlign: 'center',
              lineHeight: 10,
            }}
          >
            TAP{'\n'}PEEK
          </Text>
        </Pressable>
      </MotiView>
    );
  }

  if (!revealed) return null;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.35 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 11, stiffness: 190 }}
    >
      {/* Suit-tinted aura */}
      <Animated.View
        style={{
          position: 'absolute',
          inset: -8,
          borderRadius: 15,
          backgroundColor: isRed
            ? 'rgba(212,43,43,0.3)'
            : 'rgba(50,50,160,0.3)',
          opacity: shimmer.interpolate({
            inputRange: [0, 1],
            outputRange: [0.3, 0.75],
          }),
        }}
      />
      <View
        className='items-center justify-center overflow-hidden border'
        style={[
          cardStyle,
          {
            backgroundColor: faceColor,
            borderColor,
            elevation: 14,
            shadowColor: isRed ? '#D42B2B' : '#3333AA',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.45,
            shadowRadius: 10,
          },
        ]}
      >
        {/* Shimmer sweep across face */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: 16,
            backgroundColor: 'rgba(255,255,255,0.35)',
            transform: [
              {
                translateX: shimmer.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-44, 88],
                }),
              },
            ],
          }}
        />
        {/* Top pip */}
        <Text
          className='absolute font-black'
          style={{
            top: 4,
            left: 5,
            fontSize: 10,
            color: suitColor,
            lineHeight: 12,
          }}
        >
          {symbol}
        </Text>
        {/* Center */}
        <Text
          className='font-black'
          style={{ fontSize: 26, color: suitColor, lineHeight: 30 }}
        >
          {symbol}
        </Text>
        {/* Bottom pip */}
        <Text
          className='absolute font-black'
          style={{
            bottom: 4,
            right: 5,
            fontSize: 10,
            color: suitColor,
            lineHeight: 12,
            transform: [{ rotate: '180deg' }],
          }}
        >
          {symbol}
        </Text>
        {/* TRUMP label */}
        <View
          className='absolute bottom-0 left-0 right-0 items-center py-0.5'
          style={{
            backgroundColor: isRed
              ? 'rgba(212,43,43,0.1)'
              : 'rgba(26,26,46,0.08)',
          }}
        >
          <Text
            className='font-black uppercase'
            style={{ fontSize: 6, color: suitColor, letterSpacing: 1.5 }}
          >
            TRUMP
          </Text>
        </View>
      </View>
    </MotiView>
  );
}

// ── WinnerBanner ──────────────────────────────────────────────────────────────

function WinnerBanner({ name }: { name: string }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.5, translateY: 24 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 11, stiffness: 230 }}
      className='absolute -bottom-2 self-center'
    >
      {/* Burst glow */}
      <MotiView
        from={{ opacity: 0.9, scale: 0.7 }}
        animate={{ opacity: 0, scale: 3 }}
        transition={{ type: 'timing', duration: 700 }}
        style={{
          position: 'absolute',
          inset: -16,
          borderRadius: 28,
          backgroundColor: C.gold,
        }}
      />
      <View
        className='flex-row items-center gap-1.5 px-4 py-1.5 rounded-full'
        style={{
          backgroundColor: C.gold,
          shadowColor: C.gold,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 18,
          elevation: 18,
        }}
      >
        <MotiView
          animate={{ rotate: ['0deg', '18deg', '-18deg', '0deg'] }}
          transition={{
            loop: true,
            duration: 1100,
            type: 'timing',
            delay: 500,
          }}
        >
          <Text style={{ fontSize: 12 }}>⭐</Text>
        </MotiView>
        <Text
          className='font-black uppercase'
          style={{ fontSize: 10, color: '#07130D', letterSpacing: 2 }}
        >
          {name}
        </Text>
      </View>
    </MotiView>
  );
}

// ── FeltTable — subtle animated inner ring ───────────────────────────────────

function FeltTable() {
  const shimmer = useShimmer(4500);
  return (
    <>
      <View
        className='absolute self-center border'
        style={{
          top: SCREEN_H * 0.05,
          width: SCREEN_W * 0.62,
          height: SCREEN_H * 0.72,
          borderRadius: SCREEN_H * 0.36,
          borderColor: 'rgba(200,168,64,0.06)',
          backgroundColor: 'rgba(10,28,15,0.4)',
        }}
        pointerEvents='none'
      />
      <Animated.View
        style={{
          position: 'absolute',
          alignSelf: 'center',
          top: SCREEN_H * 0.07,
          width: SCREEN_W * 0.52,
          height: SCREEN_H * 0.64,
          borderRadius: SCREEN_H * 0.32,
          borderWidth: 1,
          borderColor: C.gold,
          opacity: shimmer.interpolate({
            inputRange: [0, 1],
            outputRange: [0.02, 0.07],
          }),
        }}
        pointerEvents='none'
      />
    </>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function GameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, playPlayerCard, startNewGame, nextRound, revealTrump } =
    useGameStore();
  const [pressed, setPressed] = useState<string | null>(null);
  const lastTrickCount = useRef(0);

  const {
    players,
    currentTrick,
    currentSeat,
    trumpSuit,
    trumpRevealed,
    trumpCreator,
    phase,
    teamScores,
  } = state;

  const isPlayerTurn = currentSeat === 'bottom';
  const isPlayerActive = phase === 'playing' && isPlayerTurn;

  const btTricks = players.bottom.tricksTaken + players.top.tricksTaken;
  const lrTricks = players.left.tricksTaken + players.right.tricksTaken;

  const bidderTeam = state.highestBidder
    ? players[state.highestBidder].team
    : null;
  const btIsBidding = bidderTeam === 'BT';
  const lrIsBidding = bidderTeam === 'LR';
  const winningBid = state.highestBid > 0 ? state.highestBid : null;

  const canPeek =
    trumpCreator === 'bottom' && !trumpRevealed && trumpSuit !== null;

  // Track latest card for dramatic play-in animation
  const latestCardId =
    currentTrick.cards.length > lastTrickCount.current
      ? currentTrick.cards[currentTrick.cards.length - 1]?.card.id
      : null;
  useEffect(() => {
    lastTrickCount.current = currentTrick.cards.length;
  }, [currentTrick.cards.length]);

  const playableIds = useMemo<Set<string>>(() => {
    if (!isPlayerActive) return new Set();
    return new Set(
      getPlayableCards(
        players.bottom.hand,
        currentTrick,
        trumpSuit,
        trumpRevealed,
      ).map((c) => c.id),
    );
  }, [
    isPlayerActive,
    players.bottom.hand,
    currentTrick,
    trumpSuit,
    trumpRevealed,
  ]);

  const uniqueHand = players.bottom.hand.filter(
    (card, idx, arr) => arr.findIndex((c) => c.id === card.id) === idx,
  );
  const hand = sortHandAlternating(uniqueHand);
  const layouts = getHandLayout(hand.length);

  // ── Phase: dealing2 ───────────────────────────────────────────────────────

  if (phase === 'dealing2' && !players.bottom.hand.some(() => true)) {
    return (
      <View
        className='flex-1 items-center justify-center'
        style={{ backgroundColor: C.bg }}
      >
        <LinearGradient
          colors={[C.bg, C.felt, C.bg]}
          className='absolute inset-0'
        />
        <MotiView
          animate={{
            rotate: ['0deg', '8deg', '-8deg', '0deg'],
            scale: [1, 1.1, 1],
          }}
          transition={{ loop: true, duration: 900, type: 'timing' }}
          style={{ marginBottom: 20 }}
        >
          <Text style={{ fontSize: 52, opacity: 0.45 }}>🃏</Text>
        </MotiView>
        <MotiView
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ loop: true, duration: 1200, type: 'timing' }}
        >
          <Text
            className='font-bold uppercase'
            style={{
              color: 'rgba(200,168,64,0.4)',
              fontSize: 13,
              letterSpacing: 3,
            }}
          >
            Dealing cards...
          </Text>
        </MotiView>
      </View>
    );
  }

  // ── Phase: roundEnd / gameEnd ─────────────────────────────────────────────

  if (phase === 'roundEnd' || phase === 'gameEnd') {
    const isGameEnd = phase === 'gameEnd';
    const winner = getWinner(teamScores);
    const btEliminated = teamScores.BT <= -30;
    const lrEliminated = teamScores.LR <= -30;
    const eliminationMode = isGameEnd && (btEliminated || lrEliminated);

    return (
      <View className='flex-1' style={{ backgroundColor: C.bg }}>
        <LinearGradient
          colors={[C.bg, C.felt, C.bg]}
          className='absolute inset-0'
        />

        {/* Cinematic radial bloom */}
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
          {/* Title block */}
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

          {/* Score card */}
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
                  {
                    teamId: 'BT' as const,
                    names: 'You & Alex',
                    score: teamScores.BT,
                  },
                  {
                    teamId: 'LR' as const,
                    names: 'Jordan & Sam',
                    score: teamScores.LR,
                  },
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
                      <View
                        className='h-px'
                        style={{ backgroundColor: 'rgba(200,168,64,0.08)' }}
                      />
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

                      {/* Score number — pops in with spring */}
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

          {/* CTA button */}
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
              onPress={() => {
                if (isGameEnd) {
                  startNewGame();
                  router.replace('/');
                } else {
                  nextRound();
                  router.replace('/bid');
                }
              }}
            >
              {/* Moving shimmer sweep */}
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

  // ── Main game view ────────────────────────────────────────────────────────

  return (
    <View
      className='flex-1'
      style={{
        backgroundColor: C.bg,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <LinearGradient
        colors={[C.bg, '#0B1E10', C.bg]}
        className='absolute inset-0'
      />
      <FeltTable />

      {/* ── HUD ── */}
      <MotiView
        from={{ opacity: 0, translateY: -24 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 18, delay: 80 }}
        className='absolute left-0 right-0 flex-row justify-between items-center px-3.5 z-50'
        style={{ top: insets.top + 8 }}
      >
        <HStack className='gap-2 items-center'>
          {trumpSuit && (trumpRevealed || canPeek) && (
            <TrumpMiniCard
              suit={trumpSuit}
              revealed={trumpRevealed}
              canPeek={canPeek}
              onPeek={canPeek && revealTrump() ? revealTrump : undefined}
            />
          )}
          <ScorePanel btScore={teamScores.BT} lrScore={teamScores.LR} />
        </HStack>

        <Menu
          offset={10}
          trigger={({ ...triggerProps }) => (
            <Pressable
              {...triggerProps}
              className='w-9 h-9 rounded-full border items-center justify-center'
              style={{ borderColor: C.goldDim, backgroundColor: C.goldFaint }}
            >
              <Icon as={Settings} size='sm' style={{ color: C.gold }} />
            </Pressable>
          )}
          style={{
            backgroundColor: '#0C1F14',
            borderWidth: 1,
            borderColor: 'rgba(200,168,64,0.25)',
            borderRadius: 14,
            padding: 6,
            minWidth: 160,
          }}
        >
          <MenuItem
            key='home'
            textValue='Home'
            className='rounded-xl py-2.5 px-3 gap-2.5'
            onPress={() => router.replace('/')}
          >
            <Icon as={Home} size='sm' style={{ color: C.goldDim }} />
            <MenuItemLabel
              className='font-semibold text-sm'
              style={{ color: 'rgba(232,213,163,0.85)' }}
            >
              Main Menu
            </MenuItemLabel>
          </MenuItem>
          <MenuItem
            key='new-game'
            textValue='New Game'
            className='rounded-xl py-2.5 px-3 gap-2.5'
            onPress={() => {
              startNewGame();
              router.replace('/bid');
            }}
          >
            <Icon as={RefreshCw} size='sm' style={{ color: C.goldDim }} />
            <MenuItemLabel
              className='font-semibold text-sm'
              style={{ color: 'rgba(232,213,163,0.85)' }}
            >
              Restart Game
            </MenuItemLabel>
          </MenuItem>
          <MenuItem
            key='close'
            textValue='Close'
            className='rounded-xl py-2.5 px-3 gap-2.5 mt-1 border-t'
            style={{ borderTopColor: 'rgba(200,168,64,0.1)' }}
          >
            <Icon as={X} size='sm' style={{ color: C.dangerDim }} />
            <MenuItemLabel
              className='font-semibold text-sm'
              style={{ color: C.danger }}
            >
              Close Menu
            </MenuItemLabel>
          </MenuItem>
        </Menu>
      </MotiView>

      {/* ── TABLE ── */}
      <HStack
        className='flex-1 items-center'
        style={{ marginTop: SCREEN_H * 0.1, marginBottom: 4 }}
      >
        {/* Left */}
        <MotiView
          from={{ opacity: 0, translateX: -28 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'spring', damping: 18, delay: 180 }}
          className='items-center justify-center'
          style={{ width: SCREEN_W * 0.13 }}
        >
          <OpponentSeat
            name={players.left.name}
            active={currentSeat === 'left'}
          />
        </MotiView>

        {/* Center */}
        <View className='flex-1 items-center justify-center relative'>
          {/* Top seat */}
          <MotiView
            from={{ opacity: 0, translateY: -28 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, delay: 130 }}
            className='absolute'
            style={{ top: -40, left: 50 + SCREEN_W * 0.1 }}
          >
            <OpponentSeat
              name={players.top.name}
              active={currentSeat === 'top'}
              orientation='horizontal'
            />
          </MotiView>

          {/* Watermark — slow breathing rotation */}
          <MotiView
            animate={{
              rotate: ['0deg', '2deg', '-2deg', '0deg'],
              opacity: [0.035, 0.05, 0.035],
            }}
            transition={{ loop: true, duration: 9000, type: 'timing' }}
            className='absolute'
            pointerEvents='none'
          >
            <Text
              className='font-black text-center'
              style={{
                fontSize: SCREEN_H * 0.52,
                color: C.gold,
                lineHeight: SCREEN_H * 0.44,
              }}
              pointerEvents='none'
            >
              {SUIT_SYMBOLS.spades}
            </Text>
          </MotiView>

          {/* Trick cards area */}
          <View
            className='items-center justify-center'
            style={{ width: SCREEN_H * 0.72, height: SCREEN_H * 0.5 }}
            pointerEvents='none'
          >
            {currentTrick.cards.map((tc) => (
              <TrickCard
                key={tc.card.id}
                cardId={tc.card.id}
                player={tc.player}
                isLatest={tc.card.id === latestCardId}
              >
                <Card
                  card={tc.card}
                  width={TRICK_CARD_W}
                  height={TRICK_CARD_H}
                />
              </TrickCard>
            ))}
          </View>

          {currentTrick.winningSeat && (
            <WinnerBanner name={players[currentTrick.winningSeat].name} />
          )}
        </View>

        {/* Right */}
        <MotiView
          from={{ opacity: 0, translateX: 28 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'spring', damping: 18, delay: 180 }}
          className='items-center justify-center'
          style={{ width: SCREEN_W * 0.13 }}
        >
          <OpponentSeat
            name={players.right.name}
            active={currentSeat === 'right'}
            scoreBadge={
              <TeamScoreBadge
                tricks={lrTricks}
                bid={lrIsBidding ? winningBid : null}
                isBiddingTeam={lrIsBidding}
                active={currentSeat === 'right'}
              />
            }
          />
        </MotiView>
      </HStack>

      {/* ── Player bar ── */}
      <MotiView
        from={{ opacity: 0, translateY: 18 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 18, delay: 240 }}
        className='flex-row items-center justify-between px-4 pb-1 mb-0.5'
      >
        <HStack className='items-center gap-2.5'>
          {/* Avatar with active halo */}
          <View
            className='items-center justify-center'
            style={{ width: 42, height: 42 }}
          >
            {isPlayerActive && <ActiveHalo size={38} />}
            <View
              className='items-center justify-center rounded-full'
              style={[
                { width: 38, height: 38, borderRadius: 19, borderWidth: 2 },
                isPlayerActive
                  ? { borderColor: C.gold, backgroundColor: C.goldAccent }
                  : { borderColor: C.white10, backgroundColor: C.white05 },
              ]}
            >
              <Text
                className='font-black text-xs'
                style={{ color: 'rgba(240,220,160,0.6)' }}
              >
                {players.bottom.name[0].toUpperCase()}
              </Text>
            </View>
          </View>

          <VStack>
            <Text
              className='font-extrabold uppercase tracking-wide'
              style={{
                fontSize: 11,
                color: 'rgba(240,220,160,0.7)',
                letterSpacing: 0.5,
              }}
            >
              {players.bottom.name}
            </Text>
            <TeamScoreBadge
              tricks={btTricks}
              bid={btIsBidding ? winningBid : null}
              isBiddingTeam={btIsBidding}
              active={isPlayerActive}
            />
          </VStack>
        </HStack>
      </MotiView>

      {/* ── Player Hand ── */}
      <View
        className='relative w-full overflow-visible '
        style={{ height: CARD_H * 0.72 }}
      >
        {hand.map((card, i) => {
          const l = layouts[i];
          const canPlay = isPlayerActive && playableIds.has(card.id);
          const isPressed = pressed === card.id;

          return (
            <DealCard key={card.id} index={i}>
              <MotiView
                animate={{
                  opacity: isPlayerActive && !canPlay ? 0.25 : 1,
                  scale: isPressed ? 1.09 : 1,
                  translateY: isPressed ? -CARD_H * 0.4 : l.y,
                  rotate: `${l.rotate}deg`,
                }}
                transition={{
                  type: 'spring',
                  damping: isPressed ? 14 : 22,
                  stiffness: isPressed ? 320 : 260,
                }}
                style={{ position: 'absolute', left: l.x, bottom: -26 }}
              >
                {/* Press flash */}
                {isPressed && (
                  <MotiView
                    from={{ opacity: 0.55 }}
                    animate={{ opacity: 0 }}
                    transition={{ type: 'timing', duration: 250 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 10,
                      backgroundColor: 'rgba(255,255,255,0.28)',
                      zIndex: 10,
                    }}
                  />
                )}

                <Pressable
                  onPressIn={() => canPlay && setPressed(card.id)}
                  onPressOut={() => setPressed(null)}
                  onPress={() => canPlay && playPlayerCard(card.id)}
                  className='overflow-hidden rounded-lg -mb-16'
                >
                  <Card card={card} width={CARD_W} height={CARD_H} />
                </Pressable>
              </MotiView>
            </DealCard>
          );
        })}
      </View>
    </View>
  );
}
