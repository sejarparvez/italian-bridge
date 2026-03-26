/**
 * GameTable.tsx  — landscape-native layout
 *
 * Zone map (landscape):
 *   ┌──────────────────────────────────────────────┐
 *   │  [L portrait]  [top portrait + card backs]  [R portrait] │
 *   │               [      trick area          ]               │
 *   │  [card backs]  [  human HUD + hand peek  ]  [card backs] │
 *   └──────────────────────────────────────────────┘
 *
 * Key decisions:
 *  - Left/right portraits are UPRIGHT (not rotated). They sit in a
 *    narrow vertical strip that is naturally readable from the human seat.
 *  - Human hand is pinned to the absolute bottom — cards are clipped so
 *    only the top ~55% of each card peeks above the bottom edge.
 *  - Card backs for side players fan vertically below their portraits.
 *  - isActive is derived from state inside GameTable so PortraitFrame
 *    never needs to receive it as a prop from GameScreen.
 */

import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Defs, Path, RadialGradient, Rect, Stop, Svg } from 'react-native-svg';
import { COLORS, Fonts } from '@/constants/theme';
import type { Player } from '@/engine/types';

// ─── types ──────────────────────────────────────────────────────────────────

type SeatPosition = 'top' | 'bottom' | 'left' | 'right';

interface TablePlayer extends Player {
  seat: SeatPosition;
  isHuman: boolean;
  name: string;
  bid: number | null;
  tricksTaken: number;
}

interface GameTableProps {
  players: Record<SeatPosition, TablePlayer>;
  children: React.ReactNode;
}

// ─── constants ──────────────────────────────────────────────────────────────

// Side strip width — portrait + card backs live inside this
const SIDE_W = 72;

// Top bar height — compact horizontal portrait lives here
const TOP_H = 72;

// Bottom peek height — how much of each human card is visible
const PEEK_H = 68;

const AVATAR_EMOJIS: Record<SeatPosition, string> = {
  top: '🎩',
  bottom: '♠️',
  left: '⚙️',
  right: '🎀',
};

// ─── background ─────────────────────────────────────────────────────────────

function TableBackground() {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <LinearGradient
        colors={[COLORS.feltMid, COLORS.feltDark, '#061510']}
        locations={[0, 0.4, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Svg width='100%' height='100%' style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id='vignette' cx='50%' cy='50%' r='70%'>
            <Stop offset='40%' stopColor='#000' stopOpacity='0' />
            <Stop offset='100%' stopColor='#000' stopOpacity='0.35' />
          </RadialGradient>
        </Defs>
        <Rect x='0' y='0' width='100%' height='100%' fill='url(#vignette)' />
      </Svg>
    </View>
  );
}

// ─── decorative border ───────────────────────────────────────────────────────

function TableBorder() {
  // Use '100%' strings in SVG — avoids stale Dimensions values on device
  const inset = 14;
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents='none'>
      <Svg width='100%' height='100%' style={StyleSheet.absoluteFillObject}>
        <Rect
          x={inset}
          y={inset}
          width={`calc(100% - ${inset * 2}px)`}
          height={`calc(100% - ${inset * 2}px)`}
          rx='28'
          fill='none'
          stroke={COLORS.goldPrimary}
          strokeWidth='1.5'
          opacity='0.25'
        />
        <Rect
          x={inset + 8}
          y={inset + 8}
          width={`calc(100% - ${(inset + 8) * 2}px)`}
          height={`calc(100% - ${(inset + 8) * 2}px)`}
          rx='22'
          fill='none'
          stroke={COLORS.goldPrimary}
          strokeWidth='0.5'
          opacity='0.1'
        />
      </Svg>
    </View>
  );
}

// ─── watermark ───────────────────────────────────────────────────────────────

