/**
 * Card Game Theme - Dark felt + Gold accents (Ace of Spades style)
 */

import '@/global.css';
import { Platform } from 'react-native';

export const COLORS = {
  feltDark: '#0D2B1A',
  feltMid: '#1A4A2E',
  feltBorder: '#0A1F13',

  goldPrimary: '#C9A84C',
  goldLight: '#E8D5A3',
  goldDark: '#8B6914',

  cardFace: '#F5F0E8',
  cardBack: '#1C1C2E',
  cardBackAccent: '#C9A84C',

  redSuit: '#C0392B',
  blackSuit: '#1A1A2E',

  overlayDark: 'rgba(0,0,0,0.75)',
  textPrimary: '#E8D5A3',
  textSecondary: 'rgba(232,213,163,0.6)',
  danger: '#E05C5C',
  success: '#4CAF7D',
};

export const Fonts = {
  display: Platform.select({
    ios: 'System',
    android: 'serif',
    default: 'serif',
  }),
  body: Platform.select({
    ios: 'System',
    android: 'serif',
    default: 'serif',
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
