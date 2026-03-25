import { View } from 'react-native';

interface GameTableProps {
  children: React.ReactNode;
}

export function GameTable({ children }: GameTableProps) {
  return (
    <View className='flex-1 bg-felt-dark'>
      <View className='absolute inset-0 border-[3px] border-felt-border opacity-20 rounded-3xl m-4' />
      <View className='absolute inset-0 border-[1px] border-felt-border opacity-10 rounded-3xl m-8' />
      {children}
    </View>
  );
}
