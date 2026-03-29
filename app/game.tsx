import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Home, RefreshCw, Settings, X } from 'lucide-react-native';
import { MotiView } from 'moti';
import type React from 'react';
import { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '@/components/cards/Card';
import { HStack } from '@/components/ui/hstack';
import { Icon } from '@/components/ui/icon';
import { Menu, MenuItem, MenuItemLabel } from '@/components/ui/menu';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { SUIT_SYMBOLS } from '@/constants/cards';
import { getWinner } from '@/game/engine';
import { getPlayableCards } from '@/game/trick';
import type { SeatPosition } from '@/game/types';
import { useGameStore } from '@/store/gameStore';
import { sortHandAlternating } from '@/utils/card-sort';

// ── Constants ─────────────────────────────────────────────────────────────────

const { width, height } = Dimensions.get('window');
const SCREEN_H = Math.min(width, height);
const SCREEN_W = Math.max(width, height);

const CARD_W = SCREEN_H * 0.17;
const CARD_H = CARD_W * 1.45;
const CARD_OVERLAP = CARD_W * 0.52;
const TRICK_CARD_W = SCREEN_H * 0.13;
const TRICK_CARD_H = TRICK_CARD_W * 1.55;
const TRICK_OFFSET = SCREEN_H * 0.18;

// ── Single colour palette (was duplicated as C and C2) ───────────────────────

const C = {
  bg: '#06110A',
  felt: '#0A1C0F',
  gold: '#C8A840',
  goldDim: 'rgba(200,168,64,0.25)',
  goldFaint: 'rgba(200,168,64,0.08)',
  goldAccent: 'rgba(200,168,64,0.12)',
  white10: 'rgba(255,255,255,0.10)',
  white05: 'rgba(255,255,255,0.05)',
  white03: 'rgba(255,255,255,0.03)',
  danger: 'rgba(248,113,113,0.7)',
  dangerDim: 'rgba(248,113,113,0.5)',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function stableRot(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return ((h % 100) - 50) / 10;
}

function getHandLayout(count: number) {
  const totalWidth = CARD_W + (count - 1) * CARD_OVERLAP;
  const startX = (SCREEN_W - totalWidth) / 2;
  return Array.from({ length: count }, (_, i) => {
    const norm = count > 1 ? i / (count - 1) : 0.5;
    const center = norm - 0.5;
    return {
      x: startX + i * CARD_OVERLAP,
      rotate: center * 27,
      y: Math.abs(center) * 17,
    };
  });
}

const slotFor = (p: SeatPosition) => {
  const o = TRICK_OFFSET;
  return p === 'bottom'
    ? { x: 0, y: o }
    : p === 'top'
      ? { x: 0, y: -o }
      : p === 'left'
        ? { x: -o * 1.2, y: 0 }
        : { x: o * 1.2, y: 0 };
};

/**
 * Score pill shown on one player per team.
 * Shows tricks taken vs the team target.
 *
 * Bidding team: target = bid amount (e.g. 0/8)
 * Opposing team: target = 4 (minimum to score, always shown as X/4)
 *
 * Only rendered on the "primary" seat for each team:
 *   BT team → bottom (human)
 *   LR team → right (opponent)
 * Top and left seats show no score badge — avoids redundancy in a team game.
 */
function TeamScoreBadge({
  tricks,
  bid,
  isBiddingTeam,
  active,
}: {
  tricks: number; // combined team tricks taken this round
  bid: number | null; // bid if this is the bidding team, null if opposing
  isBiddingTeam: boolean;
  active: boolean;
}) {
  // Bidding team target = their bid. Opposing team target = 4 (always).
  const numericTarget = isBiddingTeam ? (bid ?? 0) : 4;
  const target = isBiddingTeam ? (bid ?? '?') : 4;

  // Colour cue: gold when on track or ahead, red when behind with few tricks left
  // tricks === 0 and target unknown — stay neutral
  const onTrack = numericTarget === 0 || tricks >= numericTarget;
  const valueColor = active
    ? C.gold
    : onTrack
      ? 'rgba(100,200,120,0.85)' // soft green — on track
      : 'rgba(220,100,80,0.85)'; // soft red — behind target

  return (
    <View style={[styles.trickBadge, active && styles.trickBadgeActive]}>
      <Text style={[styles.trickText, { color: valueColor }]}>
        {tricks}
        <Text style={{ opacity: 0.45, color: 'rgba(240,220,160,0.35)' }}>
          /{target}
        </Text>
      </Text>
    </View>
  );
}

function OpponentSeat({
  name,
  active,
  orientation = 'vertical',
  scoreBadge,
}: {
  name: string;
  active: boolean;
  orientation?: 'vertical' | 'horizontal';
  /** If provided, renders a TeamScoreBadge below the name */
  scoreBadge?: React.ReactNode;
}) {
  const isH = orientation === 'horizontal';

  return (
    <View
      style={[
        styles.seatWrap,
        active && styles.seatActive,
        isH && styles.seatH,
      ]}
    >
      {active && (
        <MotiView
          from={{ opacity: 0.6, scale: 0.85 }}
          animate={{ opacity: 0, scale: 1.5 }}
          transition={{ loop: true, duration: 1400, type: 'timing' }}
          style={StyleSheet.absoluteFillObject}
        />
      )}

      <View style={[styles.avatar, active && styles.avatarActive]}>
        <Text style={styles.avatarText}>{name[0].toUpperCase()}</Text>
      </View>

      <View
        style={isH ? { marginLeft: 8 } : { marginTop: 5, alignItems: 'center' }}
      >
        <Text
          style={[
            styles.seatName,
            active && { color: 'rgba(240,220,160,0.9)' },
          ]}
          numberOfLines={1}
        >
          {name}
        </Text>
        {scoreBadge}
      </View>

      {active && (
        <MotiView
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ loop: true, duration: 900, type: 'timing' }}
          style={styles.activeDot}
        />
      )}
    </View>
  );
}

