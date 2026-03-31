import { Text } from '@/components/ui/text';
import { SUIT_SYMBOLS } from '@/constants/cards';
import { C } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import type React from 'react';
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, View } from 'react-native';
import { useShimmer } from "./hooks";


export default function TrumpMiniCard({
  suit,
  revealed,
  canPeek,
}: {
  suit: string;
  revealed: boolean;
  canPeek: boolean;
}) {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const symbol = SUIT_SYMBOLS[suit as keyof typeof SUIT_SYMBOLS];
  const faceColor = isRed ? '#FFF5F5' : '#F5F7FF';
  const suitColor = isRed ? '#D42B2B' : '#1A1A2E';
  const borderColor = isRed ? 'rgba(212,43,43,0.3)' : 'rgba(26,26,46,0.25)';
  const CARD_W = 44;
  const CARD_H = 62;
  const cardStyle = { width: CARD_W, height: CARD_H, borderRadius: 7 };
  const shimmer = useShimmer(2600);

  const [isPeeking, setIsPeeking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handlePeek = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsPeeking(true);
    timerRef.current = setTimeout(() => {
      setIsPeeking(false);
    }, 2000);
  };

  // ── REVEALED ─────────────────────────────────────────────────────────────────
  if (revealed) {
    return (
      <MotiView
        from={{ opacity: 0, scale: 0.35 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 11, stiffness: 190 }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: 15,
            backgroundColor: isRed ? 'rgba(212,43,43,0.3)' : 'rgba(50,50,160,0.3)',
            opacity: shimmer.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 0.75],
            }),
          }}
        />
        <View
          className='items-center justify-center overflow-hidden border'
          style={[
            cardStyle,
            {
              backgroundColor: faceColor,
              borderColor,
              elevation: 14,
              shadowColor: isRed ? '#D42B2B' : '#3333AA',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.45,
              shadowRadius: 10,
            },
          ]}
        >
          <Animated.View
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 16,
              backgroundColor: 'rgba(255,255,255,0.35)',
              transform: [
                {
                  translateX: shimmer.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-44, 88],
                  }),
                },
              ],
            }}
          />
          <Text
            className='absolute font-black'
            style={{ top: 4, left: 5, fontSize: 10, color: suitColor, lineHeight: 12 }}
          >
            {symbol}
          </Text>
          <Text
            className='font-black'
            style={{ fontSize: 26, color: suitColor, lineHeight: 30 }}
          >
            {symbol}
          </Text>
          <Text
            className='absolute font-black'
            style={{
              bottom: 4,
              right: 5,
              fontSize: 10,
              color: suitColor,
              lineHeight: 12,
              transform: [{ rotate: '180deg' }],
            }}
          >
            {symbol}
          </Text>
          <View
            className='absolute bottom-0 left-0 right-0 items-center py-0.5'
            style={{
              backgroundColor: isRed ? 'rgba(212,43,43,0.1)' : 'rgba(26,26,46,0.08)',
            }}
          >
            <Text
              className='font-black uppercase'
              style={{ fontSize: 6, color: suitColor, letterSpacing: 1.5 }}
            >
              TRUMP
            </Text>
          </View>
        </View>
      </MotiView>
    );
  }

  // ── NOT REVEALED ──────────────────────────────────────────────────────────────
  // Fixed-size wrapper — both children are position:absolute so layout never
  // shifts, meaning the setTimeout callback always fires on the live instance.
  return (
    <View style={{ width: CARD_W, height: CARD_H }}>

      {/* ── PEEK FACE (visible only during isPeeking window) ────────────────── */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          opacity: isPeeking ? 1 : 0,
        }}
        pointerEvents='none'
      >
        <View
          className='items-center justify-center overflow-hidden border'
          style={[
            cardStyle,
            {
              backgroundColor: faceColor,
              borderColor,
              elevation: 14,
              shadowColor: isRed ? '#D42B2B' : '#3333AA',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.45,
              shadowRadius: 10,
            },
          ]}
        >
          <Text
            className='absolute font-black'
            style={{ top: 4, left: 5, fontSize: 10, color: suitColor, lineHeight: 12 }}
          >
            {symbol}
          </Text>
          <Text
            className='font-black'
            style={{ fontSize: 26, color: suitColor, lineHeight: 30 }}
          >
            {symbol}
          </Text>
          <Text
            className='absolute font-black'
            style={{
              bottom: 4,
              right: 5,
              fontSize: 10,
              color: suitColor,
              lineHeight: 12,
              transform: [{ rotate: '180deg' }],
            }}
          >
            {symbol}
          </Text>
          {/* Countdown bar — shrinks from full to zero over 2s */}
          <MotiView
            animate={{ scaleX: isPeeking ? 0 : 1 }}
            transition={{ type: 'timing', duration: isPeeking ? 2000 : 0 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 3,
              backgroundColor: isRed ? '#D42B2B' : '#3333AA',
              transformOrigin: 'left',
            }}
          />
          <View
            className='absolute bottom-0 left-0 right-0 items-center'
            style={{ paddingBottom: 5 }}
          >
            <Text
              className='font-black uppercase'
              style={{ fontSize: 6, color: suitColor, letterSpacing: 1.5 }}
            >
              TRUMP
            </Text>
          </View>
        </View>
      </View>

      {/* ── PEEK BUTTON (canPeek=true, not currently peeking) ──────────────── */}
      {canPeek && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: isPeeking ? 0 : 1,
          }}
          pointerEvents={isPeeking ? 'none' : 'auto'}
        >
          <Animated.View
            style={{
              position: 'absolute',
              inset: -8,
              borderRadius: 15,
              backgroundColor: C.gold,
              opacity: shimmer.interpolate({
                inputRange: [0, 1],
                outputRange: [0.08, 0.28],
              }),
            }}
          />
          <Pressable
            onPress={handlePeek}
            className='items-center justify-center overflow-hidden border border-[rgba(255,255,255,0.15)]'
            style={[cardStyle, { elevation: 10 }]}
          >
            <LinearGradient
              colors={['#1A3A22', '#0F2216', '#1A3A22']}
              className='absolute inset-0'
              style={{ borderRadius: 7 }}
            />
            <View className='absolute inset-0 items-center justify-evenly p-1'>
              {[...Array(3)].map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: '80%',
                    height: 1,
                    backgroundColor: 'rgba(200,168,64,0.2)',
                    borderRadius: 1,
                  }}
                />
              ))}
            </View>
            <Animated.View
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: 18,
                backgroundColor: 'rgba(255,255,255,0.06)',
                transform: [
                  {
                    translateX: shimmer.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-44, 88],
                    }),
                  },
                ],
              }}
            />
            <Text
              style={{
                fontSize: 7,
                color: 'rgba(200,168,64,0.65)',
                fontWeight: '900',
                letterSpacing: 0.5,
                textAlign: 'center',
                lineHeight: 10,
              }}
            >
              TAP{'\n'}PEEK
            </Text>
          </Pressable>
        </View>
      )}

      {/* ── FACE-DOWN BACK (canPeek=false) ─────────────────────────────────── */}
      {!canPeek && (
        <View
          style={{ position: 'absolute', top: 0, left: 0 }}
          pointerEvents='none'
        >
          <View
            className='items-center justify-center overflow-hidden border border-[rgba(255,255,255,0.12)]'
            style={[
              cardStyle,
              {
                elevation: 6,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
              },
            ]}
          >
            <LinearGradient
              colors={['#1C3D26', '#0E2118', '#1C3D26']}
              style={{ position: 'absolute', inset: 0, borderRadius: 7 }}
            />
            <View
              className='absolute inset-0'
              style={{
                margin: 4,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: 'rgba(200,168,64,0.18)',
              }}
            />
            <View
              className='absolute inset-0'
              style={{
                margin: 7,
                borderRadius: 2,
                borderWidth: 1,
                borderColor: 'rgba(200,168,64,0.10)',
              }}
            />
            <Text
              style={{ fontSize: 18, color: 'rgba(200,168,64,0.25)', lineHeight: 20 }}
            >
              ✦
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}