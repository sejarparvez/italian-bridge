import { MotiView } from 'moti';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';

interface CardProps {
  index?: number;
  rotate?: number;
  faceDown?: boolean;
  suit?: '♠' | '♥' | '♦' | '♣';
  rank?: string;
}

const CARD_W = 44;
const CARD_H = 62;

export function Card({
  index = 0,
  rotate = 0,
  faceDown = true,
  suit,
  rank,
}: CardProps) {
  const isRed = suit === '♥' || suit === '♦';
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 40, type: 'spring', damping: 18 }}
      style={[
        styles.card,
        { transform: [{ rotate: `${rotate}deg` }] },
        faceDown && styles.cardBack,
      ]}
    >
      {!faceDown && suit && rank ? (
        <>
          <Text style={[styles.cardRankTL, isRed && styles.cardRed]}>
            {rank}
          </Text>
          <Text style={[styles.cardSuitCenter, isRed && styles.cardRed]}>
            {suit}
          </Text>
          <Text style={[styles.cardRankBR, isRed && styles.cardRed]}>
            {rank}
          </Text>
        </>
      ) : (
        <View style={styles.cardBackPattern}>
          <View style={styles.cardBackInner} />
        </View>
      )}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: CARD_W,
    height: CARD_H,
    borderRadius: 6,
    backgroundColor: colors.ivory300,
    borderWidth: 1,
    borderColor: colors.ivory500,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  cardBack: { backgroundColor: colors.felt700, borderColor: colors.felt600 },
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
  cardRankTL: {
    position: 'absolute',
    top: 4,
    left: 5,
    fontSize: 11,
    fontWeight: '900',
    color: colors.suitBlack,
  },
  cardRankBR: {
    position: 'absolute',
    bottom: 4,
    right: 5,
    fontSize: 11,
    fontWeight: '900',
    color: colors.suitBlack,
    transform: [{ rotate: '180deg' }],
  },
  cardSuitCenter: { fontSize: 22, color: colors.suitBlack },
  cardRed: { color: colors.suitRed },
});
