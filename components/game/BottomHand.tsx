import { Image } from 'expo-image';
import { MotiView } from 'moti';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { type Card, RANK_ORDER, type Suit } from '../../constants/cards';
import type { Trick } from '../../types/game-type';

const SUIT_INITIAL: Record<Suit, string> = {
  spades: 'S',
  hearts: 'H',
  diamonds: 'D',
  clubs: 'C',
};

const AS = require('../../assets/cards/AS.svg') as number;
const KS = require('../../assets/cards/KS.svg');
const QS = require('../../assets/cards/QS.svg');
const JS = require('../../assets/cards/JS.svg');
const TS = require('../../assets/cards/10S.svg');
const NS9 = require('../../assets/cards/9S.svg');
const NS8 = require('../../assets/cards/8S.svg');
const NS7 = require('../../assets/cards/7S.svg');
const NS6 = require('../../assets/cards/6S.svg');
const NS5 = require('../../assets/cards/5S.svg');
const NS4 = require('../../assets/cards/4S.svg');
const NS3 = require('../../assets/cards/3S.svg');
const NS2 = require('../../assets/cards/2S.svg');
const AH = require('../../assets/cards/AH.svg');
const KH = require('../../assets/cards/KH.svg');
const QH = require('../../assets/cards/QH.svg');
const JH = require('../../assets/cards/JH.svg');
const TH = require('../../assets/cards/10H.svg');
const NH9h = require('../../assets/cards/9H.svg');
const NH8h = require('../../assets/cards/8H.svg');
const NH7h = require('../../assets/cards/7H.svg');
const NH6h = require('../../assets/cards/6H.svg');
const NH5h = require('../../assets/cards/5H.svg');
const NH4h = require('../../assets/cards/4H.svg');
const NH3h = require('../../assets/cards/3H.svg');
const NH2h = require('../../assets/cards/2H.svg');
const AD = require('../../assets/cards/AD.svg');
const KD = require('../../assets/cards/KD.svg');
const QD = require('../../assets/cards/QD.svg');
const JD = require('../../assets/cards/JD.svg');
const TD = require('../../assets/cards/10D.svg');
const ND9d = require('../../assets/cards/9D.svg');
const ND8d = require('../../assets/cards/8D.svg');
const ND7d = require('../../assets/cards/7D.svg');
const ND6d = require('../../assets/cards/6D.svg');
const ND5d = require('../../assets/cards/5D.svg');
const ND4d = require('../../assets/cards/4D.svg');
const ND3d = require('../../assets/cards/3D.svg');
const ND2d = require('../../assets/cards/2D.svg');
const AC = require('../../assets/cards/AC.svg');
const KC = require('../../assets/cards/KC.svg');
const QC = require('../../assets/cards/QC.svg');
const JC = require('../../assets/cards/JC.svg');
const TC = require('../../assets/cards/10C.svg');
const NC9c = require('../../assets/cards/9C.svg');
const NC8c = require('../../assets/cards/8C.svg');
const NC7c = require('../../assets/cards/7C.svg');
const NC6c = require('../../assets/cards/6C.svg');
const NC5c = require('../../assets/cards/5C.svg');
const NC4c = require('../../assets/cards/4C.svg');
const NC3c = require('../../assets/cards/3C.svg');
const NC2c = require('../../assets/cards/2C.svg');

const cardImages: Record<string, number> = {
  AS,
  KS,
  QS,
  JS,
  '10S': TS,
  '9S': NS9,
  '8S': NS8,
  '7S': NS7,
  '6S': NS6,
  '5S': NS5,
  '4S': NS4,
  '3S': NS3,
  '2S': NS2,
  AH,
  KH,
  QH,
  JH,
  '10H': TH,
  '9H': NH9h,
  '8H': NH8h,
  '7H': NH7h,
  '6H': NH6h,
  '5H': NH5h,
  '4H': NH4h,
  '3H': NH3h,
  '2H': NH2h,
  AD,
  KD,
  QD,
  JD,
  '10D': TD,
  '9D': ND9d,
  '8D': ND8d,
  '7D': ND7d,
  '6D': ND6d,
  '5D': ND5d,
  '4D': ND4d,
  '3D': ND3d,
  '2D': ND2d,
  AC,
  KC,
  QC,
  JC,
  '10C': TC,
  '9C': NC9c,
  '8C': NC8c,
  '7C': NC7c,
  '6C': NC6c,
  '5C': NC5c,
  '4C': NC4c,
  '3C': NC3c,
  '2C': NC2c,
};

// ─── Screen-relative card sizing ─────────────────────────────────────────────
const { width, height } = Dimensions.get('window');
const SCREEN_H = Math.min(width, height);
const CARD_W = SCREEN_H * 0.18;
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
  const showTrumpGlow = isTrump && trumpRevealed;
  const cardKey = `${card.rank}${SUIT_INITIAL[card.suit]}`;

  return (
    <View
      style={[
        styles.card,
        { width: CARD_W, height: CARD_H },
        showTrumpGlow && styles.cardTrump,
      ]}
    >
      {showTrumpGlow && <View style={styles.trumpStripe} />}
      <Image
        source={cardImages[cardKey]}
        style={styles.cardImage}
        contentFit='fill'
      />
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
    overflow: 'hidden',
    backgroundColor: '#FDFAF4',
  },
  cardTrump: {
    borderColor: '#EF9F27',
    borderWidth: 2,
  },
  trumpStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#EF9F27',
    zIndex: 10,
  },
  cardImage: {
    width: '100%',
    height: '100%',
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
