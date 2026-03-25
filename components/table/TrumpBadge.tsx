import { Text, View } from 'react-native';
import { SUIT_SYMBOLS, type Suit } from '@/components/cards/Card';
import { COLORS } from '@/constants/theme';

interface TrumpBadgeProps {
  suit: Suit;
}

export function TrumpBadge({ suit }: TrumpBadgeProps) {
  const _color =
    suit === 'hearts' || suit === 'diamonds'
      ? COLORS.redSuit
      : COLORS.blackSuit;

  return (
    <View
      className='bg-gold-primary rounded-full px-3 py-1 items-center justify-center'
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 4,
      }}
    >
      <Text className='text-felt-dark font-bold text-sm'>
        TRUMP {SUIT_SYMBOLS[suit]}
      </Text>
    </View>
  );
}
