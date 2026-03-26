'use client';

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, Fonts } from '@/constants/theme';
import { Card } from '@/src/components/cards/Card';
import { ALL_SUITS, SUIT_SYMBOLS, type Suit } from '@/src/constants/cards';
import { useGameStore } from '@/src/store/gameStore';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.06;

export default function BidScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, placePlayerBid } = useGameStore();
  const [selectedBid, setSelectedBid] = useState<number | null>(null);
  const [showTrumpPicker, setShowTrumpPicker] = useState(false);

  const playerHand = state.players.bottom.hand;

  const handlePassBid = () => {
    const { passBid } = useGameStore.getState();
    passBid();
  };

  const handleConfirmBid = () => {
    if (selectedBid !== null) {
      placePlayerBid(selectedBid);
      setShowTrumpPicker(true);
    }
  };

  const handleSelectTrump = (suit: Suit) => {
    const { selectPlayerTrump, runBotBids } = useGameStore.getState();
    selectPlayerTrump(suit);
    setShowTrumpPicker(false);
    setTimeout(() => {
      router.replace('/game');
    }, 500);
  };

  if (showTrumpPicker) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[COLORS.feltDark, COLORS.feltMid, COLORS.feltDark]}
          style={StyleSheet.absoluteFill}
        />
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.trumpPickerContainer}
        >
          <Text style={styles.trumpTitle}>Select Trump Suit</Text>
          <Text style={styles.trumpSubtitle}>
            Highest bidder chooses the trump
          </Text>
          <View style={styles.suitGrid}>
            {ALL_SUITS.map((suit) => (
              <Pressable
                key={suit}
                onPress={() => handleSelectTrump(suit)}
                style={styles.suitButton}
              >
                <Text style={styles.suitEmoji}>{SUIT_SYMBOLS[suit]}</Text>
                <Text style={styles.suitName}>{suit.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>
        </MotiView>
      </View>
    );
  }

  const isPlayerTurn =
    state.currentSeat === 'bottom' && state.phase === 'bidding';
  const currentBid = state.highestBid;
  const currentBidder = state.highestBidder;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[COLORS.feltDark, COLORS.feltMid, COLORS.feltDark]}
        style={StyleSheet.absoluteFill}
      />

      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 15 }}
        style={styles.header}
      >
        <Text style={styles.title}>Place Your Bid</Text>
        <Text style={styles.subtitle}>Bid between 7 - 10</Text>
      </MotiView>

      <View style={styles.bidInfo}>
        {currentBidder && currentBid > 0 && (
          <Text style={styles.currentBidText}>
            Current highest: {currentBid} by {state.players[currentBidder].name}
          </Text>
        )}
      </View>

      <View style={styles.tableArea}>
        <View style={styles.playerTop}>
          <Text style={styles.botName}>{state.players.top.name}</Text>
          <Text style={styles.botBid}>
            {state.players.top.bid !== null
              ? `Bid: ${state.players.top.bid}`
              : '...'}
          </Text>
        </View>

        <View style={styles.middleRow}>
          <View style={styles.playerLeft}>
            <Text style={styles.botName}>{state.players.left.name}</Text>
            <Text style={styles.botBid}>
              {state.players.left.bid !== null
                ? `Bid: ${state.players.left.bid}`
                : '...'}
            </Text>
          </View>

          <View style={styles.centerArea}>
            <View style={styles.dealerBadge}>
              <Text style={styles.dealerText}>DEALER</Text>
            </View>
          </View>

          <View style={styles.playerRight}>
            <Text style={styles.botName}>{state.players.right.name}</Text>
            <Text style={styles.botBid}>
              {state.players.right.bid !== null
                ? `Bid: ${state.players.right.bid}`
                : '...'}
            </Text>
          </View>
        </View>

        <View style={styles.playerBottom}>
          <Text style={styles.playerLabel}>Your Hand</Text>
          <View style={styles.handContainer}>
            {playerHand.map((card, index) => (
              <MotiView
                key={card.id}
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: index * 50, type: 'spring', damping: 15 }}
                style={[styles.cardInHand, { left: index * (CARD_WIDTH + 5) }]}
              >
                <Card card={card} />
              </MotiView>
            ))}
          </View>
        </View>
      </View>

      {isPlayerTurn && (
        <MotiView
          from={{ opacity: 0, translateY: 50 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 15, delay: 300 }}
          style={[styles.bidPicker, { paddingBottom: insets.bottom + 20 }]}
        >
          <View style={styles.bidOptions}>
            {[7, 8, 9, 10].map((bid) => (
              <Pressable
                key={bid}
                onPress={() => setSelectedBid(bid)}
                style={[
                  styles.bidButton,
                  selectedBid === bid && styles.bidButtonSelected,
                ]}
              >
                <Text
                  style={[
                    styles.bidText,
                    selectedBid === bid && styles.bidTextSelected,
                  ]}
                >
                  {bid}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.buttonRow}>
            <Pressable onPress={handlePassBid} style={styles.passButton}>
              <Text style={styles.passText}>PASS</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirmBid}
              disabled={selectedBid === null}
              style={[
                styles.confirmButton,
                selectedBid === null && styles.confirmButtonDisabled,
              ]}
            >
              <Text style={styles.confirmText}>CONFIRM BID</Text>
            </Pressable>
          </View>
        </MotiView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: Fonts.display.bold,
    color: COLORS.goldLight,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  bidInfo: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  currentBidText: {
    fontSize: 16,
    color: COLORS.goldPrimary,
    fontFamily: Fonts.body.regular,
  },
  tableArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  playerTop: {
    alignItems: 'center',
    paddingTop: 10,
  },
  botName: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontFamily: Fonts.body.semibold,
  },
  botBid: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  playerLeft: {
    alignItems: 'center',
    width: 80,
  },
  playerRight: {
    alignItems: 'center',
    width: 80,
  },
  centerArea: {
    alignItems: 'center',
  },
  dealerBadge: {
    backgroundColor: COLORS.goldDark,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dealerText: {
    fontSize: 12,
    color: COLORS.goldLight,
    fontFamily: Fonts.display.semibold,
    letterSpacing: 1,
  },
  playerBottom: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  playerLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontFamily: Fonts.body.semibold,
    marginBottom: 8,
  },
  handContainer: {
    flexDirection: 'row',
    height: 80,
  },
  cardInHand: {
    position: 'absolute',
  },
  bidPicker: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.feltDark,
    borderTopWidth: 1,
    borderTopColor: COLORS.goldDark,
    paddingTop: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  bidOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  bidButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.feltMid,
    borderWidth: 2,
    borderColor: COLORS.goldDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bidButtonSelected: {
    backgroundColor: COLORS.goldPrimary,
    borderColor: COLORS.goldLight,
  },
  bidText: {
    fontSize: 24,
    fontFamily: Fonts.display.bold,
    color: COLORS.goldLight,
  },
  bidTextSelected: {
    color: COLORS.feltDark,
  },
  confirmButton: {
    backgroundColor: COLORS.goldPrimary,
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    fontSize: 16,
    fontFamily: Fonts.display.semibold,
    color: COLORS.feltDark,
    letterSpacing: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.goldDark,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 16,
  },
  passText: {
    fontSize: 14,
    fontFamily: Fonts.display.regular,
    color: COLORS.textSecondary,
  },
  trumpPickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  trumpTitle: {
    fontSize: 32,
    fontFamily: Fonts.display.bold,
    color: COLORS.goldLight,
    marginBottom: 8,
  },
  trumpSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  suitGrid: {
    flexDirection: 'row',
    gap: 20,
  },
  suitButton: {
    width: 80,
    height: 100,
    backgroundColor: COLORS.feltMid,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.goldDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suitEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  suitName: {
    fontSize: 12,
    color: COLORS.goldLight,
    fontFamily: Fonts.body.semibold,
  },
});
