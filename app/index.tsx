import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View className='flex-1 items-center justify-center bg-felt-dark'>
      <Text className='text-gold text-4xl font-bold tracking-widest uppercase mb-12'>
        Italian Bridge
      </Text>

      <View className='flex gap-4'>
        <Pressable
          className='bg-felt-mid border border-gold px-8 py-4 rounded-lg min-w-48 items-center'
          onPress={() => router.push('/game')}
        >
          <Text className='text-gold-light text-lg font-semibold tracking-wide'>
            New Game
          </Text>
        </Pressable>

        <Pressable
          className='bg-felt-mid border border-gold px-8 py-4 rounded-lg min-w-48 items-center opacity-50'
          disabled
        >
          <Text className='text-gold-light text-lg font-semibold tracking-wide'>
            Resume
          </Text>
        </Pressable>

        <Pressable
          className='bg-felt-mid border border-gold px-8 py-4 rounded-lg min-w-48 items-center'
          onPress={() => router.push('/settings')}
        >
          <Text className='text-gold-light text-lg font-semibold tracking-wide'>
            Settings
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
