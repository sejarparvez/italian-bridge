'use client';

import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CardDecoration({
  delay,
  rotation,
  startX,
  right,
  suit,
  color,
}: {
  delay: number;
  rotation: number;
  startX?: number;
  right?: number;
  suit: string;
  color: string;
}) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: -50, rotate: `${rotation + 20}deg` }}
      animate={{ opacity: 1, translateY: 0, rotate: `${rotation}deg` }}
      transition={{ delay, type: 'spring', damping: 15, stiffness: 100 }}
      style={[
        {
          position: 'absolute',
          width: 80,
          height: 120,
          backgroundColor: '#F5F0E8',
          borderRadius: 6,
          top: 80,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
          ...(right !== undefined ? { right } : { left: startX }),
        },
      ]}
    >
      <View style={styles.cardInner}>
        <Text style={[styles.cardSuitTop, { color }]}>{suit}</Text>
        <Text style={[styles.cardCenter, { color }]}>A</Text>
        <Text style={[styles.cardSuitBottom, { color }]}>{suit}</Text>
      </View>
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
      animate={{ opacity: disabled ? 0.5 : 1, translateY: 0 }}
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

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <CardDecoration
        delay={200}
        rotation={-15}
        startX={60}
        suit='♠'
        color='#1A1A2E'
      />
      <CardDecoration
        delay={400}
        rotation={10}
        right={60}
        suit='♥'
        color='#C0392B'
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
            // @ts-expect-error - expo-router type mismatch
            onPress={() => router.push('/game')}
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
  cardInner: {
    flex: 1,
    padding: 6,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSuitTop: {
    fontSize: 18,
    alignSelf: 'flex-start',
  },
  cardCenter: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  cardSuitBottom: {
    fontSize: 18,
    alignSelf: 'flex-end',
    transform: [{ rotate: '180deg' }],
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '300',
    color: '#E8D5A3',
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  titleHighlight: {
    fontSize: 40,
    fontWeight: '700',
    color: '#C9A84C',
    letterSpacing: 8,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(201, 168, 76, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 20,
  },
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
