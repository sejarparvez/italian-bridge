import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export function useShimmer(duration = 2000, delay = 0) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration,
          easing: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t), // easeInOut
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration,
          easing: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, duration, delay]);
  return anim;
}
