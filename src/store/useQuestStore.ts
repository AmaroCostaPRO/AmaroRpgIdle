import { create } from 'zustand';
import { QuestDef, ObjectiveType, NpcDialogState, NpcDialogOption } from '../core/quests/types';
import { MAIN_QUESTS_CATALOG } from '../core/quests/mainQuestsData';
import { STORY_ITEMS_CATALOG } from '../core/quests/storyItemsData';
import { ACT_CUTSCENES_CATALOG, ActCutsceneDef } from '../core/quests/storyCutscenesData';
import { generateProceduralQuests } from '../core/quests/QuestGenerator';
import { useGameStore } from './useGameStore';
import { BaseStats, GameEvent } from '../core/types';
import { bridge } from '../bridge/GameBridge';

const QUEST_STORE_STORAGE_KEY = 'medieval_idle_quest_store';

interface QuestStoreState {
  mainQuests: Record<string, QuestDef>;
  proceduralQuests: QuestDef[];
  completedQuestIds: string[];
  storyInventory: Record<string, number>;
  activeDialog: NpcDialogState | null;

  // Cutscenes Narrativas de Ato
  seenActCutscenes: number[];
  activeActCutscene: ActCutsceneDef | null;
  playActCutscene: (actNumber: number) => void;
  finishActCutscene: () => void;

