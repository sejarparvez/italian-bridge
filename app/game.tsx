import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Home, LayoutDashboard, RefreshCw, X } from 'lucide-react-native'; // Added Spade
import { MotiView } from 'moti';
import { useMemo, useState } from 'react';
import { Dimensions, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar, AvatarFallbackText } from '@/components/ui/avatar';
import { Box } from '@/components/ui/box';

// Gluestack UI
import { Button, ButtonIcon } from '@/components/ui/button';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Menu, MenuItem, MenuItemLabel } from '@/components/ui/menu';
import { Text } from '@/components/ui/text';
import { View } from '@/components/ui/view';
import { VStack } from '@/components/ui/vstack';

// Game Logic
import { getPlayableCards } from '@/game/trick';
import type { SeatPosition } from '@/game/types';
import { Card } from '@/src/components/cards/Card';
import { SUIT_SYMBOLS } from '@/src/constants/cards';
import { useGameStore } from '@/store/gameStore';
import { sortHandAlternating } from '@/utils/card-sort';

const { width, height } = Dimensions.get('window');
const IS_LANDSCAPE = width > height;
const PLAYER_CARD_W = IS_LANDSCAPE ? 50 : 56;
const PLAYER_CARD_OVERLAP = IS_LANDSCAPE ? 28 : 34;
const TRICK_OFFSET = IS_LANDSCAPE ? 58 : 70;
const FELT_SIZE = IS_LANDSCAPE
  ? Math.min(height * 0.68, width * 0.44)
  : height * 0.48;
const CARD_H_RATIO = 1.4;

const getHandLayout = (count: number) => {
  const span = PLAYER_CARD_W + (count - 1) * PLAYER_CARD_OVERLAP;
  const startX = (width - span) / 2;
  return Array.from({ length: count }, (_, i) => ({
    x: startX + i * PLAYER_CARD_OVERLAP,
    rotate: (i - (count - 1) / 2) * 3.2,
    y: Math.abs(i - (count - 1) / 2) * 1.8,
  }));
};

function stableRot(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return ((h % 120) - 60) / 10;
}

function Pill({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Box
      className={`px-3 py-1 rounded-lg border items-center justify-center ${accent ? 'bg-gold-dark/10 border-gold-dark/40' : 'bg-white/5 border-gold-dark/10'}`}
    >
      <Text className='text-[8px] text-gold-dark/50 font-bold tracking-widest uppercase'>
        {label}
      </Text>
      <Text
        className={`font-black ${accent ? 'text-lg text-gold-dark' : 'text-md text-gold-light'}`}
      >
        {value}
      </Text>
    </Box>
  );
}

