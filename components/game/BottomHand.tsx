import { MotiView } from 'moti';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  type Card,
  RANK_ORDER,
  SUIT_COLORS,
  SUIT_SYMBOLS,
  type Suit,
} from '../../constants/cards';
import type { Trick } from '../../types/game-type';

// ─── Screen-relative card sizing ─────────────────────────────────────────────
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
  const MAX_ROTATE = 22;
  const ARC_DEPTH = CARD_H * 0.18;

  return Array.from({ length: count }, (_, i) => {
    const t = count > 1 ? (i / (count - 1)) * 2 - 1 : 0;
    const rotate = t * MAX_ROTATE;
    const y = t * t * ARC_DEPTH;
    const spread = Math.min(CARD_W * 0.72, totalWidth / (count + 1));
    const x = width / 2 - CARD_W / 2 + (i - (count - 1) / 2) * spread;
    return { x, y, rotate };
  });
}

// ─── Hand sorting ─────────────────────────────────────────────────────────────
function sortHand(hand: Card[]): Card[] {
  if (!hand?.length) return [];

  const bySuit: Partial<Record<Suit, Card[]>> = {};
  for (const c of hand) {
    if (!bySuit[c.suit]) bySuit[c.suit] = [];
    bySuit[c.suit]?.push(c);
  }
  for (const s in bySuit) {
    bySuit[s as Suit]?.sort(
      (a, b) => (RANK_ORDER[b.rank] ?? 0) - (RANK_ORDER[a.rank] ?? 0),
    );
  }

  const reds = (['hearts', 'diamonds'] as Suit[]).filter((s) => bySuit[s]);
  const blacks = (['spades', 'clubs'] as Suit[]).filter((s) => bySuit[s]);

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

// ─── Playability logic ────────────────────────────────────────────────────────
function getPlayableIds(
  hand: Card[],
  trick: Trick,
  isMyTurn: boolean,
): Set<string> {
  // Not your turn — nothing is playable
  if (!isMyTurn) return new Set();

  // Leading the trick — all cards are playable
  if (trick.cards.length === 0) return new Set(hand.map((c) => c.id));

  const leadSuit = trick.leadSuit;

  if (!leadSuit) return new Set(hand.map((c) => c.id));

  // Must follow lead suit if possible (trump or not doesn't matter for validity)
  const canFollow = hand.filter((c) => c.suit === leadSuit);

  if (canFollow.length > 0) return new Set(canFollow.map((c) => c.id));

  // Can't follow — all cards are playable (game logic will show trump dialog if needed)
  return new Set(hand.map((c) => c.id));
}

// ─── Card face ────────────────────────────────────────────────────────────────
function CardFace({
  card,
  isTrump,
  trumpRevealed,
}: {
  card: Card;
  isTrump: boolean;
  trumpRevealed: boolean;
}) {
  const color = SUIT_COLORS[card.suit];
  const symbol = SUIT_SYMBOLS[card.suit];
  const showTrumpGlow = isTrump && trumpRevealed;

  return (
    <View
      style={[
        styles.card,
        { width: CARD_W, height: CARD_H },
        showTrumpGlow && styles.cardTrump,
      ]}
    >
      {/* Trump indicator stripe */}
      {showTrumpGlow && <View style={styles.trumpStripe} />}

      {/* Top-left pip */}
      <View style={styles.pip}>
        <Text style={[styles.pipRank, { color }]}>{card.rank}</Text>
        <Text style={[styles.pipSuit, { color }]}>{symbol}</Text>
      </View>

      {/* Ghost watermark suit */}
      <Text
        style={[styles.watermark, { color, opacity: showTrumpGlow ? 0.18 : 1 }]}
      >
        {symbol}
      </Text>

      {/* Bottom-right pip (flipped) */}
      <View style={[styles.pip, styles.pipBR]}>
        <Text style={[styles.pipRank, { color }]}>{card.rank}</Text>
        <Text style={[styles.pipSuit, { color }]}>{symbol}</Text>
      </View>
    </View>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface BottomHandProps {
  hand?: Card[];
  currentTrick: Trick;
  trumpSuit: Suit | null;
  trumpRevealed: boolean;
  isMyTurn: boolean;
  onCardPress?: (cardId: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function BottomHand({
  hand = [],
  currentTrick,
  trumpSuit,
  trumpRevealed,
  isMyTurn,
  onCardPress,
}: BottomHandProps) {
  const sorted = sortHand(hand);
  const layouts = getHandLayout(sorted.length);

  const playableIds = getPlayableIds(sorted, currentTrick, isMyTurn);

  if (!sorted.length) return null;

  return (
    <View style={styles.container}>
      {sorted.map((card, i) => {
        const l = layouts[i];
        const canPlay = !isMyTurn || playableIds.has(card.id);
        const dimmed = isMyTurn && !playableIds.has(card.id);
        const isTrump = card.suit === trumpSuit;

        return (
          <MotiView
            key={card.id}
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
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.3,
              shadowRadius: 7,
              elevation: i + 1,
            }}
          >
            <Pressable
              onPress={() => canPlay && onCardPress?.(card.id)}
              disabled={!isMyTurn || !canPlay}
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
                  <CardFace
                    card={card}
                    isTrump={isTrump}
                    trumpRevealed={trumpRevealed}
                  />
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
  cardTrump: {
    borderColor: '#EF9F27',
    borderWidth: 1.5,
    backgroundColor: '#FFFDF5',
  },
  trumpStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#EF9F27',
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

  pressedCard: {
    transform: [{ translateY: -(CARD_H * 0.38) }, { scale: 1.08 }],
  },
  pressFlash: {
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.28)',
    zIndex: 10,
  },
});
