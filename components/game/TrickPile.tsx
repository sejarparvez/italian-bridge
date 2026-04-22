import { StyleSheet, View } from 'react-native';
import type { Suit } from '../../constants/cards';
import type { Trick } from '../../types/game-type';
import { Card } from './Card';

interface TrickPileProps {
  trick: Trick;
}

const SEAT_ORDER = ['bottom', 'left', 'top', 'right'] as const;

const SUIT_MAP: Record<Suit, string> = {
  spades: 'S',
  hearts: 'H',
  diamonds: 'D',
  clubs: 'C',
};

const POSITIONS: Record<string, { top: number; left: number }> = {
  bottom: { top: 50, left: 20 },
  left: { top: 0, left: -35 },
  top: { top: -45, left: 20 },
  right: { top: 0, left: 55 },
};

export function TrickPile({ trick }: TrickPileProps) {
  const cards = trick.cards;

  return (
    <View style={styles.container}>
      {SEAT_ORDER.map((seat) => {
        const trickCard = cards.find((tc) => tc.player === seat);
        if (!trickCard) return null;

        const cardKey = `${trickCard.card.rank}${SUIT_MAP[trickCard.card.suit]}`;

        return (
          <View key={seat} style={[styles.cardWrapper, POSITIONS[seat]]}>
            <Card rotate={0} faceDown={false} cardKey={cardKey} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 110,
    height: 95,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    position: 'absolute',
  },
});
