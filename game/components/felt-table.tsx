import { C } from '@/constants/theme';
import type React from 'react';
import { Animated, Dimensions, View } from 'react-native';
import { useShimmer } from "./hooks";

const { width, height } = Dimensions.get('window');
const SCREEN_H = Math.min(width, height);
const SCREEN_W = Math.max(width, height);

const CARD_W = SCREEN_H * 0.17;
const CARD_H = CARD_W * 1.45;
const TRICK_CARD_W = SCREEN_H * 0.13;
const TRICK_CARD_H = TRICK_CARD_W * 1.55;

export default function FeltTable() {
  const shimmer = useShimmer(4500);
  return (
    <>
      <View
        style={{
          position: 'absolute',
          alignSelf: 'center',
          top: SCREEN_H * 0.07,
          borderWidth: 1,
          width: SCREEN_W * 0.62,
          height: SCREEN_H * 0.72,
          borderRadius: SCREEN_H * 0.36,
          borderColor: 'rgba(200,168,64,0.06)',
          backgroundColor: 'rgba(10,28,15,0.4)',
        }}
        pointerEvents='none'
      />
      <Animated.View
      
        style={{
          position: 'absolute',
          alignSelf: 'center',
          top: SCREEN_H * 0.07,
          width: SCREEN_W * 0.52,
          height: SCREEN_H * 0.64,
          borderRadius: SCREEN_H * 0.32,
          borderWidth: 1,
          borderColor: C.gold,
          opacity: shimmer.interpolate({
            inputRange: [0, 1],
            outputRange: [0.02, 0.07],
          }),
        }}
        pointerEvents='none'
      />
    </>
  );
}