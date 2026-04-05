import { MotiView } from 'moti';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Card } from '../../hooks/useDealing';

// ─── Screen-relative card sizing (matches inspiration) ────────────────────────
const { width, height } = Dimensions.get('window');
const SCREEN_H = Math.min(width, height);
const CARD_W = SCREEN_H * 0.13;
const CARD_H = CARD_W * 1.45;
export const HAND_HEIGHT = CARD_H * 0.72 + 26;

// ─── Fan layout ───────────────────────────────────────────────────────────────
interface CardLayout {
  x: number;
  y: number;
  rotate: number;
}

function getHandLayout(count: number): CardLayout[] {
  if (count === 0) return [];

  const totalWidth = width * 0.92;
  const MAX_ROTATE = 22; // max tilt at edges (degrees)
  const ARC_DEPTH = CARD_H * 0.18; // how far edges dip vs center

  return Array.from({ length: count }, (_, i) => {
    // t: -1 (leftmost) → +1 (rightmost)
    const t = count > 1 ? (i / (count - 1)) * 2 - 1 : 0;

    const rotate = t * MAX_ROTATE;
    // Parabolic arc — edges sit lower than center
    const y = t * t * ARC_DEPTH;

    // Evenly spread across available width, centered
    const spread = Math.min(CARD_W * 0.72, totalWidth / (count + 1));
    // Center around the middle of the screen; x is relative to the absolute wrapper
    const x = width / 2 - CARD_W / 2 + (i - (count - 1) / 2) * spread;

    return { x, y, rotate };
  });
}

// ─── Suit helpers ─────────────────────────────────────────────────────────────
type Suit = Card['suit'];

const SUIT_COLOR: Record<Suit, string> = {
  '♥': '#C0392B',
  '♦': '#C0392B',
  '♠': '#1C1C28',
  '♣': '#1C1C28',
};

const RANK_VALUE: Record<string, number> = {
  A: 14,
  K: 13,
  Q: 12,
  J: 11,
  '10': 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2,
};

function sortHand(hand: Card[]): Card[] {
  if (!hand?.length) return [];
  const bySuit: Partial<Record<Suit, Card[]>> = {};
  for (const c of hand) {
    if (!bySuit[c.suit]) bySuit[c.suit] = [];
    bySuit[c.suit]?.push(c);
  }
  for (const s in bySuit) {
    bySuit[s as Suit]?.sort(
      (a, b) => (RANK_VALUE[b.rank] ?? 0) - (RANK_VALUE[a.rank] ?? 0),
    );
  }
  const reds = (['♥', '♦'] as Suit[]).filter((s) => bySuit[s]);
  const blacks = (['♠', '♣'] as Suit[]).filter((s) => bySuit[s]);
  let order: Suit[];
  if (!reds.length) order = blacks;
  else if (!blacks.length) order = reds;
  else if (reds.length === 1 && blacks.length === 1)
    order = [reds[0], blacks[0]];
  else if (reds.length === 2 && blacks.length === 1)
    order = [reds[0], blacks[0], reds[1]];
  else if (reds.length === 1 && blacks.length === 2)
    order = [blacks[0], reds[0], blacks[1]];
  else order = [reds[0], blacks[0], reds[1], blacks[1]];
  return order.flatMap((s) => bySuit[s] ?? []);
}

// ─── Card face ────────────────────────────────────────────────────────────────
function CardFace({ card }: { card: Card }) {
  const color = SUIT_COLOR[card.suit];
  return (
    <View style={[styles.card, { width: CARD_W, height: CARD_H }]}>
      {/* Top-left pip */}
      <View style={styles.pip}>
        <Text style={[styles.pipRank, { color }]}>{card.rank}</Text>
        <Text style={[styles.pipSuit, { color }]}>{card.suit}</Text>
      </View>

      {/* Ghost watermark suit */}
      <Text style={[styles.watermark, { color }]}>{card.suit}</Text>

      {/* Bottom-right pip (flipped) */}
      <View style={[styles.pip, styles.pipBR]}>
        <Text style={[styles.pipRank, { color }]}>{card.rank}</Text>
        <Text style={[styles.pipSuit, { color }]}>{card.suit}</Text>
      </View>
    </View>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface BottomHandProps {
  hand?: Card[];
  playableIds?: Set<string>; // cards that can be played (dims others)
  isPlayerActive?: boolean;
  onCardPress?: (card: Card) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function BottomHand({
  hand = [],
  playableIds,
  isPlayerActive = false,
  onCardPress,
}: BottomHandProps) {
  const sorted = sortHand(hand);
  const layouts = getHandLayout(sorted.length);

  if (!sorted.length) return null;

  return (
    <View style={styles.container}>
      {sorted.map((card, i) => {
        const l = layouts[i];
        const cardKey = `${card.suit}${card.rank}`;
        const canPlay =
          !isPlayerActive || !playableIds || playableIds.has(cardKey);
        const dimmed = isPlayerActive && playableIds && !canPlay;

        return (
          <MotiView
            // biome-ignore lint/suspicious/noArrayIndexKey: positional fan
            key={`${card.suit}-${card.rank}-${i}`}
            from={{ opacity: 0, translateY: CARD_H }}
            animate={{
              opacity: dimmed ? 0.28 : 1,
              translateY: l.y,
              rotate: `${l.rotate}deg`,
            }}
            transition={{
              delay: 350 + i * 35,
              type: 'spring',
              damping: 22,
              stiffness: 260,
            }}
            style={{
              position: 'absolute',
              left: l.x,
              bottom: -26,
              zIndex: i,
              // Shadow on wrapper
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.3,
              shadowRadius: 7,
              elevation: i + 1,
            }}
          >
            <Pressable
              onPress={() => canPlay && onCardPress?.(card)}
              style={({ pressed }) =>
                pressed && canPlay ? styles.pressedCard : undefined
              }
            >
              {({ pressed }) => (
                <>
                  {pressed && canPlay && (
                    <MotiView
                      from={{ opacity: 0.4 }}
                      animate={{ opacity: 0 }}
                      transition={{ type: 'timing', duration: 220 }}
                      style={[StyleSheet.absoluteFill, styles.pressFlash]}
                    />
                  )}
                  <CardFace card={card} />
                </>
              )}
            </Pressable>
          </MotiView>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: CARD_H * 0.72,
    overflow: 'visible',
  },

  card: {
    borderRadius: 9,
    backgroundColor: '#FDFAF4',
    borderWidth: 1,
    borderColor: '#E2D8C0',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },

  pip: {
    position: 'absolute',
    top: 5,
    left: 6,
    alignItems: 'center',
  },
  pipBR: {
    top: undefined,
    left: undefined,
    bottom: 5,
    right: 6,
    transform: [{ rotate: '180deg' }],
  },
  pipRank: {
    fontSize: CARD_W * 0.25,
    fontWeight: '800',
    lineHeight: CARD_W * 0.24,
    letterSpacing: -0.4,
  },
  pipSuit: {
    fontSize: CARD_W * 0.16,
    lineHeight: CARD_W * 0.18,
    fontWeight: '600',
  },

  watermark: {
    position: 'absolute',
    fontSize: CARD_W * 0.55,
    fontWeight: '900',
  },

  centerRank: {
    fontSize: CARD_W * 0.34,
    fontWeight: '800',
    letterSpacing: -1,
    zIndex: 1,
  },

  pressedCard: {
    transform: [{ translateY: -(CARD_H * 0.38) }, { scale: 1.08 }],
  },

  pressFlash: {
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.28)',
    zIndex: 10,
  },
});
