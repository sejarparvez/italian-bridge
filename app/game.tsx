import { useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BiddingPanel } from '@/components/game/BiddingOverlay';
import { TrumpSelectPanel } from '@/components/game/TrumpSelectOverlay';
import { useGameStore } from '@/store/game-store';
import { BottomHand, HAND_HEIGHT } from '../components/game/BottomHand';
import { SideFan, TopFan } from '../components/game/CardFan';
import { DealingAnimation } from '../components/game/DealingAnimation';
import { Deck } from '../components/game/Deck';
import { MenuOverlay } from '../components/game/MenuOverlay';
import {
  SidePlayerBadge,
  TopPlayerBadge,
  UserPanel,
} from '../components/game/PlayerBadges';
import { TopBar } from '../components/game/TopBar';
import { TrickPile } from '../components/game/TrickPile';
import { colors } from '../constants/colors';
import { useDealing } from '../hooks/useDealing';

const { height: H } = Dimensions.get('window');

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const { state: dealState, startNewGame } = useDealing(true);
  const { state: gameState } = useGameStore();
  const topBarHeight = insets.top + 52;

  // ── Derived display flags ────────────────────────────────────────────────
  const isDealing = dealState.isDealing;
  const showDeck = dealState.deckCount > 0;

  const showHands =
    gameState.phase === 'playing' ||
    gameState.phase === 'trickEnd' ||
    gameState.phase === 'roundEnd';

  const showPartialHands =
    (gameState.phase === 'bidding' || gameState.phase === 'dealing2') &&
    !isDealing;

  const showBidding = gameState.phase === 'bidding';

  const showTrumpSelect =
    gameState.phase === 'dealing2' &&
    gameState.highestBidder === 'bottom' &&
    !isDealing;

  const showAnimation = isDealing && dealState.currentCardIndex > 0;

  // ── Score helpers (BT = bottom+top, LR = left+right) ────────────────────
  const btScore = gameState.teamScores?.BT ?? 0;
  const lrScore = gameState.teamScores?.LR ?? 0;

  const handleMenuAction = (action: string) => {
    setMenuVisible(false);
    if (action === 'New Game') {
      startNewGame();
    }
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {Array.from({ length: 14 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static background
        <View key={i} style={[styles.feltLine, { top: i * (H / 14) }]} />
      ))}

      <TopBar onMenuPress={() => setMenuVisible(true)} topInset={insets.top} />

      {/* ── Top Player (Marco) — team BT ── */}
      <View
        style={[styles.topPlayerAbsolute, { top: topBarHeight - 40 }]}
        pointerEvents='none'
      >
        <TopPlayerBadge
          name='Marco'
          score={btScore}
          bid={gameState.players.top.bid}
          isActive={gameState.currentSeat === 'top'}
        />
        {showHands && <TopFan count={13} />}
        {showPartialHands && <TopFan count={5} />}
      </View>

      {/* ── Middle Row ── */}
      <View style={[styles.middleRow, { marginTop: topBarHeight + 20 }]}>
        {/* Left player (Sofia) — team LR */}
        <View style={styles.sideColumn}>
          <SidePlayerBadge
            name='Sofia'
            score={lrScore}
            bid={gameState.players.left.bid}
            team='us'
            isActive={gameState.currentSeat === 'left'}
          />
          {showHands && (
            <SideFan
              count={13}
              rotationBase={90}
              style={{ top: -70, zIndex: -1 }}
            />
          )}
          {showPartialHands && (
            <SideFan
              count={5}
              rotationBase={90}
              style={{ top: -70, zIndex: -1 }}
            />
          )}
        </View>

        {/* Center table */}
        <View style={styles.centerTable}>
          {showDeck && <Deck cardCount={dealState.deckCount} />}

          {!showDeck && !showBidding && !showTrumpSelect && <TrickPile />}

          {/* Bidding UI — replace with your real BiddingPanel */}
          {showBidding && (
            <BiddingPanel
              highestBid={gameState.highestBid}
              isHumanTurn={gameState.currentSeat === 'bottom'}
            />
          )}

          {/* Trump selection — shown when human won the bid */}
          {showTrumpSelect && <TrumpSelectPanel />}
        </View>

        {/* Right player (Luca) — team LR */}
        <View style={[styles.sideColumn, { top: -60 }]}>
          {showHands && (
            <SideFan count={13} rotationBase={-90} style={{ top: 70 }} />
          )}
          {showPartialHands && (
            <SideFan count={5} rotationBase={-90} style={{ top: 70 }} />
          )}
          <SidePlayerBadge
            name='Luca'
            score={lrScore}
            bid={gameState.players.right.bid}
            team='them'
            isActive={gameState.currentSeat === 'right'}
            flip
          />
        </View>
      </View>

      {/* ── Bottom Area (Human Player) — team BT ── */}
      <View style={styles.bottomArea}>
        <UserPanel
          score={btScore}
          bid={gameState.players.bottom.bid}
          isActive={gameState.currentSeat === 'bottom'}
        />
        <View style={styles.bottomHandWrapper}>
          {/* Full playable hand during playing phases */}
          {showHands && (
            <BottomHand
              hand={gameState.players.bottom.hand}
              onCardPress={(cardId) =>
                useGameStore.getState().playPlayerCard(cardId)
              }
              currentTrick={gameState.currentTrick}
              trumpSuit={gameState.trumpSuit}
              trumpRevealed={gameState.trumpRevealed}
              isMyTurn={gameState.currentSeat === 'bottom'}
            />
          )}
          {/* Partial hand visible during bidding (not playable) */}
          {showPartialHands && (
            <BottomHand
              hand={gameState.players.bottom.hand}
              onCardPress={undefined}
              currentTrick={gameState.currentTrick}
              trumpSuit={gameState.trumpSuit}
              trumpRevealed={gameState.trumpRevealed}
              isMyTurn={false}
            />
          )}
        </View>
      </View>

      {/* ── Dealing Animation ── */}
      {showAnimation && (
        <DealingAnimation currentCardIndex={dealState.currentCardIndex} />
      )}

      {/* ── Menu Overlay ── */}
      <MenuOverlay
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onAction={handleMenuAction}
        panelTop={topBarHeight + 6}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.felt900, overflow: 'hidden' },
  feltLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(26,122,84,0.07)',
  },
  topPlayerAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    gap: 2,
  },
  middleRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  sideColumn: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  centerTable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  bottomArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  bottomHandWrapper: {
    position: 'absolute',
    left: 27,
    right: 0,
    bottom: 16,
    height: HAND_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
});
