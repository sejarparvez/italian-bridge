import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Difficulty } from '@/types/game-type';

const mmkvStorage = createMMKV({ id: 'italian-bridge-settings' });

export interface SettingsState {
  userName: string;
  winThreshold: number;
  animSpeed: number;
  difficulty: Difficulty;
  setUserName: (value: string) => void;
  setWinThreshold: (value: number) => void;
  setAnimSpeed: (value: number) => void;
  setDifficulty: (value: Difficulty) => void;
  reset: () => void;
}

const DEFAULT_SETTINGS: Pick<
  SettingsState,
  'userName' | 'winThreshold' | 'animSpeed' | 'difficulty'
> = {
  userName: 'Player One',
  winThreshold: 30,
  animSpeed: 1,
  difficulty: 'hard',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setUserName: (value) => set({ userName: value }),
      setWinThreshold: (value) => set({ winThreshold: value }),
      setAnimSpeed: (value) => set({ animSpeed: value }),
      setDifficulty: (value) => set({ difficulty: value }),
      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'italian-bridge-settings',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const value = mmkvStorage.getString(name);
          return value ?? null;
        },
        setItem: (name, value) => {
          mmkvStorage.set(name, value);
        },
        removeItem: (name) => {
          mmkvStorage.remove(name);
        },
      })),
    },
  ),
);
