import { Dimensions, StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';

const { width: W } = Dimensions.get('window');
const CARD_W = 44;
const CARD_H = 62;

interface CardFanProps {
  count?: number;
  rotationBase?: number;
  style?: object;
}

export function TopFan({ count = 9, style }: CardFanProps) {
  const spread = 9;
  const halfSpread = ((count - 1) * spread) / 2;
  return (
    <View style={[styles.topFanContainer, style]} pointerEvents='none'>
      {Array.from({ length: count }).map((_, i) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: static UI
          key={`top-${i}`}
          style={[
            styles.topFanCard,
            {
              transform: [
                { rotate: `${180 + (i * spread - halfSpread)}deg` },
                { translateY: -40 },
              ],
              top: -60,
              zIndex: -1000000 + i,
            },
          ]}
        >
          <View style={styles.topFanCardBack}>
            <View style={styles.cardBackInner} />
          </View>
        </View>
      ))}
    </View>
  );
}

export function SideFan({
  count = 8,
  rotationBase = 90,
  style,
}: CardFanProps & { rotationBase?: number }) {
  const spread = 10;
  const halfSpread = ((count - 1) * spread) / 2;
  return (
    <View style={[styles.sideFanContainer, style]} pointerEvents='none'>
      {Array.from({ length: count }).map((_, i) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: static UI
          key={`side-${i}`}
          style={[
            styles.sideFanCard,
            {
              transform: [
                { rotate: `${rotationBase + (i * spread - halfSpread)}deg` },
                { translateY: -40 },
              ],
            },
          ]}
        >
          <View style={styles.sideFanCardBack}>
            <View style={styles.cardBackInner} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  topFanContainer: {
    height: 48,
    width: W * 0.55,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  topFanCard: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    borderRadius: 6,
    overflow: 'hidden',
    elevation: 4,
  },
  topFanCardBack: {
    flex: 1,
    backgroundColor: colors.felt700,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.felt600,
    padding: 4,
  },
  sideFanContainer: {
    width: 56,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideFanCard: {
    position: 'absolute',
    width: CARD_H,
    height: CARD_W,
    borderRadius: 6,
    overflow: 'hidden',
    elevation: 4,
  },
  sideFanCardBack: {
    flex: 1,
    backgroundColor: colors.felt700,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.felt600,
    padding: 4,
  },
  cardBackInner: {
    flex: 1,
    width: '100%',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.felt600,
    backgroundColor: colors.felt700,
  },
});
