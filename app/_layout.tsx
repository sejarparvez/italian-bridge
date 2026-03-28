import { Stack } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { FontLoader } from '@/hooks/FontLoader';
import '../global.css';

// Keep splash visible until fonts are ready
SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  useEffect(() => {
    // Lock orientation; ignore unsupported-device errors gracefully
    ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE,
    ).catch(() => {});

    // Cleanup: restore portrait when layout unmounts (e.g. dev reload)
    return () => {
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, []);

  return (
    <FontLoader onReady={() => SplashScreen.hideAsync()}>
      <GluestackUIProvider mode='system'>
        <StatusBar hidden />
        <Stack screenOptions={{ headerShown: false }} />
      </GluestackUIProvider>
    </FontLoader>
  );
}
