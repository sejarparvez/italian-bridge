import { Pressable, Text, View } from 'react-native';
import { COLORS } from '@/constants/theme';

interface BidPanelProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function BidPanel({
  value,
  onChange,
  min = 1,
  max = 13,
}: BidPanelProps) {
  return (
    <View className='bg-felt-dark border-2 border-gold-primary rounded-xl p-6 items-center shadow-lg'>
      <Text className='text-gold-light text-xl font-bold mb-4 tracking-widest'>
        YOUR BID
      </Text>

      <View className='flex-row items-center gap-8'>
        <Pressable
          className={`w-14 h-14 rounded-full items-center justify-center border-2 ${
            value > min
              ? 'bg-gold border-gold-primary'
              : 'bg-felt-mid border-gold/30'
          }`}
          style={
            value > min
              ? { backgroundColor: COLORS.goldPrimary }
              : {
                  backgroundColor: COLORS.feltMid,
                  borderColor: `${COLORS.goldPrimary}30`,
                }
          }
          onPress={() => value > min && onChange(value - 1)}
          disabled={value <= min}
        >
          <Text
            className='text-3xl font-bold'
            style={{
              color: value > min ? COLORS.feltDark : `${COLORS.goldPrimary}60`,
            }}
          >
            −
          </Text>
        </Pressable>

        <View className='w-16 items-center'>
          <Text
            className='text-6xl font-bold'
            style={{
              color: COLORS.goldLight,
              textShadowColor: COLORS.goldDark,
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }}
          >
            {value}
          </Text>
        </View>

        <Pressable
          className={`w-14 h-14 rounded-full items-center justify-center border-2 ${
            value < max
              ? 'bg-gold border-gold-primary'
              : 'bg-felt-mid border-gold/30'
          }`}
          style={
            value < max
              ? { backgroundColor: COLORS.goldPrimary }
              : {
                  backgroundColor: COLORS.feltMid,
                  borderColor: `${COLORS.goldPrimary}30`,
                }
          }
          onPress={() => value < max && onChange(value + 1)}
          disabled={value >= max}
        >
          <Text
            className='text-3xl font-bold'
            style={{
              color: value < max ? COLORS.feltDark : `${COLORS.goldPrimary}60`,
            }}
          >
            +
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
