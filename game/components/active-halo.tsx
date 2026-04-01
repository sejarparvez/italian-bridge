import { MotiView } from 'moti';
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { View } from '@/components/ui/view';
import { C } from '@/constants/theme';

export function ActiveHalo({ size = 34 }: { size?: number }) {
  return (
    <View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <PulseRing size={size * 2.2} color={C.goldGlow} duration={1800} />
      <PulseRing size={size * 1.6} color={C.gold} duration={1400} delay={300} />
      <OrbitDot
        radius={size * 0.82}
        duration={3000}
        startAngle={0}
        color={C.gold}
      />
      <OrbitDot
        radius={size * 0.82}
        duration={3000}
        startAngle={180}
        color={C.goldBright}
      />
    </View>
  );
}

function PulseRing({
  size,
  color,
  duration = 1400,
  delay = 0,
}: {
  size: number;
  color: string;
  duration?: number;
  delay?: number;
}) {
  return (
    <MotiView
      from={{ opacity: 0.7, scale: 0.5 }}
      animate={{ opacity: 0, scale: 1.1 }}
      transition={{
        loop: true,
        duration,
        type: 'timing',
        delay,
        easing: Easing.out(Easing.quad),
      }}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: color,
        alignSelf: 'center',
      }}
    />
  );
}

// ── OrbitDot ──────────────────────────────────────────────────────────────────

function OrbitDot({
  radius,
  duration,
  startAngle = 0,
  color,
}: {
  radius: number;
  duration: number;
  startAngle?: number;
  color: string;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: (t) => t, // linear
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress, duration]);

  const steps = 60;
  const inputRange = Array.from({ length: steps + 1 }, (_, i) => i / steps);
  const xRange = inputRange.map((t) => {
    const angle = startAngle * (Math.PI / 180) + t * 2 * Math.PI;
    return radius * Math.cos(angle);
  });
  const yRange = inputRange.map((t) => {
    const angle = startAngle * (Math.PI / 180) + t * 2 * Math.PI;
    return radius * Math.sin(angle);
  });

  const translateX = progress.interpolate({ inputRange, outputRange: xRange });
  const translateY = progress.interpolate({ inputRange, outputRange: yRange });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: color,
        opacity: 0.7,
        transform: [{ translateX }, { translateY }],
      }}
    />
  );
}
