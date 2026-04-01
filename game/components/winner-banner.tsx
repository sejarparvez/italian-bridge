import { MotiView } from 'moti';
import type React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { C } from '@/constants/theme';

export default function WinnerBanner({ name }: { name: string }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.5, translateY: 24 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 11, stiffness: 230 }}
      className='absolute -bottom-2 self-center'
    >
      <MotiView
        from={{ opacity: 0.9, scale: 0.7 }}
        animate={{ opacity: 0, scale: 3 }}
        transition={{ type: 'timing', duration: 700 }}
        style={{
          position: 'absolute',
          inset: -16,
          borderRadius: 28,
          backgroundColor: C.gold,
        }}
      />
      <View
        className='flex-row items-center gap-1.5 px-4 py-1.5 rounded-full'
        style={{
          backgroundColor: C.gold,
          shadowColor: C.gold,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 18,
          elevation: 18,
        }}
      >
        <MotiView
          animate={{ rotate: ['0deg', '18deg', '-18deg', '0deg'] }}
          transition={{
            loop: true,
            duration: 1100,
            type: 'timing',
            delay: 500,
          }}
        >
          <Text style={{ fontSize: 12 }}>⭐</Text>
        </MotiView>
        <Text
          className='font-black uppercase'
          style={{ fontSize: 10, color: '#07130D', letterSpacing: 2 }}
        >
          {name}
        </Text>
      </View>
    </MotiView>
  );
}
