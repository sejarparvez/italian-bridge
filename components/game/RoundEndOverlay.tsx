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

type SeatPosition = 'bottom' | 'top' | 'left' | 'right';

interface RoundEndOverlayProps {
  roundScores?: {
    round: number;
    scores: Record<TeamId, number>;
  };
  teamScores: Record<TeamId, number>;
  highestBid: number;
  highestBidder: SeatPosition | null;
  winThreshold: number;
  onContinue: () => void;
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
        styles.scoreTotal,
        { color, opacity: anim, transform: [{ scale: anim }] },
      ]}
    >
      {value > 0 ? '+' : ''}
      {value}
    </Animated.Text>
  );
}

export function RoundEndOverlay({
  roundScores,
  teamScores,
  highestBid,
  highestBidder,
  winThreshold,
  onContinue,
}: RoundEndOverlayProps) {
  const roundNum = roundScores?.round ?? 1;
  const btRoundScore = roundScores?.scores.BT ?? 0;
  const lrRoundScore = roundScores?.scores.LR ?? 0;
  const btTotal = teamScores.BT ?? 0;
  const lrTotal = teamScores.LR ?? 0;
  const isBidderBT = highestBidder === 'bottom' || highestBidder === 'top';
  const btLeading = btTotal > lrTotal;

  const scoreColor = (v: number) =>
    v > 0 ? colors.gold400 : v < 0 ? '#E57373' : colors.felt300;
  const deltaColor = (v: number) =>
    v > 0 ? colors.felt400 : v < 0 ? '#E57373' : colors.felt300;

  const teams = [
    {
      id: 'BT' as TeamId,
      label: 'You & Alex',
      roundScore: btRoundScore,
      total: btTotal,
      progress: Math.min(Math.abs(btTotal) / winThreshold, 1),
      isLeading: btLeading,
      dotColor: colors.gold500,
      animDelay: 400,
    },
    {
      id: 'LR' as TeamId,
      label: 'Jordan & Sam',
      roundScore: lrRoundScore,
      total: lrTotal,
      progress: Math.min(Math.abs(lrTotal) / winThreshold, 1),
      isLeading: !btLeading,
      dotColor: colors.felt400,
      animDelay: 480,
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
        {/* ── Left column: header + bid + CTA ─────────────── */}
        <View style={styles.leftCol}>
          <View style={styles.topRule} />

          <MotiView
            from={{ opacity: 0, translateX: -8 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'spring', damping: 16, delay: 180 }}
            style={styles.headerBlock}
          >
            <Text style={styles.eyebrow}>Round Complete</Text>
            <View style={styles.roundBadge}>
              <Text style={styles.roundBadgeText}>R{roundNum}</Text>
            </View>
          </MotiView>

          {/* Bid pill */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 300, delay: 420 }}
            style={styles.bidPill}
          >
            <Text style={styles.bidPillLabel}>Bid</Text>
            <View style={styles.bidPillDot} />
            <Text style={styles.bidPillValue}>
              {highestBidder
                ? `${isBidderBT ? 'Your team' : 'Opponents'} · ${highestBid}`
                : '—'}
            </Text>
          </MotiView>

          <View style={{ flex: 1 }} />

          {/* CTA */}
          <MotiView
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 16, delay: 600 }}
          >
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={onContinue}
              activeOpacity={0.82}
            >
              <View style={styles.continueBtnInner}>
                <Text style={styles.continueBtnText}>Next Round</Text>
                <View style={styles.continueBtnArrow} />
              </View>
            </TouchableOpacity>
            <Text style={styles.hint}>Round {roundNum + 1} up next</Text>
          </MotiView>
        </View>

        {/* ── Vertical divider ─────────────────────────────── */}
        <View style={styles.vertDivider} />

        {/* ── Right column: score cards ────────────────────── */}
        <View style={styles.rightCol}>
          {teams.map((team) => (
            <MotiView
              key={team.id}
              from={{ opacity: 0, translateX: 12 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{
                type: 'spring',
                damping: 16,
                delay: team.animDelay,
              }}
              style={[
                styles.scoreCard,
                {
                  backgroundColor: team.isLeading
                    ? 'rgba(239,159,39,0.07)'
                    : 'rgba(245,243,235,0.03)',
                  borderColor: team.isLeading
                    ? 'rgba(239,159,39,0.26)'
                    : 'rgba(61,184,122,0.12)',
                },
              ]}
            >
              {/* Leading pip */}
              {team.isLeading && <View style={styles.leadingPip} />}

              {/* Team info */}
              <View style={styles.cardLeft}>
                <View style={styles.teamHeader}>
                  <View
                    style={[styles.teamDot, { backgroundColor: team.dotColor }]}
                  />
                  <Text style={styles.teamLabel}>{team.label}</Text>
                </View>

                {/* Round delta */}
                <View style={styles.deltaRow}>
                  <Text style={styles.deltaPrefix}>Round </Text>
                  <Text
                    style={[
                      styles.deltaValue,
                      { color: deltaColor(team.roundScore) },
                    ]}
                  >
                    {team.roundScore > 0 ? '+' : ''}
                    {team.roundScore}
                  </Text>
                </View>

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                  <MotiView
                    from={{ width: '0%' }}
                    animate={{ width: `${team.progress * 100}%` }}
                    transition={{
                      type: 'timing',
                      duration: 700,
                      delay: team.animDelay + 100,
                    }}
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor:
                          team.total < 0 ? '#E57373' : team.dotColor,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressLabel}>
                  {Math.abs(team.total)}/{winThreshold}
                </Text>
              </View>

              {/* Total score */}
              <AnimatedScore
                value={team.total}
                color={scoreColor(team.total)}
                delay={team.animDelay + 100}
              />
            </MotiView>
          ))}
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
    zIndex: 100,
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

  // ── Sheet: horizontal layout ──────────────────────────────
  sheet: {
    backgroundColor: colors.felt800,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(61,184,122,0.18)',
    flexDirection: 'row', // landscape: side by side
    overflow: 'hidden',
    width: 520, // wide card fits landscape
    height: 200,
  },

  // ── Left column ───────────────────────────────────────────
  leftCol: {
    width: 200,
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

  headerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: colors.felt300,
  },
  roundBadge: {
    backgroundColor: 'rgba(239,159,39,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,159,39,0.28)',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  roundBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.gold500,
    letterSpacing: 1,
  },

  bidPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(61,184,122,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(61,184,122,0.14)',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  bidPillLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.felt400,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  bidPillDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(61,184,122,0.3)',
  },
  bidPillValue: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.gold400,
  },

  continueBtn: {
    backgroundColor: colors.gold500,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 20,
    width: '100%',
    marginBottom: 7,
  },
  continueBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.felt900,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  continueBtnArrow: {
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

  // ── Vertical divider ──────────────────────────────────────
  vertDivider: {
    width: 1,
    backgroundColor: 'rgba(61,184,122,0.1)',
    marginVertical: 16,
  },

  // ── Right column: score cards ─────────────────────────────
  rightCol: {
    flex: 1,
    padding: 12,
    gap: 8,
  },

  scoreCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row', // score on right, info on left
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  leadingPip: {
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
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  deltaPrefix: {
    fontSize: 9,
    color: 'rgba(125,212,168,0.35)',
  },
  deltaValue: {
    fontSize: 9,
    fontWeight: '700',
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(61,184,122,0.12)',
    borderRadius: 1,
    overflow: 'hidden',
    marginBottom: 3,
    width: '80%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1,
  },
  progressLabel: {
    fontSize: 8,
    color: 'rgba(125,212,168,0.3)',
    letterSpacing: 0.3,
  },

  scoreTotal: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
    marginLeft: 12,
  },
});