export default function GameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, playPlayerCard, startNewGame, nextRound } = useGameStore();
  const [pressed, setPressed] = useState<string | null>(null);

  const {
    players,
    currentTrick,
    currentSeat,
    trumpSuit,
    trumpRevealed,
    round,
  } = state;
  const isPlayerTurn = currentSeat === 'bottom';
  const isPlayerActive = state.phase === 'playing' && isPlayerTurn;

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

  const hand = sortHandAlternating(players.bottom.hand);
  const layouts = getHandLayout(hand.length);
  const isOver =
    state.phase === 'gameEnd' ||
    (state.phase === 'roundEnd' && currentTrick.cards.length === 0);

  const slotFor = (p: SeatPosition) => {
    const o = TRICK_OFFSET;
    return p === 'bottom'
      ? { x: 0, y: o }
      : p === 'top'
        ? { x: 0, y: -o }
        : p === 'left'
          ? { x: -o, y: 0 }
          : { x: o, y: 0 };
  };

  if (isOver) {
    const end = state.phase === 'gameEnd';
    const bt = state.teamScores.BT,
      lr = state.teamScores.LR;
    const btWon = bt > lr;

    return (
      <View className='flex-1 bg-[#07130D]' style={{ paddingTop: insets.top }}>
        <LinearGradient
          colors={['#07130D', '#0C2016', '#07130D']}
          className='absolute inset-0'
        />
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className='flex-1 justify-center items-center px-8 gap-6'
        >
          <VStack className='w-full'>
            <Text className='text-gold-dark font-bold tracking-[4px] text-xs mb-1 uppercase'>
              {end ? 'Final Results' : 'Round Summary'}
            </Text>
            <Text className='text-4xl font-black text-gold-light tracking-tighter leading-none'>
              {end ? 'Standings' : 'Scores'}
            </Text>
          </VStack>
          <Box className='w-full bg-white/5 border border-gold-dark/20 rounded-3xl p-6 backdrop-blur-md'>
            {[
              { key: 'BT', names: 'You & Alex', score: bt, win: btWon },
              { key: 'LR', names: 'Jordan & Sam', score: lr, win: !btWon },
            ].map((row, i) => (
              <VStack key={row.key}>
                {i > 0 && <Box className='h-[1px] bg-gold-dark/10 my-4' />}
                <HStack className='justify-between items-center'>
                  <HStack space='md' className='items-center'>
                    <Box
                      className={`w-11 h-11 rounded-xl items-center justify-center border ${row.win ? 'bg-gold-dark border-gold-dark shadow-lg shadow-gold-dark/50' : 'bg-gold-dark/10 border-gold-dark/20'}`}
                    >
                      <Text
                        className={`font-black text-sm ${row.win ? 'text-[#07130D]' : 'text-gold-dark'}`}
                      >
                        {row.key}
                      </Text>
                    </Box>
                    <VStack>
                      <Text
                        className={`text-md ${row.win ? 'text-white font-bold' : 'text-white/60'}`}
                      >
                        {row.names}
                      </Text>
                      {row.win && (
                        <Text className='text-[10px] text-gold-dark font-bold uppercase tracking-widest mt-0.5'>
                          Winner
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                  <Text
                    className={`text-4xl font-black ${row.win ? 'text-gold-dark' : 'text-white/10'}`}
                  >
                    {row.score}
                  </Text>
                </HStack>
              </VStack>
            ))}
          </Box>
          <Button
            size='xl'
            className='w-full bg-gold-dark h-16 rounded-2xl active:opacity-90 active:scale-[0.98]'
            onPress={() => {
              if (end) {
                startNewGame();
                router.replace('/');
              } else {
                nextRound();
                router.replace('/bid');
              }
            }}
          >
            <Text className='text-[#07130D] font-black uppercase tracking-widest text-base'>
              {end ? 'Start New Game' : 'Continue to Next Round'}
            </Text>
          </Button>
        </MotiView>
      </View>
    );
  }

  return (
    <View className='flex-1 bg-[#07130D]' style={{ paddingTop: insets.top }}>
      <LinearGradient
        colors={['#07130D', '#0C2016', '#07130D']}
        className='absolute inset-0'
      />

      {/* ── Header ── */}
      <HStack
        style={{ top: insets.top + 10 }}
        className='absolute left-0 right-0 justify-between items-center px-4 z-50'
      >
        <HStack space='sm'>
          <Pill label='RND' value={String(round)} />
          {trumpSuit && trumpRevealed && (
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Pill label='TRUMP' value={SUIT_SYMBOLS[trumpSuit]} accent />
            </MotiView>
          )}
        </HStack>
        <Menu
          offset={10}
          trigger={({ ...triggerProps }) => (
            <Button
              {...triggerProps}
              variant='outline'
              className='border-gold-dark/20 bg-gold-dark/5 h-12 w-12 rounded-full p-0 active:bg-gold-dark/20'
            >
              <ButtonIcon
                as={LayoutDashboard}
                size='xl'
                className='text-gold-dark'
              />
            </Button>
          )}
          className='bg-[#0C1F14] border border-gold-dark/30 p-1.5 min-w-[170px] rounded-2xl shadow-2xl'
        >
          <MenuItem
            key='home'
            textValue='Home'
            className='rounded-xl focus:bg-gold-dark/10 active:bg-gold-dark/10 gap-3 py-3.5 px-4'
            onPress={() => router.replace('/')}
          >
            <Icon as={Home} size='sm' className='text-gold-dark/70' />
            <MenuItemLabel className='text-[#E8D5A3] font-semibold text-sm'>
              Main Menu
            </MenuItemLabel>
          </MenuItem>

          <MenuItem
            key='new-game'
            textValue='New Game'
            className='rounded-xl focus:bg-gold-dark/10 active:bg-gold-dark/10 gap-3 py-3.5 px-4'
            onPress={() => {
              startNewGame();
              router.replace('/bid');
            }}
          >
            <Icon as={RefreshCw} size='sm' className='text-gold-dark/70' />
            <MenuItemLabel className='text-[#E8D5A3] font-semibold text-sm'>
              Restart Game
            </MenuItemLabel>
          </MenuItem>

          <MenuItem
            key='close'
            textValue='Close'
            className='rounded-xl gap-3 py-3.5 px-4 border-t border-gold-dark/10 mt-1'
          >
            <Icon as={X} size='sm' className='text-red-400/50' />
            <MenuItemLabel className='text-red-400/70 font-semibold text-sm'>
              Close Menu
            </MenuItemLabel>
          </MenuItem>
        </Menu>
      </HStack>

      {/* ── Table Area ── */}
      <View className='flex-1 justify-between pb-6'>
        <Box
          className='items-center'
          style={{ paddingRight: width > 600 ? 300 : 0 }}
        >
          <Seat
            name={players.top.name}
            tricks={players.top.tricksTaken}
            bid={players.top.bid}
            active={currentSeat === 'top'}
          />
        </Box>

        <HStack className='flex-1 items-center justify-between px-2'>
          <Box className='w-20 items-center'>
            <Seat
              name={players.left.name}
              tricks={players.left.tricksTaken}
              bid={players.left.bid}
              active={currentSeat === 'left'}
            />
          </Box>

          <Box className='flex-1 items-center justify-center relative'>
            {/* ── Table Watermark & Glow ── */}
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 1500 }}
              className='absolute items-center justify-center'
              pointerEvents='none'
            >
              {/* Using the Text Symbol for the Spade */}
              <Text
                style={{
                  fontSize: FELT_SIZE * 1.3,
                  color: '#D4AF37',
                  opacity: 0.08,
                  lineHeight: FELT_SIZE * 0.7, // Adjusts vertical centering
                  textAlign: 'center',
                  fontWeight: '900',
                }}
              >
                {SUIT_SYMBOLS.spades}
              </Text>

              {/* Inner Table Glow - subtle circle to define the play area */}
              <Box
                style={{
                  width: FELT_SIZE * 1.8,
                  height: FELT_SIZE,
                  borderRadius: FELT_SIZE / 2,
                  borderWidth: 1,
                  borderColor: '#D4AF37',
                  opacity: 0.05,
                  position: 'absolute',
                }}
              />
            </MotiView>

            {/* Trick Cards Container */}
            <View
              style={{ width: FELT_SIZE, height: FELT_SIZE }}
              className='absolute items-center justify-center'
              pointerEvents='none'
            >
              {currentTrick.cards.map((tc) => {
                const s = slotFor(tc.player),
                  r = stableRot(tc.card.id);
                const tw = IS_LANDSCAPE ? 40 : 48;
                return (
                  <MotiView
                    key={tc.card.id}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      transform: [
                        { translateX: s.x - tw / 2 },
                        { translateY: s.y - (tw * CARD_H_RATIO) / 2 },
                        { rotate: `${r}deg` },
                      ],
                    }}
                    className='absolute'
                  >
                    <Card
                      card={tc.card}
                      width={tw}
                      height={tw * CARD_H_RATIO}
                    />
                  </MotiView>
                );
              })}
            </View>

            {/* Trick Winner Badge */}
            {currentTrick.winningSeat && (
              <MotiView
                from={{ opacity: 0, transform: [{ translateY: 10 }] }}
                animate={{ opacity: 1, transform: [{ translateY: 0 }] }}
                className='absolute bottom-[-14] bg-gold-dark px-4 py-1.5 rounded-full shadow-lg'
              >
                <Text className='text-[10px] text-[#07130D] font-black uppercase tracking-wider'>
                  {players[currentTrick.winningSeat].name}
                </Text>
              </MotiView>
            )}
          </Box>

          <Box className='w-20 items-center'>
            <Seat
              name={players.right.name}
              tricks={players.right.tricksTaken}
              bid={players.right.bid}
              active={currentSeat === 'right'}
            />
          </Box>
        </HStack>

        <Box className='relative w-full overflow-visible'>
          <View
            style={{ height: IS_LANDSCAPE ? 96 : 126 }}
            className='relative w-full'
          >
            {hand.map((card, i) => {
              const l = layouts[i],
                canPlay = isPlayerActive && playableIds.has(card.id),
                isPressed = pressed === card.id;
              return (
                <MotiView
                  key={card.id}
                  animate={{
                    opacity: isPlayerActive && !canPlay ? 0.3 : 1,
                    scale: isPressed ? 1.05 : 1,
                    transform: [
                      { translateY: isPressed ? -24 : l.y },
                      { rotate: `${l.rotate}deg` },
                    ],
                  }}
                  className='absolute'
                  style={{ left: l.x, bottom: -18 }}
                >
                  <Pressable
                    onPressIn={() => canPlay && setPressed(card.id)}
                    onPressOut={() => setPressed(null)}
                    onPress={() => canPlay && playPlayerCard(card.id)}
                  >
                    <Card
                      card={card}
                      width={PLAYER_CARD_W}
                      height={PLAYER_CARD_W * CARD_H_RATIO}
                    />
                    {canPlay && !isPressed && (
                      <MotiView
                        animate={{ opacity: [0, 0.8, 0] }}
                        transition={{ loop: true, duration: 2000 }}
                        className='absolute bottom-[-4] left-0 h-[3px] bg-gold-dark rounded-full shadow-sm shadow-gold-dark'
                        style={{ width: PLAYER_CARD_W }}
                      />
                    )}
                  </Pressable>
                </MotiView>
              );
            })}
          </View>
        </Box>
      </View>
    </View>
  );
}

