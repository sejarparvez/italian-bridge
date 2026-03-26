/**
 * GameScreen.tsx — landscape-native game screen
 *
 * Layout contract (matches GameTable zones):
 *   - Left/right AI:  vertical strips (SIDE_W = 72px each side)
 *   - Top AI:         horizontal bar  (TOP_H  = 72px)
 *   - Human hand:     pinned to absolute bottom — cards overflow bottom edge
 *                     so only the top ~55-60% of each card is visible (peek)
 *   - Trick area:     fills remaining center space
 */

import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/cards';
import { ActionMenu, GameTable, TrumpBadge } from '@/components/table';
import { COLORS, Fonts } from '@/constants/theme';
import type { Card as CardType, PlayerId } from '@/engine/types';
import { useGameStore } from '@/store';

// ─── random AI names ────────────────────────────────────────────────────────

const AI_NAME_POOL = [
  'Alex',
  'Jordan',
  'Sam',
  'Morgan',
  'Casey',
  'Riley',
  'Quinn',
  'Avery',
  'Blake',
  'Drew',
  'Skyler',
  'Reese',
  'Parker',
  'Emerson',
  'Dakota',
];

function useAiNames(): [string, string, string] {
  return useMemo(() => {
    const pool = [...AI_NAME_POOL];
    const pick = () =>
      pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    return [pick(), pick(), pick()] as [string, string, string];
  }, []);
}

// ─── constants ──────────────────────────────────────────────────────────────

const SIDE_W = 72;
const PEEK_H = 68;
const CARD_W = 52;

// ─── trick area ──────────────────────────────────────────────────────────────

function getCardPosition(
  playerId: PlayerId,
): 'top' | 'right' | 'bottom' | 'left' {
  switch (playerId) {
    case 0:
      return 'bottom';
    case 1:
      return 'right';
    case 2:
      return 'top';
    case 3:
      return 'left';
  }
}

function TrickArea({
  currentTrick,
}: {
  currentTrick: Map<PlayerId, CardType> | null;
}) {
  if (!currentTrick || currentTrick.size === 0) return null;

  const cardPos: Record<string, { top: number; left: number; rotate: number }> =
    {
      top: { top: 0, left: 50, rotate: -7 },
      bottom: { top: 76, left: 50, rotate: 0 },
      left: { top: 34, left: 2, rotate: -10 },
      right: { top: 34, left: 98, rotate: 10 },
    };

  return (
    <View style={trick.container}>
      {Array.from(currentTrick.entries()).map(([playerId, card]) => {
        const pos = cardPos[getCardPosition(playerId)];
        return (
          <View
            key={playerId}
            style={[
              trick.card,
              {
                top: pos.top,
                left: pos.left,
                transform: [{ rotate: `${pos.rotate}deg` }],
              },
            ]}
          >
            <Card suit={card.suit} rank={card.rank} width={40} />
          </View>
        );
      })}
    </View>
  );
}

const trick = StyleSheet.create({
  container: { width: 145, height: 122, position: 'relative' },
  card: { position: 'absolute' },
});

// ─── hand card with lift animation ───────────────────────────────────────────

function HandCard({
  card,
  isPlayable,
  isHumanPlaying,
  rotation,
  onPress,
}: {
  card: CardType;
  isPlayable: boolean;
  isHumanPlaying: boolean;
  rotation: number;
  onPress: () => void;
}) {
  const liftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(liftAnim, {
      toValue: isPlayable && isHumanPlaying ? 1 : 0,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  }, [isPlayable, isHumanPlaying, liftAnim]);

  const translateY = liftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });

  return (
    <Pressable
      onPress={onPress}
      disabled={!isHumanPlaying}
      style={{ marginHorizontal: -5 }}
      hitSlop={{ top: 16, bottom: 0, left: 4, right: 4 }}
    >
      <Animated.View
        style={{ transform: [{ rotate: `${rotation}deg` }, { translateY }] }}
      >
        <Card
          suit={card.suit}
          rank={card.rank}
          width={CARD_W}
          highlighted={isPlayable && isHumanPlaying}
        />
      </Animated.View>
    </Pressable>
  );
}

// ─── turn pill ────────────────────────────────────────────────────────────────

function TurnPill({ name }: { name: string }) {
  return (
    <View style={turn.pill}>
      <View style={turn.dot} />
      <Text style={turn.text}>{name}'s turn</Text>
    </View>
  );
}

const turn = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#00000066',
    borderWidth: 1,
    borderColor: `${COLORS.goldPrimary}40`,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.goldPrimary,
  },
  text: {
    fontFamily: Fonts.display,
    fontSize: 10,
    color: COLORS.goldLight,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});

// ─── main screen ─────────────────────────────────────────────────────────────

