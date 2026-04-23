import { MotiView } from 'moti';
import { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../constants/colors';
import type { TeamId } from '../../types/game-type';

interface GameOverOverlayProps {
  teamScores: Record<TeamId, number>;
  onNewGame: () => void;
}

function AnimatedScore({
  value,
  color,
  delay = 0,
}: {
  value: number;
  color: string;
  delay?: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.Text
      style={[
        styles.scoreValue,
        { color, opacity: anim, transform: [{ scale: anim }] },
      ]}
    >
      {value > 0 ? '+' : ''}
      {value}
    </Animated.Text>
  );
}

export function GameOverOverlay({
  teamScores,
  onNewGame,
}: GameOverOverlayProps) {
  const btScore = teamScores.BT;
  const lrScore = teamScores.LR;
  const playerWins = btScore > lrScore;

  const winnerColor = playerWins ? colors.gold400 : '#E57373';
  const winnerBg = playerWins
    ? 'rgba(239,159,39,0.10)'
    : 'rgba(229,115,115,0.10)';
  const winnerBorder = playerWins
    ? 'rgba(239,159,39,0.28)'
    : 'rgba(229,115,115,0.28)';

  const teams = [
    {
      label: 'You & Alex',
      id: 'BT' as TeamId,
      score: btScore,
      dotColor: colors.gold500,
    },
    {
      label: 'Jordan & Sam',
      id: 'LR' as TeamId,
      score: lrScore,
      dotColor: colors.felt400,
    },
  ];

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 200 }}
      style={styles.overlay}
    >
      {/* Corner dots */}
      <View style={styles.dotTL} />
      <View style={styles.dotBR} />

      <MotiView
        from={{ opacity: 0, scale: 0.94, translateY: 16 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 18, delay: 60 }}
        style={styles.sheet}
      >
        {/* ── Left column: result + CTA ────────────────────── */}
        <View style={styles.leftCol}>
          <View style={styles.topRule} />

          {/* Eyebrow */}
          <MotiView
            from={{ opacity: 0, translateX: -8 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'spring', damping: 16, delay: 180 }}
          >
            <Text style={styles.eyebrow}>Game Over</Text>
          </MotiView>

          {/* Winner badge */}
          <MotiView
            from={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 14, delay: 280 }}
            style={[
              styles.winnerBadge,
              { backgroundColor: winnerBg, borderColor: winnerBorder },
            ]}
          >
            <Text style={[styles.winnerLabel, { color: winnerColor }]}>
              {playerWins ? 'Victory' : 'Defeated'}
            </Text>
            <Text
              style={[styles.winnerSub, { color: winnerColor, opacity: 0.7 }]}
            >
              {playerWins
                ? 'You & Alex take the match'
                : 'Jordan & Sam take the match'}
            </Text>
          </MotiView>

          <View style={{ flex: 1 }} />

          {/* CTA */}
          <MotiView
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 16, delay: 620 }}
          >
            <TouchableOpacity
              style={styles.newGameBtn}
              onPress={onNewGame}
              activeOpacity={0.82}
            >
              <View style={styles.newGameBtnInner}>
                <Text style={styles.newGameBtnText}>New Game</Text>
                <View style={styles.newGameArrow} />
              </View>
            </TouchableOpacity>
            <Text style={styles.hint}>All scores will be reset</Text>
          </MotiView>
        </View>

        {/* ── Vertical divider ─────────────────────────────── */}
        <View style={styles.vertDivider} />

        {/* ── Right column: score cards ────────────────────── */}
        <View style={styles.rightCol}>
          {teams.map((team, i) => {
            const isWinner =
              team.score > (team.id === 'BT' ? lrScore : btScore);
            const scoreColor = team.score >= 0 ? colors.gold400 : '#E57373';
            const cardBg = isWinner
              ? 'rgba(239,159,39,0.07)'
              : 'rgba(245,243,235,0.03)';
            const cardBorder = isWinner
              ? 'rgba(239,159,39,0.26)'
              : 'rgba(61,184,122,0.12)';

            return (
              <MotiView
                key={team.id}
                from={{ opacity: 0, translateX: 12 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{
                  type: 'spring',
                  damping: 16,
                  delay: 380 + i * 80,
                }}
                style={[
                  styles.scoreCard,
                  { backgroundColor: cardBg, borderColor: cardBorder },
                ]}
              >
                {/* Leading pip on left edge */}
                {isWinner && <View style={styles.winnerPip} />}

                {/* Team info */}
                <View style={styles.cardLeft}>
                  <View style={styles.teamHeader}>
                    <View
                      style={[
                        styles.teamDot,
                        { backgroundColor: team.dotColor },
                      ]}
                    />
                    <Text style={styles.teamLabel}>{team.label}</Text>
                  </View>
                  <Text style={styles.teamSub}>
                    {team.score >= 0 ? 'points earned' : 'points lost'}
                  </Text>
                </View>

                {/* Animated score on right */}
                <AnimatedScore
                  value={team.score}
                  color={scoreColor}
                  delay={500 + i * 80}
                />
              </MotiView>
            );
          })}

          {/* Round summary row */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 300, delay: 580 }}
            style={styles.summaryRow}
          >
            <Text style={styles.summaryLabel}>Margin</Text>
            <View style={styles.summaryDot} />
            <Text style={styles.summaryValue}>
              {Math.abs(btScore - lrScore)} pts
            </Text>
            <View style={styles.summaryDot} />
            <Text style={styles.summaryLabel}>
              {playerWins ? 'You led all game' : 'Opponents led all game'}
            </Text>
          </MotiView>
        </View>
      </MotiView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,28,19,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },

  dotTL: {
    position: 'absolute',
    top: 24,
    left: 24,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(61,184,122,0.18)',
  },
  dotBR: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(239,159,39,0.18)',
  },

  // ── Sheet: horizontal ─────────────────────────────────
  sheet: {
    backgroundColor: colors.felt800,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(61,184,122,0.18)',
    flexDirection: 'row',
    overflow: 'hidden',
    width: 520,
    height: 210,
  },

  // ── Left column ───────────────────────────────────────
  leftCol: {
    width: 210,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'flex-start',
  },

  topRule: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.gold500,
    marginBottom: 12,
  },

  eyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: colors.felt300,
    marginBottom: 10,
  },

  winnerBadge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'flex-start',
    width: '100%',
  },
  winnerLabel: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  winnerSub: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.3,
  },

  newGameBtn: {
    backgroundColor: colors.gold500,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 20,
    width: '100%',
    marginBottom: 7,
  },
  newGameBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  newGameBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.felt900,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  newGameArrow: {
    width: 0,
    height: 0,
    borderTopWidth: 3.5,
    borderBottomWidth: 3.5,
    borderLeftWidth: 6,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.felt900,
  },
  hint: {
    fontSize: 9,
    color: 'rgba(125,212,168,0.3)',
    textAlign: 'center',
    width: '100%',
    letterSpacing: 0.3,
  },

  // ── Vertical divider ──────────────────────────────────
  vertDivider: {
    width: 1,
    backgroundColor: 'rgba(61,184,122,0.1)',
    marginVertical: 16,
  },

  // ── Right column ──────────────────────────────────────
  rightCol: {
    flex: 1,
    padding: 12,
    gap: 8,
  },

  scoreCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  winnerPip: {
    position: 'absolute',
    left: 0,
    top: '20%',
    bottom: '20%',
    width: 2,
    backgroundColor: colors.gold500,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },

  cardLeft: {
    flex: 1,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  teamDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  teamLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.felt300,
  },
  teamSub: {
    fontSize: 9,
    color: 'rgba(125,212,168,0.35)',
    letterSpacing: 0.3,
  },

  scoreValue: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
    marginLeft: 12,
  },

  // ── Summary row ───────────────────────────────────────
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 9,
    color: 'rgba(125,212,168,0.3)',
    letterSpacing: 0.5,
  },
  summaryDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(125,212,168,0.2)',
  },
  summaryValue: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(125,212,168,0.5)',
    letterSpacing: 0.3,
  },
});
