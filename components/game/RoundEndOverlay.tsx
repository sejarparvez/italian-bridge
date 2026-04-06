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

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 300 }}
      style={styles.overlay}
    >
      <View style={styles.container}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>ROUND {roundNum}</Text>
        </View>

        <Text style={styles.title}>Round Complete!</Text>

        <View style={styles.scoreBoard}>
          <View style={styles.teamColumn}>
            <Text style={styles.teamLabel}>You & Marco</Text>
            <View style={styles.scoreRow}>
              <View
                style={[styles.teamDot, { backgroundColor: colors.gold500 }]}
              />
              <Text style={styles.totalLabel}>Total</Text>
              <Text
                style={[
                  styles.totalValue,
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
            <View style={styles.roundChange}>
              <Text style={styles.roundLabel}>This round</Text>
              <Text
                style={[
                  styles.roundValue,
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
          </View>

          <View style={styles.divider} />

          <View style={styles.teamColumn}>
            <Text style={styles.teamLabel}>Sofia & Luca</Text>
            <View style={styles.scoreRow}>
              <View
                style={[styles.teamDot, { backgroundColor: colors.felt400 }]}
              />
              <Text style={styles.totalLabel}>Total</Text>
              <Text
                style={[
                  styles.totalValue,
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
            <View style={styles.roundChange}>
              <Text style={styles.roundLabel}>This round</Text>
              <Text
                style={[
                  styles.roundValue,
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
          </View>
        </View>

        <View style={styles.bidInfo}>
          <Text style={styles.bidInfoText}>
            {highestBidder ? (
              <>
                {isBidderBT ? 'Your team' : 'Opponents'} bid{' '}
                <Text style={styles.bidValue}>{highestBid}</Text>
              </>
            ) : (
              'No bid'
            )}
          </Text>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
          <Text style={styles.continueButtonText}>
            {teamScores.BT >= 30 || teamScores.LR >= 30
              ? 'Game Over'
              : 'Next Round'}
          </Text>
        </TouchableOpacity>

        {teamScores.BT >= 30 && (
          <Text style={styles.winnerText}>🎉 You Win! 🎉</Text>
        )}
        {teamScores.LR >= 30 && (
          <Text style={styles.loserText}>😔 Opponents Win</Text>
        )}
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  container: {
    backgroundColor: colors.felt800,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gold500,
    minWidth: 320,
    maxWidth: 340,
  },
  headerBadge: {
    backgroundColor: colors.gold600,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: -8,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.felt900,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.gold400,
    marginTop: 12,
    marginBottom: 20,
  },
  scoreBoard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  teamColumn: {
    flex: 1,
    alignItems: 'center',
  },
  teamLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.felt300,
    marginBottom: 10,
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  teamDot: { width: 8, height: 8, borderRadius: 4 },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.felt400,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  roundChange: {
    alignItems: 'center',
  },
  roundLabel: {
    fontSize: 10,
    color: colors.felt500,
    marginBottom: 2,
  },
  roundValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  positive: { color: colors.gold400 },
  negative: { color: '#FF6B6B' },
  neutral: { color: colors.felt300 },
  divider: {
    width: 1,
    height: 80,
    backgroundColor: colors.felt600,
  },
  bidInfo: {
    backgroundColor: colors.felt700,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  bidInfoText: {
    fontSize: 13,
    color: colors.felt300,
    fontWeight: '600',
  },
  bidValue: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.gold400,
  },
  continueButton: {
    paddingHorizontal: 50,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: colors.gold600,
    borderWidth: 2,
    borderColor: colors.gold400,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.felt900,
  },
  winnerText: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '900',
    color: colors.gold400,
  },
  loserText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: colors.felt300,
  },
});
