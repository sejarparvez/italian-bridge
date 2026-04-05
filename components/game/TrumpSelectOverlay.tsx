import { MotiView } from 'moti';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Suit } from '../../constants/cards';
import { colors } from '../../constants/colors';

interface TrumpSelectOverlayProps {
  onSelect: (suit: Suit) => void;
}

const SUITS: { suit: Suit; name: string; symbol: string }[] = [
  { suit: 'spades', name: 'Spades', symbol: '♠' },
  { suit: 'hearts', name: 'Hearts', symbol: '♥' },
  { suit: 'diamonds', name: 'Diamonds', symbol: '♦' },
  { suit: 'clubs', name: 'Clubs', symbol: '♣' },
];

export function TrumpSelectOverlay({ onSelect }: TrumpSelectOverlayProps) {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 200 }}
      style={styles.overlay}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Select Trump</Text>
        <Text style={styles.subtitle}>Choose your trump suit</Text>

        <View style={styles.suits}>
          {SUITS.map(({ suit, name, symbol }) => (
            <TouchableOpacity
              key={suit}
              style={styles.suitButton}
              onPress={() => onSelect(suit)}
            >
              <Text style={styles.suitSymbol}>{symbol}</Text>
              <Text style={styles.suitName}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
    minWidth: 300,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.gold400,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.felt300,
    marginBottom: 24,
  },
  suits: {
    flexDirection: 'row',
    gap: 12,
  },
  suitButton: {
    width: 64,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.felt700,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gold600,
  },
  suitSymbol: {
    fontSize: 32,
    color: colors.ivory300,
    marginBottom: 4,
  },
  suitName: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.felt300,
    textTransform: 'uppercase',
  },
});