function SpadeWatermark() {
  const { width, height } = useWindowDimensions();
  const size = Math.min(width, height) * 0.32;
  return (
    <View
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -size / 2 }, { translateY: -size / 2 }],
      }}
      pointerEvents='none'
    >
      <Svg width={size} height={size} viewBox='0 0 200 220'>
        <Path
          d='M100,10 C130,40 170,60 170,100 C170,135 140,145 115,135 C125,155 135,170 150,175 L50,175 C65,170 75,155 85,135 C60,145 30,135 30,100 C30,60 70,40 100,10 Z'
          fill={COLORS.goldPrimary}
          opacity={0.04}
        />
        <Path
          d='M85,175 C88,185 92,195 100,200 C108,195 112,185 115,175 Z'
          fill={COLORS.goldPrimary}
          opacity={0.04}
        />
      </Svg>
    </View>
  );
}

// ─── corner flourish ─────────────────────────────────────────────────────────

function CornerFlourish() {
  return (
    <Svg width={28} height={28} viewBox='0 0 28 28'>
      <Path
        d='M2,14 L14,2 M2,14 L2,6 M2,14 L6,14'
        stroke={COLORS.goldPrimary}
        strokeWidth='0.6'
        opacity='0.35'
      />
      <Path d='M5,3 L9,3 L9,7 L5,7 Z' fill={COLORS.goldPrimary} opacity='0.4' />
    </Svg>
  );
}

// ─── bid tick bar ────────────────────────────────────────────────────────────

