import { create } from 'zustand';
import { bridge } from '../bridge/GameBridge';
import { GameEvent } from '../core/types';
import { useGameStore } from './useGameStore';
import { useRelicStore } from './useRelicStore';

export interface TowerStoreState {
  towerActive: boolean;
  currentFloor: number;
  weeklyHighestFloor: number;
  historicalHighestFloor: number;
  unlockedTitles: string[];
  selectedTitle: string;
  weeklySeed: number;
  lastWeeklyResetTime: number;
  savedStageBeforeTower: number;
  savedEnemiesDefeatedBeforeTower: number;
  activeKeyType: 'normal' | 'evolved';

  // Ações
  startTowerAttempt: (keyType?: 'normal' | 'evolved') => void;
  advanceTowerFloor: () => void;
  exitTower: (success: boolean) => void;
  checkWeeklyReset: () => void;
  selectTitle: (title: string) => void;
  resetTowerProgress: () => void;
}

// Gera a seed semanal baseada no ano e número da semana
export const getWeeklySeed = (): number => {
  const now = new Date();
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((now.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
  return now.getFullYear() * 100 + weekNumber;
};

const saveTowerToStorage = (state: Partial<TowerStoreState>) => {
  try {
    const dataToSave = {
      weeklyHighestFloor: state.weeklyHighestFloor,
      historicalHighestFloor: state.historicalHighestFloor,
      unlockedTitles: state.unlockedTitles,
      selectedTitle: state.selectedTitle,
      weeklySeed: state.weeklySeed,
      lastWeeklyResetTime: state.lastWeeklyResetTime,
    };
    localStorage.setItem('medieval_idle_tower', JSON.stringify(dataToSave));
  } catch (e) {
    console.error('Erro ao salvar dados da Torre no localStorage:', e);
  }
};

const loadTowerFromStorage = (): Partial<TowerStoreState> => {
  try {
    const saved = localStorage.getItem('medieval_idle_tower');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        weeklyHighestFloor: parsed.weeklyHighestFloor || 0,
        historicalHighestFloor: parsed.historicalHighestFloor || 0,
        unlockedTitles: parsed.unlockedTitles || ['Iniciante da Torre'],
        selectedTitle: parsed.selectedTitle || '',
        weeklySeed: parsed.weeklySeed || 0,
        lastWeeklyResetTime: parsed.lastWeeklyResetTime || 0,
      };
    }
  } catch (e) {
    console.error('Erro ao carregar dados da Torre do localStorage:', e);
  }
  return {
    weeklyHighestFloor: 0,
    historicalHighestFloor: 0,
    unlockedTitles: ['Iniciante da Torre'],
    selectedTitle: '',
    weeklySeed: 0,
    lastWeeklyResetTime: 0,
  };
};

const initialData = loadTowerFromStorage();

