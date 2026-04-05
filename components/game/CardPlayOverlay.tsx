import { MotiView } from 'moti';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Card, Suit } from '../../constants/cards';
import { colors } from '../../constants/colors';

interface CardPlayOverlayProps {
  card?: Card;
  winner?: string | null;
  onContinue: () => void;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

export function CardPlayOverlay({
  card,
  winner,
  onContinue,
}: CardPlayOverlayProps) {
  const winnerName =
    winner === 'bottom'
      ? 'You'
      : winner === 'top'
        ? 'Alex'
        : winner === 'left'
          ? 'Jordan'
          : 'Sam';

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 200 }}
      style={styles.overlay}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Trick Winner</Text>
        <Text style={styles.winner}>{winnerName}</Text>

        {card && (
          <View style={styles.cardDisplay}>
            <Text
              style={[
                styles.cardSuit,
                (card.suit === 'hearts' || card.suit === 'diamonds') &&
                  styles.cardRed,
              ]}
            >
              {SUIT_SYMBOLS[card.suit]}
            </Text>
            <Text
              style={[
                styles.cardRank,
                (card.suit === 'hearts' || card.suit === 'diamonds') &&
                  styles.cardRed,
              ]}
            >
              {card.rank}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  container: {
    backgroundColor: colors.felt800,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gold500,
    minWidth: 240,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.felt300,
    marginBottom: 8,
  },
  winner: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.gold400,
    marginBottom: 16,
  },
  cardDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  cardSuit: {
    fontSize: 40,
    color: colors.suitBlack,
  },
  cardRank: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.suitBlack,
  },
  cardRed: {
    color: colors.suitRed,
  },
  continueButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: colors.gold600,
    borderWidth: 2,
    borderColor: colors.gold400,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.felt900,
  },
});
