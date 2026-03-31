import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Pressable, View } from 'react-native';
import { Card } from '@/components/cards/Card';
import { SUIT_SYMBOLS } from '@/constants/cards';
import { C } from '@/constants/theme';
import { getPlayableCards } from '@/game/trick';
import DealCard from '@/game/ui/deal-card';
import FeltTable from '@/game/ui/felt-table';
import GameDealingLoader from '@/game/ui/game-dealing-loader';
import GameFelt from '@/game/ui/game-felt';
import GameHUD from '@/game/ui/game-hud';
import GamePlayerBar from '@/game/ui/game-player-bar';
import GameScoreboard from '@/game/ui/game-scoreboard';
import { getHandLayout } from '@/game/ui/helpers';
import TrumpIntentModal from '@/game/ui/trump-intent-modal';
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

  const canPeek =
    trumpCreator === 'bottom' && !trumpRevealed && trumpSuit !== null;

  const latestCardId =
    currentTrick.cards.length > lastTrickCount.current
      ? currentTrick.cards[currentTrick.cards.length - 1]?.card.id
      : null;
  useEffect(() => {
    lastTrickCount.current = currentTrick.cards.length;
  }, [currentTrick.cards.length]);

  const isVoidInLedSuit = useMemo(() => {
    if (!isPlayerActive || !currentTrick.leadSuit) return false;
    return !players.bottom.hand.some((c) => c.suit === currentTrick.leadSuit);
  }, [isPlayerActive, currentTrick.leadSuit, players.bottom.hand]);

  useEffect(() => {
    if (isVoidInLedSuit && trumpIntent === 'idle' && isPlayerActive) {
      setTrumpIntent('pending');
    }
  }, [isVoidInLedSuit, trumpIntent, isPlayerActive]);

  const wantsToTrump = trumpIntent === 'trumping';

  const playableIds = useMemo<Set<string>>(() => {
    if (!isPlayerActive) return new Set();

    if (trumpIntent === 'pending') return new Set();
    return new Set(
      getPlayableCards(
        players.bottom.hand,
        currentTrick,
        trumpSuit,
        trumpRevealed,
        wantsToTrump,
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
    <View
      className='flex-1'
      style={{
        backgroundColor: C.bg,
      }}
    >
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

      {isPlayerActive && trumpIntent === 'pending' && trumpSuit && (
        <TrumpIntentModal
          trumpSuit={trumpSuit}
          trumpSymbol={SUIT_SYMBOLS[trumpSuit as keyof typeof SUIT_SYMBOLS]}
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
