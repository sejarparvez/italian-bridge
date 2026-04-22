import { MotiView } from 'moti';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import type { TeamId } from '../../types/game-type';

interface RoundEndOverlayProps {
  roundScores?: {
    round: number;
    scores: Record<TeamId, number>;
  };
  teamScores: Record<TeamId, number>;
  highestBid: number;
  highestBidder: SeatPosition | null;
  onContinue: () => void;
}

type SeatPosition = 'bottom' | 'top' | 'left' | 'right';

export function RoundEndOverlay({
  roundScores,
  teamScores,
  highestBid,
  highestBidder,
  onContinue,
}: RoundEndOverlayProps) {
  const roundNum = roundScores?.round ?? 1;
  const btRoundScore = roundScores?.scores.BT ?? 0;
  const lrRoundScore = roundScores?.scores.LR ?? 0;
  const btTotal = teamScores.BT ?? 0;
  const lrTotal = teamScores.LR ?? 0;
  const isBidderBT = highestBidder === 'bottom' || highestBidder === 'top';

  const isGameOver = btTotal >= 30 || lrTotal >= 30;

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 300 }}
      style={styles.overlay}
    >
      <View style={styles.backdrop} />

      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 18 }}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>ROUND {roundNum}</Text>
          </View>
          <Text style={styles.title}>
            {isGameOver ? 'Game Over!' : 'Round Complete!'}
          </Text>
        </View>

        {/* Scores Row */}
        <View style={styles.scoresRow}>
          {/* Your Team */}
          <View style={styles.teamBox}>
            <View style={styles.teamHeader}>
              <View
                style={[styles.teamDot, { backgroundColor: colors.gold500 }]}
              />
              <Text style={styles.teamLabel}>You & Marco</Text>
            </View>
            <View style={styles.scoreRow}>
              <View style={styles.scoreCol}>
                <Text style={styles.scoreColLabel}>Round</Text>
                <Text
                  style={[
                    styles.scoreColValue,
                    btRoundScore > 0
                      ? styles.positive
                      : btRoundScore < 0
                        ? styles.negative
                        : styles.neutral,
                  ]}
                >
                  {btRoundScore > 0 ? '+' : ''}
                  {btRoundScore}
                </Text>
              </View>
              <View style={styles.scoreCol}>
                <Text style={styles.scoreColLabel}>Total</Text>
                <Text
                  style={[
                    styles.scoreColValueLarge,
                    btTotal > 0
                      ? styles.positive
                      : btTotal < 0
                        ? styles.negative
                        : styles.neutral,
                  ]}
                >
                  {btTotal > 0 ? '+' : ''}
                  {btTotal}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.vsText}>VS</Text>

          {/* Opponents */}
          <View style={styles.teamBox}>
            <View style={styles.teamHeader}>
              <View
                style={[styles.teamDot, { backgroundColor: colors.felt400 }]}
              />
              <Text style={styles.teamLabel}>Sofia & Luca</Text>
            </View>
            <View style={styles.scoreRow}>
              <View style={styles.scoreCol}>
                <Text style={styles.scoreColLabel}>Round</Text>
                <Text
                  style={[
                    styles.scoreColValue,
                    lrRoundScore > 0
                      ? styles.positive
                      : lrRoundScore < 0
                        ? styles.negative
                        : styles.neutral,
                  ]}
                >
                  {lrRoundScore > 0 ? '+' : ''}
                  {lrRoundScore}
                </Text>
              </View>
              <View style={styles.scoreCol}>
                <Text style={styles.scoreColLabel}>Total</Text>
                <Text
                  style={[
                    styles.scoreColValueLarge,
                    lrTotal > 0
                      ? styles.positive
                      : lrTotal < 0
                        ? styles.negative
                        : styles.neutral,
                  ]}
                >
                  {lrTotal > 0 ? '+' : ''}
                  {lrTotal}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bid Info */}
        <View style={styles.bidInfoRow}>
          <Text style={styles.bidInfoLabel}>Bid:</Text>
          <Text style={styles.bidInfoValue}>
            {highestBidder
              ? isBidderBT
                ? `Your team ${highestBid}`
                : `Opponents ${highestBid}`
              : '—'}
          </Text>
        </View>

        {/* Winner/Loser Text */}
        {isGameOver && (
          <Text style={btTotal > lrTotal ? styles.winText : styles.loseText}>
            {btTotal > lrTotal ? '🎉 You Win! 🎉' : '😔 Opponents Win'}
          </Text>
        )}

        {/* Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={onContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            {isGameOver ? 'Game Over' : 'Next Round'}
          </Text>
        </TouchableOpacity>
      </MotiView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  container: {
    backgroundColor: colors.felt800,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gold500,
    minWidth: 340,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  headerBadge: {
    backgroundColor: colors.gold600,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 10,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.felt900,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.gold400,
  },

  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.felt500,
  },
  teamBox: {
    backgroundColor: colors.felt900,
    borderRadius: 14,
    padding: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: colors.felt600,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  teamDot: { width: 8, height: 8, borderRadius: 4 },
  teamLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.felt300,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreCol: {
    alignItems: 'center',
  },
  scoreColLabel: {
    fontSize: 9,
    color: colors.felt500,
    marginBottom: 2,
  },
  scoreColValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  scoreColValueLarge: {
    fontSize: 20,
    fontWeight: '900',
  },
  positive: { color: colors.gold400 },
  negative: { color: '#FF6B6B' },
  neutral: { color: colors.felt300 },

  bidInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  bidInfoLabel: {
    fontSize: 12,
    color: colors.felt400,
    fontWeight: '600',
  },
  bidInfoValue: {
    fontSize: 14,
    color: colors.gold400,
    fontWeight: '700',
  },

  winText: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.gold400,
    marginBottom: 12,
  },
  loseText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.felt300,
    marginBottom: 12,
  },

  continueButton: {
    backgroundColor: colors.gold600,
    paddingHorizontal: 36,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.gold400,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.felt900,
  },
});
