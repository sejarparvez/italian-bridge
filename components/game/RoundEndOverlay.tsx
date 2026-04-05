import { MotiView } from 'moti';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';
import type { TeamId } from '../../types/game-type';

interface RoundEndOverlayProps {
  roundScores?: {
    round: number;
    scores: Record<TeamId, number>;
  };
  onContinue: () => void;
}

export function RoundEndOverlay({
  roundScores,
  onContinue,
}: RoundEndOverlayProps) {
  const btScore = roundScores?.scores.BT ?? 0;
  const lrScore = roundScores?.scores.LR ?? 0;
  const round = roundScores?.round ?? 1;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 300 }}
      style={styles.overlay}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Round {round} Complete</Text>

        <View style={styles.scoreBoard}>
          <View style={styles.teamScore}>
            <Text style={styles.teamLabel}>You & Alex</Text>
            <Text
              style={[
                styles.scoreValue,
                btScore > 0
                  ? styles.positive
                  : btScore < 0
                    ? styles.negative
                    : styles.neutral,
              ]}
            >
              {btScore > 0 ? '+' : ''}
              {btScore}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.teamScore}>
            <Text style={styles.teamLabel}>Jordan & Sam</Text>
            <Text
              style={[
                styles.scoreValue,
                lrScore > 0
                  ? styles.positive
                  : lrScore < 0
                    ? styles.negative
                    : styles.neutral,
              ]}
            >
              {lrScore > 0 ? '+' : ''}
              {lrScore}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
          <Text style={styles.continueButtonText}>Next Round</Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  container: {
    backgroundColor: colors.felt800,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gold500,
    minWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.gold400,
    marginBottom: 20,
  },
  scoreBoard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  teamScore: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  teamLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.felt300,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '900',
  },
  positive: { color: colors.gold400 },
  negative: { color: '#FF6B6B' },
  neutral: { color: colors.felt300 },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: colors.felt600,
  },
  continueButton: {
    paddingHorizontal: 40,
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
});
