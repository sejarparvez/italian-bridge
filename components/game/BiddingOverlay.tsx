import { useGameStore } from '@/store/game-store';
import { MotiView } from 'moti';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';

const BID_OPTIONS = [7, 8, 9, 10];

interface BiddingPanelProps {
  isHumanTurn: boolean;
  highestBid: number;
}

export function BiddingPanel({ isHumanTurn, highestBid }: BiddingPanelProps) {
  const { placePlayerBid, passPlayerBid } = useGameStore();

  // Bots thinking — just a quiet spinner
  if (!isHumanTurn) {
    return null;
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 22, stiffness: 200 }}
      style={styles.container}
    >
      {/* Single context line */}
      {highestBid > 0 && (
        <Text style={styles.context}>Highest: {highestBid}</Text>
      )}

      {/* Bid buttons */}
      <View style={styles.bidButtons}>
        {BID_OPTIONS.map((bid) => {
          const disabled = bid <= highestBid;
          const isMax = bid === 10;
          return (
            <TouchableOpacity
              key={bid}
              style={[
                styles.bidButton,
                isMax && !disabled && styles.bidButtonMax,
                disabled && styles.bidButtonDisabled,
              ]}
              onPress={() => placePlayerBid(bid)}
              disabled={disabled}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.bidButtonText,
                  isMax && !disabled && styles.bidButtonTextMax,
                  disabled && styles.bidButtonTextDisabled,
                ]}
              >
                {bid}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Pass */}
      <TouchableOpacity
        style={styles.passButton}
        onPress={passPlayerBid}
        activeOpacity={0.75}
      >
        <Text style={styles.passButtonText}>Pass</Text>
      </TouchableOpacity>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  // ── Waiting ──────────────────────────────────────────────────────────────
  waiting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(11,51,35,0.7)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.felt600,
  },
  waitingText: {
    fontSize: 13,
    color: colors.felt400,
    fontWeight: '600',
    fontStyle: 'italic',
  },

  // ── Human panel ──────────────────────────────────────────────────────────
  container: {
    backgroundColor: 'rgba(15,69,48,0.95)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gold600,
    gap: 12,
  },
  context: {
    fontSize: 12,
    color: colors.felt300,
    fontWeight: '600',
    letterSpacing: 0.4,
  },

  // ── Bid buttons ──────────────────────────────────────────────────────────
  bidButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  bidButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.felt700,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.felt500,
  },
  bidButtonMax: {
    backgroundColor: colors.gold600,
    borderColor: colors.gold500,
  },
  bidButtonDisabled: {
    backgroundColor: colors.felt900,
    borderColor: colors.felt700,
    opacity: 0.35,
  },
  bidButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.felt300,
  },
  bidButtonTextMax: {
    color: colors.gold400,
  },
  bidButtonTextDisabled: {
    color: colors.felt600,
  },

  // ── Pass ─────────────────────────────────────────────────────────────────
  passButton: {
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.felt900,
    borderWidth: 1,
    borderColor: colors.felt600,
  },
  passButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.felt400,
    letterSpacing: 0.5,
  },
});
