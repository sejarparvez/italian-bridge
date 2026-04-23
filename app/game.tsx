import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BiddingPanel } from '@/components/game/BiddingOverlay';
import { GameOverOverlay } from '@/components/game/GameOverOverlay';
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
  const [scoresVisible, setScoresVisible] = useState(false);
  const [exitVisible, setExitVisible] = useState(false);
  const [trumpDialogVisible, setTrumpDialogVisible] = useState(false);
  const [trumpChoice, setTrumpChoice] = useState<boolean | null>(null);
  const { state: dealState, startNewGame } = useDealing(true);
  const { state: gameState } = useGameStore();
  const router = useRouter();
  const winThreshold = useGameStore((s) => s.winThreshold);
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

  // ── Overlay phase flags ──────────────────────────────────────────────────
  const showRoundEnd = gameState.phase === 'roundEnd';
  const showGameOver = gameState.phase === 'gameEnd';

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

    const isBiddingTeamBT =
      gameState.highestBidder === 'bottom' || gameState.highestBidder === 'top';

    const isPlayerOnBiddingTeam = seat === 'bottom' || seat === 'top';

    const teamTricks = isPlayerOnBiddingTeam
      ? gameState.players.bottom.tricksTaken + gameState.players.top.tricksTaken
      : gameState.players.left.tricksTaken +
        gameState.players.right.tricksTaken;

    if (isBidder) {
      showChip = true;
      target = gameState.highestBid;
    } else if (isBiddingTeamBT && seat === 'left') {
      showChip = true;
      target = 4;
    } else if (!isBiddingTeamBT && seat === 'bottom') {
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

  const handleMenuAction = (action: string) => {
    setMenuVisible(false);
    if (action === 'New Game') {
      startNewGame();
    } else if (action === 'Settings') {
      router.push('/settings');
    } else if (action === 'Show Scores') {
      setScoresVisible(true);
    } else if (action === 'Exit Game') {
      setExitVisible(true);
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

          {showBidding && (
            <View style={styles.biddingOverlay}>
              <BiddingPanel
                highestBid={gameState.highestBid}
                highestBidder={gameState.highestBidder}
                isHumanTurn={gameState.currentSeat === 'bottom'}
              />
            </View>
          )}

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

      {/* ── Exit Confirmation Modal ── */}
      {exitVisible && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 200 }}
          style={styles.exitOverlay}
        >
          <View style={styles.exitBackdrop} />
          <MotiView
            from={{ opacity: 0, scale: 0.9, translateY: 10 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18 }}
            style={styles.exitContainer}
          >
            <View style={styles.exitIconWrap}>
              <Text style={styles.exitIcon}>🚪</Text>
            </View>
            <Text style={styles.exitTitle}>Exit Game</Text>
            <Text style={styles.exitMessage}>
              Are you sure you want to exit?{'\n'}Your progress will be lost.
            </Text>
            <View style={styles.exitButtons}>
              <TouchableOpacity
                style={styles.exitCancelBtn}
                onPress={() => setExitVisible(false)}
              >
                <Text style={styles.exitCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exitConfirmBtn}
                onPress={() => router.push('/')}
              >
                <Text style={styles.exitConfirmText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </MotiView>
      )}

      {/* ── Scores Overlay ── */}
      {scoresVisible && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 200 }}
          style={styles.scoresOverlay}
        >
          <View style={styles.scoresBackdrop} />
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 18 }}
            style={styles.scoresContainer}
          >
            <View style={styles.scoresHeader}>
              <Text style={styles.scoresTitle}>CURRENT SCORES</Text>
              <TouchableOpacity
                style={styles.scoresCloseBtn}
                onPress={() => setScoresVisible(false)}
              >
                <Text style={styles.scoresCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.scoresDivider} />
            <View style={styles.scoresRow}>
              <View style={styles.scoreTeamBox}>
                <View style={styles.scoreTeamHeader}>
                  <View
                    style={[
                      styles.scoreDot,
                      { backgroundColor: colors.gold500 },
                    ]}
                  />
                  <Text style={styles.scoreTeamLabel}>You & Marco</Text>
                </View>
                <Text style={styles.scoreValue}>{gameState.teamScores.BT}</Text>
                <Text style={styles.scoreTarget}>
                  {gameState.teamScores.BT >= 0 ? '+' : ''}
                  {gameState.teamScores.BT} / ±{winThreshold}
                </Text>
              </View>
              <Text style={styles.scoreVs}>VS</Text>
              <View style={styles.scoreTeamBox}>
                <View style={styles.scoreTeamHeader}>
                  <View
                    style={[
                      styles.scoreDot,
                      { backgroundColor: colors.felt400 },
                    ]}
                  />
                  <Text style={styles.scoreTeamLabel}>Sofia & Luca</Text>
                </View>
                <Text style={styles.scoreValue}>{gameState.teamScores.LR}</Text>
                <Text style={styles.scoreTarget}>
                  {gameState.teamScores.LR >= 0 ? '+' : ''}
                  {gameState.teamScores.LR} / ±{winThreshold}
                </Text>
              </View>
            </View>
            <View style={styles.scoresDivider} />
            <View style={styles.scoresInfo}>
              <Text style={styles.scoresInfoText}>
                First to ±{winThreshold} wins · Game continues until match ends
              </Text>
            </View>
          </MotiView>
        </MotiView>
      )}

      {/* ── Round End Overlay ── */}
      {showRoundEnd && (
        <RoundEndOverlay
          roundScores={gameState.roundScores[gameState.roundScores.length - 1]}
          teamScores={gameState.teamScores}
          highestBid={gameState.highestBid}
          highestBidder={gameState.highestBidder}
          winThreshold={winThreshold}
          onContinue={() => useGameStore.getState().nextRound()}
        />
      )}

      {/* ── Game Over Overlay ── */}
      {showGameOver && (
        <GameOverOverlay
          teamScores={gameState.teamScores}
          onNewGame={() => startNewGame()}
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
  scoresOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 150,
  },
  scoresBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  scoresContainer: {
    backgroundColor: colors.felt800,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.felt600,
    width: 340,
    padding: 20,
    alignItems: 'center',
  },
  scoresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 14,
  },
  scoresTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.felt300,
    letterSpacing: 2,
  },
  scoresCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.felt700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoresCloseText: {
    fontSize: 12,
    color: colors.felt300,
    fontWeight: '700',
  },
  scoresDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(26,122,84,0.15)',
    marginVertical: 14,
  },
  scoresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  scoreTeamBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.felt900,
    borderRadius: 12,
    padding: 14,
  },
  scoreTeamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  scoreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scoreTeamLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.felt300,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.gold400,
  },
  scoreTarget: {
    fontSize: 10,
    color: colors.felt400,
    marginTop: 4,
  },
  scoreVs: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.felt500,
  },
  scoresInfo: {
    marginTop: 12,
  },
  scoresInfoText: {
    fontSize: 10,
    color: 'rgba(125,212,168,0.45)',
    textAlign: 'center',
  },
  exitOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 160,
  },
  exitBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  exitContainer: {
    backgroundColor: colors.felt800,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(229,115,115,0.3)',
    padding: 28,
    alignItems: 'center',
    width: 300,
  },
  exitIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(229,115,115,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229,115,115,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  exitIcon: { fontSize: 26 },
  exitTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ivory300,
    marginBottom: 8,
  },
  exitMessage: {
    fontSize: 13,
    color: colors.felt300,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  exitButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  exitCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.felt700,
    alignItems: 'center',
  },
  exitCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ivory300,
  },
  exitConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#E57373',
    alignItems: 'center',
  },
  exitConfirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
});
