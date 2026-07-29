import { create } from 'zustand';
import { bridge } from '../bridge/GameBridge';
import { GameEvent } from '../core/types';

export interface Relic {
  id: string;
  name: string;
  level: number; // Nível atual: 0 (bloqueada) até 3 (máximo)
  maxLevel: number;
  description: string;
  bonusValuePerLevel: number; // 0.03 para 3%
}

interface RelicStoreState {
  unstableSoulFragments: number;
  relics: Record<string, Relic>;
  addFragments: (amount: number) => void;
  spendFragments: (amount: number) => boolean;
  forgeRelic: () => { success: boolean; message: string; relicId?: string };
  getRelicEffectBonus: (relicId: string) => number;
  resetRelics: () => void;
  // v11.1.1: recarrega as Relíquias do slot de save ativo — chamado por useGameStore quando o
  // personagem troca (ver comentário em getRelicStoreKey abaixo).
  reloadForActiveSlot: () => void;
}

// v11.1.1: Relíquias Ativas são progresso POR PERSONAGEM, não por conta — cada slot de save tem sua
// própria chave, igual à correção já aplicada em useQuestStore.ts. Lê `medieval_idle_current_slot`
// direto do localStorage (em vez de importar useGameStore) para não criar um import circular, já que
// `useGameStore.ts` importa este arquivo no topo — o gatilho de recarregamento ao trocar de slot é
// registrado do lado de `useGameStore.ts`, não daqui.
const getActiveSlot = (): number | null => {
  const raw = localStorage.getItem('medieval_idle_current_slot');
  return raw ? Number(raw) : null;
};

const getRelicStoreKey = (slot: number | null): string =>
  slot != null ? `medieval_idle_relics_slot_${slot}` : 'medieval_idle_relics';

const RELICS_MIGRATED_FLAG = 'medieval_idle_relics_migrated_to_slots';

// Migração única do progresso legado (chave global, de antes desta correção) para o slot ativo no
// momento em que a correção passou a rodar — mesmo raciocínio de useQuestStore.ts.
const migrateLegacyRelicsIfNeeded = (slot: number | null): void => {
  if (slot == null) return;
  try {
    if (localStorage.getItem(RELICS_MIGRATED_FLAG)) return;
    const legacyRaw = localStorage.getItem('medieval_idle_relics');
    if (!legacyRaw) {
      localStorage.setItem(RELICS_MIGRATED_FLAG, '1');
      return;
    }
    const slotKey = getRelicStoreKey(slot);
    if (!localStorage.getItem(slotKey)) {
      localStorage.setItem(slotKey, legacyRaw);
    }
    localStorage.setItem(RELICS_MIGRATED_FLAG, '1');
  } catch (e) {
    console.error('Erro ao migrar relíquias legadas para slots:', e);
  }
};

const DEFAULT_RELICS: Record<string, Relic> = {
  luz_alma: {
    id: 'luz_alma',
    name: 'Luz da Alma Partida',
    level: 0,
    maxLevel: 5,
    description: 'Aumenta o Dano Geral em +3% por nível. Lvl 5: +10% Dano Crítico.',
    bonusValuePerLevel: 0.03,
  },
  moeda_ciclo: {
    id: 'moeda_ciclo',
    name: 'Moeda do Ciclo Eterno',
    level: 0,
    maxLevel: 5,
    description: 'Aumenta o Ouro Ganho em +4% por nível. Lvl 5: +5% chance de ouro em dobro.',
    bonusValuePerLevel: 0.04,
  },
  simbolo_aprendizado: {
    id: 'simbolo_aprendizado',
    name: 'Símbolo do Aprendizado',
    level: 0,
    maxLevel: 5,
    description: 'Aumenta a Chance de Drop de equipamentos em +3% por nível. Lvl 5: +10% de chance de item Raro ou superior.',
    bonusValuePerLevel: 0.03,
  },
  gema_vontade: {
    id: 'gema_vontade',
    name: 'Gema da Vontade',
    level: 0,
    maxLevel: 5,
    description: 'Concede +4 de Força por nível. Lvl 5: +10% de penetração de armadura.',
    bonusValuePerLevel: 4,
  },
  nucleo_pensamento: {
    id: 'nucleo_pensamento',
    name: 'Núcleo do Pensamento',
    level: 0,
    maxLevel: 5,
    description: 'Concede +4 de Magia por nível. Lvl 5: +15% de Regeneração de Mana.',
    bonusValuePerLevel: 4,
  },
  foco_precisao: {
    id: 'foco_precisao',
    name: 'Foco da Precisão',
    level: 0,
    maxLevel: 5,
    description: 'Concede +4 de Destreza por nível. Lvl 5: +5% de Velocidade de Ataque.',
    bonusValuePerLevel: 4,
  },
  brasao_devoacao: {
    id: 'brasao_devoacao',
    name: 'Brasão da Devoção',
    level: 0,
    maxLevel: 5,
    description: 'Concede +6 de Constituição por nível. Lvl 5: +2% de HP máximo como barreira no início do combate.',
    bonusValuePerLevel: 6,
  },
  olho_sobrevivencia: {
    id: 'olho_sobrevivencia',
    name: 'Olho da Sobrevivência',
    level: 0,
    maxLevel: 5,
    description: 'Concede +4 de Sorte por nível. Lvl 5: Reduz o tempo de recarga da habilidade de Cura em 1.5s.',
    bonusValuePerLevel: 4,
  },
};

