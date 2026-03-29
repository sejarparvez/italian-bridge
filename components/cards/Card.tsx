import { StyleSheet, Text, View } from 'react-native';
import {
  type Card as CardType,
  SUIT_COLORS,
  SUIT_SYMBOLS,
} from '@/constants/cards';
import { COLORS } from '@/constants/theme';

interface CardProps {
  card: CardType;
  faceDown?: boolean;
  selected?: boolean;
  onPress?: () => void;
  width?: number;
  height?: number;
}

export function Card({
  card,
  faceDown = false,
  selected = false,
  width,
  height,
}: CardProps) {
  const cardWidth = width || 50;
  const cardHeight = height || 70;
  const fontSize = cardWidth * 0.24;
  const suitSize = cardWidth * 0.4;

  if (faceDown) {
    return (
      <View
        style={[
          styles.card,
          styles.cardBack,
          { width: cardWidth, height: cardHeight },
        ]}
      >
        <View style={styles.cardBackPattern}>
          <View
            style={[
              styles.cardBackDiamond,
              { width: cardWidth * 0.4, height: cardWidth * 0.4 },
            ]}
          />
        </View>
      </View>
    );
  }

  const suitColor = SUIT_COLORS[card.suit];

  return (
    <View
      style={[
        styles.card,
        selected && styles.cardSelected,
        { width: cardWidth, height: cardHeight },
      ]}
    >
      <View style={[styles.cardInner, { padding: cardWidth * 0.08 }]}>
        <Text style={[styles.rankTop, { color: suitColor, fontSize }]}>
          {card.rank}
        </Text>
        <Text style={[styles.suit, { color: suitColor, fontSize: suitSize }]}>
          {SUIT_SYMBOLS[card.suit]}
        </Text>
        <Text style={[styles.rankBottom, { color: suitColor, fontSize }]}>
          {card.rank}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardFace,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cardSelected: {
    marginTop: -15,
    shadowColor: COLORS.goldPrimary,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  cardInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  rankTop: {
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  suit: {
    alignSelf: 'center',
  },
  rankBottom: {
    fontWeight: 'bold',
    alignSelf: 'flex-end',
    transform: [{ rotate: '180deg' }],
  },
  cardBack: {
    backgroundColor: COLORS.cardBack,
    borderWidth: 2,
    borderColor: COLORS.cardBackAccent,
  },
  cardBackPattern: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBackDiamond: {
    backgroundColor: COLORS.cardBackAccent,
    transform: [{ rotate: '45deg' }],
    opacity: 0.3,
  },
});
