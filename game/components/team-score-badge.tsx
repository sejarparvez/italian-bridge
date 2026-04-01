import { Text } from '@/components/ui/text';
import { C } from '@/constants/theme';
import { useShimmer } from '@/game/components/hooks';
import type React from 'react';
import { Animated, View } from 'react-native';

export default function TeamScoreBadge({
  tricks,
  bid,
  isBiddingTeam,
  active,
}: {
  tricks: number;
  bid: number | null;
  isBiddingTeam: boolean;
  active: boolean;
}) {
  const numericTarget = isBiddingTeam ? (bid ?? 0) : 4;
  const target = isBiddingTeam ? (bid ?? '?') : 4;
  const onTrack = numericTarget === 0 || tricks >= numericTarget;
  const valueColor = active
    ? C.gold
    : onTrack
      ? 'rgba(100,200,120,0.85)'
      : 'rgba(220,100,80,0.85)';
  const shimmer = useShimmer(1800, 300);

  return (
    <View
      className='mt-0.5 px-1.5 py-0.5 rounded-xl overflow-hidden'
      style={active ? { backgroundColor: C.goldAccent } : undefined}
    >
      {active && (
        <Animated.View
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: C.gold,
            opacity: shimmer.interpolate({
              inputRange: [0, 1],
              outputRange: [0.08, 0.25],
            }),
            borderRadius: 8,
          }}
        />
      )}
      <Text className='text-xs font-black' style={{ color: valueColor }}>
        {tricks}
        <Text style={{ opacity: 0.45, color: 'rgba(240,220,160,0.35)' }}>
          /{target}
        </Text>
      </Text>
    </View>
  );
}