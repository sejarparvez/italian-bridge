import { MotiView } from 'moti';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';

interface DeckProps {
  cardCount: number;
}

export function Deck({ cardCount }: DeckProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: Math.min(cardCount, 52) }).map((_, i) => (
        <MotiView
          // biome-ignore lint/suspicious/noArrayIndexKey: static UI
          key={`deck-${i}`}
          style={[
            styles.card,
            {
              marginLeft: i > 0 ? -38 : 0,
              zIndex: 52 - i,
            },
          ]}
        >
          <View style={styles.cardBackPattern}>
            <View style={styles.cardBackInner} />
          </View>
        </MotiView>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 80,
  },
  card: {
    position: 'absolute',
    width: 44,
    height: 62,
    borderRadius: 6,
    backgroundColor: colors.felt700,
    borderWidth: 1,
    borderColor: colors.felt600,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
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
