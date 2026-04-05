import { MotiView } from 'moti';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../constants/colors';

interface BiddingOverlayProps {
  currentBid: number;
  onBid: (bid: number) => void;
  onPass: () => void;
}

const BID_OPTIONS = [7, 8, 9, 10];

export function BiddingOverlay({
  currentBid,
  onBid,
  onPass,
}: BiddingOverlayProps) {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 200 }}
      style={styles.overlay}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Your Bid</Text>
        <Text style={styles.subtitle}>Current highest: {currentBid}</Text>

        <View style={styles.buttons}>
          {BID_OPTIONS.map((bid) => (
            <TouchableOpacity
              key={bid}
              style={[
                styles.bidButton,
                bid <= currentBid && styles.bidButtonDisabled,
              ]}
              onPress={() => onBid(bid)}
              disabled={bid <= currentBid}
            >
              <Text
                style={[
                  styles.bidButtonText,
                  bid <= currentBid && styles.bidButtonTextDisabled,
                ]}
              >
                {bid}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.passButton} onPress={onPass}>
          <Text style={styles.passButtonText}>Pass</Text>
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
    minWidth: 280,
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
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  bidButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gold600,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.gold400,
  },
  bidButtonDisabled: {
    backgroundColor: colors.felt600,
    borderColor: colors.felt500,
  },
  bidButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.felt900,
  },
  bidButtonTextDisabled: {
    color: colors.felt400,
  },
  passButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: colors.felt700,
    borderWidth: 1,
    borderColor: colors.felt500,
  },
  passButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.felt300,
  },
});
