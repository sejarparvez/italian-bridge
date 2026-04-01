import type { SeatPosition } from '@/game/types';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const SCREEN_H = Math.min(width, height);
const SCREEN_W = Math.max(width, height);

const CARD_W = SCREEN_H * 0.17;
const CARD_OVERLAP = CARD_W * 0.52;
const TRICK_OFFSET = SCREEN_H * 0.18;


export function stableRot(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return ((h % 100) - 50) / 10;
}

export function getHandLayout(count: number) {
  const totalWidth = CARD_W + (count - 1) * CARD_OVERLAP;
  const startX = (SCREEN_W - totalWidth) / 2;
  return Array.from({ length: count }, (_, i) => {
    const norm = count > 1 ? i / (count - 1) : 0.5;
    const center = norm - 0.5;
    return {
      x: startX + i * CARD_OVERLAP,
      rotate: center * 27,
      y: Math.abs(center) * 17,
    };
  });
}

export const slotFor = (p: SeatPosition) => {
  const o = TRICK_OFFSET;
  return p === 'bottom'
    ? { x: 0, y: o }
    : p === 'top'
      ? { x: 0, y: -o }
      : p === 'left'
        ? { x: -o * 1.2, y: 0 }
        : { x: o * 1.2, y: 0 };
};
