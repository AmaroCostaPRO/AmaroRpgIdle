import { create } from 'zustand';
import { AudioManager } from '../core/AudioManager';

export type TransitionType = 'biome' | 'difficulty' | 'tower' | 'abyss';

export interface TransitionPayload {
  id: string;
  type: TransitionType;
  title: string;
  subtitle: string;
  loreText?: string;
  speakerId?: string;
  speakerName?: string;
  factionColor?: string;
  icon?: string;
}

interface TransitionStoreState {
  seenTransitions: string[];
  activeTransition: (TransitionPayload & { isFast: boolean }) | null;

  triggerTransition: (payload: TransitionPayload, forceFullMode?: boolean) => void;
  closeTransition: () => void;
  resetTransitions: () => void;
}

const TRANSITION_STORAGE_KEY = 'medieval_idle_transitions_seen';

const loadSeenTransitions = (): string[] => {
  try {
    const raw = localStorage.getItem(TRANSITION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveSeenTransitions = (list: string[]) => {
  try {
    localStorage.setItem(TRANSITION_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage errors
  }
};

export const useTransitionStore = create<TransitionStoreState>((set, get) => ({
  seenTransitions: loadSeenTransitions(),
  activeTransition: null,

  triggerTransition: (payload, forceFullMode = false) => {
    const { seenTransitions } = get();
    const alreadySeen = seenTransitions.includes(payload.id);
    const isFast = alreadySeen && !forceFullMode;

    if (!alreadySeen) {
      const nextSeen = [...seenTransitions, payload.id];
      saveSeenTransitions(nextSeen);
      set({ seenTransitions: nextSeen });
    }

    set({
      activeTransition: {
        ...payload,
        isFast,
      },
    });

    // Efeito sonoro de transição / avanço narrativo
    try {
      AudioManager.getInstance().playDialogAdvance();
    } catch {
      // Audio fallback
    }
  },

  closeTransition: () => {
    set({ activeTransition: null });
  },

  resetTransitions: () => {
    localStorage.removeItem(TRANSITION_STORAGE_KEY);
    set({ seenTransitions: [], activeTransition: null });
  },
}));
