import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '../global.css';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <GluestackUIProvider mode='system'>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </GluestackUIProvider>
  );
}
