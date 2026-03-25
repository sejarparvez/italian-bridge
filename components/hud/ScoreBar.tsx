import { Text, View } from 'react-native';

interface ScoreBarProps {
  usScore: number;
  themScore: number;
  roundNumber: number;
}

export function ScoreBar({ usScore, themScore, roundNumber }: ScoreBarProps) {
  return (
    <View className='bg-felt-dark/90 border-b border-gold-primary/50 px-4 py-2 flex-row justify-between items-center'>
      <View className='flex-row items-center gap-4'>
        <Text className='text-gold-primary font-bold text-lg'>
          Round {roundNumber}
        </Text>
      </View>
      <View className='flex-row items-center gap-8'>
        <View className='flex-row items-center gap-2'>
          <Text className='text-blue-400 font-bold text-lg'>US</Text>
          <Text className='text-white text-xl font-bold'>{usScore}</Text>
        </View>
        <View className='flex-row items-center gap-2'>
          <Text className='text-red-400 font-bold text-lg'>THEM</Text>
          <Text className='text-white text-xl font-bold'>{themScore}</Text>
        </View>
      </View>
    </View>
  );
}
