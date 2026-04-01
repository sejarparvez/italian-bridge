import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import { Card } from '@/components/cards/Card';
import { SUIT_SYMBOLS } from '@/constants/cards';
import { C } from '@/constants/theme';
import DealCard from '@/game/components/deal-card';
import FeltTable from '@/game/components/felt-table';
import { getHandLayout } from '@/game/components/helpers';
import TrumpIntentModal from '@/game/components/trump-intent-modal';
import GameDealingLoader from '@/game/sections/game-dealing-loader';
import GameFelt from '@/game/sections/game-felt';
import GameHUD from '@/game/sections/game-hud';
import GamePlayerBar from '@/game/sections/game-player-bar';
import GameScoreboard from '@/game/sections/game-scoreboard';
import { getPlayableCards } from '@/game/trick';
import { useGameStore } from '@/store/gameStore';
import { sortHandAlternating } from '@/utils/card-sort';

const { width, height } = Dimensions.get('window');
const SCREEN_H = Math.min(width, height);

const CARD_W = SCREEN_H * 0.17;
const CARD_H = CARD_W * 1.45;

export default function GameScreen() {
  const { state, playPlayerCard } = useGameStore();
  const [pressed, setPressed] = useState<string | null>(null);
  const lastTrickCount = useRef(0);

  // ── Trump intent state machine ─────────────────────────────────────────────
  // idle      → player's turn starts; waiting to see if void in led suit
  // pending   → player IS void in led suit AND trump is still hidden → show modal
  // trumping  → player chose "Reveal & Trump" → wantsToTrump=true for card play
  // discarding→ player chose "Discard"        → wantsToTrump=false, play any non-trump
  //
  // Key rule from engine: modal only fires when trump is NOT yet revealed.
  // Once trumpRevealed=true the player plays freely, no modal ever shown.
  type TrumpIntent = 'idle' | 'pending' | 'trumping' | 'discarding';
  const [trumpIntent, setTrumpIntent] = useState<TrumpIntent>('idle');

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

  // Reset intent whenever a new trick starts (cards cleared)
  const trickLen = currentTrick.cards.length;
  useEffect(() => {
    if (trickLen === 0) setTrumpIntent('idle');
  }, [trickLen]);

  const btTricks = players.bottom.tricksTaken + players.top.tricksTaken;
  const lrTricks = players.left.tricksTaken + players.right.tricksTaken;

  const bidderTeam = state.highestBidder
    ? players[state.highestBidder].team
    : null;
  const btIsBidding = bidderTeam === 'BT';
  const lrIsBidding = bidderTeam === 'LR';
  const winningBid = state.highestBid > 0 ? state.highestBid : null;

  // canPeek: only the player who chose trump can peek, and only while hidden
  const canPeek =
    trumpCreator === 'bottom' && !trumpRevealed && trumpSuit !== null;

  const latestCardId =
    currentTrick.cards.length > lastTrickCount.current
      ? currentTrick.cards[currentTrick.cards.length - 1]?.card.id
      : null;
  useEffect(() => {
    lastTrickCount.current = currentTrick.cards.length;
  }, [currentTrick.cards.length]);

  // ── Void-in-led-suit detection ─────────────────────────────────────────────
  // Player is void when:
  //   • it is their turn
  //   • there is a led suit (not leading the trick)
  //   • trump is still hidden  ← KEY: if already revealed, no modal needed
  //   • their hand has no card of the led suit
  const isVoidInLedSuit = useMemo(() => {
    if (!isPlayerActive) return false;
    if (!currentTrick.leadSuit) return false;
    if (trumpRevealed) return false; // ← already revealed → no modal
    return !players.bottom.hand.some((c) => c.suit === currentTrick.leadSuit);
  }, [
    isPlayerActive,
    currentTrick.leadSuit,
    trumpRevealed,
    players.bottom.hand,
  ]);

  // Trigger modal only once per void situation (idle → pending)
  useEffect(() => {
    if (isVoidInLedSuit && trumpIntent === 'idle' && isPlayerActive) {
      setTrumpIntent('pending');
    }
  }, [isVoidInLedSuit, trumpIntent, isPlayerActive]);

  // wantsToTrump is passed to the engine — true only when player explicitly chose "Reveal & Trump"
  const wantsToTrump = trumpIntent === 'trumping';

  // ── Playable card calculation ──────────────────────────────────────────────
  // During 'pending' no cards are selectable (waiting for modal choice).
  // After choosing:
  //   trumping   → getPlayableCards returns trump cards only (engine enforces this)
  //   discarding → getPlayableCards returns non-trump cards (wantsToTrump=false)
  //   normal     → getPlayableCards returns all legal cards
  const playableIds = useMemo<Set<string>>(() => {
    if (!isPlayerActive) return new Set();
    if (trumpIntent === 'pending') return new Set(); // block until modal resolved

    return new Set(
      getPlayableCards(
        players.bottom.hand,
        currentTrick,
        trumpSuit,
        trumpRevealed,
        wantsToTrump, // ← propagated correctly
      ).map((c) => c.id),
    );
  }, [
    isPlayerActive,
    trumpIntent,
    players.bottom.hand,
    currentTrick,
    trumpSuit,
    trumpRevealed,
    wantsToTrump,
  ]);

  const uniqueHand = players.bottom.hand.filter(
    (card, idx, arr) => arr.findIndex((c) => c.id === card.id) === idx,
  );
  const hand = sortHandAlternating(uniqueHand);
  const layouts = getHandLayout(hand.length);

  if (phase === 'dealing2' && !players.bottom.hand.some(() => true)) {
    return <GameDealingLoader />;
  }

  if (phase === 'roundEnd' || phase === 'gameEnd') {
    return <GameScoreboard phase={phase} teamScores={teamScores} />;
  }

  return (
    <View className='flex-1' style={{ backgroundColor: C.bg }}>
      <LinearGradient
        colors={[C.bg, '#0B1E10', C.bg]}
        className='absolute inset-0'
      />
      <FeltTable />

      <GameHUD
        trumpSuit={trumpSuit}
        trumpRevealed={trumpRevealed}
        canPeek={canPeek}
        teamScores={teamScores}
      />

      <GameFelt
        players={players}
        currentSeat={currentSeat}
        currentTrick={currentTrick}
        latestCardId={latestCardId}
        btTricks={btTricks}
        lrTricks={lrTricks}
        lrIsBidding={lrIsBidding}
        btIsBidding={btIsBidding}
        winningBid={winningBid}
      />

      <GamePlayerBar
        playerName={players.bottom.name}
        isPlayerActive={isPlayerActive}
        btTricks={btTricks}
        btIsBidding={btIsBidding}
        winningBid={winningBid}
      />

      {/*
        Modal conditions (all must be true):
          • It is the player's active turn
          • They are void in the led suit
          • Trump is still hidden (trumpRevealed=false)  ← enforced by isVoidInLedSuit
          • We have a trump suit and led suit to display
          • Intent state is 'pending'
      */}
      {isPlayerActive &&
        trumpIntent === 'pending' &&
        trumpSuit !== null &&
        currentTrick.leadSuit !== null && (
          <TrumpIntentModal
            trumpSuit={trumpSuit}
            trumpSymbol={SUIT_SYMBOLS[trumpSuit as keyof typeof SUIT_SYMBOLS]}
            ledSuit={currentTrick.leadSuit}
            onTrump={() => setTrumpIntent('trumping')}
            onDiscard={() => setTrumpIntent('discarding')}
          />
        )}

      <View
        className='relative w-full overflow-visible'
        style={{ height: CARD_H * 0.72 }}
      >
        {hand.map((card, i) => {
          const l = layouts[i];
          const canPlay = isPlayerActive && playableIds.has(card.id);
          const isPressed = pressed === card.id;

          return (
            <DealCard key={card.id} cardId={card.id} index={i}>
              <MotiView
                animate={{
                  opacity: isPlayerActive && !canPlay ? 0.25 : 1,
                  scale: isPressed ? 1.09 : 1,
                  translateY: isPressed ? -CARD_H * 0.4 : l.y,
                  rotate: `${l.rotate}deg`,
                }}
                transition={{
                  type: 'spring',
                  damping: isPressed ? 14 : 22,
                  stiffness: isPressed ? 320 : 260,
                }}
                style={{ position: 'absolute', left: l.x, bottom: -26 }}
              >
                {isPressed && (
                  <MotiView
                    from={{ opacity: 0.55 }}
                    animate={{ opacity: 0 }}
                    transition={{ type: 'timing', duration: 250 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 10,
                      backgroundColor: 'rgba(255,255,255,0.28)',
                      zIndex: 10,
                    }}
                  />
                )}
                <Pressable
                  onPressIn={() => canPlay && setPressed(card.id)}
                  onPressOut={() => setPressed(null)}
                  onPress={() => {
                    if (!canPlay) return;
                    // Pass wantsToTrump so engine knows to reveal trump suit
                    playPlayerCard(card.id, wantsToTrump);
                    setTrumpIntent('idle');
                  }}
                  className='overflow-hidden rounded-lg -mb-16'
                >
                  <Card card={card} width={CARD_W} height={CARD_H} />
                </Pressable>
              </MotiView>
            </DealCard>
          );
        })}
      </View>
    </View>
  );
}
