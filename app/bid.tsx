import { Card } from '@/src/components/cards/Card';
import { ALL_SUITS, SUIT_SYMBOLS, type Suit } from '@/src/constants/cards';
import { useGameStore } from '@/src/store/gameStore';
import { sortHandAlternating } from '@/utils/card-sort';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.06;

const BID_PANEL_HEIGHT = 180;
const HAND_HEIGHT = 80;
const HAND_LABEL_HEIGHT = 24;

const SUIT_META: Record<string, { color: string; label: string; bg: string }> =
  {
    hearts: { color: '#E8534A', label: 'Hearts', bg: 'rgba(232,83,74,0.12)' },
    diamonds: {
      color: '#E8534A',
      label: 'Diamonds',
      bg: 'rgba(232,83,74,0.12)',
    },
    clubs: { color: '#E8D5A3', label: 'Clubs', bg: 'rgba(232,213,163,0.08)' },
    spades: { color: '#E8D5A3', label: 'Spades', bg: 'rgba(232,213,163,0.08)' },
  };

export default function BidScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, placePlayerBid } = useGameStore();
  const [selectedBid, setSelectedBid] = useState<number | null>(null);
  const [showTrumpPicker, setShowTrumpPicker] = useState(false);
  const [hoveredSuit, setHoveredSuit] = useState<string | null>(null);

  const playerHand = state.players.bottom.hand;
  const sortedHand = sortHandAlternating(playerHand);

  const bidPanelTotalHeight = BID_PANEL_HEIGHT + insets.bottom + 16;
  const handZoneHeight = HAND_HEIGHT + HAND_LABEL_HEIGHT + 16;
  const tableBottomPadding = bidPanelTotalHeight + handZoneHeight;

  if (playerHand.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#061510', '#0D2B1A', '#061510']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Dealing cards…</Text>
        </View>
      </View>
    );
  }

  const handlePassBid = () => useGameStore.getState().passBid();

  const handleConfirmBid = () => {
    if (selectedBid !== null) {
      placePlayerBid(selectedBid);
      setShowTrumpPicker(true);
    }
  };

  const handleSelectTrump = (suit: Suit) => {
    useGameStore.getState().selectPlayerTrump(suit);
    setShowTrumpPicker(false);
    setTimeout(() => router.replace('/game'), 500);
  };

  if (showTrumpPicker) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#061510', '#0D2B1A', '#061510']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.vignetteOverlay} />
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 16 }}
          style={styles.trumpPickerContainer}
        >
          <View style={styles.decorativeRule}>
            <View style={styles.ruleLine} />
            <Text style={styles.ruleGem}>♦</Text>
            <View style={styles.ruleLine} />
          </View>
          <Text style={styles.trumpTitle}>Choose Trump</Text>
          <Text style={styles.trumpSubtitle}>You hold the highest bid</Text>
          <View style={styles.decorativeRule}>
            <View style={styles.ruleLine} />
            <Text style={styles.ruleGem}>♦</Text>
            <View style={styles.ruleLine} />
          </View>
          <View style={styles.suitGrid}>
            {ALL_SUITS.map((suit, i) => {
              const meta = SUIT_META[suit] ?? {
                color: '#E8D5A3',
                label: suit,
                bg: 'rgba(255,255,255,0.05)',
              };
              return (
                <MotiView
                  key={suit}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: i * 80, type: 'spring', damping: 15 }}
                >
                  <Pressable
                    onPressIn={() => setHoveredSuit(suit)}
                    onPressOut={() => setHoveredSuit(null)}
                    onPress={() => handleSelectTrump(suit as Suit)}
                    style={[
                      styles.suitCard,
                      hoveredSuit === suit && styles.suitCardHovered,
                      { backgroundColor: meta.bg },
                    ]}
                  >
                    <Text
                      style={[styles.suitSymbolLarge, { color: meta.color }]}
                    >
                      {SUIT_SYMBOLS[suit]}
                    </Text>
                    <Text style={[styles.suitCardLabel, { color: meta.color }]}>
                      {meta.label.toUpperCase()}
                    </Text>
                    <View
                      style={[
                        styles.suitCardBorder,
                        { borderColor: `${meta.color}50` },
                      ]}
                    />
                  </Pressable>
                </MotiView>
              );
            })}
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
        colors={['#061510', '#0D2B1A', '#061510']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.vignetteOverlay} />

      {/* ── Header ── */}
      <MotiView
        from={{ opacity: 0, translateY: -16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 15 }}
        style={styles.header}
      >
        <View style={styles.decorativeRule}>
          <View style={styles.ruleLine} />
          <Text style={styles.ruleGem}>♠</Text>
          <View style={styles.ruleLine} />
        </View>
        <Text style={styles.title}>BIDDING</Text>
        <Text style={styles.subtitle}>Place your bid between 7 – 10</Text>
      </MotiView>

      {/* ── Current Bid Banner ── */}
      {currentBidder && currentBid > 0 && (
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={styles.currentBidBanner}
        >
          <Text style={styles.currentBidLabel}>LEADING BID</Text>
          <Text style={styles.currentBidValue}>{currentBid}</Text>
          <Text style={styles.currentBidBy}>
            by {state.players[currentBidder].name}
          </Text>
        </MotiView>
      )}

      {/* ── Table (bots) ── */}
      <View style={[styles.tableArea, { paddingBottom: tableBottomPadding }]}>
        <View style={styles.botSlotTop}>
          <BotBidBubble
            name={state.players.top.name}
            bid={state.players.top.bid}
          />
        </View>
        <View style={styles.middleRow}>
          <BotBidBubble
            name={state.players.left.name}
            bid={state.players.left.bid}
          />
          <View style={styles.centerCrest}>
            <Text style={styles.crestSuit}>♣</Text>
            <Text style={styles.crestSuit}>♥</Text>
            <Text style={styles.crestSuit}>♦</Text>
            <Text style={styles.crestSuit}>♠</Text>
          </View>
          <BotBidBubble
            name={state.players.right.name}
            bid={state.players.right.bid}
          />
        </View>
      </View>

      {/* ── Your Hand ── */}
      <View style={[styles.yourHandZone, { bottom: bidPanelTotalHeight }]}>
        <Text style={styles.handLabel}>YOUR HAND</Text>
        <View style={styles.handContainer}>
          {sortedHand.map((card, index) => (
            <MotiView
              key={card.id}
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: index * 45, type: 'spring', damping: 15 }}
              style={[styles.cardInHand, { left: index * (CARD_WIDTH + 5) }]}
            >
              <Card card={card} />
            </MotiView>
          ))}
        </View>
      </View>

      {/* ── Bid Panel ── */}
      {isPlayerTurn && (
        <MotiView
          from={{ opacity: 0, translateY: 60 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 16, delay: 200 }}
          style={[styles.bidPanel, { paddingBottom: insets.bottom + 16 }]}
        >
          <LinearGradient
            colors={['rgba(6,21,16,0)', 'rgba(6,21,16,0.98)', '#061510']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.25 }}
          />
          <View style={styles.bidPanelInner}>
            <Text style={styles.bidPanelLabel}>SELECT BID</Text>
            <View style={styles.bidOptionsRow}>
              {[7, 8, 9, 10].map((bid) => {
                const isSelected = selectedBid === bid;
                return (
                  <Pressable key={bid} onPress={() => setSelectedBid(bid)}>
                    <MotiView
                      animate={{
                        scale: isSelected ? 1.1 : 1,
                        backgroundColor: isSelected
                          ? '#C9A84C'
                          : 'rgba(255,255,255,0.04)',
                        borderColor: isSelected
                          ? '#D4AF37'
                          : 'rgba(201,168,76,0.2)',
                      }}
                      transition={{ type: 'spring', damping: 14 }}
                      style={styles.bidChip}
                    >
                      <Text
                        style={[
                          styles.bidChipNumber,
                          isSelected && styles.bidChipNumberSelected,
                        ]}
                      >
                        {bid}
                      </Text>
                    </MotiView>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.actionRow}>
              <Pressable onPress={handlePassBid} style={styles.passBtn}>
                <Text style={styles.passBtnText}>PASS</Text>
              </Pressable>
              <Pressable
                onPress={handleConfirmBid}
                disabled={selectedBid === null}
                style={[
                  styles.confirmBtn,
                  selectedBid === null && { opacity: 0.4 },
                ]}
              >
                <LinearGradient
                  colors={
                    selectedBid !== null
                      ? ['#D4AF37', '#C9A84C', '#A8872A']
                      : ['#555', '#444']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.confirmBtnGradient}
                >
                  <Text style={styles.confirmBtnText}>CONFIRM BID</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </MotiView>
      )}
    </View>
  );
}

