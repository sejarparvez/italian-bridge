import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useGameStore } from '@/store/game-store';
import type { Suit } from '../../constants/cards';
import { colors } from '../../constants/colors';

const SUITS: { suit: Suit; symbol: string; name: string; isRed: boolean }[] = [
  { suit: 'spades', symbol: '♠', name: 'Spades', isRed: false },
  { suit: 'hearts', symbol: '♥', name: 'Hearts', isRed: true },
  { suit: 'clubs', symbol: '♣', name: 'Clubs', isRed: false },
  { suit: 'diamonds', symbol: '♦', name: 'Diamonds', isRed: true },
];

export function TrumpSelectPanel() {
  const { selectPlayerTrump, state } = useGameStore();
  const highestBid = state.highestBid;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 18, stiffness: 150 }}
      style={styles.container}
    >
      <LinearGradient
        colors={[colors.felt800, colors.felt900]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Decorative accent lines */}
        <View style={styles.accentTop} />
        <View style={styles.accentBottom} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.title}>Select Trump</Text>
          <View style={styles.bidBadge}>
            <Text style={styles.bidBadgeText}>Bid {highestBid}</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Choose your trump suit to win the trick
        </Text>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerDot} />
          <View style={styles.dividerLine} />
        </View>

        {/* Suit buttons - card style */}
        <View style={styles.suits}>
          {SUITS.map(({ suit, symbol, name, isRed }, index) => (
            <MotiView
              key={suit}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: index * 80, type: 'spring', damping: 20 }}
            >
              <TouchableOpacity
                style={styles.suitButton}
                onPress={() => selectPlayerTrump(suit)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    isRed ? ['#FEFEFE', '#F0EBE3'] : ['#FEFEFE', '#E8E6DE']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.suitButtonGradient}
                >
                  <View
                    style={[
                      styles.suitInner,
                      isRed ? styles.suitInnerRed : styles.suitInnerBlack,
                    ]}
                  >
                    <Text
                      style={[styles.suitSymbol, isRed && styles.suitSymbolRed]}
                    >
                      {symbol}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.suitName,
                      { color: isRed ? colors.suitRed : colors.suitBlack },
                    ]}
                  >
                    {name}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </MotiView>
          ))}
        </View>
      </LinearGradient>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    bottom: '25%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.gold500,
    shadowColor: colors.gold500,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 300,
  },
  gradient: {
    paddingHorizontal: 28,
    paddingVertical: 22,
    alignItems: 'center',
  },

  // Decorative accents
  accentTop: {
    position: 'absolute',
    top: 0,
    left: '15%',
    right: '15%',
    height: 2,
    backgroundColor: colors.gold400,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  accentBottom: {
    position: 'absolute',
    bottom: 0,
    left: '15%',
    right: '15%',
    height: 2,
    backgroundColor: colors.gold400,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  crown: {
    fontSize: 22,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.gold400,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  bidBadge: {
    backgroundColor: colors.gold600,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.gold500,
  },
  bidBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.felt900,
  },

  subtitle: {
    fontSize: 14,
    color: colors.felt300,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.4,
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.felt600,
  },
  dividerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold500,
    marginHorizontal: 12,
  },

  // Suit buttons - card style
  suits: {
    flexDirection: 'row',
    gap: 14,
  },
  suitButton: {
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  suitButtonGradient: {
    width: 66,
    height: 90,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.ivory500,
  },
  suitInner: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  suitInnerRed: {
    backgroundColor: '#FDEAEA',
  },
  suitInnerBlack: {
    backgroundColor: '#E8E8E8',
  },
  suitSymbol: {
    fontSize: 32,
  },
  suitSymbolRed: {
    color: colors.suitRed,
  },
  suitName: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Note
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 16,
    gap: 8,
  },
  noteIcon: {
    fontSize: 14,
  },
  noteText: {
    fontSize: 11,
    color: colors.felt300,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
