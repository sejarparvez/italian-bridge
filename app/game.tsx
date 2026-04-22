import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BiddingPanel } from '@/components/game/BiddingOverlay';
import { RoundEndOverlay } from '@/components/game/RoundEndOverlay';
import { TrumpDialogOverlay } from '@/components/game/TrumpDialogOverlay';
import { TrumpSelectPanel } from '@/components/game/TrumpSelectOverlay';
import { useGameStore } from '@/store/game-store';
import type { SeatPosition } from '@/types/game-type';
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
  const [trumpDialogVisible, setTrumpDialogVisible] = useState(false);
  const [trumpChoice, setTrumpChoice] = useState<boolean | null>(null);
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

  const showBidding = gameState.phase === 'bidding';

  const showTrumpSelect =
    gameState.phase === 'dealing2' &&
    gameState.highestBidder === 'bottom' &&
    !isDealing;

  const showPartialHands =
    (gameState.phase === 'bidding' && !isDealing) ||
    (gameState.phase === 'dealing2' && isDealing) ||
    (gameState.phase === 'dealing2' && gameState.highestBidder === 'bottom');

  const isHumanTurn = gameState.currentSeat === 'bottom';
  const leadSuit = gameState.currentTrick.leadSuit;
  const humanHand = gameState.players.bottom.hand;
  const trumpSuit = gameState.trumpSuit;
  const trumpRevealed = gameState.trumpRevealed;

  const trickCards = gameState.currentTrick.cards;

  const canFollowLead = leadSuit
    ? humanHand.some((c) => c.suit === leadSuit)
    : true;

  const trickCardCount = trickCards.length;
  const otherPlayersPlayed = trickCards.some((c) => c.player !== 'bottom');

  const showTrumpDialog =
    isHumanTurn &&
    leadSuit &&
    trickCardCount > 0 &&
    otherPlayersPlayed &&
    trumpChoice === null &&
    !canFollowLead &&
    !trumpRevealed &&
    trumpSuit !== null;

  useEffect(() => {
    if (showTrumpDialog && !trumpDialogVisible) {
      setTrumpDialogVisible(true);
    }
  }, [showTrumpDialog, trumpDialogVisible]);

  const handleCardPress = (cardId: string) => {
    if (trumpChoice !== null) {
      useGameStore.getState().playPlayerCard(cardId, trumpChoice);
      setTrumpChoice(null);
    } else if (showTrumpDialog) {
      setTrumpDialogVisible(true);
    } else {
      useGameStore.getState().playPlayerCard(cardId);
    }
  };

  const handleRevealAndTrump = () => {
    setTrumpDialogVisible(false);
    setTrumpChoice(true);
    useGameStore.getState().revealTrump();
  };

  const handleSkip = () => {
    setTrumpDialogVisible(false);
    setTrumpChoice(false);
  };

  const getChipProps = (seat: SeatPosition) => {
    const player = gameState.players[seat];
    const isBidder = gameState.highestBidder === seat;

    let showChip = false;
    let target: number | undefined;

    if (gameState.highestBidder === null) {
      return { tricks: player.tricksTaken, bid: player.bid, target, showChip };
    }

    const teamTricks =
      seat === 'bottom' || seat === 'top'
        ? gameState.players.bottom.tricksTaken + gameState.players.top.tricksTaken
        : gameState.players.left.tricksTaken + gameState.players.right.tricksTaken;

    if (isBidder) {
      showChip = true;
      target = gameState.highestBid;
    } else if (seat === 'bottom' && gameState.highestBidder !== null) {
      showChip = true;
      target = 4;
    }

    return {
      tricks: teamTricks,
      bid: player.bid,
      target,
      showChip,
    };
  };

  const showAnimation = isDealing && dealState.currentCardIndex > 0;

  const showRoundEnd = gameState.phase === 'roundEnd';

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

      <TopBar
        onMenuPress={() => setMenuVisible(true)}
        topInset={insets.top}
        teamScores={gameState.teamScores}
        trumpSuit={gameState.trumpSuit}
        trumpRevealed={gameState.trumpRevealed}
        isHumanTrumpCreator={gameState.trumpCreator === 'bottom'}
      />

      {/* ── Top Player (Marco) — team BT ── */}
      <View
        style={[styles.topPlayerAbsolute, { top: topBarHeight - 40 }]}
        pointerEvents='none'
      >
        <TopPlayerBadge
          name='Marco'
          isActive={gameState.currentSeat === 'top'}
          {...getChipProps('top')}
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
            team='us'
            isActive={gameState.currentSeat === 'left'}
            {...getChipProps('left')}
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

          {!showDeck && !showBidding && !showTrumpSelect && (
            <TrickPile trick={gameState.currentTrick} />
          )}

          {/* Bidding UI — replace with your real BiddingPanel */}
          {showBidding && (
            <View style={styles.biddingOverlay}>
              <BiddingPanel
                highestBid={gameState.highestBid}
                highestBidder={gameState.highestBidder}
                isHumanTurn={gameState.currentSeat === 'bottom'}
              />
            </View>
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
            team='them'
            isActive={gameState.currentSeat === 'right'}
            flip
            {...getChipProps('right')}
          />
        </View>
      </View>

      {/* ── Bottom Area (Human Player) — team BT ── */}
      <View style={styles.bottomArea}>
        <UserPanel
          isActive={gameState.currentSeat === 'bottom'}
          {...getChipProps('bottom')}
        />
        <View style={styles.bottomHandWrapper}>
          {/* Full playable hand during playing phases */}
          {showHands && (
            <BottomHand
              hand={gameState.players.bottom.hand}
              onCardPress={handleCardPress}
              currentTrick={gameState.currentTrick}
              trumpSuit={gameState.trumpSuit}
              trumpRevealed={gameState.trumpRevealed}
              isMyTurn={gameState.currentSeat === 'bottom'}
              wantsToTrump={trumpChoice ?? false}
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
              wantsToTrump={false}
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

      {/* ── Round End Overlay ── */}
      {showRoundEnd && (
        <RoundEndOverlay
          roundScores={gameState.roundScores[gameState.roundScores.length - 1]}
          teamScores={gameState.teamScores}
          highestBid={gameState.highestBid}
          highestBidder={gameState.highestBidder}
          onContinue={() => useGameStore.getState().nextRound()}
        />
      )}

      {/* ── Trump Dialog Overlay ── */}
      {trumpDialogVisible && (
        <TrumpDialogOverlay
          onReveal={handleRevealAndTrump}
          onSkip={handleSkip}
        />
      )}
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
    bottom: -4,
    height: HAND_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  biddingOverlay: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    zIndex: 100,
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
  },
});
