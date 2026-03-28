import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AnimatePresence, MotiView } from 'moti';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Center } from '@/components/ui/center';
import { Heading } from '@/components/ui/heading';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';

import { Card } from '@/src/components/cards/Card';
import { ALL_SUITS, type Suit } from '@/src/constants/cards';
import { useGameStore } from '@/store/gameStore';
import { sortHandAlternating } from '@/utils/card-sort';

const { width, height } = Dimensions.get('window');

// In landscape the shorter dimension is the height
const SCREEN_H = Math.min(width, height);
const SCREEN_W = Math.max(width, height);

// Fan layout constants
const CARD_W = SCREEN_H * 0.09;
const CARD_H = CARD_W * 1.4;
const FAN_SPREAD_DEG = 32; // total arc degrees

const SUIT_META: Record<
  string,
  { color: string; bg: string; symbol: string; name: string }
> = {
  hearts: {
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    symbol: '♥',
    name: 'Hearts',
  },
  diamonds: {
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    symbol: '♦',
    name: 'Diamonds',
  },
  clubs: {
    color: 'text-amber-200',
    bg: 'bg-amber-200/5',
    symbol: '♣',
    name: 'Clubs',
  },
  spades: {
    color: 'text-amber-200',
    bg: 'bg-amber-200/5',
    symbol: '♠',
    name: 'Spades',
  },
};

