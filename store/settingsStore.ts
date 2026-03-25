import { create } from 'zustand';
import { Difficulty } from '@/engine/ai/bidAI';

interface SettingsStore {
  soundEnabled: boolean;
  animationSpeed: number;
  difficulty: Difficulty;
  
  toggleSound: () => void;
  setAnimationSpeed: (speed: number) => void;
  setDifficulty: (difficulty: Difficulty) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  soundEnabled: true,
  animationSpeed: 1.0,
  difficulty: 'medium',

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  
  setAnimationSpeed: (speed: number) => set({ animationSpeed: speed }),
  
  setDifficulty: (difficulty: Difficulty) => set({ difficulty }),
}));
