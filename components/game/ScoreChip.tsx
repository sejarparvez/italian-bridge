import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import type { BidValue } from '../../types/game-type';

interface ScoreChipProps {
  tricks: number;
  bid: BidValue;
  target?: number;
}

export function ScoreChip({ tricks, bid, target }: ScoreChipProps) {
  const bidValue = bid ?? 0;

  const displayText = () => {
    if (target !== undefined) {
      return `${tricks}/${target}`;
    }
    if (bidValue > 0) {
      return `${tricks}/${bidValue}`;
    }
    return tricks;
  };

  return (
    <View style={styles.scoreChip}>
      <Text style={styles.tricksText}>{displayText()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scoreChip: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.felt700,
  },
  tricksText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.ivory300,
  },
});
