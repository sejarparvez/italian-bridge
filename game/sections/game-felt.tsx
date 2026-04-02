import { MotiView } from 'moti';
import { Dimensions, View } from 'react-native';
import { Card } from '@/components/cards/Card';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { SUIT_SYMBOLS } from '@/constants/cards';
import { C } from '@/constants/theme';
import OpponentSeat from '@/game/components/opponent-seat';
import TeamScoreBadge from '@/game/components/team-score-badge';
import TrickCard from '@/game/components/trick-card';
import WinnerBanner from '@/game/components/winner-banner';

const { width, height } = Dimensions.get('window');
const SCREEN_H = Math.min(width, height);
const TRICK_CARD_W = SCREEN_H * 0.13;
const TRICK_CARD_H = TRICK_CARD_W * 1.55;

interface TrickCardData {
  card: { id: string };
  player: 'top' | 'left' | 'right' | 'bottom';
}

interface GameFeltProps {
  players: {
    top: { name: string };
    left: { name: string };
    right: { name: string };
    bottom: { name: string };
  };
  currentSeat: 'top' | 'left' | 'right' | 'bottom';
  currentTrick: {
    cards: TrickCardData[];
    winningSeat: 'top' | 'left' | 'right' | 'bottom' | null;
  };
  latestCardId: string | null;
  btTricks: number;
  lrTricks: number;
  lrIsBidding: boolean;
  btIsBidding: boolean;
  winningBid: number | null;
}

export default function GameFelt({
  players,
  currentSeat,
  currentTrick,
  latestCardId,

  lrTricks,
  lrIsBidding,

  winningBid,
}: GameFeltProps) {
  return (
    <HStack
      className='flex-1 items-center'
      style={{ marginTop: SCREEN_H * 0.1, marginBottom: 4 }}
    >
      {/* Left */}
      <MotiView
        from={{ opacity: 0, translateX: -28 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'spring', damping: 18, delay: 180 }}
        className='items-center justify-center'
        style={{ left: 40 }}
      >
        <OpponentSeat
          name={players.left.name}
          active={currentSeat === 'left'}
        />
      </MotiView>

      {/* Center felt */}
      <View className='flex-1 items-center justify-center relative'>
        {/* Top seat */}
        <MotiView
          from={{ opacity: 0, translateY: -28 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, delay: 130 }}
          className='absolute items-center justify-center'
          style={{ top: -80 }}
        >
          <OpponentSeat
            name={players.top.name}
            active={currentSeat === 'top'}
            orientation='horizontal'
          />
        </MotiView>

        {/* Watermark */}
        <View className=' absolute' style={{ opacity: 0.08 }}>
          <Text
            className='font-black text-center'
            style={{
              fontSize: SCREEN_H * 0.52,
              color: C.gold,
              lineHeight: SCREEN_H * 0.44,
            }}
            pointerEvents='none'
          >
            {SUIT_SYMBOLS.spades}
          </Text>
        </View>

        {/* Trick cards */}
        <View
          className='items-center justify-center'
          style={{ width: SCREEN_H * 0.72, height: SCREEN_H * 0.5 }}
          pointerEvents='none'
        >
          {currentTrick.cards.map((tc) => (
            <TrickCard
              key={tc.card.id}
              cardId={tc.card.id}
              player={tc.player}
              isLatest={tc.card.id === latestCardId}
            >
              <Card
                // biome-ignore lint/suspicious/noExplicitAny: this is fine
                card={tc.card as any}
                width={TRICK_CARD_W}
                height={TRICK_CARD_H}
              />
            </TrickCard>
          ))}
        </View>

        {currentTrick.winningSeat && (
          <WinnerBanner name={players[currentTrick.winningSeat].name} />
        )}
      </View>

      {/* Right */}
      <MotiView
        from={{ opacity: 0, translateX: 28 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'spring', damping: 18, delay: 180 }}
        style={{ right: 30 }}
      >
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
      </MotiView>
    </HStack>
  );
}
