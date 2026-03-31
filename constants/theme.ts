/**
 * Card Game Theme - Dark felt + Gold accents (Ace of Spades style)
 */

import '@/global.css';

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
  display: {
    regular: 'Cinzel_400Regular',
    medium: 'Cinzel_500Medium',
    semibold: 'Cinzel_600SemiBold',
    bold: 'Cinzel_700Bold',
    extrabold: 'Cinzel_800ExtraBold',
    black: 'Cinzel_900Black',
  },
  body: {
    regular: 'CrimsonText_400Regular',
    semibold: 'CrimsonText_600SemiBold',
    bold: 'CrimsonText_700Bold',
  },
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

export const BottomTabInset = 80;
export const MaxContentWidth = 800;

export const C = {
  bg: '#06110A',
  felt: '#0A1C0F',
  gold: '#C8A840',
  goldBright: '#E8C84A',
  goldDim: 'rgba(200,168,64,0.25)',
  goldFaint: 'rgba(200,168,64,0.08)',
  goldAccent: 'rgba(200,168,64,0.12)',
  goldGlow: 'rgba(200,168,64,0.35)',
  white10: 'rgba(255,255,255,0.10)',
  white05: 'rgba(255,255,255,0.05)',
  danger: 'rgba(248,113,113,0.7)',
  dangerDim: 'rgba(248,113,113,0.5)',
};
