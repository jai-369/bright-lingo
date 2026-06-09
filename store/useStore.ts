import { create } from 'zustand';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { persistChallengeResult } from '../db/gamification';

interface StoreState {
  language: string | null;
  displayName: string | null;
  skillLevel: string | null;
  hearts: number;
  xp: number;
  currentStreak: number;
  isModalVisible: boolean;

  setLanguage: (lang: string) => void;
  setDisplayName: (name: string) => void;
  setSkillLevel: (level: string) => void;
  setGamificationState: (state: Partial<Pick<StoreState, 'hearts' | 'xp' | 'currentStreak'>>) => void;
  setModalVisible: (visible: boolean) => void;
  addXp: (amount: number) => void;

  hasCompletedOnboarding: () => boolean;
  completeChallenge: (isCorrect: boolean) => Promise<void>;

  groqApiKey: string | null;
  openRouterApiKey: string | null;
  setApiKeys: (groq: string, openRouter: string) => Promise<void>;
  loadApiKeys: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  language: null,
  displayName: null,
  skillLevel: null,
  hearts: 5,
  xp: 0,
  currentStreak: 0,
  isModalVisible: false,

  setLanguage: (lang) => set({ language: lang }),
  setDisplayName: (name) => set({ displayName: name }),
  setSkillLevel: (level) => set({ skillLevel: level }),
  setGamificationState: (newState) => set((state) => ({ ...state, ...newState })),
  setModalVisible: (visible) => set({ isModalVisible: visible }),
  addXp: (amount) => set((state) => ({ xp: state.xp + amount })),

  hasCompletedOnboarding: () => {
    const state = get();
    return state.language !== null && state.displayName !== null && state.skillLevel !== null;
  },

  completeChallenge: async (isCorrect) => {
    const { hearts, xp, currentStreak } = get();

    if (!isCorrect && hearts <= 0) {
      Alert.alert('Out of Hearts ❤️', 'You need more hearts to play. They regenerate every 4 hours!');
      return;
    }

    // Snapshot for rollback
    const snapshot = { hearts, xp, currentStreak };

    try {
      // Persist to DB first — optimistic update only on success
      await persistChallengeResult(isCorrect, hearts, xp, currentStreak);

      // DB succeeded — update UI state
      if (isCorrect) {
        set({ xp: xp + 10, currentStreak: currentStreak + 1 });
      } else {
        set({ hearts: Math.max(0, hearts - 1) });
      }
    } catch (error) {
      console.error('[completeChallenge] DB write failed, rolling back:', error);
      // Rollback to pre-action state
      set(snapshot);
      Alert.alert('Error', 'Failed to save progress. Please try again.');
    }
  },

  groqApiKey: null,
  openRouterApiKey: null,
  setApiKeys: async (groq: string, openRouter: string) => {
    const data = JSON.stringify({ groqApiKey: groq, openRouterApiKey: openRouter });
    await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + 'api_settings.json', data);
    set({ groqApiKey: groq, openRouterApiKey: openRouter });
  },
  loadApiKeys: async () => {
    try {
      const uri = FileSystem.documentDirectory + 'api_settings.json';
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(uri);
        const data = JSON.parse(content);
        set({ 
          groqApiKey: data.groqApiKey || null, 
          openRouterApiKey: data.openRouterApiKey || null 
        });
      }
    } catch (e) {
      console.error('Failed to load API keys', e);
    }
  }
}));

// Load keys on startup
useStore.getState().loadApiKeys();
