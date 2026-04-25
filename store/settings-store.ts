import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Difficulty } from '@/types/game-type';

export interface SettingsState {
  winThreshold: number;
  animSpeed: number;
  difficulty: Difficulty;
  setWinThreshold: (value: number) => void;
  setAnimSpeed: (value: number) => void;
  setDifficulty: (value: Difficulty) => void;
  reset: () => void;
}

const DEFAULT_SETTINGS: Pick<SettingsState, 'winThreshold' | 'animSpeed' | 'difficulty'> = {
  winThreshold: 20,
  animSpeed: 1,
  difficulty: 'medium',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setWinThreshold: (value) => set({ winThreshold: value }),
      setAnimSpeed: (value) => set({ animSpeed: value }),
      setDifficulty: (value) => set({ difficulty: value }),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'italian-bridge-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);