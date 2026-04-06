import { MotiView } from 'moti';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '@/store/game-store';
import type { Suit } from '../../constants/cards';
import { colors } from '../../constants/colors';

const SUITS: { suit: Suit; symbol: string; name: string; isRed: boolean }[] = [
  { suit: 'spades', symbol: '♠', name: 'Spades', isRed: false },
  { suit: 'hearts', symbol: '♥', name: 'Hearts', isRed: true },
  { suit: 'diamonds', symbol: '♦', name: 'Diamonds', isRed: true },
  { suit: 'clubs', symbol: '♣', name: 'Clubs', isRed: false },
];

export function TrumpSelectPanel() {
  const { selectPlayerTrump, state } = useGameStore();
  const highestBid = state.highestBid;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 180 }}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Select Trump</Text>
        <View style={styles.bidBadge}>
          <Text style={styles.bidBadgeText}>Bid {highestBid}</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        You won the bid — choose your trump suit
      </Text>

      <View style={styles.divider} />

      {/* Suit buttons */}
      <View style={styles.suits}>
        {SUITS.map(({ suit, symbol, name, isRed }) => (
          <TouchableOpacity
            key={suit}
            style={[
              styles.suitButton,
              isRed ? styles.suitButtonRed : styles.suitButtonBlack,
            ]}
            onPress={() => selectPlayerTrump(suit)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.suitSymbol,
                { color: isRed ? colors.suitRed : colors.suitBlack },
              ]}
            >
              {symbol}
            </Text>
            <Text
              style={[
                styles.suitName,
                { color: isRed ? '#f7a090' : colors.felt300 },
              ]}
            >
              {name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reminder note */}
      <View style={styles.noteRow}>
        <Text style={styles.noteText}>
          Trump suit stays hidden until revealed in play
        </Text>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.felt800,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gold600,
    minWidth: 280,
    maxWidth: 340,
    gap: 12,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.gold400,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bidBadge: {
    backgroundColor: colors.gold600,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  bidBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.gold400,
  },

  subtitle: {
    fontSize: 12,
    color: colors.felt300,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.felt600,
    marginVertical: 2,
  },

  // ── Suit grid ────────────────────────────────────────────────────────────
  suits: {
    flexDirection: 'row',
    gap: 10,
  },
  suitButton: {
    width: 62,
    height: 78,
    borderRadius: 14,
    backgroundColor: colors.ivory300,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    gap: 4,
  },
  suitButtonRed: {
    borderColor: '#e8a09a',
  },
  suitButtonBlack: {
    borderColor: colors.ivory500,
  },
  suitSymbol: {
    fontSize: 30,
  },
  suitName: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // ── Note ─────────────────────────────────────────────────────────────────
  noteRow: {
    backgroundColor: colors.felt700,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.felt600,
  },
  noteText: {
    fontSize: 10,
    color: colors.felt400,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