export default function BidScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, placePlayerBid, passPlayerBid, selectPlayerTrump } =
    useGameStore();
  const [selectedBid, setSelectedBid] = useState<number | null>(null);

  const hand = state.players.bottom.hand;
  const sorted = sortHandAlternating(hand);
  const showTrumpPicker =
    state.phase === 'dealing2' && state.highestBidder === 'bottom';

  useEffect(() => {
    if (state.phase === 'playing') router.replace('/game');
  }, [state.phase, router]);

  return (
    <Box
      className='flex-1 bg-[#07130D]'
      style={{ paddingLeft: insets.left, paddingRight: insets.right }}
    >
      {/* Background */}
      <LinearGradient
        colors={['#07130D', '#0C2016', '#07130D']}
        style={StyleSheet.absoluteFillObject}
      />

      <AnimatePresence exitBeforeEnter>
        {/* ── LOADING ── */}
        {hand.length === 0 ? (
          <Center key='loading' className='flex-1'>
            <MotiView
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ loop: true, duration: 1400, type: 'timing' }}
            >
              <Text className='text-amber-100/40 tracking-[4px] font-bold text-sm uppercase'>
                Dealing...
              </Text>
            </MotiView>
          </Center>
        ) : showTrumpPicker ? (
          /* ── TRUMP PICKER (landscape: horizontal row) ── */
          <MotiView
            key='trump'
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='flex-1'
          >
            <HStack className='flex-1 px-16 items-center justify-center space-x-10'>
              {/* Label block */}
              <VStack className='space-y-2 mr-6'>
                <Text className='text-amber-500 text-[10px] font-bold tracking-[3px] uppercase'>
                  You won the bid
                </Text>
                <Heading className='text-amber-100 text-4xl font-black leading-tight'>
                  Choose{'\n'}Trump
                </Heading>
              </VStack>

              {/* Suit tiles */}
              {ALL_SUITS.map((suit, i) => {
                const m = SUIT_META[suit];
                return (
                  <MotiView
                    key={suit}
                    from={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 100 }}
                  >
                    <Pressable
                      onPress={() => {
                        selectPlayerTrump(suit as Suit);
                        setTimeout(() => router.replace('/game'), 400);
                      }}
                      className={`w-20 h-24 rounded-2xl border m-2 border-white/10 items-center justify-center space-y-2 active:scale-95 ${m.bg}`}
                    >
                      <Text className={`text-4xl ${m.color}`}>{m.symbol}</Text>
                      <Text
                        className={`text-[8px] font-bold tracking-widest uppercase ${m.color} opacity-60`}
                      >
                        {m.name}
                      </Text>
                    </Pressable>
                  </MotiView>
                );
              })}
            </HStack>
          </MotiView>
        ) : (
          /* ── BIDDING SCREEN (landscape layout) ── */
          <Box key='bidding' className='flex-1'>
            {/*
              LANDSCAPE LAYOUT:
              ┌─────────────────────────────────────────────────────┐
              │  LEFT    │       CENTER MODAL        │    RIGHT     │
              │  player  │  ┌─────────────────────┐  │   player    │
              │          │  │   Bidding modal      │  │            │
              │          │  └─────────────────────┘  │            │
              │          │         TOP player         │            │
              ├──────────┴───────────────────────────┴────────────┤
              │                  Player hand fan                   │
              └─────────────────────────────────────────────────────┘
            */}

            {/* ── TABLE AREA (top ~65% of screen) ── */}
            <HStack className='flex-1' style={{ maxHeight: SCREEN_H * 0.65 }}>
              {/* Left player */}
              <Center style={{ width: SCREEN_W * 0.12 }}>
                <BotPill
                  name={state.players.left.name}
                  bid={state.players.left.bid}
                />
              </Center>

              {/* Center: top player + modal stacked */}
              <VStack className='flex-1 items-center justify-around py-3'>
                {/* Top player */}
                <BotPill
                  name={state.players.top.name}
                  bid={state.players.top.bid}
                />

                {/* ── BIDDING MODAL ── */}
                <MotiView
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 20 }}
                  style={{
                    width: SCREEN_W * 0.44,
                    borderRadius: 20,
                    overflow: 'hidden',
                    borderWidth: 1.5,
                    borderColor: 'rgba(180,140,40,0.4)',
                  }}
                >
                  {/* Modal inner gradient */}
                  <LinearGradient
                    colors={['#1C1400', '#120E00', '#1A1600']}
                    style={{ padding: 16, borderRadius: 19 }}
                  >
                    {/* Modal header */}
                    <VStack
                      className='items-center mb-3 pb-3'
                      style={{
                        borderBottomWidth: 1,
                        borderBottomColor: 'rgba(100,80,20,0.3)',
                      }}
                    >
                      <Text className='text-amber-500/50 text-[9px] font-bold tracking-[3px] uppercase mb-0.5'>
                        Round {state.round ?? 1} · Your Turn
                      </Text>
                      <Heading className='text-amber-100 text-xl font-extrabold tracking-tight'>
                        Place Your Bid
                      </Heading>
                      {state.highestBidder && (
                        <HStack className='items-center space-x-1 mt-1'>
                          <Text className='text-[10px] text-amber-100/30'>
                            Leading:
                          </Text>
                          <Text className='text-[10px] text-amber-400 font-bold'>
                            {state.players[state.highestBidder].name} —{' '}
                            {state.highestBid}
                          </Text>
                        </HStack>
                      )}
                    </VStack>

                    {/* Bid number tiles */}
                    {state.currentSeat === 'bottom' ? (
                      <>
                        <HStack className='justify-center mb-4' space='md'>
                          {[7, 8, 9, 10].map((n) => {
                            const active = selectedBid === n;
                            const disabled = n <= state.highestBid;
                            return (
                              <Pressable
                                key={n}
                                disabled={disabled}
                                onPress={() => setSelectedBid(n)}
                                style={{
                                  width: 52,
                                  height: 52,
                                  borderRadius: 12,
                                  borderWidth: active ? 2 : 1.5,
                                  borderColor: active
                                    ? '#C8A840'
                                    : 'rgba(255,255,255,0.08)',
                                  backgroundColor: active
                                    ? 'rgba(200,168,64,0.15)'
                                    : 'rgba(255,255,255,0.03)',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  opacity: disabled ? 0.15 : 1,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 20,
                                    fontWeight: '900',
                                    color: active
                                      ? '#F0D080'
                                      : 'rgba(240,208,128,0.35)',
                                  }}
                                >
                                  {n}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </HStack>

                        {/* Action buttons */}
                        <HStack className='space-x-2' space='lg'>
                          <Button
                            variant='outline'
                            className='border-white/10 h-11 px-5 rounded-xl'
                            onPress={() => passPlayerBid()}
                          >
                            <ButtonText className='text-amber-100/30 font-bold uppercase tracking-widest text-[10px]'>
                              Pass
                            </ButtonText>
                          </Button>
                          <Button
                            className='flex-1 h-11 rounded-xl active:opacity-80'
                            style={{
                              backgroundColor: selectedBid
                                ? '#C8A840'
                                : 'rgba(200,168,64,0.15)',
                            }}
                            isDisabled={!selectedBid}
                            onPress={() =>
                              selectedBid && placePlayerBid(selectedBid)
                            }
                          >
                            <ButtonText
                              style={{
                                color: selectedBid
                                  ? '#1A1000'
                                  : 'rgba(200,168,64,0.4)',
                                fontWeight: '900',
                                fontSize: 12,
                                letterSpacing: 1,
                                textTransform: 'uppercase',
                              }}
                            >
                              {selectedBid
                                ? `Bid  ${selectedBid}`
                                : 'Select a bid'}
                            </ButtonText>
                          </Button>
                        </HStack>
                      </>
                    ) : (
                      /* Waiting state */
                      <Center className='py-3'>
                        <HStack className='items-center space-x-2'>
                          <MotiView
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ loop: true, duration: 900 }}
                            className='w-1.5 h-1.5 bg-amber-500 rounded-full'
                          />
                          <Text className='text-amber-100/30 text-[10px] font-bold tracking-widest uppercase'>
                            Waiting...
                          </Text>
                        </HStack>
                      </Center>
                    )}
                  </LinearGradient>
                </MotiView>
              </VStack>

              {/* Right player */}
              <Center style={{ width: SCREEN_W * 0.12 }}>
                <BotPill
                  name={state.players.right.name}
                  bid={state.players.right.bid}
                />
              </Center>
            </HStack>

            {/* ── PLAYER HAND FAN ── */}
            <FannedHand cards={sorted} />
          </Box>
        )}
      </AnimatePresence>
    </Box>
  );
}

