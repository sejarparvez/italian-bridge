import { Text, View } from 'react-native';
import { COLORS } from '@/constants/theme';

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank =
  | 'A'
  | 'K'
  | 'Q'
  | 'J'
  | '10'
  | '9'
  | '8'
  | '7'
  | '6'
  | '5'
  | '4'
  | '3'
  | '2';

interface CardProps {
  suit: Suit;
  rank: Rank;
  width?: number;
  highlighted?: boolean;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

const SUIT_COLORS: Record<Suit, string> = {
  spades: COLORS.blackSuit,
  hearts: COLORS.redSuit,
  diamonds: COLORS.redSuit,
  clubs: COLORS.blackSuit,
};

const RANK_ORDER: Record<Rank, number> = {
  A: 14,
  K: 13,
  Q: 12,
  J: 11,
  '10': 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2,
};

export function Card({
  suit,
  rank,
  width = 60,
  highlighted = false,
}: CardProps) {
  const height = width * 1.4;
  const fontSize = width * 0.35;
  const suitSize = width * 0.4;
  const cornerPadding = width * 0.08;

  return (
    <View
      className='bg-card-face rounded-md overflow-hidden'
      style={{
        width,
        height,
        shadowColor: highlighted ? COLORS.goldPrimary : '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: highlighted ? 0.8 : 0.55,
        shadowRadius: highlighted ? 8 : 4,
        elevation: highlighted ? 10 : 5,
        borderWidth: highlighted ? 2 : 0,
        borderColor: highlighted ? COLORS.goldPrimary : 'transparent',
      }}
    >
      <View
        className='absolute top-0 left-0 flex-row items-center'
        style={{ padding: cornerPadding }}
      >
        <Text
          className='font-bold text-center'
          style={{
            fontSize,
            color: SUIT_COLORS[suit],
            lineHeight: fontSize,
          }}
        >
          {rank}
        </Text>
        <Text
          className='text-center'
          style={{
            fontSize: suitSize,
            color: SUIT_COLORS[suit],
            lineHeight: suitSize,
          }}
        >
          {SUIT_SYMBOLS[suit]}
        </Text>
      </View>

      <View
        className='absolute inset-0 items-center justify-center'
        style={{ paddingBottom: cornerPadding * 2 }}
      >
        <Text style={{ fontSize: suitSize * 2, color: SUIT_COLORS[suit] }}>
          {SUIT_SYMBOLS[suit]}
        </Text>
      </View>

      <View
        className='absolute bottom-0 right-0 flex-row items-center'
        style={{
          padding: cornerPadding,
          transform: [{ rotate: '180deg' }],
        }}
      >
        <Text
          className='font-bold text-center'
          style={{
            fontSize,
            color: SUIT_COLORS[suit],
            lineHeight: fontSize,
          }}
        >
          {rank}
        </Text>
        <Text
          className='text-center'
          style={{
            fontSize: suitSize,
            color: SUIT_COLORS[suit],
            lineHeight: suitSize,
          }}
        >
          {SUIT_SYMBOLS[suit]}
        </Text>
      </View>
    </View>
  );
}

export { RANK_ORDER, SUIT_COLORS, SUIT_SYMBOLS };