const saveRelicsToStorage = (fragments: number, relics: Record<string, Relic>) => {
  try {
    localStorage.setItem(
      getRelicStoreKey(getActiveSlot()),
      JSON.stringify({ unstableSoulFragments: fragments, relics })
    );
  } catch (e) {
    console.error('Erro ao salvar relíquias no localStorage:', e);
  }
};

const cloneDefaultRelics = (): Record<string, Relic> => {
  const clone: Record<string, Relic> = {};
  for (const key in DEFAULT_RELICS) {
    clone[key] = { ...DEFAULT_RELICS[key] };
  }
  return clone;
};

const loadRelicsFromStorage = (slot: number | null): { unstableSoulFragments: number; relics: Record<string, Relic> } => {
  migrateLegacyRelicsIfNeeded(slot);
  try {
    const saved = localStorage.getItem(getRelicStoreKey(slot));
    if (saved) {
      const parsed = JSON.parse(saved);
      const mergedRelics = cloneDefaultRelics();
      if (parsed.relics) {
        Object.keys(parsed.relics).forEach((key) => {
          if (mergedRelics[key]) {
            const rawLevel = parsed.relics[key].level || 0;
            mergedRelics[key].level = Math.min(mergedRelics[key].maxLevel, Math.max(0, rawLevel));
          }
        });
      }
      return {
        unstableSoulFragments: parsed.unstableSoulFragments || 0,
        relics: mergedRelics,
      };
    }
  } catch (e) {
    console.error('Erro ao carregar relíquias do localStorage:', e);
  }
  return {
    unstableSoulFragments: 0,
    relics: cloneDefaultRelics(),
  };
};

const initialData = loadRelicsFromStorage(getActiveSlot());

export const useRelicStore = create<RelicStoreState>((set, get) => ({
  unstableSoulFragments: initialData.unstableSoulFragments,
  relics: initialData.relics,

  addFragments: (amount) => {
    set((state) => {
      const nextFragments = state.unstableSoulFragments + amount;
      saveRelicsToStorage(nextFragments, state.relics);
      return { unstableSoulFragments: nextFragments };
    });
  },

  spendFragments: (amount) => {
    let success = false;
    set((state) => {
      if (state.unstableSoulFragments < amount) return state;
      success = true;
      const nextFragments = state.unstableSoulFragments - amount;
      saveRelicsToStorage(nextFragments, state.relics);
      return { unstableSoulFragments: nextFragments };
    });
    return success;
  },

  forgeRelic: () => {
    let result: { success: boolean; message: string; relicId?: string } = { success: false, message: '' };

    set((state) => {
      if (state.unstableSoulFragments < 10) {
        result = { success: false, message: 'Fragmentos de Alma Instável insuficientes! Requer 10 fragmentos.' };
        return state;
      }

      // Filtra relíquias que ainda podem ser aprimoradas
      const upgradeable = Object.values(state.relics).filter((r) => r.level < r.maxLevel);

      if (upgradeable.length === 0) {
        result = { success: false, message: 'Todas as relíquias já estão no nível máximo!' };
        return state;
      }

      // Seleciona uma relíquia aleatória elegível
      const selected = upgradeable[Math.floor(Math.random() * upgradeable.length)];
      const nextLevel = selected.level + 1;
      const isNew = selected.level === 0;

      const nextRelics = {
        ...state.relics,
        [selected.id]: {
          ...selected,
          level: nextLevel,
        },
      };

      const nextFragments = state.unstableSoulFragments - 10;
      saveRelicsToStorage(nextFragments, nextRelics);

      const actionText = isNew ? 'desbloqueada' : 'aprimorada';
      const msg = `✨ Relíquia [${selected.name}] foi ${actionText} para o Nível ${nextLevel}!`;
      
      bridge.emit(GameEvent.LOG_EMITTED, { message: msg });

      result = { success: true, message: msg, relicId: selected.id };

      return {
        unstableSoulFragments: nextFragments,
        relics: nextRelics,
      };
    });

    return result;
  },

  getRelicEffectBonus: (relicId) => {
    const relic = get().relics[relicId];
    if (!relic) return 0;
    return relic.level * relic.bonusValuePerLevel;
  },

  resetRelics: () => {
    const freshRelics = cloneDefaultRelics();
    saveRelicsToStorage(0, freshRelics);
    set({ unstableSoulFragments: 0, relics: freshRelics });
  },

  reloadForActiveSlot: () => {
    const reloaded = loadRelicsFromStorage(getActiveSlot());
    set({ unstableSoulFragments: reloaded.unstableSoulFragments, relics: reloaded.relics });
  },
}));
