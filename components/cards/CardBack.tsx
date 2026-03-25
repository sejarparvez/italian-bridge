import { View } from 'react-native';
import { COLORS } from '@/constants/theme';

interface CardBackProps {
  width?: number;
}

export function CardBack({ width = 60 }: CardBackProps) {
  const height = width * 1.4;

  return (
    <View
      className='bg-card-back rounded-md overflow-hidden'
      style={{
        width,
        height,
        borderWidth: 2,
        borderColor: COLORS.goldPrimary,
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.55,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      <View className='flex-1 m-1 rounded-sm border border-card-back-inner'>
        <View className='flex-1 rounded-sm bg-card-back-pattern opacity-30' />
      </View>
    </View>
  );
}
