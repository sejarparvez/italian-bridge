import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGameStore } from '@/src/store/gameStore';

function CardDecoration({
  delay,
  rotation,
  startX,
  right,
  suit,
  color,
  accentColor,
}: {
  delay: number;
  rotation: number;
  startX?: number;
  right?: number;
  suit: string;
  color: string;
  accentColor: string;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: -80, rotate: `${rotation + 25}deg` }}
      animate={{ opacity: 1, translateY: 0, rotate: `${rotation}deg` }}
      transition={{ delay, type: 'spring', damping: 18, stiffness: 90 }}
      style={[
        styles.card,
        {
          ...(right !== undefined ? { right } : { left: startX }),
        },
      ]}
    >
      {/* Card background shimmer layer */}
      <View style={styles.cardShimmer} />

      {/* Top left corner */}
      <View style={styles.cardCornerTop}>
        <Text style={[styles.cardCornerRank, { color }]}>A</Text>
        <Text style={[styles.cardCornerSuit, { color }]}>{suit}</Text>
      </View>

      {/* Center suit watermark */}
      <View style={styles.cardCenterContainer}>
        <Text style={[styles.cardWatermark, { color: accentColor }]}>
          {suit}
        </Text>
      </View>

      {/* Bottom right corner (rotated) */}
      <View style={styles.cardCornerBottom}>
        <Text style={[styles.cardCornerRank, { color }]}>A</Text>
        <Text style={[styles.cardCornerSuit, { color }]}>{suit}</Text>
      </View>

      {/* Gloss overlay */}
      <View style={styles.cardGloss} />
    </MotiView>
  );
}

function AnimatedButton({
  title,
  onPress,
  delay,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  delay: number;
  disabled?: boolean;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: disabled ? 0.4 : 1, translateY: 0 }}
      transition={{ delay, type: 'spring', damping: 15, stiffness: 100 }}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[styles.button, disabled && styles.buttonDisabled]}
      >
        <View style={styles.buttonContent}>
          <Text
            style={[styles.buttonText, disabled && styles.buttonTextDisabled]}
          >
            {title}
          </Text>
        </View>
      </Pressable>
    </MotiView>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [shouldNavigate, setShouldNavigate] = useState(false);

  useEffect(() => {
    if (shouldNavigate) {
      router.replace('/bid');
      setShouldNavigate(false);
    }
  }, [shouldNavigate, router.replace]);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <CardDecoration
        delay={200}
        rotation={-18}
        startX={60}
        suit='♠'
        color='black'
        accentColor='black'
      />
      <CardDecoration
        delay={350}
        rotation={12}
        right={60}
        suit='♥'
        color='red'
        accentColor='red'
      />

      <View style={styles.content}>
        <MotiView
          from={{ opacity: 0, translateY: -30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
        >
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Italian</Text>
            <Text style={styles.titleHighlight}>Bridge</Text>
          </View>
        </MotiView>

        <View style={styles.buttonsContainer}>
          <AnimatedButton
            title='New Game'
            onPress={() => {
              useGameStore.getState().startNewGame();
              setShouldNavigate(true);
            }}
            delay={600}
          />
          <AnimatedButton
            title='Resume'
            onPress={() => {}}
            delay={700}
            disabled
          />
          <AnimatedButton
            title='Settings'
            onPress={() => router.push('/settings')}
            delay={800}
          />
        </View>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: 1000,
            type: 'spring',
            damping: 15,
            stiffness: 100,
          }}
          style={styles.footer}
        >
          <View style={styles.footerLine} />
          <Text style={styles.footerText}>v1.0.0</Text>
        </MotiView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D2B1A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  // ── Card styles ──────────────────────────────────────────
  card: {
    position: 'absolute',
    width: 90,
    height: 130,
    top: 60,
    backgroundColor: '#FAFAF7',
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 16,
    overflow: 'hidden',
  },
  cardShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  cardCornerTop: {
    position: 'absolute',
    top: 8,
    left: 9,
    alignItems: 'center',
  },
  cardCornerBottom: {
    position: 'absolute',
    bottom: 8,
    right: 9,
    alignItems: 'center',
    transform: [{ rotate: '180deg' }],
  },
  cardCornerRank: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 16,
    letterSpacing: -0.5,
  },
  cardCornerSuit: {
    fontSize: 12,
    lineHeight: 13,
  },
  cardCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWatermark: {
    fontSize: 52,
    lineHeight: 56,
  },
  cardGloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },

  // ── Title ────────────────────────────────────────────────
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#E8D5A3',
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  titleHighlight: {
    fontSize: 40,
    fontWeight: '900',
    color: '#C9A84C',
    letterSpacing: 8,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(201, 168, 76, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },

  // ── Buttons ──────────────────────────────────────────────
  buttonsContainer: {
    marginTop: 48,
    gap: 12,
    width: '100%',
    maxWidth: 240,
  },
  button: {
    backgroundColor: '#1A4A2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(201, 168, 76, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonContent: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8D5A3',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  buttonTextDisabled: {
    color: 'rgba(232, 213, 163, 0.5)',
  },

  // ── Footer ───────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 24,
    alignItems: 'center',
  },
  footerLine: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(201, 168, 76, 0.2)',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 10,
    color: 'rgba(232, 213, 163, 0.3)',
    letterSpacing: 2,
  },
});
