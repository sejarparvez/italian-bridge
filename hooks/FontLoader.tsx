import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useCustomFonts } from './useFonts';

interface FontLoaderProps {
  children: React.ReactNode;
  onReady?: () => void;  // ✅ add this
}

export function FontLoader({ children, onReady }: FontLoaderProps) {
  const { fontsLoaded } = useCustomFonts();

  useEffect(() => {
    if (fontsLoaded) {
      onReady?.();  // ✅ call it once fonts are loaded
    }
  }, [fontsLoaded]);  // eslint-disable-line react-hooks/exhaustive-deps

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size='large' color='#C9A84C' />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D2B1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});