  // Ações
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
  seenActCutscenes: number[];
} => {
  try {
    const raw = localStorage.getItem(QUEST_STORE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
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
        seenActCutscenes: parsed.seenActCutscenes || [],
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
    seenActCutscenes: [],
  };
};

const saveQuestStore = (state: {
  mainQuests: Record<string, QuestDef>;
  proceduralQuests: QuestDef[];
  completedQuestIds: string[];
  storyInventory: Record<string, number>;
  seenActCutscenes: number[];
}) => {
  try {
    localStorage.setItem(
      QUEST_STORE_STORAGE_KEY,
      JSON.stringify({
        mainQuests: state.mainQuests,
        proceduralQuests: state.proceduralQuests,
        completedQuestIds: state.completedQuestIds,
        storyInventory: state.storyInventory,
        seenActCutscenes: state.seenActCutscenes,
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
    activeActCutscene: null,

    playActCutscene: (actNumber: number) => {
      const cutscene = ACT_CUTSCENES_CATALOG[actNumber];
      if (!cutscene) return;

      // Pausa a cena de combate durante a exibição narrativa
      bridge.emit(GameEvent.END_COMBAT, {});
      set({ activeActCutscene: cutscene });
    },

    finishActCutscene: () => {
      const { activeActCutscene, seenActCutscenes } = get();
      let updatedSeen = [...seenActCutscenes];

      if (activeActCutscene && !updatedSeen.includes(activeActCutscene.act)) {
        updatedSeen.push(activeActCutscene.act);
      }

      set({
        activeActCutscene: null,
        seenActCutscenes: updatedSeen,
      });

      saveQuestStore({ ...get(), seenActCutscenes: updatedSeen });

      // Retoma o loop de combate
      bridge.emit(GameEvent.START_COMBAT, { mode: 'campaign' });
    },

    generateRunQuests: () => {
      const char = useGameStore.getState().character;
      const proceduralQuests = generateProceduralQuests(char);
      set({ proceduralQuests });
      saveQuestStore({ ...get(), proceduralQuests });
    },

    updateObjectiveProgress: (type: ObjectiveType, targetId?: string, amount = 1) => {
      const { mainQuests, proceduralQuests } = get();
      const char = useGameStore.getState().character;
      const currentStage = char?.currentStage || 1;

      let changed = false;

      const updateQuestList = (quests: QuestDef[]) => {
        return quests.map((quest) => {
          if (quest.isCompleted || quest.isClaimed) return quest;

          if (quest.act && !isMainQuestUnlocked(quest, mainQuests, currentStage)) {
            return quest;
          }

          let questUpdated = false;
          let allCompleted = true;

          const updatedObjectives = quest.objectives.map((obj) => {
            if (obj.type !== type) {
              if (obj.currentAmount < obj.requiredAmount) allCompleted = false;
              return obj;
            }

            if (type === 'stage') {
              const currentAmount = currentStage;
              if (currentAmount !== obj.currentAmount) questUpdated = true;
              if (currentAmount < obj.requiredAmount) allCompleted = false;
              return { ...obj, currentAmount };
            }

            if (type === 'level') {
              const currentAmount = char?.level || 1;
              if (currentAmount !== obj.currentAmount) questUpdated = true;
              if (currentAmount < obj.requiredAmount) allCompleted = false;
              return { ...obj, currentAmount };
            }

            if (obj.targetId && targetId && obj.targetId !== targetId) {
              if (obj.currentAmount < obj.requiredAmount) allCompleted = false;
              return obj;
            }

            const newAmount = Math.min(obj.requiredAmount, obj.currentAmount + amount);
            if (newAmount !== obj.currentAmount) questUpdated = true;
            if (newAmount < obj.requiredAmount) allCompleted = false;

            return { ...obj, currentAmount: newAmount };
          });

          const isCompleted = allCompleted ? true : quest.isCompleted;
          if (questUpdated) changed = true;

          return {
            ...quest,
            objectives: updatedObjectives,
            isCompleted,
          };
        });
      };

      const newMainList = updateQuestList(Object.values(mainQuests));
      const newMain: Record<string, QuestDef> = {};
      newMainList.forEach((q) => {
        newMain[q.id] = q;
      });

      const newProcedural = updateQuestList(proceduralQuests);

      if (changed) {
        set({ mainQuests: newMain, proceduralQuests: newProcedural });
        saveQuestStore({ ...get(), mainQuests: newMain, proceduralQuests: newProcedural });
      }
    },

    syncQuestObjectives: () => {
      const { mainQuests, proceduralQuests } = get();
      const char = useGameStore.getState().character;
      if (!char) return;

      const currentStage = char.currentStage || 1;
      const currentLevel = char.level || 1;
      let changed = false;

      const syncList = (quests: QuestDef[]) => {
        return quests.map((quest) => {
          if (quest.isCompleted || quest.isClaimed) return quest;
          if (quest.act && !isMainQuestUnlocked(quest, mainQuests, currentStage)) return quest;

          let questUpdated = false;
          let allCompleted = true;

          const objectives = quest.objectives.map((obj) => {
            let currentAmount = obj.currentAmount;
            if (obj.type === 'stage') {
              currentAmount = currentStage;
            } else if (obj.type === 'level') {
              currentAmount = currentLevel;
            }
            if (currentAmount !== obj.currentAmount) questUpdated = true;
            if (currentAmount < obj.requiredAmount) allCompleted = false;

            return { ...obj, currentAmount };
          });

          const isCompleted = allCompleted ? true : quest.isCompleted;
          if (questUpdated) changed = true;
          return { ...quest, objectives, isCompleted };
        });
      };

      const newMainList = syncList(Object.values(mainQuests));
      const newMain: Record<string, QuestDef> = {};
      newMainList.forEach((q) => {
        newMain[q.id] = q;
      });

      const newProcedural = syncList(proceduralQuests);

      if (changed) {
        set({ mainQuests: newMain, proceduralQuests: newProcedural });
        saveQuestStore({ ...get(), mainQuests: newMain, proceduralQuests: newProcedural });
      }
    },

    claimReward: (questId: string) => {
      const { mainQuests, proceduralQuests, completedQuestIds, storyInventory, seenActCutscenes, playActCutscene } = get();

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
        seenActCutscenes,
      });

      // Disparo Automático da Cutscene do Próximo Ato ao Concluir o Ato Atual
      if (isMain && targetQuest.act) {
        const currentAct = targetQuest.act;
        const questsInAct = Object.values(mainQuests).filter((q) => q.act === currentAct);
        const allActDone = questsInAct.every((q) => q.isCompleted || q.isClaimed);

        if (allActDone && currentAct < 6) {
          const nextAct = currentAct + 1;
          if (!seenActCutscenes.includes(nextAct)) {
            setTimeout(() => {
              playActCutscene(nextAct);
            }, 500);
          }
        }
      }
    },

    triggerNpcDialog: (npcId, npcName, factionColor, text, options, questId) => {
      set({
        activeDialog: {
          npcId,
          npcName,
          factionColor,
          text,
          options,
          questId,
        },
      });
    },

    closeDialog: () => {
      set({ activeDialog: null });
    },

    getStoryStatsBonus: () => {
      const { storyInventory } = get();
      const bonus: Partial<BaseStats> = {};

      for (const [itemId, count] of Object.entries(storyInventory)) {
        if (count <= 0) continue;
        const itemDef = STORY_ITEMS_CATALOG[itemId];
        if (!itemDef || !itemDef.statBonus) continue;

        for (const [statKey, statVal] of Object.entries(itemDef.statBonus)) {
          const key = statKey as keyof BaseStats;
          const val = Number(statVal || 0) * count;
          bonus[key] = (Number(bonus[key]) || 0) + val;
        }
      }

      return bonus;
    },
  };
});
