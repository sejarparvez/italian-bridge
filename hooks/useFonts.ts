import {
  Cinzel_400Regular,
  Cinzel_500Medium,
  Cinzel_600SemiBold,
  Cinzel_700Bold,
  Cinzel_800ExtraBold,
  Cinzel_900Black,
  useFonts,
} from '@expo-google-fonts/cinzel';
import {
  CrimsonText_400Regular,
  CrimsonText_600SemiBold,
  CrimsonText_700Bold,
} from '@expo-google-fonts/crimson-text';
import { useEffect, useState } from 'react';

export function useCustomFonts() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [fontsLoadedHook, errorHook] = useFonts({
    Cinzel_400Regular,
    Cinzel_500Medium,
    Cinzel_600SemiBold,
    Cinzel_700Bold,
    Cinzel_800ExtraBold,
    Cinzel_900Black,
    CrimsonText_400Regular,
    CrimsonText_600SemiBold,
    CrimsonText_700Bold,
  });

  useEffect(() => {
    if (fontsLoadedHook) {
      setFontsLoaded(true);
    }
    if (errorHook) {
      setError(errorHook);
    }
  }, [fontsLoadedHook, errorHook]);

  return { fontsLoaded, error };
}

export const FONT_OPTIONS = {
  display: {
    regular: 'Cinzel_400Regular',
    medium: 'Cinzel_500Medium',
    semibold: 'Cinzel_600SemiBold',
    bold: 'Cinzel_700Bold',
    extrabold: 'Cinzel_800ExtraBold',
    black: 'Cinzel_900Black',
  },
  body: {
    regular: 'CrimsonText_400Regular',
    semibold: 'CrimsonText_600SemiBold',
    bold: 'CrimsonText_700Bold',
  },
};
