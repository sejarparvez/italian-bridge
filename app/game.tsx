'use client';

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, Fonts } from '@/constants/theme';
import { Card } from '@/src/components/cards/Card';
import { SUIT_SYMBOLS } from '@/src/constants/cards';
import type { SeatPosition } from '@/src/game/types';
import { useGameStore } from '@/src/store/gameStore';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = 50;
const CARD_HEIGHT = 70;

export default function GameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, playPlayerCard } = useGameStore();

  const handleCardPress = (cardId: string) => {
    if (state.currentSeat === 'bottom' && state.phase === 'playing') {
      playPlayerCard(cardId);
    }
  };

  const getTrickCardPosition = (player: SeatPosition) => {
    const centerX = width / 2;
    const centerY = height / 2 - 40;
    const offset = 40;

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
          colors={[COLORS.feltDark, COLORS.feltMid, COLORS.feltDark]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>
            {state.phase === 'gameEnd' ? 'Game Over!' : 'Round Complete'}
          </Text>
          <View style={styles.scoreBoard}>
            <View style={styles.scoreRow}>
              <Text style={styles.teamName}>You & Alex (BT)</Text>
              <Text style={styles.teamScore}>{state.teamScores.BT}</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.teamName}>Jordan & Sam (LR)</Text>
              <Text style={styles.teamScore}>{state.teamScores.LR}</Text>
            </View>
          </View>
          <Pressable
            style={styles.nextButton}
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
            <Text style={styles.nextButtonText}>
              {state.phase === 'gameEnd' ? 'NEW GAME' : 'NEXT ROUND'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const {
    players,
    currentTrick,
    currentSeat,
    trumpSuit,
    trumpRevealed,
    round,
    completedTricks,
  } = state;
  const playerHand = players.bottom.hand;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[COLORS.feltDark, COLORS.feltMid, COLORS.feltDark]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topBar}>
        <View style={styles.roundInfo}>
          <Text style={styles.roundText}>Round {round}/5</Text>
        </View>
        <View style={styles.scoreBar}>
          <Text style={styles.scoreLabel}>BT: {state.teamScores.BT}</Text>
          <Text style={styles.scoreDivider}>|</Text>
          <Text style={styles.scoreLabel}>LR: {state.teamScores.LR}</Text>
        </View>
        {trumpSuit && (
          <View style={styles.trumpBadge}>
            <Text style={styles.trumpText}>
              {trumpRevealed ? '🔻 ' : '🔻 '}
              {SUIT_SYMBOLS[trumpSuit]} {trumpSuit.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.tableArea}>
        <View style={styles.topPlayer}>
          <View
            style={[
              styles.playerIndicator,
              currentSeat === 'top' && styles.activePlayer,
            ]}
          >
            <Text style={styles.playerName}>{players.top.name}</Text>
            <Text style={styles.trickCount}>
              Tricks: {players.top.tricksTaken}
            </Text>
          </View>
          <View style={styles.botHandRow}>
            {players.top.hand.map((card, i) => (
              <View
                key={card.id}
                style={[
                  styles.cardStacked,
                  { left: i * 15, transform: [{ rotate: '180deg' }] },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.middleRow}>
          <View
            style={[
              styles.sidePlayer,
              currentSeat === 'left' && styles.activePlayer,
            ]}
          >
            <Text style={styles.playerName}>{players.left.name}</Text>
            <Text style={styles.trickCount}>
              Tricks: {players.left.tricksTaken}
            </Text>
            <View style={styles.verticalHand}>
              {players.left.hand.map((card, i) => (
                <View
                  key={card.id}
                  style={[
                    styles.cardStacked,
                    { top: i * 10, transform: [{ rotate: '-90deg' }] },
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.trickArea}>
            {currentTrick.cards.map((trickCard) => {
              const pos = getTrickCardPosition(trickCard.player);
              return (
                <MotiView
                  key={trickCard.card.id}
                  from={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 15 }}
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
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={styles.winnerIndicator}
              >
                <Text style={styles.winnerText}>
                  Winner: {players[currentTrick.winningSeat].name}
                </Text>
              </MotiView>
            )}
          </View>

          <View
            style={[
              styles.sidePlayer,
              currentSeat === 'right' && styles.activePlayer,
            ]}
          >
            <Text style={styles.playerName}>{players.right.name}</Text>
            <Text style={styles.trickCount}>
              Tricks: {players.right.tricksTaken}
            </Text>
            <View style={styles.verticalHand}>
              {players.right.hand.map((card, i) => (
                <View
                  key={card.id}
                  style={[
                    styles.cardStacked,
                    { top: i * 10, transform: [{ rotate: '90deg' }] },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.bottomPlayer}>
          <View
            style={[
              styles.playerIndicator,
              currentSeat === 'bottom' && styles.activePlayer,
            ]}
          >
            <Text style={styles.playerName}>You</Text>
            <Text style={styles.trickCount}>
              Tricks: {players.bottom.tricksTaken} | Bid:{' '}
              {players.bottom.bid ?? '-'}
            </Text>
          </View>
          <View style={styles.handContainer}>
            {playerHand.map((card, index) => {
              const isPlayable = currentSeat === 'bottom';
              return (
                <MotiView
                  key={card.id}
                  from={{ opacity: 0, translateY: 30 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{
                    delay: index * 50,
                    type: 'spring',
                    damping: 15,
                  }}
                  style={[
                    styles.cardInHand,
                    { left: index * (CARD_WIDTH + 4) },
                  ]}
                >
                  <Pressable
                    onPress={() => isPlayable && handleCardPress(card.id)}
                  >
                    <Card card={card} />
                  </Pressable>
                </MotiView>
              );
            })}
          </View>
        </View>
      </View>

      <View style={[styles.turnIndicator, { bottom: insets.bottom + 20 }]}>
        <Text style={styles.turnText}>
          {currentSeat === 'bottom'
            ? 'Your turn'
            : `${players[currentSeat].name}'s turn`}
        </Text>
        <Text style={styles.trickCount}>
          Tricks: {completedTricks.length}/5
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  roundInfo: {
    backgroundColor: COLORS.feltMid,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roundText: {
    fontSize: 14,
    color: COLORS.goldLight,
    fontFamily: Fonts.body.semibold,
  },
  scoreBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreLabel: {
    fontSize: 18,
    color: COLORS.goldPrimary,
    fontFamily: Fonts.display.bold,
  },
  scoreDivider: {
    color: COLORS.goldDark,
    fontSize: 18,
  },
  trumpBadge: {
    backgroundColor: COLORS.goldDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  trumpText: {
    fontSize: 14,
    color: COLORS.goldLight,
    fontFamily: Fonts.body.semibold,
  },
  tableArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topPlayer: {
    alignItems: 'center',
    paddingTop: 8,
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    alignItems: 'center',
  },
  sidePlayer: {
    width: 80,
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activePlayer: {
    borderColor: COLORS.goldPrimary,
    backgroundColor: 'rgba(201, 168, 76, 0.1)',
  },
  playerIndicator: {
    alignItems: 'center',
    marginBottom: 4,
  },
  playerName: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontFamily: Fonts.body.semibold,
  },
  trickCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  botHandRow: {
    flexDirection: 'row',
    height: 40,
    width: 100,
  },
  verticalHand: {
    height: 120,
    marginTop: 4,
  },
  cardStacked: {
    position: 'absolute',
    width: 32,
    height: 45,
    backgroundColor: COLORS.cardBack,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: COLORS.cardBackAccent,
  },
  trickArea: {
    width: 150,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trickCard: {
    position: 'absolute',
  },
  winnerIndicator: {
    position: 'absolute',
    bottom: -20,
    backgroundColor: COLORS.goldDark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  winnerText: {
    fontSize: 10,
    color: COLORS.goldLight,
    fontFamily: Fonts.body.regular,
  },
  bottomPlayer: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  handContainer: {
    flexDirection: 'row',
    height: 90,
    marginTop: 8,
  },
  cardInHand: {
    position: 'absolute',
  },
  turnIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(13, 43, 26, 0.9)',
    borderTopWidth: 1,
    borderTopColor: COLORS.goldDark,
  },
  turnText: {
    fontSize: 16,
    color: COLORS.goldLight,
    fontFamily: Fonts.body.semibold,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 36,
    fontFamily: Fonts.display.bold,
    color: COLORS.goldLight,
    marginBottom: 32,
  },
  scoreBoard: {
    backgroundColor: COLORS.feltMid,
    paddingHorizontal: 40,
    paddingVertical: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.goldDark,
    marginBottom: 32,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 12,
  },
  teamName: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontFamily: Fonts.body.regular,
  },
  teamScore: {
    fontSize: 20,
    color: COLORS.goldPrimary,
    fontFamily: Fonts.display.bold,
  },
  nextButton: {
    backgroundColor: COLORS.goldPrimary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontFamily: Fonts.display.semibold,
    color: COLORS.feltDark,
    letterSpacing: 1,
  },
});
