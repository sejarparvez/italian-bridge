import { MotiView } from 'moti';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { Dimensions } from 'react-native';

// ── Constants ─────────────────────────────────────────────────────────────────

const { width, height } = Dimensions.get('window');
const SCREEN_H = Math.min(width, height);

const CARD_W = SCREEN_H * 0.17;
const CARD_H = CARD_W * 1.45;
const TRICK_CARD_W = SCREEN_H * 0.13;

export default function DealCard({
  index,
  children,
}: {
  cardId: string;
  index: number;
  children: React.ReactNode;
}) {
  const hasDealtIn = useRef(false);

  // Mark as dealt after the entrance animation would complete
  useEffect(() => {
    const t = setTimeout(
      () => {
        hasDealtIn.current = true;
      },
      300 + index * 55,
    );
    return () => clearTimeout(t);
  }, [index]);

  return (
    <MotiView
      from={
        hasDealtIn.current
          ? undefined // already in — no entrance re-play
          : { opacity: 0, translateY: -CARD_H * 1.4, scale: 0.55 }
      }
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{
        type: 'spring',
        damping: 16,
        stiffness: 110,
        delay: hasDealtIn.current ? 0 : index * 55,
      }}
    >
      {children}
    </MotiView>
  );
}
