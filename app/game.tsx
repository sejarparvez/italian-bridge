import { Text, View } from 'react-native';
import { Card, CardBack } from '@/components/cards';
import { ScoreBar } from '@/components/hud';
import { GameTable, TrumpBadge } from '@/components/table';

export default function GameScreen() {
  return (
    <View className='flex-1 bg-felt-dark'>
      <ScoreBar usScore={0} themScore={0} roundNumber={1} />

      <GameTable>
        <View className='absolute top-8 left-0 right-0 items-center'>
          <Text className='text-gold-light text-sm'>Partner</Text>
          <View className='mt-2 -rotate-12'>
            <CardBack width={55} />
          </View>
        </View>

        <View className='absolute top-20 right-8 items-center'>
          <Text className='text-gold-light text-sm'>You</Text>
          <View className='flex-row mt-2 gap-2'>
            <Card suit='spades' rank='A' width={55} />
            <Card suit='hearts' rank='K' width={55} />
            <Card suit='diamonds' rank='Q' width={55} />
            <Card suit='clubs' rank='J' width={55} />
            <Card suit='spades' rank='10' width={55} />
          </View>
        </View>

        <View className='absolute bottom-8 left-0 right-0 items-center'>
          <Text className='text-gold-light text-sm'>Left</Text>
          <View className='mt-2 rotate-12'>
            <CardBack width={55} />
          </View>
        </View>

        <View className='absolute top-8 left-8'>
          <TrumpBadge suit='hearts' />
        </View>

        <View className='absolute inset-0 items-center justify-center'>
          <View className='bg-felt-mid/80 rounded-full p-4 border-2 border-gold-primary'>
            <Text className='text-gold text-lg font-bold'>3 of 5</Text>
          </View>
        </View>
      </GameTable>
    </View>
  );
}
