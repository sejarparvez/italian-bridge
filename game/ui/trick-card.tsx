import { C } from '@/constants/theme';
import type { SeatPosition } from '@/game/types';
import { slotFor, stableRot } from '@/game/ui/helpers';
import { MotiView } from 'moti';
import type React from 'react';
import { Dimensions } from 'react-native';


const { width, height } = Dimensions.get('window');
const SCREEN_H = Math.min(width, height);
const SCREEN_W = Math.max(width, height);

const CARD_W = SCREEN_H * 0.17;
const CARD_H = CARD_W * 1.45;
const TRICK_CARD_W = SCREEN_H * 0.13;
const TRICK_CARD_H = TRICK_CARD_W * 1.55;

export default function TrickCard({
  cardId,
  player,
  isLatest,
  children,
}: {
  cardId: string;
  player: SeatPosition;
  isLatest: boolean;
  children: React.ReactNode;
}) {
  const s = slotFor(player);
  const rot = stableRot(cardId);

  return (
    <MotiView
      key={cardId}
      from={{
        scale: isLatest ? 0.45 : 0.8,
        opacity: isLatest ? 0 : 0.7,
        rotate: `${rot + (isLatest ? 20 : 6)}deg`,
      }}
      animate={{
        scale: 1,
        opacity: 1,
        rotate: `${rot}deg`,
        transform: [
          { translateX: s.x - TRICK_CARD_W / 2 },
          { translateY: s.y - TRICK_CARD_H / 2 },
          { rotate: `${rot}deg` },
        ],
      }}
      transition={{
        type: 'spring',
        damping: isLatest ? 13 : 20,
        stiffness: isLatest ? 170 : 220,
        mass: isLatest ? 0.75 : 1,
      }}
      style={{ position: 'absolute', top: '50%', left: '50%' }}
    >
      {isLatest && (
        <MotiView
          from={{ opacity: 0.85, scale: 1.4 }}
          animate={{ opacity: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 500 }}
          style={{
            position: 'absolute',
            inset: -10,
            borderRadius: 14,
            backgroundColor: C.goldGlow,
          }}
        />
      )}
      {children}
    </MotiView>
  );
}
