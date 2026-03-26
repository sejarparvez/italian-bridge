import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card as CardType, SUIT_SYMBOLS, SUIT_COLORS } from '../../constants/cards';
import { COLORS } from '../../../constants/theme';

interface CardProps {
  card: CardType;
  faceDown?: boolean;
  selected?: boolean;
  onPress?: () => void;
}

export function Card({ card, faceDown = false, selected = false, onPress }: CardProps) {
  if (faceDown) {
    return (
      <View style={[styles.card, styles.cardBack]}>
        <View style={styles.cardBackPattern}>
          <View style={styles.cardBackDiamond} />
        </View>
      </View>
    );
  }

  const suitColor = SUIT_COLORS[card.suit];

  return (
    <View style={[styles.card, selected && styles.cardSelected]}>
      <View style={styles.cardInner}>
        <Text style={[styles.rankTop, { color: suitColor }]}>{card.rank}</Text>
        <Text style={[styles.suit, { color: suitColor }]}>{SUIT_SYMBOLS[card.suit]}</Text>
        <Text style={[styles.rankBottom, { color: suitColor }]}>{card.rank}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 50,
    height: 70,
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
    padding: 4,
    justifyContent: 'space-between',
  },
  rankTop: {
    fontSize: 12,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  suit: {
    fontSize: 20,
    alignSelf: 'center',
  },
  rankBottom: {
    fontSize: 12,
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
    width: 20,
    height: 20,
    backgroundColor: COLORS.cardBackAccent,
    transform: [{ rotate: '45deg' }],
    opacity: 0.3,
  },
});