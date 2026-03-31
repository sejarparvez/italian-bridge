import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { C } from '@/constants/theme';

export default function GameDealingLoader() {
  return (
    <View className='flex-1 items-center justify-center' style={{ backgroundColor: C.bg }}>
      <LinearGradient colors={[C.bg, C.felt, C.bg]} className='absolute inset-0' />
      <MotiView
        animate={{
          rotate: ['0deg', '8deg', '-8deg', '0deg'],
          scale: [1, 1.1, 1],
        }}
        transition={{ loop: true, duration: 900, type: 'timing' }}
        style={{ marginBottom: 20 }}
      >
        <Text style={{ fontSize: 52, opacity: 0.45 }}>🃏</Text>
      </MotiView>
      <MotiView
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ loop: true, duration: 1200, type: 'timing' }}
      >
        <Text
          className='font-bold uppercase'
          style={{
            color: 'rgba(200,168,64,0.4)',
            fontSize: 13,
            letterSpacing: 3,
          }}
        >
          Dealing cards...
        </Text>
      </MotiView>
    </View>
  );
}