/** Compact team score panel — sits in the HUD alongside trump pill */
function ScorePanel({
  btScore,
  lrScore,
}: {
  btScore: number;
  lrScore: number;
}) {
  const fmt = (n: number) => (n > 0 ? `+${n}` : String(n));
  return (
    <View style={styles.scorePanel}>
      <View style={styles.scorePanelRow}>
        <Text style={styles.scorePanelLabel}>US</Text>
        <Text
          style={[
            styles.scorePanelValue,
            btScore > 0 && { color: C.gold },
            btScore <= -20 && { color: C.danger },
          ]}
        >
          {fmt(btScore)}
        </Text>
      </View>
      <View style={styles.scorePanelDivider} />
      <View style={styles.scorePanelRow}>
        <Text style={styles.scorePanelLabel}>THEM</Text>
        <Text
          style={[
            styles.scorePanelValue,
            lrScore > 0 && { color: 'rgba(255,255,255,0.5)' },
            lrScore <= -20 && { color: C.danger },
          ]}
        >
          {fmt(lrScore)}
        </Text>
      </View>
    </View>
  );
}

/**
 * Trump peek button — shown only to the human player when:
 * - they created the trump (trumpCreator === 'bottom')
 * - trump has not been revealed yet
 * Tapping it calls revealTrump so all players see the suit.
 */

/**
 * Mini playing card that shows the trump suit.
 *
 * States:
 * - Hidden (face-down): shown when trump hasn't been revealed but user CAN peek.
 *   Tapping flips it to reveal.
 * - Revealed: shows suit symbol and name, styled like a real card face.
 *
 * Red suits (hearts/diamonds) get a warm card face.
 * Black suits (clubs/spades) get a cool card face.
 */
