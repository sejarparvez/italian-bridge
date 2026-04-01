import { create } from 'zustand';
import type { Difficulty } from '../game/types';

interface SettingsStore {
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  difficulty: Difficulty;
  animationSpeed: number;
  cardBackStyle: string;
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setVibrationEnabled: (enabled: boolean) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setAnimationSpeed: (speed: number) => void;
  setCardBackStyle: (style: string) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
  difficulty: 'medium',
  animationSpeed: 1,
  cardBackStyle: 'classic',

  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  setMusicEnabled: (musicEnabled) => set({ musicEnabled }),
  setVibrationEnabled: (vibrationEnabled) => set({ vibrationEnabled }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setAnimationSpeed: (animationSpeed) => set({ animationSpeed }),
  setCardBackStyle: (cardBackStyle) => set({ cardBackStyle }),
}));
