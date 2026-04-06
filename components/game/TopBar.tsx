import { MotiView } from 'moti';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import type { TeamId } from '../../types/game-type';
import { Card } from './Card';

interface TopBarProps {
  onMenuPress: () => void;
  topInset: number;
  teamScores: Record<TeamId, number>;
  trumpSuit: string | null;
  trumpRevealed: boolean;
  isHumanTrumpCreator: boolean;
}

const SUIT_SYMBOLS: Record<string, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

export function TopBar({
  onMenuPress,
  topInset,
  teamScores,
  trumpSuit,
  trumpRevealed,
  isHumanTrumpCreator,
}: TopBarProps) {
  const btScore = teamScores.BT ?? 0;
  const lrScore = teamScores.LR ?? 0;

  const [peekRevealed, setPeekRevealed] = useState(false);

  useEffect(() => {
    if (peekRevealed) {
      const timer = setTimeout(() => setPeekRevealed(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [peekRevealed]);

  const showTrump = trumpSuit !== null;
  const showFaceUp = trumpRevealed || peekRevealed;
  // biome-ignore lint/style/noNonNullAssertion: this is fine
  const trumpSuitSymbol = showFaceUp ? SUIT_SYMBOLS[trumpSuit!] : null;

  const handlePeekPress = () => {
    if (!trumpRevealed && isHumanTrumpCreator) {
      setPeekRevealed(true);
    }
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: 100 }}
      style={[styles.topBar, { paddingTop: topInset + 8 }]}
    >
      <View style={styles.teamBar}>
        <View style={styles.teamScore}>
          <View style={[styles.teamDot, { backgroundColor: colors.gold500 }]} />
          <Text style={styles.teamLabel}>Us</Text>
          <Text style={[styles.teamPoints, { color: colors.gold500 }]}>
            {btScore}
          </Text>
        </View>
        <View style={styles.teamBarDivider} />
        <View style={styles.teamScore}>
          <View style={[styles.teamDot, { backgroundColor: colors.felt400 }]} />
          <Text style={styles.teamLabel}>Them</Text>
          <Text style={[styles.teamPoints, { color: colors.felt400 }]}>
            {lrScore}
          </Text>
        </View>
      </View>

      <View style={styles.topBarRight}>
        {showTrump && (
          <Pressable
            onPress={handlePeekPress}
            style={({ pressed }) => [
              styles.trumpCardWrapper,
              pressed &&
                isHumanTrumpCreator &&
                !trumpRevealed &&
                styles.trumpCardPressed,
            ]}
          >
            <Card
              faceDown={!showFaceUp}
              suit={trumpSuitSymbol as '♠' | '♥' | '♦' | '♣' | undefined}
              rank={showFaceUp ? 'A' : undefined}
            />
            {isHumanTrumpCreator && !trumpRevealed && !peekRevealed && (
              <View style={styles.tapHint}>
                <Text style={styles.tapHintText}>tap</Text>
              </View>
            )}
          </Pressable>
        )}
        <Pressable
          onPress={onMenuPress}
          style={({ pressed }) => [
            styles.menuBtn,
            pressed && styles.menuBtnPressed,
          ]}
        >
          <View style={styles.menuBtnLine} />
          <View style={styles.menuBtnLine} />
          <View style={styles.menuBtnLine} />
        </Pressable>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 8,
    backgroundColor: 'rgba(11,51,35,0.95)',
  },
  teamBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  teamScore: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  teamDot: { width: 7, height: 7, borderRadius: 4 },
  teamLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.felt300,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  teamPoints: { fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  teamBarDivider: { width: 1, height: 20, backgroundColor: colors.felt600 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trumpCardWrapper: {
    position: 'relative',
  },
  trumpCardPressed: {
    opacity: 0.8,
  },
  tapHint: {
    position: 'absolute',
    bottom: -14,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tapHintText: {
    fontSize: 8,
    color: colors.gold400,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.felt700,
    borderWidth: 1,
    borderColor: colors.felt600,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  menuBtnPressed: { backgroundColor: colors.felt600 },
  menuBtnLine: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.felt300,
  },
});
