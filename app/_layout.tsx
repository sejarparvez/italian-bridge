import { Stack } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '../global.css';

export default function TabLayout() {
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  }, []);

  return (
    <GluestackUIProvider mode='system'>
      <StatusBar hidden />
      <Stack screenOptions={{ headerShown: false }} />
    </GluestackUIProvider>
  );
}