export const useTowerStore = create<TowerStoreState>((set, get) => ({
  towerActive: false,
  currentFloor: 1,
  weeklyHighestFloor: initialData.weeklyHighestFloor || 0,
  historicalHighestFloor: initialData.historicalHighestFloor || 0,
  unlockedTitles: initialData.unlockedTitles || ['Iniciante da Torre'],
  selectedTitle: initialData.selectedTitle || '',
  weeklySeed: initialData.weeklySeed || 0,
  lastWeeklyResetTime: initialData.lastWeeklyResetTime || 0,
  savedStageBeforeTower: 1,
  savedEnemiesDefeatedBeforeTower: 0,
  activeKeyType: 'normal',

  startTowerAttempt: (keyType: 'normal' | 'evolved' = 'normal') => {
    // Primeiro, verifica se há necessidade de reset semanal
    get().checkWeeklyReset();

    const char = useGameStore.getState().character;
    const consumableType = keyType === 'evolved' ? 'tower_key_evolved' : 'tower_key';

    // Verifica se possui a Chave correspondente
    const keyIndex = char.inventory.findIndex(i => i.consumableType === consumableType);
    if (keyIndex === -1) {
      bridge.emit(GameEvent.LOG_EMITTED, {
        message: keyType === 'evolved' ? '❌ Você precisa de uma Chave da Torre Evoluída para entrar!' : '❌ Você precisa de uma Chave da Torre para entrar!'
      });
      return;
    }

    // Consome a chave da torre
    const keyItem = char.inventory[keyIndex];
    useGameStore.setState((state) => {
      const updatedInv = state.character.inventory.filter(i => i.id !== keyItem.id);
      const updatedChar = {
        ...state.character,
        inventory: updatedInv
      };
      
      // Salva no localStorage
      try {
        localStorage.setItem('medieval_idle_save', JSON.stringify(updatedChar));
        const currentSlot = localStorage.getItem('medieval_idle_current_slot');
        if (currentSlot) {
          localStorage.setItem(`medieval_idle_save_slot_${currentSlot}`, JSON.stringify(updatedChar));
        }
      } catch (e) {}
      
      return { character: updatedChar };
    });

    // Salva o estágio e progresso do combate atual da campanha
    const savedStage = char.currentStage;
    const savedEnemies = char.enemiesDefeatedInStage;

    set({
      towerActive: true,
      currentFloor: 1,
      savedStageBeforeTower: savedStage,
      savedEnemiesDefeatedBeforeTower: savedEnemies,
      activeKeyType: keyType,
    });

    bridge.emit(GameEvent.LOG_EMITTED, {
      message: keyType === 'evolved'
        ? '🗝️ Você utilizou uma [Chave da Torre Evoluída] e entrou na Torre Infinita! Ouro e XP triplicados nesta subida. Iniciando a partir do Andar 1.'
        : '🔑 Você utilizou uma [Chave da Torre] e entrou na Torre Infinita! Iniciando subida a partir do Andar 1.'
    });

    // Avisa que o combate precisa recomeçar no modo torre
    bridge.emit(GameEvent.START_COMBAT, { mode: 'tower' });
  },

  advanceTowerFloor: () => {
    const floorCompleted = get().currentFloor;
    const nextFloor = floorCompleted + 1;
    
    // Se o andar completado é maior do que o recorde da semana, atualiza os recordes
    let nextWeeklyHighest = get().weeklyHighestFloor;
    let nextHistoricalHighest = get().historicalHighestFloor;
    let titleUnlockedMsg = '';
    const newTitles = [...get().unlockedTitles];

    // Se completou um andar inédito na semana atual, concede recompensas
    if (floorCompleted > get().weeklyHighestFloor) {
      nextWeeklyHighest = floorCompleted;
      
      // Recompensa básica em ouro por andar completado (inédito na semana)
      const baseGold = 100 * floorCompleted * (get().activeKeyType === 'evolved' ? 3 : 1);
      const coinRelicLvl = useRelicStore.getState().relics['moeda_ciclo']?.level || 0;
      const relicGoldBonus = useRelicStore.getState().getRelicEffectBonus('moeda_ciclo');
      let goldReward = Math.floor(baseGold * (1 + relicGoldBonus));
      
      // Capstone da Moeda do Ciclo Eterno (Lvl 5): 5% de chance de dobrar recompensa (12.5% se Superaquecida no Laboratório de Relíquias)
      const isCoinOverheated = (useGameStore.getState().character.citadel?.relicLab?.overheatedRelicIds || []).includes('moeda_ciclo');
      if (coinRelicLvl === 5 && Math.random() < (isCoinOverheated ? 0.125 : 0.05)) {
        goldReward *= 2;
        bridge.emit(GameEvent.LOG_EMITTED, { message: '🪙 Moeda do Ciclo Eterno duplicou a recompensa da Torre!' });
      }
      
      useGameStore.getState().addGold(goldReward);
      bridge.emit(GameEvent.LOG_EMITTED, {
        message: `🎁 Recompensa do Andar ${floorCompleted}: +${goldReward} Ouro!`
      });

      // A cada 5 andares, concede Fragmento de Alma Instável garantido!
      if (floorCompleted % 5 === 0) {
        useRelicStore.getState().addFragments(1);
        bridge.emit(GameEvent.LOG_EMITTED, {
          message: `✨ Bônus de Elite da Torre: +1 Fragmento de Alma Instável!`
        });
      }
    }

    // Recompensa de Fragmentos de Forja: ganha sempre ao avançar andares (quadruplicado; 3x adicional com a Chave da Torre Evoluída)
    const forgeFragmentsReward = Math.max(1, Math.floor(floorCompleted * 0.5)) * 4 * (get().activeKeyType === 'evolved' ? 3 : 1);
    useGameStore.getState().addForgeFragments(forgeFragmentsReward);
    bridge.emit(GameEvent.LOG_EMITTED, {
      message: `🔩 Recompensa de Conclusão: +${forgeFragmentsReward} Fragmento(s) de Forja!`
    });

    if (floorCompleted > get().historicalHighestFloor) {
      nextHistoricalHighest = floorCompleted;
      
      // Lógica de desbloqueio de títulos históricos
      const titleMilestones: Record<number, string> = {
        5: 'Iniciante da Torre',
        10: 'Desbravador da Torre',
        20: 'Conquistador das Alturas',
        30: 'Guardião da Torre',
        50: 'Mestre do Infinito',
        100: 'Lenda Eterna'
      };

      const milestoneTitle = titleMilestones[floorCompleted];
      if (milestoneTitle && !newTitles.includes(milestoneTitle)) {
        newTitles.push(milestoneTitle);
        titleUnlockedMsg = `🏆 TÍTULO DESBLOQUEADO: "${milestoneTitle}"!`;
      }
    }

    set({
      currentFloor: nextFloor,
      weeklyHighestFloor: nextWeeklyHighest,
      historicalHighestFloor: nextHistoricalHighest,
      unlockedTitles: newTitles,
    });

    saveTowerToStorage({
      weeklyHighestFloor: nextWeeklyHighest,
      historicalHighestFloor: nextHistoricalHighest,
      unlockedTitles: newTitles,
      selectedTitle: get().selectedTitle,
      weeklySeed: get().weeklySeed,
      lastWeeklyResetTime: get().lastWeeklyResetTime,
    });

    if (titleUnlockedMsg) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: titleUnlockedMsg });
    }

    bridge.emit(GameEvent.LOG_EMITTED, {
      message: `⚔️ Andar ${floorCompleted} Concluído! Avançando para o Andar ${nextFloor}.`
    });
  },

  exitTower: (success: boolean) => {
    const savedStage = get().savedStageBeforeTower;
    const savedEnemies = get().savedEnemiesDefeatedBeforeTower;

    set({
      towerActive: false,
      activeKeyType: 'normal',
    });

    // Restaura o progresso do combate da campanha
    useGameStore.setState((state) => ({
      character: {
        ...state.character,
        currentStage: savedStage,
        enemiesDefeatedInStage: savedEnemies,
      }
    }));

    if (success) {
      bridge.emit(GameEvent.LOG_EMITTED, {
        message: '🚪 Você saiu da Torre Infinita e retornou à sua jornada da campanha.'
      });
    } else {
      bridge.emit(GameEvent.LOG_EMITTED, {
        message: '💀 Você foi derrotado na Torre Infinita e retornou à sua jornada da campanha.'
      });
    }

    // Força reiniciar o combate na campanha
    bridge.emit(GameEvent.START_COMBAT, { mode: 'campaign' });
  },

  checkWeeklyReset: () => {
    const currentSeed = getWeeklySeed();
    const storedSeed = get().weeklySeed;

    if (currentSeed !== storedSeed) {
      // Realiza o reset semanal das conquistas semanais
      set({
        weeklyHighestFloor: 0,
        weeklySeed: currentSeed,
        lastWeeklyResetTime: Date.now(),
      });

      saveTowerToStorage({
        weeklyHighestFloor: 0,
        historicalHighestFloor: get().historicalHighestFloor,
        unlockedTitles: get().unlockedTitles,
        selectedTitle: get().selectedTitle,
        weeklySeed: currentSeed,
        lastWeeklyResetTime: Date.now(),
      });

      bridge.emit(GameEvent.LOG_EMITTED, {
        message: '🔄 Uma nova semana se iniciou! O progresso da Torre e a Seed Semanal foram resetados.'
      });
    }
  },

  selectTitle: (title: string) => {
    if (get().unlockedTitles.includes(title) || title === '') {
      set({ selectedTitle: title });
      saveTowerToStorage({
        weeklyHighestFloor: get().weeklyHighestFloor,
        historicalHighestFloor: get().historicalHighestFloor,
        unlockedTitles: get().unlockedTitles,
        selectedTitle: title,
        weeklySeed: get().weeklySeed,
        lastWeeklyResetTime: get().lastWeeklyResetTime,
      });
      bridge.emit(GameEvent.LOG_EMITTED, {
        message: title !== '' ? `🏷️ Novo título equipado: "${title}"` : '🏷️ Título desequipado.'
      });
    }
  },

  resetTowerProgress: () => {
    set({
      weeklyHighestFloor: 0,
      historicalHighestFloor: 0,
      unlockedTitles: ['Iniciante da Torre'],
      selectedTitle: '',
      weeklySeed: getWeeklySeed(),
      lastWeeklyResetTime: Date.now(),
    });
    saveTowerToStorage({
      weeklyHighestFloor: 0,
      historicalHighestFloor: 0,
      unlockedTitles: ['Iniciante da Torre'],
      selectedTitle: '',
      weeklySeed: getWeeklySeed(),
      lastWeeklyResetTime: Date.now(),
    });
  }
}));
