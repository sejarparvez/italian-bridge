import { Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View className='flex-1 items-center justify-center bg-white dark:bg-black'>
      <Text className='text-black dark:text-white text-2xl font-bold'>
        this is the home screen
      </Text>
    </View>
  );
}