function TrumpMiniCard({
  suit,
  revealed,
  canPeek,
  onPeek,
}: {
  suit: string;
  revealed: boolean;
  canPeek: boolean;
  onPeek?: () => void;
}) {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const symbol = SUIT_SYMBOLS[suit as keyof typeof SUIT_SYMBOLS];

  // Card face colours
  const faceColor = isRed ? '#FFF5F5' : '#F5F7FF';
  const suitColor = isRed ? '#D42B2B' : '#1A1A2E';
  const borderColor = isRed ? 'rgba(212,43,43,0.3)' : 'rgba(26,26,46,0.25)';

  if (!revealed && canPeek) {
    // Face-down state — tap to peek
    return (
      <MotiView
        from={{ opacity: 0, scale: 0.7, rotateY: '90deg' }}
        animate={{ opacity: 1, scale: 1, rotateY: '0deg' }}
        transition={{ type: 'spring', damping: 16 }}
      >
        <Pressable onPress={onPeek} style={styles.trumpCard}>
          {/* Card back — green felt pattern */}
          <LinearGradient
            colors={['#1A3A22', '#0F2216', '#1A3A22']}
            style={[StyleSheet.absoluteFillObject, { borderRadius: 7 }]}
          />
          <View style={styles.trumpCardBackPattern}>
            {[...Array(3)].map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: this is fine
              <View key={i} style={styles.trumpCardBackLine} />
            ))}
          </View>
          <Text style={styles.trumpCardBackLabel}>TAP TO PEEK</Text>
        </Pressable>
      </MotiView>
    );
  }

  if (!revealed) return null;

  // Face-up state
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 16 }}
    >
      <View
        style={[styles.trumpCard, { backgroundColor: faceColor, borderColor }]}
      >
        {/* Top-left pip */}
        <Text style={[styles.trumpCardPip, { color: suitColor }]}>
          {symbol}
        </Text>

        {/* Center symbol */}
        <Text style={[styles.trumpCardCenter, { color: suitColor }]}>
          {symbol}
        </Text>

        {/* Bottom-right pip (rotated) */}
        <Text
          style={[
            styles.trumpCardPip,
            styles.trumpCardPipBottom,
            { color: suitColor },
          ]}
        >
          {symbol}
        </Text>

        {/* Suit name label */}
        <View
          style={[
            styles.trumpCardLabel,
            {
              backgroundColor: isRed
                ? 'rgba(212,43,43,0.1)'
                : 'rgba(26,26,46,0.08)',
            },
          ]}
        >
          <Text style={[styles.trumpCardLabelText, { color: suitColor }]}>
            TRUMP
          </Text>
        </View>
      </View>
    </MotiView>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function GameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, playPlayerCard, startNewGame, nextRound, revealTrump } =
    useGameStore();
  const [pressed, setPressed] = useState<string | null>(null);

  const {
    players,
    currentTrick,
    currentSeat,
    trumpSuit,
    trumpRevealed,
    trumpCreator,
    phase,
    teamScores,
  } = state;

  const isPlayerTurn = currentSeat === 'bottom';
  const isPlayerActive = phase === 'playing' && isPlayerTurn;

  // Team trick counts for score badges
  const btTricks = players.bottom.tricksTaken + players.top.tricksTaken;
  const lrTricks = players.left.tricksTaken + players.right.tricksTaken;

  // Which team holds the bid this round
  const bidderTeam = state.highestBidder
    ? players[state.highestBidder].team
    : null;
  const btIsBidding = bidderTeam === 'BT';
  const lrIsBidding = bidderTeam === 'LR';
  // The winning bid amount (used for score badge target)
  const winningBid = state.highestBid > 0 ? state.highestBid : null;

  // FIX: canPeek uses trumpCreator from state (added in selectTrump) rather
  // than a hardcoded check. Only show peek button if human created the trump
  // and it hasn't been revealed to everyone yet.
  const canPeek =
    trumpCreator === 'bottom' && !trumpRevealed && trumpSuit !== null;

  const playableIds = useMemo<Set<string>>(() => {
    if (!isPlayerActive) return new Set();
    return new Set(
      getPlayableCards(
        players.bottom.hand,
        currentTrick,
        trumpSuit,
        trumpRevealed,
      ).map((c) => c.id),
    );
  }, [
    isPlayerActive,
    players.bottom.hand,
    currentTrick,
    trumpSuit,
    trumpRevealed,
  ]);

  // Deduplicate by id before sorting — guards against duplicate entries in state
  // that can appear if playCard is called twice for the same card (race condition
  // between human press and state update).
  const uniqueHand = players.bottom.hand.filter(
    (card, idx, arr) => arr.findIndex((c) => c.id === card.id) === idx,
  );
  const hand = sortHandAlternating(uniqueHand);
  const layouts = getHandLayout(hand.length);

  // ── Phase: dealing2 (waiting for second deal / trump reveal animation) ──────
  // FIX: added explicit handling for 'dealing2' phase — previously this fell
  // through to the game screen with no cards dealt yet, causing an empty hand.
  if (phase === 'dealing2' && !players.bottom.hand.some(() => true)) {
    return (
      <View
        style={[
          styles.root,
          { alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <LinearGradient
          colors={[C.bg, C.felt, C.bg]}
          style={StyleSheet.absoluteFillObject}
        />
        <MotiView
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ loop: true, duration: 1200, type: 'timing' }}
        >
          <Text style={styles.dealingText}>Dealing remaining cards...</Text>
        </MotiView>
      </View>
    );
  }

  // ── Phase: roundEnd or gameEnd ────────────────────────────────────────────
  // FIX: use getWinner() from engine instead of `bt > lr` comparison.
  // getWinner correctly handles the -30 elimination case (losing team ≠ lower score).
  // FIX: isOver no longer checks currentTrick.cards.length — roundEnd is a
  // stable phase set by the engine after all 13 tricks are scored.
  if (phase === 'roundEnd' || phase === 'gameEnd') {
    const isGameEnd = phase === 'gameEnd';
    const winner = getWinner(teamScores); // 'BT' | 'LR' | null

    // Determine why the game ended (win vs elimination) for display
    const btEliminated = teamScores.BT <= -30;
    const lrEliminated = teamScores.LR <= -30;
    const eliminationMode = isGameEnd && (btEliminated || lrEliminated);

    return (
      <View style={styles.root}>
        <LinearGradient
          colors={[C.bg, C.felt, C.bg]}
          style={StyleSheet.absoluteFillObject}
        />
        <MotiView
          from={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          style={styles.endWrap}
        >
          {/* Title */}
          <VStack style={{ marginBottom: 20, alignItems: 'center' }}>
            <Text style={styles.endSubtitle}>
              {isGameEnd
                ? eliminationMode
                  ? 'Eliminated'
                  : 'Final Results'
                : 'Round Summary'}
            </Text>
            <Text style={styles.endTitle}>
              {isGameEnd ? 'Game Over' : 'Round Over'}
            </Text>
          </VStack>

          {/* Score card */}
          <View style={styles.scoreCard}>
            {(
              [
                {
                  teamId: 'BT' as const,
                  names: 'You & Alex',
                  score: teamScores.BT,
                },
                {
                  teamId: 'LR' as const,
                  names: 'Jordan & Sam',
                  score: teamScores.LR,
                },
              ] as const
            ).map((row, i) => {
              const isWinner = winner === row.teamId;
              const isEliminated =
                isGameEnd &&
                ((row.teamId === 'BT' && btEliminated) ||
                  (row.teamId === 'LR' && lrEliminated));

              return (
                <View key={row.teamId}>
                  {i > 0 && <View style={styles.scoreDivider} />}
                  <HStack
                    style={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 14,
                    }}
                  >
                    <HStack style={{ alignItems: 'center', gap: 12 }}>
                      <View
                        style={[
                          styles.teamBadge,
                          isWinner && styles.teamBadgeWin,
                          isEliminated && styles.teamBadgeElim,
                        ]}
                      >
                        <Text
                          style={[
                            styles.teamKey,
                            isWinner && { color: C.bg },
                            isEliminated && { color: C.danger },
                          ]}
                        >
                          {row.teamId}
                        </Text>
                      </View>
                      <VStack>
                        <Text
                          style={[
                            styles.teamName,
                            isWinner && { color: 'white', opacity: 1 },
                          ]}
                        >
                          {row.names}
                        </Text>
                        {isWinner && (
                          <Text style={styles.winnerTag}>
                            {isGameEnd ? '🏆 Winner' : 'Round Win'}
                          </Text>
                        )}
                        {isEliminated && (
                          <Text style={[styles.winnerTag, { color: C.danger }]}>
                            Eliminated (−30)
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                    <Text
                      style={[
                        styles.scoreNum,
                        !isWinner && { color: 'rgba(255,255,255,0.12)' },
                        isEliminated && { color: C.dangerDim },
                      ]}
                    >
                      {row.score > 0 ? `+${row.score}` : row.score}
                    </Text>
                  </HStack>
                </View>
              );
            })}
          </View>

          {/* CTA */}
          <Pressable
            style={styles.ctaBtn}
            onPress={() => {
              if (isGameEnd) {
                startNewGame();
                router.replace('/');
              } else {
                nextRound();
                router.replace('/bid');
              }
            }}
          >
            <Text style={styles.ctaText}>
              {isGameEnd ? 'New Game' : 'Next Round →'}
            </Text>
          </Pressable>
        </MotiView>
      </View>
    );
  }

  // ── Game Screen ───────────────────────────────────────────────────────────

  return (
    <View
      style={[
        styles.root,
        { paddingLeft: insets.left, paddingRight: insets.right },
      ]}
    >
      <LinearGradient
        colors={[C.bg, '#0B1E10', C.bg]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.tableOval} pointerEvents='none' />

      {/* ── HUD ── */}
      <View style={[styles.hud, { top: insets.top + 8 }]}>
        <HStack style={{ gap: 8, alignItems: 'center' }}>
          {/* RND removed — game is score-driven, not round-count-driven */}

          {/* Trump mini-card — shown when revealed or when user can peek */}
          {trumpSuit && (trumpRevealed || canPeek) && (
            <TrumpMiniCard
              suit={trumpSuit}
              revealed={trumpRevealed}
              canPeek={canPeek}
              onPeek={canPeek && revealTrump() ? revealTrump : undefined}
            />
          )}

          <ScorePanel btScore={teamScores.BT} lrScore={teamScores.LR} />
        </HStack>

        {/* Peek button merged into TrumpMiniCard — tap the card to reveal */}

        <Menu
          offset={10}
          trigger={({ ...triggerProps }) => (
            <Pressable {...triggerProps} style={styles.menuBtn}>
              <Icon as={Settings} size='sm' style={{ color: C.gold }} />
            </Pressable>
          )}
          style={styles.menuDropdown}
        >
          <MenuItem
            key='home'
            textValue='Home'
            style={styles.menuItem}
            onPress={() => router.replace('/')}
          >
            <Icon as={Home} size='sm' style={{ color: C.goldDim }} />
            <MenuItemLabel style={styles.menuLabel}>Main Menu</MenuItemLabel>
          </MenuItem>
          <MenuItem
            key='new-game'
            textValue='New Game'
            style={styles.menuItem}
            onPress={() => {
              startNewGame();
              router.replace('/bid');
            }}
          >
            <Icon as={RefreshCw} size='sm' style={{ color: C.goldDim }} />
            <MenuItemLabel style={styles.menuLabel}>Restart Game</MenuItemLabel>
          </MenuItem>
          <MenuItem
            key='close'
            textValue='Close'
            style={[styles.menuItem, styles.menuItemDanger]}
          >
            <Icon as={X} size='sm' style={{ color: C.dangerDim }} />
            <MenuItemLabel style={[styles.menuLabel, { color: C.danger }]}>
              Close Menu
            </MenuItemLabel>
          </MenuItem>
        </Menu>
      </View>

      {/* ── TABLE ── */}
      <HStack style={styles.tableRow}>
        {/* Left opponent */}
        <View style={styles.sideSlot}>
          {/* Left = LR team secondary seat — no score badge (shown on right) */}
          <OpponentSeat
            name={players.left.name}
            active={currentSeat === 'left'}
          />
        </View>

        {/* Center felt */}
        <View style={styles.feltCenter}>
          {/* Top opponent */}
          <View style={styles.topSlot}>
            {/* Top = BT team secondary seat — no score badge (shown on bottom/user bar) */}
            <OpponentSeat
              name={players.top.name}
              active={currentSeat === 'top'}
              orientation='horizontal'
            />
          </View>

          {/* Watermark */}
          <Text style={styles.watermark} pointerEvents='none'>
            {SUIT_SYMBOLS.spades}
          </Text>

          {/* Trick cards */}
          <View style={styles.trickArea} pointerEvents='none'>
            {currentTrick.cards.map((tc) => {
              const s = slotFor(tc.player);
              const rot = stableRot(tc.card.id);
              return (
                <MotiView
                  key={tc.card.id}
                  from={{ scale: 0.7, opacity: 0 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                    transform: [
                      { translateX: s.x - TRICK_CARD_W / 2 },
                      { translateY: s.y - TRICK_CARD_H / 2 },
                      { rotate: `${rot}deg` },
                    ],
                  }}
                  transition={{ type: 'spring', damping: 16 }}
                  style={{ position: 'absolute', top: '50%', left: '50%' }}
                >
                  <Card
                    card={tc.card}
                    width={TRICK_CARD_W}
                    height={TRICK_CARD_H}
                  />
                </MotiView>
              );
            })}
          </View>

          {/* Trick winner badge */}
          {currentTrick.winningSeat && (
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={styles.winnerBadge}
            >
              <Text style={styles.winnerBadgeText}>
                {players[currentTrick.winningSeat].name}
              </Text>
            </MotiView>
          )}
        </View>

        {/* Right opponent */}
        <View style={styles.sideSlot}>
          {/* Right = LR team primary seat — shows combined LR team score badge */}
          <OpponentSeat
            name={players.right.name}
            active={currentSeat === 'right'}
            scoreBadge={
              <TeamScoreBadge
                tricks={lrTricks}
                bid={lrIsBidding ? winningBid : null}
                isBiddingTeam={lrIsBidding}
                active={currentSeat === 'right'}
              />
            }
          />
        </View>
      </HStack>

      {/* ── Player info bar ── */}
      <View style={styles.playerBar}>
        <HStack style={{ alignItems: 'center', gap: 10 }}>
          <View
            style={[
              styles.avatar,
              styles.avatarSelf,
              isPlayerActive && styles.avatarActive,
            ]}
          >
            <Text style={styles.avatarText}>
              {players.bottom.name[0].toUpperCase()}
            </Text>
          </View>
          <VStack>
            <Text style={styles.playerName}>{players.bottom.name}</Text>
            {/* BT team primary seat — shows combined BT team tricks vs target */}
            <TeamScoreBadge
              tricks={btTricks}
              bid={btIsBidding ? winningBid : null}
              isBiddingTeam={btIsBidding}
              active={isPlayerActive}
            />
          </VStack>
        </HStack>

        {isPlayerActive && (
          <MotiView
            from={{ opacity: 0, translateY: 6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18 }}
            style={styles.yourTurnBadge}
          >
            <MotiView
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ loop: true, duration: 1000, type: 'timing' }}
              style={styles.yourTurnDot}
            />
            <Text style={styles.yourTurnText}>Your turn</Text>
          </MotiView>
        )}
      </View>

      {/* ── Player Hand ── */}
      <View style={styles.handArea}>
        {hand.map((card, i) => {
          const l = layouts[i];
          const canPlay = isPlayerActive && playableIds.has(card.id);
          const isPressed = pressed === card.id;

          return (
            <MotiView
              key={card.id}
              animate={{
                opacity: isPlayerActive && !canPlay ? 0.28 : 1,
                scale: isPressed ? 1.06 : 1,
                translateY: isPressed ? -CARD_H * 0.35 : l.y,
                rotate: `${l.rotate}deg`,
              }}
              transition={{ type: 'spring', damping: 20, stiffness: 260 }}
              style={{ position: 'absolute', left: l.x, bottom: -26 }}
            >
              <Pressable
                onPressIn={() => canPlay && setPressed(card.id)}
                onPressOut={() => setPressed(null)}
                onPress={() => canPlay && playPlayerCard(card.id)}
              >
                <Card card={card} width={CARD_W} height={CARD_H} />
                {canPlay && !isPressed && (
                  <MotiView
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ loop: true, duration: 1800, type: 'timing' }}
                    style={[styles.playableGlow, { width: CARD_W }]}
                  />
                )}
              </Pressable>
            </MotiView>
          );
        })}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  dealingText: {
    color: 'rgba(200,168,64,0.4)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },

  tableOval: {
    position: 'absolute',
    alignSelf: 'center',
    top: SCREEN_H * 0.05,
    width: SCREEN_W * 0.62,
    height: SCREEN_H * 0.72,
    borderRadius: SCREEN_H * 0.36,
    borderWidth: 1,
    borderColor: 'rgba(200,168,64,0.06)',
    backgroundColor: 'rgba(10,28,15,0.4)',
  },

  // ── HUD ──
  hud: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    zIndex: 50,
  },
  hudPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.white10,
    backgroundColor: C.white05,
    alignItems: 'center',
    minWidth: 44,
  },
  hudPillAccent: {
    borderColor: 'rgba(200,168,64,0.35)',
    backgroundColor: C.goldFaint,
  },
  hudLabel: {
    fontSize: 7,
    color: 'rgba(200,168,64,0.45)',
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  hudValue: {
    fontSize: 13,
    color: 'rgba(240,220,160,0.7)',
    fontWeight: '900',
  },
  yourTurnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: C.goldAccent,
    borderWidth: 1,
    borderColor: C.goldDim,
  },
  yourTurnDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.gold,
  },
  yourTurnText: {
    fontSize: 10,
    color: C.gold,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Peek button ──
  peekBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.goldAccent,
    borderWidth: 1,
    borderColor: C.goldDim,
  },
  peekBtnText: {
    fontSize: 10,
    color: C.gold,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Menu ──
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.goldDim,
    backgroundColor: C.goldFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDropdown: {
    backgroundColor: '#0C1F14',
    borderWidth: 1,
    borderColor: 'rgba(200,168,64,0.25)',
    borderRadius: 14,
    padding: 6,
    minWidth: 160,
  },
  menuItem: {
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    gap: 10,
  },
  menuItemDanger: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(200,168,64,0.1)',
  },
  menuLabel: {
    color: 'rgba(232,213,163,0.85)',
    fontWeight: '600',
    fontSize: 13,
  },

  // ── Table layout ──
  tableRow: {
    flex: 1,
    alignItems: 'center',
    marginTop: SCREEN_H * 0.1,
    marginBottom: 4,
  },
  sideSlot: {
    width: SCREEN_W * 0.13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feltCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  topSlot: {
    position: 'absolute',
    top: -40,
    left: 50 + SCREEN_W * 0.1,
    alignSelf: 'center',
  },
  watermark: {
    fontSize: SCREEN_H * 0.52,
    color: C.gold,
    opacity: 0.045,
    fontWeight: '900',
    position: 'absolute',
    lineHeight: SCREEN_H * 0.44,
    textAlign: 'center',
  },
  trickArea: {
    width: SCREEN_H * 0.72,
    height: SCREEN_H * 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winnerBadge: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    backgroundColor: C.gold,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  winnerBadgeText: {
    fontSize: 10,
    color: '#07130D',
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ── Opponent seat ──
  seatWrap: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    position: 'relative',
    minWidth: 64,
  },
  seatActive: {
    backgroundColor: C.goldFaint,
    borderColor: C.goldDim,
  },
  seatH: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.white05,
    borderWidth: 1.5,
    borderColor: C.white10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelf: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarActive: {
    borderColor: C.gold,
    backgroundColor: C.goldAccent,
  },
  avatarText: {
    color: 'rgba(240,220,160,0.6)',
    fontWeight: '900',
    fontSize: 12,
  },
  seatName: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    maxWidth: 60,
  },
  trickBadge: {
    marginTop: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  trickBadgeActive: {
    backgroundColor: C.goldAccent,
  },
  trickText: {
    fontSize: 11,
    color: 'rgba(200,168,64,0.35)',
    fontWeight: '900',
  },
  activeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.gold,
  },

  // ── Player bar ──
  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 4,
    marginBottom: 2,
  },
  playerName: {
    fontSize: 11,
    color: 'rgba(240,220,160,0.7)',
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  playerStats: {
    fontSize: 13,
    color: C.gold,
    fontWeight: '900',
    marginTop: 1,
  },
  hintText: {
    fontSize: 9,
    color: 'rgba(200,168,64,0.4)',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // ── Hand ──
  handArea: {
    height: CARD_H * 0.72,
    position: 'relative',
    width: '100%',
    overflow: 'visible',
    marginBottom: 6,
  },
  playableGlow: {
    position: 'absolute',
    bottom: -3,
    left: 0,
    height: 3,
    backgroundColor: C.gold,
    borderRadius: 2,
  },

  // ── End screen ──
  endWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  endSubtitle: {
    fontSize: 10,
    color: 'rgba(200,168,64,0.5)',
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  endTitle: {
    fontSize: 36,
    color: 'rgba(240,220,160,0.95)',
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  scoreCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: C.white05,
    borderWidth: 1,
    borderColor: 'rgba(200,168,64,0.15)',
    borderRadius: 20,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  scoreDivider: {
    height: 1,
    backgroundColor: 'rgba(200,168,64,0.08)',
  },
  teamBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: C.goldAccent,
    borderWidth: 1,
    borderColor: C.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamBadgeWin: {
    backgroundColor: C.gold,
    borderColor: C.gold,
  },
  teamBadgeElim: {
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderColor: C.dangerDim,
  },
  teamKey: {
    fontSize: 12,
    fontWeight: '900',
    color: C.gold,
  },
  teamName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '500',
  },
  winnerTag: {
    fontSize: 9,
    color: C.gold,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  scoreNum: {
    fontSize: 36,
    fontWeight: '900',
    color: C.gold,
  },
  ctaBtn: {
    backgroundColor: C.gold,
    height: 52,
    borderRadius: 16,
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#07130D',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // ── Danger colours for menu ──
  dangerDim: {
    color: C.dangerDim,
  },

  // ── Trump mini card ──
  trumpCard: {
    width: 44,
    height: 62,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: '#F5F7FF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  trumpCardBackPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    padding: 4,
  },
  trumpCardBackLine: {
    width: '80%',
    height: 1,
    backgroundColor: 'rgba(200,168,64,0.2)',
    borderRadius: 1,
  },
  trumpCardBackLabel: {
    fontSize: 7,
    color: 'rgba(200,168,64,0.6)',
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 10,
  },
  trumpCardPip: {
    position: 'absolute',
    top: 4,
    left: 5,
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  trumpCardPipBottom: {
    top: undefined,
    left: undefined,
    bottom: 4,
    right: 5,
    transform: [{ rotate: '180deg' }],
  },
  trumpCardCenter: {
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 30,
  },
  trumpCardLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 2,
  },
  trumpCardLabelText: {
    fontSize: 6,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ── Score panel (HUD) ──
  scorePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.white10,
    backgroundColor: C.white05,
    overflow: 'hidden',
  },
  scorePanelRow: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 52,
  },
  scorePanelDivider: {
    width: 1,
    height: '70%',
    backgroundColor: C.white10,
  },
  scorePanelLabel: {
    fontSize: 7,
    color: 'rgba(200,168,64,0.45)',
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  scorePanelValue: {
    fontSize: 13,
    color: 'rgba(240,220,160,0.4)',
    fontWeight: '900',
  },
});
