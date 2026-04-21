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
      {/* Left Section */}
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

      {/* Right Section */}
      <View style={styles.topBarRight}>
        {showTrump && (
          <Pressable
            onPress={handlePeekPress}
            style={({ pressed }) => [
              styles.trumpCardWrapper,
              pressed &&
                isHumanTrumpCreator &&
                !trumpRevealed &&
                styles.pressedState,
            ]}
          >
            {/* Wrapper view to enforce card dimensions within the flex row */}
            <View style={styles.cardSizer}>
              <Card
                faceDown={!showFaceUp}
                suit={trumpSuitSymbol as '♠' | '♥' | '♦' | '♣' | undefined}
                rank={showFaceUp ? 'A' : undefined}
              />
            </View>

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
            pressed && styles.pressedState,
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
    paddingHorizontal: 28,
    paddingBottom: 12,
    backgroundColor: 'rgba(11,51,35,0.95)',
  },
  teamBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamDot: { width: 7, height: 7, borderRadius: 4 },
  teamLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.felt300,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  teamPoints: { fontSize: 17, fontWeight: '900' },
  teamBarDivider: { width: 1, height: 16, backgroundColor: colors.felt600 },

  // FIXED SECTION
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // Pushes everything to the right
    gap: 20, // This creates the physical gap between the Trump card and Menu button
  },
  trumpCardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    top: 6,
  },
  cardSizer: {
    // Ensures the card has a defined footprint in the flex layout
    width: 32,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
    textTransform: 'uppercase',
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.felt700,
    borderWidth: 1,
    borderColor: colors.felt600,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  menuBtnLine: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.felt300,
  },
  pressedState: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
});
