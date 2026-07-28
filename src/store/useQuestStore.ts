import { create } from 'zustand';
import { QuestDef, ObjectiveType, NpcDialogState, NpcDialogOption } from '../core/quests/types';
import { MAIN_QUESTS_CATALOG } from '../core/quests/mainQuestsData';
import { STORY_ITEMS_CATALOG } from '../core/quests/storyItemsData';
import { generateProceduralQuests } from '../core/quests/QuestGenerator';
import { useGameStore } from './useGameStore';
import { BaseStats } from '../core/types';

const QUEST_STORE_STORAGE_KEY = 'medieval_idle_quest_store';

interface QuestStoreState {
  mainQuests: Record<string, QuestDef>;
  proceduralQuests: QuestDef[];
  completedQuestIds: string[];
  storyInventory: Record<string, number>;
  activeDialog: NpcDialogState | null;

  // Actions
  generateRunQuests: () => void;
  updateObjectiveProgress: (type: ObjectiveType, targetId?: string, amount?: number) => void;
  syncQuestObjectives: () => void;
  claimReward: (questId: string) => void;
  triggerNpcDialog: (npcId: string, npcName: string, factionColor: string, text: string, options?: NpcDialogOption[], questId?: string) => void;
  closeDialog: () => void;
  getStoryStatsBonus: () => Partial<BaseStats>;
}

export const isMainQuestUnlocked = (quest: QuestDef, mainQuests: Record<string, QuestDef>, currentStage: number): boolean => {
  if (!quest.act) return true;
  for (const other of Object.values(mainQuests)) {
    if (other.id === quest.id) continue;
    if (!other.act) continue;
    if (other.act < quest.act) {
      if (!other.isCompleted && !other.isClaimed) return false;
    } else if (other.act === quest.act && (other.chapterNumber || 0) < (quest.chapterNumber || 0)) {
      if (!other.isCompleted && !other.isClaimed) return false;
    }
  }
  if (quest.unlockedAtStage && currentStage < quest.unlockedAtStage) return false;
  return true;
};

const defaultMainQuestsMap = (): Record<string, QuestDef> => {
  const map: Record<string, QuestDef> = {};
  for (const q of MAIN_QUESTS_CATALOG) {
    map[q.id] = JSON.parse(JSON.stringify(q));
  }
  return map;
};

const loadPersistedQuestStore = (): {
  mainQuests: Record<string, QuestDef>;
  proceduralQuests: QuestDef[];
  completedQuestIds: string[];
  storyInventory: Record<string, number>;
} => {
  try {
    const raw = localStorage.getItem(QUEST_STORE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge mainQuests with default catalog in case new catalog items exist
      const mainMap = defaultMainQuestsMap();
      if (parsed.mainQuests) {
        for (const [id, quest] of Object.entries(parsed.mainQuests)) {
          if (mainMap[id]) {
            mainMap[id] = { ...mainMap[id], ...(quest as QuestDef) };
          }
        }
      }
      return {
        mainQuests: mainMap,
        proceduralQuests: parsed.proceduralQuests || [],
        completedQuestIds: parsed.completedQuestIds || [],
        storyInventory: parsed.storyInventory || {},
      };
    }
  } catch (e) {
    console.error('Erro ao carregar useQuestStore do localStorage:', e);
  }
  return {
    mainQuests: defaultMainQuestsMap(),
    proceduralQuests: [],
    completedQuestIds: [],
    storyInventory: {},
  };
};

const saveQuestStore = (state: {
  mainQuests: Record<string, QuestDef>;
  proceduralQuests: QuestDef[];
  completedQuestIds: string[];
  storyInventory: Record<string, number>;
}) => {
  try {
    localStorage.setItem(
      QUEST_STORE_STORAGE_KEY,
      JSON.stringify({
        mainQuests: state.mainQuests,
        proceduralQuests: state.proceduralQuests,
        completedQuestIds: state.completedQuestIds,
        storyInventory: state.storyInventory,
      })
    );
  } catch (e) {
    console.error('Erro ao salvar useQuestStore no localStorage:', e);
  }
};

