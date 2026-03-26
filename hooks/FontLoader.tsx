import { useCustomFonts } from './useFonts';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

interface FontLoaderProps {
  children: React.ReactNode;
}

export function FontLoader({ children }: FontLoaderProps) {
  const { fontsLoaded } = useCustomFonts();

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