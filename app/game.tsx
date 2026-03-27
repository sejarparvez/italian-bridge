import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/src/components/cards/Card';
import { SUIT_SYMBOLS } from '@/src/constants/cards';
import type { SeatPosition } from '@/src/game/types';
import { useGameStore } from '@/src/store/gameStore';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = 50;

export default function GameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, playPlayerCard } = useGameStore();
  const [pressedCard, setPressedCard] = useState<string | null>(null);

  const handleCardPress = (cardId: string) => {
    if (state.currentSeat === 'bottom' && state.phase === 'playing') {
      playPlayerCard(cardId);
    }
  };

  const getTrickCardPosition = (player: SeatPosition) => {
    const centerX = width / 2;
    const centerY = height / 2 - 40;
    const offset = 44;
    switch (player) {
      case 'bottom':
        return { x: centerX, y: centerY + offset };
      case 'top':
        return { x: centerX, y: centerY - offset };
      case 'left':
        return { x: centerX - offset, y: centerY };
      case 'right':
        return { x: centerX + offset, y: centerY };
    }
  };

  const isGameOver = state.phase === 'roundEnd' || state.phase === 'gameEnd';

  if (isGameOver) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#061510', '#0D2B1A', '#061510']}
          style={StyleSheet.absoluteFill}
        />
        {/* Gold vignette overlay */}
        <View style={styles.vignetteOverlay} />

        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 18 }}
          style={styles.resultContainer}
        >
          {/* Decorative top rule */}
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
                  <Text style={styles.teamName}>You & Alex</Text>
                </View>
                <Text style={styles.teamScore}>{state.teamScores.BT}</Text>
              </View>
              <View style={styles.scoreDividerH} />
              <View style={styles.scoreRow}>
                <View style={styles.scoreTeamInfo}>
                  <Text style={styles.teamBadge}>LR</Text>
                  <Text style={styles.teamName}>Jordan & Sam</Text>
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

  const {
    players,
    currentTrick,
    currentSeat,
    trumpSuit,
    round,
    completedTricks,
  } = state;
  const playerHand = players.bottom.hand;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#061510', '#0D2B1A', '#061510']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.vignetteOverlay} />

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.pillBadge}>
          <Text style={styles.pillText}>ROUND {round}/5</Text>
        </View>

        <View style={styles.scorePill}>
          <Text style={styles.scoreText}>BT</Text>
          <Text style={styles.scoreNum}>{state.teamScores.BT}</Text>
          <View style={styles.scoreVertDivider} />
          <Text style={styles.scoreNum}>{state.teamScores.LR}</Text>
          <Text style={styles.scoreText}>LR</Text>
        </View>

        {trumpSuit && (
          <View style={styles.trumpPill}>
            <Text
              style={[
                styles.trumpSuitSymbol,
                {
                  color: ['hearts', 'diamonds'].includes(trumpSuit)
                    ? '#E8534A'
                    : '#E8D5A3',
                },
              ]}
            >
              {SUIT_SYMBOLS[trumpSuit]}
            </Text>
            <Text style={styles.trumpLabel}>TRUMP</Text>
          </View>
        )}
      </View>

      {/* ── Table ── */}
      <View style={styles.tableArea}>
        {/* Top player */}
        <View style={styles.topPlayerZone}>
          <PlayerBubble
            name={players.top.name}
            tricks={players.top.tricksTaken}
            isActive={currentSeat === 'top'}
          />
          <View style={styles.faceDownRow}>
            {players.top.hand.map((card, i) => (
              <View
                key={card.id}
                style={[
                  styles.faceDownCard,
                  { left: i * 12, transform: [{ rotate: '180deg' }] },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Middle row */}
        <View style={styles.middleRow}>
          {/* Left player */}
          <View style={styles.sidePlayerZone}>
            <PlayerBubble
              name={players.left.name}
              tricks={players.left.tricksTaken}
              isActive={currentSeat === 'left'}
              vertical
            />
            <View style={styles.verticalFaceDownRow}>
              {players.left.hand.map((card, i) => (
                <View
                  key={card.id}
                  style={[
                    styles.faceDownCard,
                    { top: i * 8, transform: [{ rotate: '-90deg' }] },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Trick area */}
          <View style={styles.trickArea}>
            {/* Felt circle */}
            <View style={styles.feltCircle} />

            {currentTrick.cards.map((trickCard) => {
              const pos = getTrickCardPosition(trickCard.player);
              return (
                <MotiView
                  key={trickCard.card.id}
                  from={{ opacity: 0, scale: 0.6, rotate: '0deg' }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    rotate: `${(Math.random() * 10 - 5).toFixed(1)}deg`,
                  }}
                  transition={{ type: 'spring', damping: 14, stiffness: 120 }}
                  style={[
                    styles.trickCard,
                    { left: pos.x - 25, top: pos.y - 35 },
                  ]}
                >
                  <Card card={trickCard.card} />
                </MotiView>
              );
            })}

            {currentTrick.winningSeat && (
              <MotiView
                from={{ opacity: 0, translateY: 4 }}
                animate={{ opacity: 1, translateY: 0 }}
                style={styles.winnerBadge}
              >
                <Text style={styles.winnerBadgeText}>
                  ♛ {players[currentTrick.winningSeat].name}
                </Text>
              </MotiView>
            )}

            <View style={styles.trickCounter}>
              <Text style={styles.trickCounterText}>
                {completedTricks.length}/5
              </Text>
              <Text style={styles.trickCounterLabel}>TRICKS</Text>
            </View>
          </View>

          {/* Right player */}
          <View style={styles.sidePlayerZone}>
            <PlayerBubble
              name={players.right.name}
              tricks={players.right.tricksTaken}
              isActive={currentSeat === 'right'}
              vertical
            />
            <View style={styles.verticalFaceDownRow}>
              {players.right.hand.map((card, i) => (
                <View
                  key={card.id}
                  style={[
                    styles.faceDownCard,
                    { top: i * 8, transform: [{ rotate: '90deg' }] },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Bottom player (you) */}
        <View style={styles.bottomPlayerZone}>
          <View
            style={[
              styles.youIndicator,
              currentSeat === 'bottom' && styles.youIndicatorActive,
            ]}
          >
            <Text style={styles.youLabel}>YOU</Text>
            <Text style={styles.youStats}>
              Tricks: {players.bottom.tricksTaken} · Bid:{' '}
              {players.bottom.bid ?? '—'}
            </Text>
          </View>

          <View style={styles.handContainer}>
            {playerHand.map((card, index) => {
              const isPlayable = currentSeat === 'bottom';
              const isPressed = pressedCard === card.id;
              return (
                <MotiView
                  key={card.id}
                  from={{ opacity: 0, translateY: 40 }}
                  animate={{
                    opacity: 1,
                    translateY: isPressed ? -16 : 0,
                    scale: isPressed ? 1.08 : 1,
                  }}
                  transition={{
                    delay: index * 40,
                    type: 'spring',
                    damping: 14,
                  }}
                  style={[
                    styles.cardInHand,
                    { left: index * (CARD_WIDTH + 4) },
                  ]}
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
        </View>
      </View>

      {/* ── Turn Banner ── */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={[styles.turnBanner, { bottom: insets.bottom + 8 }]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(6,21,16,0.97)', 'rgba(6,21,16,0.97)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.turnBannerInner}>
          <MotiView
            animate={{ opacity: currentSeat === 'bottom' ? [1, 0.4, 1] : 1 }}
            transition={{
              loop: currentSeat === 'bottom',
              duration: 1400,
              type: 'timing',
            }}
            style={[
              styles.turnDot,
              {
                backgroundColor:
                  currentSeat === 'bottom' ? '#C9A84C' : '#4CAF82',
              },
            ]}
          />
          <Text style={styles.turnText}>
            {currentSeat === 'bottom'
              ? 'Your turn to play'
              : `${players[currentSeat].name} is playing…`}
          </Text>
        </View>
      </MotiView>
    </View>
  );
}

function PlayerBubble({
  name,
  tricks,
  isActive,
}: {
  name: string;
  tricks: number;
  isActive: boolean;
  vertical?: boolean;
}) {
  return (
    <MotiView
      animate={{
        borderColor: isActive ? '#C9A84C' : 'rgba(201,168,76,0.15)',
        backgroundColor: isActive
          ? 'rgba(201,168,76,0.1)'
          : 'rgba(13,43,26,0.6)',
      }}
      transition={{ type: 'timing', duration: 300 }}
      style={styles.playerBubble}
    >
      {isActive && (
        <MotiView
          from={{ opacity: 0.6, scale: 1 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ loop: true, duration: 1200, type: 'timing' }}
          style={styles.playerHalo}
        />
      )}
      <Text
        style={[
          styles.playerBubbleName,
          isActive && styles.playerBubbleNameActive,
        ]}
      >
        {name}
      </Text>
      <Text style={styles.playerBubbleTricks}>{tricks} tricks</Text>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  vignetteOverlay: {
    position: 'absolute',
    inset: 0,
    borderWidth: 40,
    borderColor: 'rgba(0,0,0,0.35)',
    borderRadius: 0,
  },

  // ── Top Bar ──
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pillBadge: {
    backgroundColor: 'rgba(201,168,76,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 11,
    color: '#C9A84C',
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 10,
    color: 'rgba(232,213,163,0.5)',
    letterSpacing: 1,
    fontWeight: '700',
  },
  scoreNum: { fontSize: 18, color: '#C9A84C', fontWeight: '800' },
  scoreVertDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(201,168,76,0.25)',
  },
  trumpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  trumpSuitSymbol: { fontSize: 16 },
  trumpLabel: {
    fontSize: 10,
    color: 'rgba(232,213,163,0.6)',
    letterSpacing: 1.5,
    fontWeight: '700',
  },

  // ── Table ──
  tableArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 60,
  },

  topPlayerZone: { alignItems: 'center', paddingTop: 4 },
  faceDownRow: { flexDirection: 'row', height: 36, width: 120, marginTop: 6 },

  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    alignItems: 'center',
  },

  sidePlayerZone: { width: 76, alignItems: 'center' },
  verticalFaceDownRow: { height: 100, width: 36, marginTop: 8 },

  faceDownCard: {
    position: 'absolute',
    width: 28,
    height: 40,
    backgroundColor: '#1A4A2E',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },

  // ── Trick Area ──
  trickArea: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feltCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(10,35,20,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.12)',
  },
  trickCard: { position: 'absolute' },
  winnerBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#C9A84C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  winnerBadgeText: {
    fontSize: 10,
    color: '#061510',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  trickCounter: {
    position: 'absolute',
    top: 8,
    right: 8,
    alignItems: 'center',
  },
  trickCounterText: { fontSize: 16, color: '#C9A84C', fontWeight: '800' },
  trickCounterLabel: {
    fontSize: 8,
    color: 'rgba(201,168,76,0.5)',
    letterSpacing: 1.5,
  },

  // ── Player Bubble ──
  playerBubble: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'visible',
  },
  playerHalo: {
    position: 'absolute',
    inset: -6,
    borderRadius: 20,
    backgroundColor: 'rgba(201,168,76,0.2)',
  },
  playerBubbleName: {
    fontSize: 12,
    color: '#E8D5A3',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  playerBubbleNameActive: { color: '#C9A84C' },
  playerBubbleTricks: {
    fontSize: 10,
    color: 'rgba(232,213,163,0.4)',
    marginTop: 2,
  },

  // ── Bottom / You ──
  bottomPlayerZone: { alignItems: 'center', paddingBottom: 4 },
  youIndicator: {
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  youIndicatorActive: {
    borderColor: '#C9A84C',
    backgroundColor: 'rgba(201,168,76,0.08)',
  },
  youLabel: {
    fontSize: 13,
    color: '#C9A84C',
    fontWeight: '800',
    letterSpacing: 2,
  },
  youStats: { fontSize: 10, color: 'rgba(232,213,163,0.45)', marginTop: 2 },
  handContainer: { flexDirection: 'row', height: 90, marginTop: 4 },
  cardInHand: { position: 'absolute' },

  // ── Turn Banner ──
  turnBanner: { position: 'absolute', left: 0, right: 0, paddingVertical: 10 },
  turnBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  turnDot: { width: 8, height: 8, borderRadius: 4 },
  turnText: {
    fontSize: 13,
    color: '#E8D5A3',
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // ── Game Over ──
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