export const useQuestStore = create<QuestStoreState>((set, get) => {
  const initialData = loadPersistedQuestStore();

  return {
    ...initialData,
    activeDialog: null,

    generateRunQuests: () => {
      const char = useGameStore.getState().character;
      const proceduralQuests = generateProceduralQuests(char);
      set({ proceduralQuests });
      saveQuestStore({ ...get(), proceduralQuests });
    },

    syncQuestObjectives: () => {
      const char = useGameStore.getState().character;
      if (!char) return;
      get().updateObjectiveProgress('level', undefined, char.level || 1);
    },

    updateObjectiveProgress: (type: ObjectiveType, targetId?: string, amount = 1) => {
      let changed = false;
      const char = useGameStore.getState().character;
      const currentStage = char?.currentStage || 1;
      const currentLevel = char?.level || 1;

      // 1. Atualiza Main Quests
      const newMain = { ...get().mainQuests };
      for (const [id, quest] of Object.entries(newMain)) {
        if (quest.isCompleted) continue;
        if (!isMainQuestUnlocked(quest, newMain, currentStage)) continue;

        let questUpdated = false;
        let allCompleted = true;

        for (const obj of quest.objectives) {
          if (obj.type === type) {
            if (!obj.targetId || obj.targetId === targetId) {
              const prev = obj.currentAmount;
              if (type === 'stage' || type === 'level') {
                obj.currentAmount = Math.max(obj.currentAmount, amount);
              } else {
                obj.currentAmount = Math.min(obj.requiredAmount, obj.currentAmount + amount);
              }
              if (obj.currentAmount !== prev) {
                questUpdated = true;
                changed = true;
              }
            }
          } else if (obj.type === 'stage') {
            const prev = obj.currentAmount;
            obj.currentAmount = Math.max(obj.currentAmount, currentStage);
            if (obj.currentAmount !== prev) {
              questUpdated = true;
              changed = true;
            }
          } else if (obj.type === 'level') {
            const prev = obj.currentAmount;
            obj.currentAmount = Math.max(obj.currentAmount, currentLevel);
            if (obj.currentAmount !== prev) {
              questUpdated = true;
              changed = true;
            }
          }

          if (obj.currentAmount < obj.requiredAmount) {
            allCompleted = false;
          }
        }

        if (allCompleted && !quest.isCompleted) {
          quest.isCompleted = true;
          changed = true;
          // Trigger NPC Dialog if available
          if (quest.npcId && quest.npcName) {
            get().triggerNpcDialog(
              quest.npcId,
              quest.npcName,
              '#a855f7',
              `Excelente progresso! Você concluiu os objetivos da missão "${quest.title}". Reclame sua recompensa no Diário da Jornada!`,
              [
                { label: 'Reclamar Recompensa', action: 'claim_reward', questId: quest.id },
                { label: 'Fechar', action: 'close' },
              ],
              quest.id
            );
          }
        }
      }

      // 2. Atualiza Procedural Quests
      const newProcedural = get().proceduralQuests.map((quest) => {
        if (quest.isCompleted) return quest;

        let questUpdated = false;
        let allCompleted = true;
        const objectives = quest.objectives.map((obj) => {
          let currentAmount = obj.currentAmount;
          if (obj.type === type) {
            if (!obj.targetId || obj.targetId === targetId) {
              currentAmount =
                type === 'stage' || type === 'level'
                  ? Math.max(currentAmount, amount)
                  : Math.min(obj.requiredAmount, currentAmount + amount);
            }
          } else if (obj.type === 'stage') {
            currentAmount = Math.max(currentAmount, currentStage);
          } else if (obj.type === 'level') {
            currentAmount = Math.max(currentAmount, currentLevel);
          }

          if (currentAmount !== obj.currentAmount) questUpdated = true;
          if (currentAmount < obj.requiredAmount) allCompleted = false;

          return { ...obj, currentAmount };
        });

        const isCompleted = allCompleted ? true : quest.isCompleted;
        if (questUpdated) changed = true;
        return { ...quest, objectives, isCompleted };
      });

      if (changed) {
        set({ mainQuests: newMain, proceduralQuests: newProcedural });
        saveQuestStore({ ...get(), mainQuests: newMain, proceduralQuests: newProcedural });
      }
    },

    claimReward: (questId: string) => {
      const { mainQuests, proceduralQuests, completedQuestIds, storyInventory } = get();

      let targetQuest: QuestDef | null = mainQuests[questId] || null;
      let isMain = true;

      if (!targetQuest) {
        targetQuest = proceduralQuests.find((q) => q.id === questId) || null;
        isMain = false;
      }

      if (!targetQuest || !targetQuest.isCompleted || targetQuest.isClaimed) return;

      // Mark claimed
      if (isMain) {
        mainQuests[questId] = { ...targetQuest, isClaimed: true };
      } else {
        const idx = proceduralQuests.findIndex((q) => q.id === questId);
        if (idx !== -1) proceduralQuests[idx] = { ...targetQuest, isClaimed: true };
      }

      const newCompleted = [...completedQuestIds, questId];
      const newStoryInventory = { ...storyInventory };

      // Apply rewards to useGameStore
      const rewards = targetQuest.rewards;
      if (rewards.gold) {
        useGameStore.getState().addGold(rewards.gold);
      }
      if (rewards.forgeFragments) {
        useGameStore.getState().addForgeFragments(rewards.forgeFragments);
      }
      if (rewards.studyInsignias) {
        useGameStore.getState().addStudyInsignias(rewards.studyInsignias);
      }
      if (rewards.abyssPearls) {
        useGameStore.getState().addPearls(rewards.abyssPearls);
      }
      if (rewards.transcendenceEssence) {
        useGameStore.getState().addTranscendenceEssence(rewards.transcendenceEssence);
      }
      if (rewards.storyItemId) {
        newStoryInventory[rewards.storyItemId] = (newStoryInventory[rewards.storyItemId] || 0) + 1;
      }

      set({
        mainQuests: { ...mainQuests },
        proceduralQuests: [...proceduralQuests],
        completedQuestIds: newCompleted,
        storyInventory: newStoryInventory,
      });

      saveQuestStore({
        mainQuests,
        proceduralQuests,
        completedQuestIds: newCompleted,
        storyInventory: newStoryInventory,
      });
    },

    triggerNpcDialog: (npcId, npcName, factionColor, text, options, questId) => {
      set({
        activeDialog: {
          npcId,
          npcName,
          factionColor,
          text,
          options: options || [{ label: 'Entendido', action: 'close' }],
          questId,
        },
      });
    },

    closeDialog: () => {
      set({ activeDialog: null });
    },

    getStoryStatsBonus: () => {
      const { storyInventory } = get();
      const totals: Partial<BaseStats> = {};

      for (const [itemId, qty] of Object.entries(storyInventory)) {
        if (qty <= 0) continue;
        const itemDef = STORY_ITEMS_CATALOG[itemId];
        if (!itemDef || !itemDef.statBonus) continue;

        for (const [key, val] of Object.entries(itemDef.statBonus)) {
          const statKey = key as keyof BaseStats;
          totals[statKey] = (totals[statKey] || 0) + (val as number) * qty;
        }
      }
      return totals;
    },
  };
});