function BidTicks({
  bid,
  tricksTaken,
  horizontal = false,
}: {
  bid: number | null;
  tricksTaken: number;
  horizontal?: boolean;
}) {
  if (!bid) return null;
  return (
    <View style={[styles.tickRow, horizontal && styles.tickRowH]}>
      {Array.from({ length: bid }).map((_, i) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: stable tick count
          key={i}
          style={[
            styles.tick,
            {
              backgroundColor:
                i < tricksTaken ? COLORS.goldPrimary : `${COLORS.goldDark}55`,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ─── vertical portrait (left / right seats) ──────────────────────────────────
// Stays upright — no rotation. Fits inside SIDE_W.

interface VerticalPortraitProps {
  player: TablePlayer;
  isActive: boolean;
  isPartner: boolean;
}

function VerticalPortrait({
  player,
  isActive,
  isPartner,
}: VerticalPortraitProps) {
  const frameColor = isPartner ? COLORS.goldPrimary : COLORS.goldDark;
  const cardCount = Math.min(player.hand?.length ?? 0, 6);

  return (
    <View style={styles.vPortraitWrap}>
      {/* Portrait card */}
      <View
        style={[
          styles.vPortraitFrame,
          { borderColor: frameColor },
          isActive && styles.frameActive,
        ]}
      >
        {/* Avatar */}
        <View style={styles.vAvatarArea}>
          <Text style={styles.avatarEmoji}>{AVATAR_EMOJIS[player.seat]}</Text>
          {isActive && <View style={styles.activePulseRing} />}
        </View>

        {/* Name */}
        <Text
          style={[
            styles.vNameText,
            { color: isPartner ? COLORS.goldLight : COLORS.textPrimary },
          ]}
          numberOfLines={1}
        >
          {player.name}
        </Text>

        {/* Score */}
        <Text style={styles.vScoreText}>
          {player.tricksTaken}/{player.bid ?? '?'}
        </Text>

        {/* Tick bar */}
        <BidTicks bid={player.bid} tricksTaken={player.tricksTaken} />
      </View>

      {/* Card backs — fanned below portrait */}
      <View style={styles.vCardStack}>
        {Array.from({ length: cardCount }).map((_, i) => {
          const angle = (i - (cardCount - 1) / 2) * 5;
          const tx = (i - (cardCount - 1) / 2) * 3;
          return (
            <View
              // biome-ignore lint/suspicious/noArrayIndexKey: stable fan
              key={i}
              style={[
                styles.vCardBack,
                {
                  transform: [{ rotate: `${angle}deg` }, { translateX: tx }],
                  zIndex: i,
                },
              ]}
            >
              {/* Plain rect standing in for CardBack — replace with your CardBack component */}
              <View style={styles.cardBackRect} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── horizontal portrait (top seat) ─────────────────────────────────────────

interface HorizontalPortraitProps {
  player: TablePlayer;
  isActive: boolean;
  isPartner: boolean;
}

function HorizontalPortrait({
  player,
  isActive,
  isPartner,
}: HorizontalPortraitProps) {
  const frameColor = isPartner ? COLORS.goldPrimary : COLORS.goldDark;

  return (
    <View
      style={[
        styles.hPortraitFrame,
        { borderColor: frameColor },
        isActive && styles.frameActive,
      ]}
    >
      {/* Avatar circle */}
      <View style={styles.hAvatarArea}>
        <Text style={styles.avatarEmojiSm}>{AVATAR_EMOJIS[player.seat]}</Text>
        {isActive && <View style={styles.activePulseRingSmall} />}
      </View>

      {/* Name + score column */}
      <View style={styles.hInfoCol}>
        <Text
          style={[
            styles.hNameText,
            { color: isPartner ? COLORS.goldLight : COLORS.textPrimary },
          ]}
          numberOfLines={1}
        >
          {player.name}
        </Text>
        <Text style={styles.hScoreText}>
          {player.tricksTaken}/{player.bid ?? '?'}
        </Text>
        <BidTicks
          bid={player.bid}
          tricksTaken={player.tricksTaken}
          horizontal
        />
      </View>
    </View>
  );
}

// ─── action menu ─────────────────────────────────────────────────────────────

interface ActionMenuProps {
  onHint?: () => void;
  onRewind?: () => void;
  onConfuse?: () => void;
  onTrade?: () => void;
  onPeek?: () => void;
}

export function ActionMenu(props: ActionMenuProps) {
  const actions = [
    { icon: '💡', label: 'Hint', onPress: props.onHint },
    { icon: '⏪', label: 'Rewind', onPress: props.onRewind },
    { icon: '😕', label: 'Confuse', onPress: props.onConfuse },
    { icon: '🔄', label: 'Trade', onPress: props.onTrade },
    { icon: '👁️', label: 'Peek', onPress: props.onPeek },
  ];

  return (
    <View style={styles.actionPanel}>
      {actions.map((a) => (
        <View key={a.label} style={styles.actionBtn}>
          <Text style={styles.actionIcon}>{a.icon}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── trump badge ─────────────────────────────────────────────────────────────

const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};
const SUIT_COLORS: Record<string, string> = {
  spades: COLORS.textPrimary,
  hearts: '#e53e3e',
  diamonds: '#e53e3e',
  clubs: COLORS.textPrimary,
};

export function TrumpBadge({ suit }: { suit: string }) {
  return (
    <View style={styles.trumpBadge}>
      <Text
        style={[
          styles.trumpSymbol,
          { color: SUIT_COLORS[suit] ?? COLORS.goldPrimary },
        ]}
      >
        {SUIT_SYMBOLS[suit] ?? suit}
      </Text>
      <Text style={styles.trumpLabel}>trump</Text>
    </View>
  );
}

// ─── main GameTable ──────────────────────────────────────────────────────────

export function GameTable({ players, children }: GameTableProps) {
  return (
    <View style={styles.root}>
      <TableBackground />
      <SpadeWatermark />
      <TableBorder />

      {/* Corner flourishes */}
      <View style={[styles.corner, styles.cornerTL]}>
        <CornerFlourish />
      </View>
      <View
        style={[
          styles.corner,
          styles.cornerTR,
          { transform: [{ scaleX: -1 }] },
        ]}
      >
        <CornerFlourish />
      </View>
      <View
        style={[
          styles.corner,
          styles.cornerBL,
          { transform: [{ scaleY: -1 }] },
        ]}
      >
        <CornerFlourish />
      </View>
      <View
        style={[
          styles.corner,
          styles.cornerBR,
          { transform: [{ scaleX: -1 }, { scaleY: -1 }] },
        ]}
      >
        <CornerFlourish />
      </View>

      {/* ── LEFT player strip ───────────────────────────────────── */}
      <View style={styles.seatLeft} pointerEvents='none'>
        <VerticalPortrait
          player={players.left}
          isActive={false}
          isPartner={false}
        />
      </View>

      {/* ── RIGHT player strip ──────────────────────────────────── */}
      <View style={styles.seatRight} pointerEvents='none'>
        <VerticalPortrait
          player={players.right}
          isActive={false}
          isPartner={false}
        />
      </View>

      {/* ── TOP player bar ──────────────────────────────────────── */}
      {/* portrait is centered; card backs fill space on BOTH sides */}
      <View style={styles.seatTop} pointerEvents='none'>
        {/* Card backs — left half */}
        <View style={styles.topCardRow}>
          {(players.top.hand ?? []).slice(0, 5).map((_, i, arr) => {
            const angle = (i / Math.max(arr.length - 1, 1) - 0.5) * 14;
            return (
              <View
                // biome-ignore lint/suspicious/noArrayIndexKey: stable fan
                key={i}
                style={[
                  styles.topCardBack,
                  { transform: [{ rotate: `${angle}deg` }] },
                ]}
              >
                <View style={styles.cardBackRectSm} />
              </View>
            );
          })}
        </View>

        {/* Portrait — pinned center */}
        <HorizontalPortrait player={players.top} isActive={false} isPartner />

        {/* Card backs — right half (mirror) */}
        <View style={styles.topCardRow}>
          {(players.top.hand ?? []).slice(0, 5).map((_, i, arr) => {
            const angle = (i / Math.max(arr.length - 1, 1) - 0.5) * 14;
            return (
              <View
                // biome-ignore lint/suspicious/noArrayIndexKey: stable fan
                key={i}
                style={[
                  styles.topCardBack,
                  { transform: [{ rotate: `${angle}deg` }] },
                ]}
              >
                <View style={styles.cardBackRectSm} />
              </View>
            );
          })}
        </View>
      </View>

      {/* ── Content layer (trick area, turn pill, etc.) ─────────── */}
      <View style={styles.content} pointerEvents='box-none'>
        {children}
      </View>
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const V_PORTRAIT_W = SIDE_W - 8; // 64px — fits inside the strip with padding
const V_AVATAR = 36;
const H_AVATAR = 32;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.feltBorder,
  },

  corner: { position: 'absolute', width: 28, height: 28 },
  cornerTL: { top: 16, left: 16 },
  cornerTR: { top: 16, right: 16 },
  cornerBL: { bottom: 16, left: 16 },
  cornerBR: { bottom: 16, right: 16 },

  // ── seat positions ───────────────────────────────────────────────

  seatLeft: {
    position: 'absolute',
    left: 0,
    top: TOP_H,
    bottom: PEEK_H,
    width: SIDE_W,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatRight: {
    position: 'absolute',
    right: 0,
    top: TOP_H,
    bottom: PEEK_H,
    width: SIDE_W,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatTop: {
    position: 'absolute',
    top: 0,
    left: SIDE_W,
    right: SIDE_W,
    height: TOP_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },

  // ── content zone (trick area etc.) ──────────────────────────────
  content: {
    position: 'absolute',
    top: TOP_H,
    left: SIDE_W,
    right: SIDE_W,
    bottom: PEEK_H,
  },

  // ── vertical portrait ────────────────────────────────────────────
  vPortraitWrap: {
    alignItems: 'center',
    gap: 8,
  },
  vPortraitFrame: {
    width: V_PORTRAIT_W,
    borderWidth: 1.5,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: `${COLORS.feltBorder}CC`,
    alignItems: 'center',
    paddingBottom: 4,
  },
  frameActive: {
    borderColor: COLORS.goldPrimary,
    shadowColor: COLORS.goldPrimary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 10,
  },
  vAvatarArea: {
    width: '100%',
    height: V_AVATAR,
    backgroundColor: COLORS.feltDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.goldDark}50`,
  },
  avatarEmoji: { fontSize: 20 },
  avatarEmojiSm: { fontSize: 16 },
  activePulseRing: {
    position: 'absolute',
    width: V_AVATAR - 4,
    height: V_AVATAR - 4,
    borderRadius: (V_AVATAR - 4) / 2,
    borderWidth: 2,
    borderColor: COLORS.goldPrimary,
    opacity: 0.65,
  },
  activePulseRingSmall: {
    position: 'absolute',
    width: H_AVATAR - 4,
    height: H_AVATAR - 4,
    borderRadius: (H_AVATAR - 4) / 2,
    borderWidth: 2,
    borderColor: COLORS.goldPrimary,
    opacity: 0.65,
  },
  vNameText: {
    fontFamily: Fonts.display,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 3,
    maxWidth: V_PORTRAIT_W - 6,
  },
  vScoreText: {
    fontFamily: Fonts.display,
    fontSize: 9,
    color: COLORS.goldLight,
    fontWeight: '600',
    marginTop: 1,
  },

  // ── tick bar ─────────────────────────────────────────────────────
  tickRow: {
    flexDirection: 'column',
    gap: 2,
    marginTop: 3,
    flexWrap: 'wrap',
    maxHeight: 26,
    alignItems: 'center',
  },
  tickRowH: {
    flexDirection: 'row',
    maxHeight: undefined,
  },
  tick: {
    width: 5,
    height: 5,
    borderRadius: 1,
  },

  // ── card backs in vertical strip ─────────────────────────────────
  vCardStack: {
    position: 'relative',
    width: V_PORTRAIT_W,
    height: 32,
    alignItems: 'center',
  },
  vCardBack: {
    position: 'absolute',
  },
  cardBackRect: {
    width: 14,
    height: 22,
    borderRadius: 2,
    backgroundColor: '#2a5a8a',
    borderWidth: 0.5,
    borderColor: '#ffffff20',
  },
  cardBackRectSm: {
    width: 12,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#2a5a8a',
    borderWidth: 0.5,
    borderColor: '#ffffff20',
  },

  // ── horizontal portrait ──────────────────────────────────────────
  hPortraitFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: `${COLORS.feltBorder}CC`,
    paddingRight: 6,
    height: TOP_H - 8,
  },
  hAvatarArea: {
    width: H_AVATAR + 8,
    height: '100%',
    backgroundColor: COLORS.feltDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: `${COLORS.goldDark}40`,
  },
  hInfoCol: {
    gap: 2,
  },
  hNameText: {
    fontFamily: Fonts.display,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  hScoreText: {
    fontFamily: Fonts.display,
    fontSize: 9,
    color: COLORS.goldLight,
    fontWeight: '600',
  },

  // ── top card row ─────────────────────────────────────────────────
  topCardRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  topCardBack: {
    marginHorizontal: -2,
  },

  // ── action menu ──────────────────────────────────────────────────
  actionPanel: {
    backgroundColor: '#3D2914E6',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: `${COLORS.goldPrimary}60`,
    padding: 5,
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: COLORS.feltBorder,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${COLORS.goldDark}40`,
  },
  actionIcon: { fontSize: 14 },

  // ── trump badge ───────────────────────────────────────────────────
  trumpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#1a1a1aCC',
    borderWidth: 1,
    borderColor: `${COLORS.goldPrimary}60`,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  trumpSymbol: {
    fontSize: 14,
    fontWeight: '700',
  },
  trumpLabel: {
    fontSize: 9,
    color: COLORS.goldLight,
    fontFamily: Fonts.display,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