function BotBidBubble({ name, bid }: { name: string; bid: number | null }) {
  return (
    <MotiView animate={{ opacity: 1 }} style={styles.botBubble}>
      <Text style={styles.botBubbleName}>{name}</Text>
      <MotiView
        animate={{
          backgroundColor:
            bid !== null ? 'rgba(201,168,76,0.15)' : 'transparent',
          borderColor:
            bid !== null ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.1)',
        }}
        style={styles.botBidPill}
      >
        <Text
          style={[styles.botBidValue, bid !== null && styles.botBidValueActive]}
        >
          {bid !== null ? bid : '·  ·  ·'}
        </Text>
      </MotiView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  vignetteOverlay: {
    position: 'absolute',
    inset: 0,
    borderWidth: 40,
    borderColor: 'rgba(0,0,0,0.35)',
    borderRadius: 0,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 18, color: '#E8D5A3', letterSpacing: 2 },
  decorativeRule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '70%',
    marginVertical: 8,
  },
  ruleLine: { flex: 1, height: 1, backgroundColor: 'rgba(201,168,76,0.25)' },
  ruleGem: { color: '#C9A84C', fontSize: 11 },
  header: { alignItems: 'center', paddingTop: 16, paddingHorizontal: 24 },
  title: {
    fontSize: 30,
    color: '#E8D5A3',
    fontWeight: '900',
    letterSpacing: 8,
    textShadowColor: 'rgba(201,168,76,0.35)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 14,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(232,213,163,0.4)',
    letterSpacing: 1.5,
    marginTop: 4,
  },
  currentBidBanner: {
    marginHorizontal: 24,
    marginTop: 8,
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  currentBidLabel: {
    fontSize: 10,
    color: 'rgba(201,168,76,0.6)',
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  currentBidValue: { fontSize: 22, color: '#C9A84C', fontWeight: '900' },
  currentBidBy: { fontSize: 12, color: 'rgba(232,213,163,0.5)' },
  tableArea: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  botSlotTop: { alignItems: 'center', paddingTop: 8 },
  middleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  centerCrest: { alignItems: 'center', gap: 0 },
  crestSuit: { fontSize: 16, color: 'rgba(201,168,76,0.15)', lineHeight: 20 },
  botBubble: { alignItems: 'center', gap: 4 },
  botBubbleName: {
    fontSize: 13,
    color: '#E8D5A3',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  botBidPill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  botBidValue: {
    fontSize: 16,
    color: 'rgba(232,213,163,0.3)',
    fontWeight: '700',
  },
  botBidValueActive: { color: '#C9A84C' },
  yourHandZone: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 8,
  },
  handLabel: {
    fontSize: 10,
    color: 'rgba(232,213,163,0.35)',
    letterSpacing: 2,
    marginBottom: 8,
  },
  handContainer: { flexDirection: 'row', height: 80 },
  cardInHand: { position: 'absolute' },
  bidPanel: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  bidPanelInner: {
    paddingTop: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 14,
  },
  bidPanelLabel: {
    fontSize: 10,
    color: 'rgba(201,168,76,0.5)',
    letterSpacing: 2.5,
    fontWeight: '700',
  },
  bidOptionsRow: { flexDirection: 'row', gap: 14 },
  bidChip: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  bidChipNumber: {
    fontSize: 24,
    color: 'rgba(232,213,163,0.5)',
    fontWeight: '700',
  },
  bidChipNumberSelected: { color: '#061510', fontWeight: '900' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  passBtn: {
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
  },
  passBtnText: {
    fontSize: 13,
    color: 'rgba(232,213,163,0.4)',
    fontWeight: '700',
    letterSpacing: 1,
  },
  confirmBtn: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  confirmBtnGradient: { paddingVertical: 14, alignItems: 'center' },
  confirmBtnText: {
    fontSize: 14,
    color: '#061510',
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  trumpPickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  trumpTitle: {
    fontSize: 32,
    color: '#E8D5A3',
    fontWeight: '900',
    letterSpacing: 5,
    textShadowColor: 'rgba(201,168,76,0.4)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
  },
  trumpSubtitle: {
    fontSize: 13,
    color: 'rgba(232,213,163,0.4)',
    letterSpacing: 2,
    marginBottom: 32,
  },
  suitGrid: { flexDirection: 'row', gap: 14, marginTop: 32 },
  suitCard: {
    width: 72,
    height: 96,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  suitCardHovered: { transform: [{ scale: 1.08 }, { translateY: -4 }] },
  suitCardBorder: {
    position: 'absolute',
    inset: 0,
    borderWidth: 1,
    borderRadius: 14,
  },
  suitSymbolLarge: { fontSize: 38 },
  suitCardLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
});
