import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';

interface ScoreChipProps {
  score: number;
  bid: number;
}

export function ScoreChip({ score, bid }: ScoreChipProps) {
  const pos = score >= 0;
  return (
    <View style={[styles.scoreChip, pos ? styles.scorePos : styles.scoreNeg]}>
      <Text
        style={[
          styles.scoreText,
          pos ? styles.scoreTextPos : styles.scoreTextNeg,
        ]}
      >
        {pos ? '+' : ''}
        {score}
      </Text>
      <Text style={styles.bidText}>BID {bid}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scoreChip: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  scorePos: { backgroundColor: colors.scorePosBg },
  scoreNeg: { backgroundColor: colors.scoreNegBg },
  scoreText: { fontSize: 11, fontWeight: '900' },
  scoreTextPos: { color: colors.scorePosText },
  scoreTextNeg: { color: colors.scoreNegText },
  bidText: {
    fontSize: 8,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.8,
  },
});