function Seat({
  name,
  tricks,
  bid,
  active,
}: {
  name: string;
  tricks: number;
  bid: number | null;
  active: boolean;
}) {
  return (
    <VStack
      className={`items-center p-2 rounded-2xl border transition-all duration-300 ${active ? 'bg-gold-dark/10 border-gold-dark/30' : 'border-transparent opacity-60'}`}
    >
      {active && (
        <MotiView
          from={{ opacity: 0.3, scale: 0.9 }}
          animate={{ opacity: 0, scale: 1.4 }}
          transition={{ loop: true, duration: 1500 }}
          className='absolute inset-0 bg-gold-dark/20 rounded-2xl'
        />
      )}
      <Avatar
        size='md'
        className={`border-2 ${active ? 'border-gold-dark bg-gold-dark/30' : 'border-white/10 bg-white/5'}`}
      >
        <AvatarFallbackText className='text-gold-light font-black text-xs uppercase'>
          {name}
        </AvatarFallbackText>
      </Avatar>
      <Text
        className={`text-[11px] mt-1.5 font-bold uppercase tracking-tight ${active ? 'text-gold-light' : 'text-white/40'}`}
        numberOfLines={1}
      >
        {name}
      </Text>
      <Text
        className={`text-[12px] font-black mt-0.5 ${active ? 'text-gold-dark' : 'text-gold-dark/40'}`}
      >
        {tricks} / {bid ?? '—'}
      </Text>
    </VStack>
  );
}
