import { MotiView } from 'moti';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';

const CARD_W = 44;
const CARD_H = 62;

interface BottomHandProps {
  count?: number;
}

export function BottomHand({ count = 10 }: BottomHandProps) {
  const spread = 11;
  const halfSpread = ((count - 1) * spread) / 2;
  return (
    <View style={styles.bottomHandContainer}>
      {Array.from({ length: count }).map((_, i) => {
        const angle = i * spread - halfSpread;
        const translateY = Math.abs(angle) * 0.5;
        return (
          <MotiView
            // biome-ignore lint/suspicious/noArrayIndexKey: static UI
            key={i}
            from={{ opacity: 0, translateY: 40 }}
            animate={{ opacity: 1, translateY }}
            transition={{ delay: 600 + i * 50, type: 'spring', damping: 16 }}
            style={[
              styles.bottomCard,
              {
                transform: [{ rotate: `${angle}deg` }, { translateY }],
                zIndex: i,
                marginLeft: i === 0 ? 0 : -28,
              },
            ]}
          >
            <View style={styles.cardBackPattern}>
              <View style={styles.cardBackInner} />
            </View>
          </MotiView>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomHandContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CARD_H + 20,
    justifyContent: 'center',
  },
  bottomCard: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 6,
    backgroundColor: colors.felt700,
    borderWidth: 1,
    borderColor: colors.felt600,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 8,
  },
  cardBackPattern: {
    flex: 1,
    width: '100%',
    borderRadius: 5,
    padding: 4,
    backgroundColor: colors.felt800,
    justifyContent: 'center',
    alignItems: 'center',
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
