import { Card } from '@/components/cards/Card';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Menu, MenuItem, MenuItemLabel } from '@/components/ui/menu';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { SUIT_SYMBOLS } from '@/constants/cards';
import { C } from '@/constants/theme';
import { getWinner } from '@/game/engine';
import { getPlayableCards } from '@/game/trick';
import { ActiveHalo } from '@/game/ui/active-halo';
import DealCard from '@/game/ui/deal-card';
import FeltTable from '@/game/ui/felt-table';
import { getHandLayout } from '@/game/ui/helpers';
import OpponentSeat from '@/game/ui/opponent-seat';
import ScorePanel from '@/game/ui/score-panel';
import TeamScoreBadge from '@/game/ui/team-score-badge';
import TrickCard from '@/game/ui/trick-card';
import TrumpIntentModal from '@/game/ui/trump-intent-modal';
import TrumpMiniCard from '@/game/ui/trump-mini-card';
import WinnerBanner from '@/game/ui/winner-banner';
import { useGameStore } from '@/store/gameStore';
import { sortHandAlternating } from '@/utils/card-sort';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Home, RefreshCw, Settings, X } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ── Constants ─────────────────────────────────────────────────────────────────

const { width, height } = Dimensions.get('window');
const SCREEN_H = Math.min(width, height);
const SCREEN_W = Math.max(width, height);

const CARD_W = SCREEN_H * 0.17;
const CARD_H = CARD_W * 1.45;
const TRICK_CARD_W = SCREEN_H * 0.13;
const TRICK_CARD_H = TRICK_CARD_W * 1.55;

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function GameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, playPlayerCard, startNewGame, nextRound } = useGameStore();
  const [pressed, setPressed] = useState<string | null>(null);
  const lastTrickCount = useRef(0);

  type TrumpIntent = 'idle' | 'pending' | 'trumping' | 'discarding';
  const [trumpIntent, setTrumpIntent] = useState<TrumpIntent>('idle');

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

  // Reset intent whenever a new trick starts
  const trickLen = currentTrick.cards.length;
  useEffect(() => {
    if (trickLen === 0) setTrumpIntent('idle');
  }, [trickLen]);

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

  // Track latest card for the dramatic play-in animation on TrickCard
  const latestCardId =
    currentTrick.cards.length > lastTrickCount.current
      ? currentTrick.cards[currentTrick.cards.length - 1]?.card.id
      : null;
  useEffect(() => {
    lastTrickCount.current = currentTrick.cards.length;
  }, [currentTrick.cards.length]);

  // ── Determine if player is void in led suit ───────────────────────────────
  const isVoidInLedSuit = useMemo(() => {
    if (!isPlayerActive || !currentTrick.leadSuit) return false;
    return !players.bottom.hand.some((c) => c.suit === currentTrick.leadSuit);
  }, [isPlayerActive, currentTrick.leadSuit, players.bottom.hand]);

  // ── Trigger the pending prompt once when void is detected ────────────────
  useEffect(() => {
    if (isVoidInLedSuit && trumpIntent === 'idle' && isPlayerActive) {
      setTrumpIntent('pending');
    }
  }, [isVoidInLedSuit, trumpIntent, isPlayerActive]);

  const wantsToTrump = trumpIntent === 'trumping';

  const playableIds = useMemo<Set<string>>(() => {
    if (!isPlayerActive) return new Set();

    if (trumpIntent === 'pending') return new Set();
    return new Set(
      getPlayableCards(
        players.bottom.hand,
        currentTrick,
        trumpSuit,
        trumpRevealed,
        wantsToTrump,
      ).map((c) => c.id),
    );
  }, [
    isPlayerActive,
    trumpIntent,
    players.bottom.hand,
    currentTrick,
    trumpSuit,
    trumpRevealed,
    wantsToTrump,
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
        className='absolute left-6 right-0 flex-row justify-between items-center px-3.5 z-50'
        style={{ top: insets.top + 8 }}
      >
        <HStack space='4xl'>
          {trumpSuit && (trumpRevealed || canPeek) && (
            <TrumpMiniCard
              suit={trumpSuit}
              revealed={trumpRevealed}
              canPeek={canPeek}
            />
          )}
          <ScorePanel btScore={teamScores.BT} lrScore={teamScores.LR} />
        </HStack>

        <Menu
          offset={-20}
          trigger={({ ...triggerProps }) => (
            <Pressable
              {...triggerProps}
              className='w-9 h-9 rounded-full border items-center justify-center right-10'
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

        {/* Center felt */}
        <View className='flex-1 items-center justify-center relative'>
          {/* Top seat */}
          <MotiView
            from={{ opacity: 0, translateY: -28 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, delay: 130 }}
            className='absolute -top-12 items-center justify-center'
          >
            <OpponentSeat
              name={players.top.name}
              active={currentSeat === 'top'}
              orientation='horizontal'
            />
          </MotiView>

          {/* Watermark */}
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

          {/* Trick cards */}
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
          className='items-center justify-center right-8'
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
        className='flex-row items-center justify-between px-4 pb-1 left-6 mb-0.5'
      >
        <HStack className='items-center gap-2.5'>
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

      {isPlayerActive && trumpIntent === 'pending' && trumpSuit && (
        <TrumpIntentModal
          trumpSuit={trumpSuit}
          trumpSymbol={SUIT_SYMBOLS[trumpSuit as keyof typeof SUIT_SYMBOLS]}
          onTrump={() => setTrumpIntent('trumping')}
          onDiscard={() => setTrumpIntent('discarding')}
        />
      )}

      {/* ── Player Hand ── */}
      <View
        className='relative w-full overflow-visible'
        style={{ height: CARD_H * 0.72 }}
      >
        {hand.map((card, i) => {
          const l = layouts[i];
          const canPlay = isPlayerActive && playableIds.has(card.id);
          const isPressed = pressed === card.id;

          return (
            <DealCard key={card.id} cardId={card.id} index={i}>
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
                  onPress={() => {
                    if (!canPlay) return;
                    playPlayerCard(card.id, wantsToTrump);
                    setTrumpIntent('idle');
                  }}
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
