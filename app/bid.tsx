import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useEffect, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/src/components/cards/Card';
import { ALL_SUITS, type Suit } from '@/src/constants/cards';
import { useGameStore } from '@/store/gameStore';
import { sortHandAlternating } from '@/utils/card-sort';

const { width } = Dimensions.get('window');
const CARD_W = width * 0.06;
const BID_PANEL_H = 180;
const HAND_H = 80;

const SUIT_META: Record<
  string,
  { color: string; dim: string; symbol: string; name: string }
> = {
  hearts: {
    color: '#E8534A',
    dim: 'rgba(232,83,74,0.12)',
    symbol: '♥',
    name: 'Hearts',
  },
  diamonds: {
    color: '#E8534A',
    dim: 'rgba(232,83,74,0.12)',
    symbol: '♦',
    name: 'Diamonds',
  },
  clubs: {
    color: '#E8D5A3',
    dim: 'rgba(232,213,163,0.08)',
    symbol: '♣',
    name: 'Clubs',
  },
  spades: {
    color: '#E8D5A3',
    dim: 'rgba(232,213,163,0.08)',
    symbol: '♠',
    name: 'Spades',
  },
};

export default function BidScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, placePlayerBid, passPlayerBid, selectPlayerTrump } =
    useGameStore();
  const [selectedBid, setSelectedBid] = useState<number | null>(null);

  const hand = state.players.bottom.hand;
  const sorted = sortHandAlternating(hand);
  const bidPanelBottom = BID_PANEL_H + insets.bottom + 16;
  const handBottom = bidPanelBottom + HAND_H + 32;

  const showTrumpPicker =
    state.phase === 'dealing2' && state.highestBidder === 'bottom';

  useEffect(() => {
    if (state.phase === 'playing') router.replace('/game');
  }, [state.phase, router]);

  if (hand.length === 0) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#07130D', '#0C2016', '#07130D']}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.centerFill}>
          <MotiView
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ loop: true, duration: 1400, type: 'timing' }}
          >
            <Text style={s.loadTxt}>Dealing…</Text>
          </MotiView>
        </View>
      </View>
    );
  }

  // ── Trump picker ──────────────────────────────────────────────────────────
  if (showTrumpPicker) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={['#07130D', '#0C2016', '#07130D']}
          style={StyleSheet.absoluteFill}
        />

        <View style={s.trumpScreen}>
          {/* Eyebrow + heading */}
          <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18 }}
          >
            <Text style={s.trumpEyebrow}>YOU WON THE BID</Text>
            <Text style={s.trumpHeading}>Choose{'\n'}Trump</Text>
          </MotiView>

          {/* Suit tiles */}
          <View style={s.suitRow}>
            {ALL_SUITS.map((suit, i) => {
              const m = SUIT_META[suit];
              return (
                <MotiView
                  key={suit}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: i * 70, type: 'spring', damping: 16 }}
                >
                  <Pressable
                    onPress={() => {
                      selectPlayerTrump(suit as Suit);
                      setTimeout(() => router.replace('/game'), 400);
                    }}
                    style={({ pressed }) => [
                      s.suitTile,
                      pressed && s.suitTilePressed,
                      { borderColor: `${m.color}40` },
                    ]}
                  >
                    <View style={[s.suitTileInner, { backgroundColor: m.dim }]}>
                      <Text style={[s.suitTileSymbol, { color: m.color }]}>
                        {m.symbol}
                      </Text>
                      <Text style={[s.suitTileName, { color: `${m.color}99` }]}>
                        {m.name.toUpperCase()}
                      </Text>
                    </View>
                  </Pressable>
                </MotiView>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  // ── Main bid screen ───────────────────────────────────────────────────────
  const myTurn = state.currentSeat === 'bottom' && state.phase === 'bidding';
  const topBid = state.highestBid;
  const topBidder = state.highestBidder;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#07130D', '#0C2016', '#07130D']}
        style={StyleSheet.absoluteFill}
      />

      {/* ── Page heading ── */}
      <View style={[s.pageHead, { marginTop: insets.top + 16 }]}>
        <Text style={s.pageEyebrow}>ROUND {state.round ?? 1}</Text>
        <Text style={s.pageTitle}>Bidding</Text>
      </View>

      {/* ── Leading bid ── */}
      {topBidder && topBid > 0 && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={s.leadBanner}
        >
          <Text style={s.leadLabel}>Leading bid</Text>
          <View style={s.leadRight}>
            <Text style={s.leadName}>{state.players[topBidder].name}</Text>
            <Text style={s.leadScore}>{topBid}</Text>
          </View>
        </MotiView>
      )}

      {/* ── Bot seats ── */}
      <View style={[s.arena, { paddingBottom: handBottom }]}>
        {/* Top bot */}
        <View style={s.arenaTop}>
          <BotRow name={state.players.top.name} bid={state.players.top.bid} />
        </View>
        {/* Side bots */}
        <View style={s.arenaMiddle}>
          <BotRow name={state.players.left.name} bid={state.players.left.bid} />
          <View style={s.arenaCrest}>
            <Text style={s.crestTxt}>♣ ♥{'\n'}♦ ♠</Text>
          </View>
          <BotRow
            name={state.players.right.name}
            bid={state.players.right.bid}
          />
        </View>
      </View>

      {/* ── Hand preview ── */}
      <View style={[s.handPreview, { bottom: bidPanelBottom }]}>
        <Text style={s.handLabel}>YOUR HAND</Text>
        <View style={s.handCards}>
          {sorted.map((card, i) => (
            <MotiView
              key={card.id}
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: i * 38, type: 'spring', damping: 15 }}
              style={[s.handCard, { left: i * (CARD_W + 4) }]}
            >
              <Card card={card} />
            </MotiView>
          ))}
        </View>
      </View>

      {/* ── Bid panel ── */}
      {myTurn && (
        <MotiView
          from={{ translateY: 80, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 18, delay: 150 }}
          style={[s.bidPanel, { paddingBottom: insets.bottom + 20 }]}
        >
          {/* Fade scrim */}
          <LinearGradient
            colors={['rgba(7,19,13,0)', 'rgba(7,19,13,0.98)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 0.3 }}
            pointerEvents='none'
          />

          <View style={s.bidInner}>
            {/* Bid chips */}
            <View style={s.chipsRow}>
              {[7, 8, 9, 10].map((n) => {
                const sel = selectedBid === n;
                const dis = n <= topBid && topBid > 0;
                return (
                  <Pressable
                    key={n}
                    disabled={dis}
                    onPress={() => setSelectedBid(n)}
                  >
                    <MotiView
                      animate={{
                        scale: sel ? 1.08 : 1,
                        borderColor: sel
                          ? '#C9A84C'
                          : dis
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(201,168,76,0.22)',
                        backgroundColor: sel
                          ? 'rgba(201,168,76,0.15)'
                          : 'transparent',
                      }}
                      transition={{ type: 'spring', damping: 14 }}
                      style={s.chip}
                    >
                      <Text
                        style={[
                          s.chipNum,
                          sel && s.chipNumSel,
                          dis && s.chipNumDis,
                        ]}
                      >
                        {n}
                      </Text>
                      {sel && <View style={s.chipDot} />}
                    </MotiView>
                  </Pressable>
                );
              })}
            </View>

            {/* Actions */}
            <View style={s.actions}>
              <Pressable
                style={({ pressed }) => [
                  s.passBtn,
                  pressed && { opacity: 0.6 },
                ]}
                onPress={() => passPlayerBid()}
              >
                <Text style={s.passTxt}>Pass</Text>
              </Pressable>

              <Pressable
                style={[s.confirmBtn, !selectedBid && { opacity: 0.35 }]}
                disabled={!selectedBid}
                onPress={() => {
                  if (selectedBid) placePlayerBid(selectedBid);
                }}
              >
                <LinearGradient
                  colors={['#D4AF37', '#B8922A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.confirmGrad}
                >
                  <Text style={s.confirmTxt}>
                    {selectedBid ? `Bid ${selectedBid}` : 'Select a bid'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </MotiView>
      )}

      {/* Waiting state */}
      {state.phase === 'bidding' && !myTurn && (
        <View style={[s.waitBar, { bottom: insets.bottom + 20 }]}>
          <MotiView
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ loop: true, duration: 900, type: 'timing' }}
            style={s.waitDot}
          />
          <Text style={s.waitTxt}>Waiting for bids…</Text>
        </View>
      )}
    </View>
  );
}

// ── Bot row component ─────────────────────────────────────────────────────────
function BotRow({ name, bid }: { name: string; bid: number | null }) {
  const hasBid = bid !== null;
  const isPassed = bid === 0;
  const label = bid === null ? '…' : bid === 0 ? 'Pass' : String(bid);

  return (
    <View style={b.wrap}>
      <View style={b.avatar}>
        <Text style={b.avatarTxt}>{name[0]}</Text>
      </View>
      <Text style={b.name}>{name}</Text>
      <MotiView
        animate={{
          opacity: hasBid ? 1 : 0.4,
          backgroundColor:
            hasBid && !isPassed ? 'rgba(201,168,76,0.1)' : 'transparent',
        }}
        style={[b.bidPill, isPassed && b.bidPillPassed]}
      >
        <Text
          style={[
            b.bidTxt,
            hasBid && !isPassed && b.bidTxtActive,
            isPassed && b.bidTxtPassed,
          ]}
        >
          {label}
        </Text>
      </MotiView>
    </View>
  );
}

const b = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: {
    fontSize: 13,
    color: 'rgba(232,213,163,0.5)',
    fontWeight: '700',
  },
  name: { fontSize: 11, color: 'rgba(232,213,163,0.5)', fontWeight: '500' },
  bidPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 36,
    alignItems: 'center',
  },
  bidPillPassed: {},
  bidTxt: { fontSize: 13, color: 'rgba(232,213,163,0.25)', fontWeight: '600' },
  bidTxtActive: { color: '#C9A84C', fontSize: 16, fontWeight: '800' },
  bidTxtPassed: {
    color: 'rgba(232,213,163,0.3)',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadTxt: {
    fontSize: 15,
    color: 'rgba(232,213,163,0.4)',
    letterSpacing: 3,
    fontWeight: '600',
  },

  // Page heading
  pageHead: { paddingHorizontal: 24, marginBottom: 4 },
  pageEyebrow: {
    fontSize: 9,
    color: '#C9A84C',
    fontWeight: '700',
    letterSpacing: 2.5,
    marginBottom: 2,
  },
  pageTitle: {
    fontSize: 34,
    color: '#E8D5A3',
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  // Leading bid banner
  leadBanner: {
    marginHorizontal: 24,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.15)',
    borderRadius: 12,
  },
  leadLabel: {
    fontSize: 10,
    color: 'rgba(232,213,163,0.4)',
    letterSpacing: 1,
    fontWeight: '600',
  },
  leadRight: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  leadName: { fontSize: 12, color: 'rgba(232,213,163,0.6)', fontWeight: '500' },
  leadScore: { fontSize: 28, color: '#C9A84C', fontWeight: '800' },

  // Bot arena
  arena: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 20 },
  arenaTop: { alignItems: 'center', paddingTop: 4 },
  arenaMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  arenaCrest: { alignItems: 'center' },
  crestTxt: {
    fontSize: 18,
    color: 'rgba(201,168,76,0.08)',
    letterSpacing: 4,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Hand preview
  handPreview: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 4,
  },
  handLabel: {
    fontSize: 8,
    color: 'rgba(232,213,163,0.28)',
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 8,
  },
  handCards: { flexDirection: 'row', height: HAND_H },
  handCard: { position: 'absolute' },

  // Bid panel
  bidPanel: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  bidInner: { paddingTop: 24, paddingHorizontal: 20, gap: 14 },

  chipsRow: { flexDirection: 'row', justifyContent: 'center', gap: 14 },
  chip: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  chipNum: { fontSize: 26, color: 'rgba(232,213,163,0.4)', fontWeight: '700' },
  chipNumSel: { color: '#C9A84C', fontWeight: '800' },
  chipNumDis: { color: 'rgba(255,255,255,0.1)', fontWeight: '400' },
  chipDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#C9A84C' },

  actions: { flexDirection: 'row', gap: 10 },
  passBtn: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.15)',
    justifyContent: 'center',
  },
  passTxt: {
    fontSize: 13,
    color: 'rgba(232,213,163,0.4)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  confirmBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  confirmGrad: { paddingVertical: 16, alignItems: 'center' },
  confirmTxt: {
    fontSize: 14,
    color: '#07130D',
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  waitBar: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  waitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(201,168,76,0.5)',
  },
  waitTxt: { fontSize: 12, color: 'rgba(232,213,163,0.38)', letterSpacing: 1 },

  // Trump picker
  trumpScreen: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    gap: 40,
  },
  trumpEyebrow: {
    fontSize: 9,
    color: '#C9A84C',
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 8,
  },
  trumpHeading: {
    fontSize: 44,
    color: '#E8D5A3',
    fontWeight: '800',
    lineHeight: 46,
    letterSpacing: -1,
  },
  suitRow: { flexDirection: 'row', gap: 12 },
  suitTile: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  suitTilePressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
  suitTileInner: {
    width: 74,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  suitTileSymbol: { fontSize: 38 },
  suitTileName: { fontSize: 7, fontWeight: '800', letterSpacing: 2 },
});
