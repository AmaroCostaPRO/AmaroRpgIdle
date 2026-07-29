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

// v11.1.1: progresso da Jornada (missões, Atos vistos, Artefatos de História) é POR PERSONAGEM, não
// por conta — cada slot de save (1-12) tem sua própria chave. Sem isso, um personagem novo herdava
// os Atos/artefatos do personagem mais avançado, pois tudo caía na mesma chave global. `null`
// (nenhum slot carregado, ex: tela de menu) cai na chave legada sem sufixo, só para não perder o
// progresso de saves já existentes antes desta correção.
//
// Lê `medieval_idle_current_slot` direto do localStorage em vez de `useGameStore.getState()`: este
// arquivo já importa `useGameStore` (usado dentro de funções de ação, ex. `claimReward`) e
// `useGameStore.ts` importa este arquivo de volta — um import circular que já existia e era
// inofensivo porque as duas pontas só se tocavam dentro de corpos de função (nunca no topo do
// módulo). Ler `useGameStore.getState()` aqui no topo do módulo quebraria essa segurança (a
// inicialização de um dos dois ficaria em TDZ dependendo da ordem de carregamento). O gatilho de
// recarregamento ao trocar de slot fica centralizado em `useGameStore.ts` (mesmo padrão usado por
// `useRelicStore.ts`/`useTowerStore.ts`), não uma assinatura própria aqui.
const getActiveSlot = (): number | null => {
  const raw = localStorage.getItem('medieval_idle_current_slot');
  return raw ? Number(raw) : null;
};

const getQuestStoreKey = (slot: number | null): string =>
  slot != null ? `${QUEST_STORE_STORAGE_KEY}_slot_${slot}` : QUEST_STORE_STORAGE_KEY;

// Cor de facção por NPC narrativo, usada no banner de diálogo (`triggerNpcDialog`) ao concluir um
// capítulo com `completionLore` — mesma paleta já usada nas cutscenes de Ato (storyCutscenesData.ts).
const NPC_FACTION_COLORS: Record<string, string> = {
  alma_mundo: '#a855f7',
  archivist_valeria: '#38bdf8',
  forge_master_vulkan: '#f97316',
  void_wanderer: '#10b981',
  avatar_echo: '#ec4899',
  sunken_castellan: '#06b6d4',
  sky_herald: '#fbbf24',
};

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
  // v11.1.1: usado por `resetAllData` (useGameStore.ts) — zera a Jornada do slot atual em memória e
  // no localStorage, já que "Resetar Todos os Dados" nunca tocava neste store antes desta correção.
  resetQuestProgress: () => void;
  // v11.1.1: recarrega a Jornada do slot de save ativo — chamado por useGameStore quando o
  // personagem troca.
  reloadForActiveSlot: () => void;
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

const QUEST_STORE_MIGRATED_FLAG = 'medieval_idle_quest_store_migrated_to_slots';

// Migração única: saves anteriores a esta correção guardavam tudo na chave global legada. Na
// primeira leitura de QUALQUER slot após a correção, se essa chave legada ainda existir e a
// migração nunca tiver rodado, copiamos o progresso legado para o slot que está sendo carregado
// agora (o slot ativo do jogador) em vez de perdê-lo — e marcamos como migrado para não duplicar
// esse mesmo progresso legado em outros slots carregados depois.
const migrateLegacyQuestStoreIfNeeded = (slot: number | null): void => {
  if (slot == null) return;
  try {
    if (localStorage.getItem(QUEST_STORE_MIGRATED_FLAG)) return;
    const legacyRaw = localStorage.getItem(QUEST_STORE_STORAGE_KEY);
    if (!legacyRaw) {
      localStorage.setItem(QUEST_STORE_MIGRATED_FLAG, '1');
      return;
    }
    const slotKey = getQuestStoreKey(slot);
    if (!localStorage.getItem(slotKey)) {
      localStorage.setItem(slotKey, legacyRaw);
    }
    localStorage.setItem(QUEST_STORE_MIGRATED_FLAG, '1');
  } catch (e) {
    console.error('Erro ao migrar useQuestStore legado para slots:', e);
  }
};

const loadPersistedQuestStore = (slot: number | null): {
  mainQuests: Record<string, QuestDef>;
  proceduralQuests: QuestDef[];
  completedQuestIds: string[];
  storyInventory: Record<string, number>;
  seenActCutscenes: number[];
} => {
  migrateLegacyQuestStoreIfNeeded(slot);
  try {
    const raw = localStorage.getItem(getQuestStoreKey(slot));
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
      getQuestStoreKey(getActiveSlot()),
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
  const initialData = loadPersistedQuestStore(getActiveSlot());

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

      // Banner de Diálogo do NPC ao concluir um capítulo com lore de conclusão registrada — reusa o
      // `triggerNpcDialog`/`NpcDialogOverlay` já existente (antes nunca era chamado por ninguém).
      if (targetQuest.completionLore && targetQuest.npcId && targetQuest.npcName) {
        get().triggerNpcDialog(
          targetQuest.npcId,
          targetQuest.npcName,
          NPC_FACTION_COLORS[targetQuest.npcId] || '#a855f7',
          targetQuest.completionLore
        );
      }

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

    resetQuestProgress: () => {
      const fresh = {
        mainQuests: defaultMainQuestsMap(),
        proceduralQuests: [] as QuestDef[],
        completedQuestIds: [] as string[],
        storyInventory: {} as Record<string, number>,
        seenActCutscenes: [] as number[],
      };
      set({ ...fresh, activeDialog: null, activeActCutscene: null });
      saveQuestStore(fresh);
    },

    // v11.1.1: chamado por `useGameStore.ts` (não por assinatura própria aqui — ver comentário em
    // `getActiveSlot` acima) sempre que o slot de save ativo mudar (novo personagem, troca de
    // personagem, exclusão de slot). A troca acontece em runtime sem reload de página, então sem
    // isso o useQuestStore continuaria com os dados do personagem anterior até um F5 manual.
    reloadForActiveSlot: () => {
      const reloaded = loadPersistedQuestStore(getActiveSlot());
      set({ ...reloaded, activeDialog: null, activeActCutscene: null });
    },
  };
});
