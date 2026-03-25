import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useGameStore } from '@/store';

export default function ResultScreen() {
  const router = useRouter();
  const { state, newRound } = useGameStore();

  const result = state.roundResult;
  if (!result) {
    return (
      <View className='flex-1 items-center justify-center bg-felt-dark'>
        <Text className='text-gold'>No result available</Text>
      </View>
    );
  }

  const usWon = result.teamUs > 0;
  const themWon = result.teamThem > 0;

  const handleNextRound = () => {
    newRound();
    router.replace('/bid');
  };

  const handleNewGame = () => {
    router.replace('/');
  };

  return (
    <View className='flex-1 items-center justify-center bg-felt-dark p-8'>
      <View className='bg-felt-mid border-2 border-gold-primary rounded-2xl p-8 items-center min-w-80'>
        <Text className='text-gold text-3xl font-bold mb-6'>
          Round {state.roundNumber} Results
        </Text>

        <View className='flex-row gap-16 mb-8'>
          <View className='items-center'>
            <Text className='text-blue-400 text-xl font-bold mb-2'>US</Text>
            <Text className='text-gold text-5xl font-bold'>
              {result.teamUs >= 0 ? '+' : ''}
              {result.teamUs}
            </Text>
            <Text className='text-gold-light text-sm mt-2'>
              Bid: {result.usBid} | Made: {result.usMade}
            </Text>
          </View>

          <View className='items-center'>
            <Text className='text-red-400 text-xl font-bold mb-2'>THEM</Text>
            <Text className='text-gold text-5xl font-bold'>
              {result.teamThem >= 0 ? '+' : ''}
              {result.teamThem}
            </Text>
            <Text className='text-gold-light text-sm mt-2'>
              Bid: {result.themBid} | Made: {result.themMade}
            </Text>
          </View>
        </View>

        <View className='flex-row gap-8 mb-8'>
          <View className='items-center'>
            <Text className='text-gold-light text-sm'>Total</Text>
            <Text className='text-gold text-3xl font-bold'>
              {state.scores.us}
            </Text>
          </View>
          <View className='items-center'>
            <Text className='text-gold-light text-sm'>vs</Text>
            <Text className='text-gold text-xl mt-2'>-</Text>
          </View>
          <View className='items-center'>
            <Text className='text-gold-light text-sm'>Total</Text>
            <Text className='text-gold text-3xl font-bold'>
              {state.scores.them}
            </Text>
          </View>
        </View>

        {usWon && (
          <Text className='text-green-400 text-xl font-bold mb-6'>
            🎉 Your team won the round!
          </Text>
        )}
        {themWon && !usWon && (
          <Text className='text-red-400 text-xl font-bold mb-6'>
            😔 Opponents won the round
          </Text>
        )}

        <View className='flex-row gap-4'>
          <Pressable
            className='bg-gold-primary px-6 py-3 rounded-lg'
            onPress={handleNextRound}
          >
            <Text className='text-felt-dark text-lg font-bold'>Next Round</Text>
          </Pressable>

          <Pressable
            className='border border-gold px-6 py-3 rounded-lg'
            onPress={handleNewGame}
          >
            <Text className='text-gold text-lg'>New Game</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