/* ─────────────────────────────────────────────
   Fanned hand — cards arc upward from bottom
───────────────────────────────────────────── */
function FannedHand({
  cards,
}: {
  cards: ReturnType<typeof sortHandAlternating>;
}) {
  const count = cards.length;
  if (count === 0) return null;

  const fanHeight = SCREEN_H * 0.35;
  const overlapStep = Math.min(CARD_W * 1, (SCREEN_W * 2) / count);

  return (
    <View
      style={{
        height: fanHeight,
        alignItems: 'center',
        justifyContent: 'flex-end',
        overflow: 'visible',
      }}
    >
      {/* Card fan container */}
      <View
        style={{
          position: 'relative',
          width: overlapStep * (count - 1) + CARD_W,
          height: CARD_H + 30,
        }}
      >
        {cards.map((card, i) => {
          // Distribute rotation evenly across FAN_SPREAD_DEG
          const rotateDeg =
            count > 1
              ? -FAN_SPREAD_DEG / 2 + (i / (count - 1)) * FAN_SPREAD_DEG
              : 0;

          // Cards arc upward: middle cards rise more
          const arcRise = Math.cos((rotateDeg * Math.PI) / 180) * 18 - 18;

          return (
            <MotiView
              key={card.id}
              from={{ translateY: 80, opacity: 0 }}
              animate={{ translateY: arcRise, opacity: 1 }}
              transition={{ delay: i * 30, type: 'spring', damping: 18 }}
              style={{
                position: 'absolute',
                left: i * overlapStep,
                bottom: 0,
                transform: [{ rotate: `${rotateDeg}deg` }],
                transformOrigin: 'bottom center',
                zIndex: i,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.5,
                shadowRadius: 6,
              }}
            >
              <Card card={card} />
            </MotiView>
          );
        })}
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────
   Bot player pill — compact for landscape
───────────────────────────────────────────── */
function BotPill({ name, bid }: { name: string; bid: number | null }) {
  const isPassed = bid === 0;
  return (
    <VStack className='items-center space-y-1.5'>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text className='text-amber-100/40 font-bold text-sm'>{name[0]}</Text>
      </View>

      <Text className='text-[9px] text-amber-100/25 font-bold uppercase tracking-tight'>
        {name}
      </Text>

      <View
        style={{
          paddingHorizontal: 8,
          paddingVertical: 2,
          borderRadius: 20,
          backgroundColor:
            bid && !isPassed ? 'rgba(200,168,64,0.12)' : 'transparent',
          borderWidth: bid && !isPassed ? 1 : 0,
          borderColor: 'rgba(200,168,64,0.2)',
          minWidth: 32,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: bid && !isPassed ? 13 : 10,
            fontWeight: '900',
            color:
              bid && !isPassed
                ? '#C8A840'
                : isPassed
                  ? 'rgba(240,208,128,0.15)'
                  : 'rgba(240,208,128,0.12)',
          }}
        >
          {bid === null ? '···' : isPassed ? 'PASS' : bid}
        </Text>
      </View>
    </VStack>
  );
}