export default function GameScreen() {
  const router = useRouter();
  const [nameLeft, nameTop, nameRight] = useAiNames();

  const {
    state,
    playCard,
    getHumanHand,
    getPlayableCards,
    isHumanTurn,
    getCurrentTrick,
  } = useGameStore();

  useEffect(() => {
    if (state.phase === 'bidding') router.replace('/bid');
    else if (state.phase === 'result') router.replace('/result');
  }, [state.phase, router.replace]);

  const humanHand = getHumanHand();
  const playableCards = getPlayableCards();
  const currentTrick = getCurrentTrick();
  const isHumanPlaying = isHumanTurn();

  const handleCardPress = (card: CardType) => {
    if (!isHumanPlaying) return;
    if (playableCards.some((c) => c.suit === card.suit && c.rank === card.rank))
      playCard(card);
  };

  const getBid = (id: PlayerId) =>
    state.bids.find((b) => b.player === id)?.tricks ?? null;
  const getWins = (id: PlayerId) =>
    state.trickWins.filter((w) => w === id).length;
  const isActive = (id: PlayerId) => state.currentPlayer === id;

  const nameMap: Record<PlayerId, string> = {
    0: 'You',
    1: nameRight,
    2: nameTop,
    3: nameLeft,
  };
  const activeName =
    state.currentPlayer !== null ? nameMap[state.currentPlayer] : null;

  const totalCards = humanHand.length;
  const fanSpread = Math.min(22, totalCards * 1.8);

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <GameTable
        players={{
          bottom: {
            ...state.players[0],
            seat: 'bottom',
            isHuman: true,
            name: 'You',
            bid: getBid(0),
            tricksTaken: getWins(0),
          },
          top: {
            ...state.players[2],
            seat: 'top',
            isHuman: false,
            name: nameTop,
            bid: getBid(2),
            tricksTaken: getWins(2),
          },
          left: {
            ...state.players[3],
            seat: 'left',
            isHuman: false,
            name: nameLeft,
            bid: getBid(3),
            tricksTaken: getWins(3),
          },
          right: {
            ...state.players[1],
            seat: 'right',
            isHuman: false,
            name: nameRight,
            bid: getBid(1),
            tricksTaken: getWins(1),
          },
        }}
      >
        {/* Trump badge — top-right of content zone */}
        {state.trump && (
          <View style={gs.trumpPos}>
            <TrumpBadge suit={state.trump} />
          </View>
        )}

        {/* Action menu — top-left of content zone */}
        <View style={gs.actionPos}>
          <ActionMenu />
        </View>

        {/* Trick area — centered in content zone */}
        <View style={gs.trickWrap} pointerEvents='none'>
          <TrickArea currentTrick={currentTrick} />
        </View>
      </GameTable>

      {/* Turn pill — floats above the hand, screen-relative */}
      {activeName && (
        <View style={gs.turnWrap} pointerEvents='none'>
          <TurnPill name={activeName} />
        </View>
      )}

      {/*
       * Human hand — OUTSIDE GameTable so it positions relative to the
       * screen root, not the content zone.
       *
       * bottom: 0 aligns the container's bottom with the screen bottom.
       * The cards inside are full height (CARD_H) but the container only
       * shows PEEK_H worth — the rest overflows below and is clipped by
       * the screen edge naturally.
       */}
      <View style={gs.handOuter} pointerEvents='box-none'>
        {/* HUD bar — sits above the peeking cards */}
        <View style={gs.humanHud}>
          <Text style={gs.hudName}>You</Text>
          <Text style={gs.hudScore}>
            {getWins(0)}/{getBid(0) ?? '?'}
          </Text>
          {getBid(0) !== null && (
            <View style={gs.hudTicks}>
              {/** biome-ignore lint/style/noNonNullAssertion: this is fine */}
              {Array.from({ length: getBid(0)! }).map((_, i) => (
                <View
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable
                  key={i}
                  style={[
                    gs.hudTick,
                    {
                      backgroundColor:
                        i < getWins(0)
                          ? COLORS.goldPrimary
                          : `${COLORS.goldDark}55`,
                    },
                  ]}
                />
              ))}
            </View>
          )}
          {isActive(0) && <View style={gs.activeIndicator} />}
        </View>

        {/* Card fan */}
        <View style={gs.handRow}>
          {humanHand.map((card, i) => {
            const isPlayable = playableCards.some(
              (c) => c.suit === card.suit && c.rank === card.rank,
            );
            const t = totalCards > 1 ? i / (totalCards - 1) : 0.5;
            return (
              <HandCard
                key={`${card.suit}-${card.rank}-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: this is fine
                  i
                }`}
                card={card}
                isPlayable={isPlayable}
                isHumanPlaying={isHumanPlaying}
                rotation={(t - 0.5) * fanSpread}
                onPress={() => handleCardPress(card)}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const gs = StyleSheet.create({
  trumpPos: { position: 'absolute', top: 8, right: 8, zIndex: 10 },
  actionPos: { position: 'absolute', top: 8, left: 8, zIndex: 10 },

  trickWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Screen-relative: sits just above the peek strip
  turnWrap: {
    position: 'absolute',
    bottom: PEEK_H + 6,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },

  // Screen-relative: bottom:0 means it touches the screen bottom.
  // Cards are CARD_H tall but only PEEK_H is above the fold —
  // the rest is clipped by the device edge. No math needed.
  handOuter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },

  humanHud: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#00000055',
    borderRadius: 8,
    marginBottom: 6,
    alignSelf: 'center',
  },
  hudName: {
    fontFamily: Fonts.display,
    fontSize: 10,
    color: COLORS.goldLight,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  hudScore: {
    fontFamily: Fonts.display,
    fontSize: 10,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  hudTicks: { flexDirection: 'row', gap: 2, alignItems: 'center' },
  hudTick: { width: 5, height: 5, borderRadius: 1 },
  activeIndicator: {
    marginLeft: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.goldPrimary,
  },

  handRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: SIDE_W,
    // overflow hidden so cards below screen bottom don't create scroll
    overflow: 'hidden',
    height: PEEK_H,
  },
});
