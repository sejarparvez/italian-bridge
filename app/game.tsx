import { Card } from '@/src/components/cards/Card';
import { SUIT_SYMBOLS } from '@/src/constants/cards';
import type { SeatPosition } from '@/src/game/types';
import { useGameStore } from '@/src/store/gameStore';
import { sortHandAlternating } from '@/utils/card-sort';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// ─── Layout constants ───────────────────────────────────────────
const PLAYER_CARD_W = 56;
const PLAYER_CARD_OVERLAP = 34;
const OPPONENT_CARD_W = 34;
const OPPONENT_CARD_H = 50;
const OPPONENT_OVERLAP = 5;

// Horizontal fan spread for player's hand
const getPlayerHandLayout = (count: number) => {
  const visibleWidth = PLAYER_CARD_W + (count - 1) * PLAYER_CARD_OVERLAP;
  const startX = (width - visibleWidth) / 2;
  return Array.from({ length: count }, (_, i) => ({
    x: startX + i * PLAYER_CARD_OVERLAP,
    rotate: (i - (count - 1) / 2) * 3.5, // gentle arc
    y: Math.abs(i - (count - 1) / 2) * 2, // slight vertical arc
  }));
};

export default function GameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, playPlayerCard, startNewGame } = useGameStore();
  const [pressedCard, setPressedCard] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const handleCardPress = (cardId: string) => {
    if (state.currentSeat === 'bottom' && state.phase === 'playing') {
      playPlayerCard(cardId);
    }
  };

  // Position of each trick card slot relative to table center
  const getTrickSlot = (player: SeatPosition) => {
    const cx = 0;
    const cy = 0;
    const off = 52;
    switch (player) {
      case 'bottom':
        return { x: cx, y: cy + off };
      case 'top':
        return { x: cx, y: cy - off };
      case 'left':
        return { x: cx - off, y: cy };
      case 'right':
        return { x: cx + off, y: cy };
    }
  };

  // ── Game Over screen ─────────────────────────────────────────
  const isGameOver = state.phase === 'roundEnd' || state.phase === 'gameEnd';
  if (isGameOver) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#061510', '#0D2B1A', '#061510']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.vignetteOverlay} />

        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 18 }}
          style={styles.resultContainer}
        >
          <View style={styles.decorativeRule}>
            <View style={styles.ruleLine} />
            <Text style={styles.ruleGem}>◆</Text>
            <View style={styles.ruleLine} />
          </View>

          <Text style={styles.resultTitle}>
            {state.phase === 'gameEnd' ? 'GAME OVER' : 'ROUND COMPLETE'}
          </Text>
          <Text style={styles.resultSubtitle}>
            {state.phase === 'gameEnd' ? 'Final Standings' : 'Scores'}
          </Text>

          <View style={styles.scoreBoard}>
            <View style={styles.scoreBoardInner}>
              <View style={styles.scoreRow}>
                <View style={styles.scoreTeamInfo}>
                  <Text style={styles.teamBadge}>BT</Text>
                  <Text style={styles.teamName}>You &amp; Alex</Text>
                </View>
                <Text style={styles.teamScore}>{state.teamScores.BT}</Text>
              </View>
              <View style={styles.scoreDividerH} />
              <View style={styles.scoreRow}>
                <View style={styles.scoreTeamInfo}>
                  <Text style={styles.teamBadge}>LR</Text>
                  <Text style={styles.teamName}>Jordan &amp; Sam</Text>
                </View>
                <Text style={styles.teamScore}>{state.teamScores.LR}</Text>
              </View>
            </View>
          </View>

          <View style={styles.decorativeRule}>
            <View style={styles.ruleLine} />
            <Text style={styles.ruleGem}>◆</Text>
            <View style={styles.ruleLine} />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.nextButtonPressed,
            ]}
            onPress={() => {
              if (state.phase === 'gameEnd') {
                useGameStore.getState().startNewGame();
                router.replace('/');
              } else {
                useGameStore.getState().nextRound();
                router.replace('/bid');
              }
            }}
          >
            <LinearGradient
              colors={['#D4AF37', '#C9A84C', '#A8872A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {state.phase === 'gameEnd' ? 'NEW GAME' : 'NEXT ROUND'}
              </Text>
            </LinearGradient>
          </Pressable>
        </MotiView>
      </View>
    );
  }

  // ── Main game ────────────────────────────────────────────────
  const {
    players,
    currentTrick,
    currentSeat,
    trumpSuit,
    trumpRevealed,
    round,
    completedTricks,
  } = state;
  const playerHand = sortHandAlternating(players.bottom.hand);
  const handLayouts = getPlayerHandLayout(playerHand.length);
  const isPlayerTurn = currentSeat === 'bottom';
  const isPlayerActive = state.phase === 'playing' && isPlayerTurn;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Background ── */}
      <LinearGradient
        colors={['#061510', '#0D2B1A', '#061510']}
        style={StyleSheet.absoluteFill}
      />
      {/* Felt texture ring */}
      <View style={styles.feltRing} />
      <View style={styles.vignetteOverlay} />

      {/* ── Menu Button ──────────────────────────────────────── */}
      <Pressable
        style={[styles.menuButton, { top: insets.top + 8 }]}
        onPress={() => setShowMenu(!showMenu)}
      >
        <Text style={styles.menuButtonText}>☰</Text>
      </Pressable>

      {/* ── Menu Modal ──────────────────────────────────────── */}
      {showMenu && (
        <View style={[styles.menuModal, { top: insets.top + 52 }]}>
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              router.replace('/');
            }}
          >
            <Text style={styles.menuItemText}>🏠 Home</Text>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              startNewGame();
              router.replace('/bid');
            }}
          >
            <Text style={styles.menuItemText}>🎮 New Game</Text>
          </Pressable>
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
            }}
          >
            <Text style={styles.menuItemText}>📊 Scores</Text>
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => setShowMenu(false)}>
            <Text style={styles.menuItemText}>✕ Close</Text>
          </Pressable>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════════
          MAIN TABLE AREA
      ══════════════════════════════════════════════════════════ */}
      <View style={styles.tableArea}>
        {/* ── TOP PLAYER ────────────────────────────────── */}
        <View style={styles.topZone}>
          <OpponentPortrait
            name={players.top.name}
            tricks={players.top.tricksTaken}
            bid={players.top.bid}
            isActive={currentSeat === 'top'}
            position='top'
          />
        </View>

        {/* ── MIDDLE ROW  (Left · Felt · Right) ─────────── */}
        <View style={styles.middleRow}>
          {/* LEFT PLAYER */}
          <View style={styles.sideZone}>
            <OpponentPortrait
              name={players.left.name}
              tricks={players.left.tricksTaken}
              bid={players.left.bid}
              isActive={currentSeat === 'left'}
              position='left'
            />
          </View>

          {/* ── FELT / TRICK AREA ── */}
          <View style={styles.feltArea}>
            {/* Outer glow ring */}
            <View style={styles.feltGlowRing} />
            {/* Felt circle */}
            <View style={styles.feltCircle} />

            {/* Trick cards — absolutely positioned relative to feltArea center */}
            <View style={styles.trickContainer} pointerEvents='none'>
              {currentTrick.cards.map((tc) => {
                const slot = getTrickSlot(tc.player);
                return (
                  <MotiView
                    key={tc.card.id}
                    from={{ opacity: 0, scale: 0.5 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      rotate: `${(Math.random() * 14 - 7).toFixed(1)}deg`,
                    }}
                    transition={{ type: 'spring', damping: 14, stiffness: 130 }}
                    style={[
                      styles.trickCard,
                      {
                        transform: [
                          { translateX: slot.x - 25 },
                          { translateY: slot.y - 35 },
                        ],
                      },
                    ]}
                  >
                    <Card card={tc.card} />
                  </MotiView>
                );
              })}
            </View>

            {/* Winner badge */}
            {currentTrick.winningSeat && (
              <MotiView
                from={{ opacity: 0, translateY: 6 }}
                animate={{ opacity: 1, translateY: 0 }}
                style={styles.winnerBadge}
              >
                <Text style={styles.winnerBadgeText}>
                  ♛ {players[currentTrick.winningSeat].name}
                </Text>
              </MotiView>
            )}
          </View>

          {/* RIGHT PLAYER */}
          <View style={styles.sideZone}>
            <OpponentPortrait
              name={players.right.name}
              tricks={players.right.tricksTaken}
              bid={players.right.bid}
              isActive={currentSeat === 'right'}
              position='right'
            />
          </View>
        </View>

        {/* ── BOTTOM — YOU ──────────────────────────────── */}
        <View style={styles.bottomZone}>
          {/* Left: Round */}
          <View style={styles.bottomInfo}>
            <Text style={styles.bottomInfoLabel}>R</Text>
            <Text style={styles.bottomInfoValue}>{round}</Text>
          </View>

          {/* ── Fanned hand ── */}
          <View style={[styles.handContainer, { height: 130 }]}>
            {playerHand.map((card, index) => {
              const layout = handLayouts[index];
              const isPlayable = isPlayerTurn;
              const isPressed = pressedCard === card.id;
              return (
                <MotiView
                  key={card.id}
                  from={{ opacity: 0, translateY: 60 }}
                  animate={{
                    opacity: isPlayable ? 1 : 0.5,
                    translateY: isPressed ? -22 : layout.y,
                    scale: isPressed ? 1.1 : 1,
                    rotate: `${layout.rotate}deg`,
                  }}
                  transition={{
                    delay: index * 35,
                    type: 'spring',
                    damping: 14,
                  }}
                  style={[styles.cardInHand, { left: layout.x }]}
                >
                  <Pressable
                    onPressIn={() => isPlayable && setPressedCard(card.id)}
                    onPressOut={() => setPressedCard(null)}
                    onPress={() => {
                      setPressedCard(null);
                      isPlayable && handleCardPress(card.id);
                    }}
                  >
                    <Card card={card} />
                  </Pressable>
                </MotiView>
              );
            })}
          </View>

          {/* Right: Trump */}
          <View style={styles.bottomInfo}>
            <Text style={styles.bottomInfoLabel}>TRUMP</Text>
            {trumpSuit ? (
              <Text
                style={[
                  styles.bottomInfoTrump,
                  {
                    color: ['hearts', 'diamonds'].includes(trumpSuit)
                      ? '#E8534A'
                      : '#E8D5A3',
                  },
                ]}
              >
                {SUIT_SYMBOLS[trumpSuit]}
              </Text>
            ) : (
              <Text style={styles.bottomInfoValue}>—</Text>
            )}
          </View>

          {/* Turn Banner - only show for bot turns */}
          {!isPlayerActive && (
            <View
              style={[styles.turnBanner, { paddingBottom: insets.bottom + 8 }]}
            >
              <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <LinearGradient
                  colors={[
                    'transparent',
                    'rgba(6,21,16,0.9)',
                    'rgba(6,21,16,0.98)',
                  ]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />
                <View style={styles.turnInner}>
                  <MotiView
                    animate={{
                      backgroundColor: 'rgba(201,168,76,0.3)',
                      opacity: [1, 0.5, 1],
                    }}
                    transition={{
                      loop: true,
                      duration: 800,
                    }}
                    style={styles.turnDot}
                  />
                  <Text style={styles.turnText}>
                    {`${players[currentSeat].name}'s Turn`}
                  </Text>
                </View>
              </MotiView>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Opponent Portrait Card ──────────────────────────────────────
// Replaces the old PlayerBubble with a portrait-style card like the reference image
function OpponentPortrait({
  name,
  tricks,
  bid,
  isActive,
  position,
}: {
  name: string;
  tricks: number;
  bid: number | null | undefined;
  isActive: boolean;
  position: 'top' | 'left' | 'right';
}) {
  // First letter(s) as avatar since we don't have real portrait assets
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <MotiView
      animate={{
        borderColor: isActive ? '#C9A84C' : 'rgba(201,168,76,0.2)',
        shadowOpacity: isActive ? 0.9 : 0.3,
      }}
      transition={{ type: 'timing', duration: 300 }}
      style={styles.portrait}
    >
      {/* Active glow ring */}
      {isActive && (
        <MotiView
          from={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ loop: true, duration: 1100, type: 'timing' }}
          style={styles.portraitHalo}
        />
      )}

      {/* Portrait "image" area — replace with <Image> if you have assets */}
      <View
        style={[styles.portraitImage, isActive && styles.portraitImageActive]}
      >
        <Text style={styles.portraitInitials}>{initials}</Text>
        {/* Decorative corner filigree marks */}
        <Text style={styles.portraitCornerTL}>◈</Text>
        <Text style={styles.portraitCornerBR}>◈</Text>
      </View>

      {/* Gold nameplate strip */}
      <LinearGradient
        colors={
          isActive
            ? ['#C9A84C', '#A8872A']
            : ['rgba(201,168,76,0.25)', 'rgba(168,135,42,0.15)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.portraitNameplate}
      >
        <Text
          style={[styles.portraitName, isActive && styles.portraitNameActive]}
          numberOfLines={1}
        >
          {name}
        </Text>
      </LinearGradient>

      {/* Bid / tricks row */}
      <View style={styles.portraitStats}>
        <Text style={styles.portraitStat}>{tricks}</Text>
        <Text style={styles.portraitStatSep}>/</Text>
        <Text style={styles.portraitStat}>{bid ?? '?'}</Text>
      </View>
    </MotiView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  vignetteOverlay: {
    position: 'absolute',
    inset: 0,
    borderWidth: 48,
    borderColor: 'rgba(0,0,0,0.45)',
    borderRadius: 0,
  },

  // Decorative felt ring behind everything
  feltRing: {
    position: 'absolute',
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: (width * 0.85) / 2,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.06)',
    top: height / 2 - (width * 0.85) / 2,
    left: width * 0.075,
  },

  // ── Table ────────────────────────────────────────────────────
  tableArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 10,
  },

  // TOP ZONE
  topZone: { alignItems: 'center' },
  topFan: {
    flexDirection: 'row',
    height: OPPONENT_CARD_H,
    width: OPPONENT_CARD_W + (7 - 1) * OPPONENT_OVERLAP,
    marginTop: -8,
  },

  // MIDDLE ROW
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    marginVertical: 4,
  },

  // SIDE ZONE
  sideZone: { width: 80, alignItems: 'center' },
  sideFan: {
    width: OPPONENT_CARD_H, // rotated — height becomes width
    height: OPPONENT_CARD_W + (7 - 1) * (OPPONENT_OVERLAP - 2),
    position: 'relative',
  },

  // Opponent card face-down rectangles
  opponentCard: {
    position: 'absolute',
    width: OPPONENT_CARD_W,
    height: OPPONENT_CARD_H,
    backgroundColor: '#1A4A2E',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 4,
  },
  opponentCardV: {
    position: 'absolute',
    width: OPPONENT_CARD_H, // landscape orientation
    height: OPPONENT_CARD_W,
    backgroundColor: '#1A4A2E',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 4,
  },

  // ── Felt Area ────────────────────────────────────────────────
  feltArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  feltGlowRing: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.08)',
    backgroundColor: 'transparent',
  },
  feltCircle: {
    width: 186,
    height: 186,
    borderRadius: 93,
    backgroundColor: 'rgba(8,28,18,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  feltWatermark: {
    fontSize: 80,
    color: 'rgba(201,168,76,0.05)',
    fontWeight: '900',
  },
  feltTrump: {
    fontSize: 56,
    fontWeight: '900',
  },
  feltRound: {
    position: 'absolute',
    bottom: 8,
    fontSize: 10,
    color: 'rgba(201,168,76,0.4)',
    fontWeight: '700',
    letterSpacing: 1,
  },
  trickContainer: {
    position: 'absolute',
    width: 186,
    height: 186,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trickCard: { position: 'absolute' },
  winnerBadge: {
    position: 'absolute',
    bottom: -16,
    backgroundColor: '#C9A84C',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: '#C9A84C',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  winnerBadgeText: {
    fontSize: 10,
    color: '#061510',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  trickCounter: {
    position: 'absolute',
    top: 10,
    right: 10,
    alignItems: 'center',
  },
  trickCountNum: { fontSize: 14, color: '#C9A84C', fontWeight: '800' },
  trickCountLabel: {
    fontSize: 7,
    color: 'rgba(201,168,76,0.5)',
    letterSpacing: 1.5,
  },

  // ── Portrait ─────────────────────────────────────────────────
  portrait: {
    width: 72,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(201,168,76,0.2)',
    backgroundColor: 'rgba(6,21,16,0.85)',
    overflow: 'hidden',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  portraitHalo: {
    position: 'absolute',
    inset: -8,
    borderRadius: 18,
    backgroundColor: 'rgba(201,168,76,0.15)',
    zIndex: -1,
  },
  portraitImage: {
    height: 38,
    backgroundColor: 'rgba(13,43,26,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.15)',
    position: 'relative',
  },
  portraitImageActive: { backgroundColor: 'rgba(20,60,35,0.95)' },
  portraitInitials: {
    fontSize: 22,
    color: 'rgba(232,213,163,0.5)',
    fontWeight: '900',
    letterSpacing: 1,
  },
  // Decorative corner marks
  portraitCornerTL: {
    position: 'absolute',
    top: 3,
    left: 4,
    fontSize: 8,
    color: 'rgba(201,168,76,0.35)',
  },
  portraitCornerBR: {
    position: 'absolute',
    bottom: 3,
    right: 4,
    fontSize: 8,
    color: 'rgba(201,168,76,0.35)',
  },
  portraitNameplate: {
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  portraitName: {
    fontSize: 11,
    color: 'rgba(232,213,163,0.7)',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  portraitNameActive: { color: '#061510' },
  portraitStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  portraitStat: { fontSize: 14, color: '#C9A84C', fontWeight: '800' },
  portraitStatSep: {
    fontSize: 12,
    color: 'rgba(201,168,76,0.35)',
    fontWeight: '400',
  },

  // ── Bottom / You ─────────────────────────────────────────────
  bottomZone: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flex: 1,
    paddingHorizontal: 16,
  },
  bottomInfo: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 50,
    paddingBottom: 10,
  },
  bottomInfoLabel: {
    fontSize: 9,
    color: 'rgba(232,213,163,0.5)',
    letterSpacing: 1,
    fontWeight: '700',
  },
  bottomInfoValue: {
    fontSize: 18,
    color: '#C9A84C',
    fontWeight: '800',
  },
  bottomInfoTrump: {
    fontSize: 22,
    flexDirection: 'row',
    fontWeight: '700',
  },
  menuButton: {
    position: 'absolute',
    right: 12,
    zIndex: 100,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonText: {
    fontSize: 18,
    color: '#C9A84C',
  },
  menuModal: {
    position: 'absolute',
    right: 12,
    zIndex: 200,
    backgroundColor: 'rgba(6,21,16,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.4)',
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 140,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.15)',
  },
  menuItemText: {
    fontSize: 14,
    color: '#E8D5A3',
    fontWeight: '500',
  },
  youStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 10,
  },
  youName: {
    fontSize: 12,
    color: '#C9A84C',
    fontWeight: '900',
    letterSpacing: 2,
  },
  youStripDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(201,168,76,0.25)',
  },
  youStat: { fontSize: 11, color: 'rgba(232,213,163,0.5)' },
  youStatSep: { fontSize: 11, color: 'rgba(232,213,163,0.2)' },

  handContainer: { flex: 1, position: 'relative' },
  cardInHand: { position: 'absolute', bottom: -20 },

  // ── Turn Banner ───────────────────────────────────────────────
  turnBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
  },
  turnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 4,
  },
  turnDot: { width: 8, height: 8, borderRadius: 4 },
  turnText: {
    fontSize: 13,
    color: '#E8D5A3',
    fontWeight: '600',
    letterSpacing: 0.4,
  },

  // ── Game Over ─────────────────────────────────────────────────
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  decorativeRule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 16,
    width: '80%',
  },
  ruleLine: { flex: 1, height: 1, backgroundColor: 'rgba(201,168,76,0.3)' },
  ruleGem: { color: '#C9A84C', fontSize: 10 },
  resultTitle: {
    fontSize: 32,
    color: '#E8D5A3',
    fontWeight: '900',
    letterSpacing: 6,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(201,168,76,0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
  },
  resultSubtitle: {
    fontSize: 12,
    color: 'rgba(232,213,163,0.45)',
    letterSpacing: 3,
    marginTop: 4,
    marginBottom: 24,
  },
  scoreBoard: {
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 8,
  },
  scoreBoardInner: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 24 },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreTeamInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  teamBadge: {
    fontSize: 10,
    color: '#061510',
    backgroundColor: '#C9A84C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  teamName: { fontSize: 15, color: '#E8D5A3', fontWeight: '500' },
  teamScore: { fontSize: 28, color: '#C9A84C', fontWeight: '900' },
  scoreDividerH: {
    height: 1,
    backgroundColor: 'rgba(201,168,76,0.15)',
    marginVertical: 14,
  },
  nextButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    width: '80%',
  },
  nextButtonPressed: { opacity: 0.85 },
  nextButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  nextButtonText: {
    fontSize: 15,
    color: '#061510',
    fontWeight: '900',
    letterSpacing: 2,
  },
});
