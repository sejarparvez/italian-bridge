import { MotiView } from 'moti';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { Card } from '@/components/cards/Card';
import { C } from '@/constants/theme';
import { SUIT_SYMBOLS } from '@/constants/cards';
import { Dimensions, Easing } from 'react-native';
import OpponentSeat from '@/game/ui/opponent-seat';
import TeamScoreBadge from '@/game/ui/team-score-badge';
import TrickCard from '@/game/ui/trick-card';
import WinnerBanner from '@/game/ui/winner-banner';
import FeltTable from '@/game/ui/felt-table';

const { width, height } = Dimensions.get('window');
const SCREEN_H = Math.min(width, height);
const SCREEN_W = Math.max(width, height);
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
  btTricks,
  lrTricks,
  lrIsBidding,
  btIsBidding,
  winningBid,
}: GameFeltProps) {
  return (
    <HStack className='flex-1 items-center' style={{ marginTop: SCREEN_H * 0.1, marginBottom: 4 }}>
      {/* Left */}
      <MotiView
        from={{ opacity: 0, translateX: -28 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'spring', damping: 18, delay: 180 }}
        className='items-center justify-center'
        style={{ width: SCREEN_W * 0.13 }}
      >
        <OpponentSeat name={players.left.name} active={currentSeat === 'left'} />
      </MotiView>

      {/* Center felt */}
      <View className='flex-1 items-center justify-center relative'>
        {/* Top seat */}
        <MotiView
          from={{ opacity: 0, translateY: -28 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, delay: 130 }}
          className='absolute -top-12 items-center justify-center'
        >
          <OpponentSeat
            name={players.top.name}
            active={currentSeat === 'top'}
            orientation='horizontal'
          />
        </MotiView>

        {/* Watermark */}
        <MotiView
          animate={{
            rotate: ['0deg', '2deg', '-2deg', '0deg'],
            opacity: [0.035, 0.05, 0.035],
          }}
          transition={{ loop: true, duration: 9000, type: 'timing' }}
          className='absolute'
          pointerEvents='none'
        >
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
        </MotiView>

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
        className='items-center justify-center right-8'
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