import { create } from 'zustand';
import { bridge } from '../bridge/GameBridge';
import { GameEvent, BaseStats } from '../core/types';
import { useGameStore } from './useGameStore';
import { useRelicStore } from './useRelicStore';
import { StatEngine } from '../core/StatEngine';

// v8.0.0 "O Espelho Faminto": Ramificação de Maldições — variante roguelike da Torre Infinita.
// A cada andar concluído nessa ramificação, uma nova maldição se acumula: +20% em 1 atributo e
// -10% em 2 outros atributos distintos (o dobro de alvos de penalidade equilibra o ganho e a perda,
// deixando o resultado final bem aleatório) — aplicados apenas enquanto a subida amaldiçoada está
// em andamento (nunca altera o equipamento real do jogador). Em troca, os prêmios de ouro/fragmentos
// ganham +50%.
export interface TowerCurse {
  buffStat: keyof BaseStats;
  debuffStats: [keyof BaseStats, keyof BaseStats];
  floor: number;
}

const CURSE_ATTRS: (keyof BaseStats)[] = ['strength', 'magic', 'dexterity', 'constitution', 'luck'];

export const CURSE_STAT_LABELS: Record<string, string> = {
  strength: 'Força',
  magic: 'Magia',
  dexterity: 'Destreza',
  constitution: 'Constituição',
  luck: 'Sorte',
};

export const CURSE_DEBUFF_PCT = 0.10;
export const CURSE_BUFF_PCT = 0.20;
export const CURSE_BRANCH_REWARD_MULT = 1.5;

// Sorteia 1 atributo para receber o bônus e 2 outros (distintos entre si e do bônus) para a
// penalidade, usando StatEngine.pickRandomElements (Fisher-Yates parcial, sem o viés conhecido de
// `array.sort(() => 0.5 - Math.random())`).
const rollCurse = (floor: number): TowerCurse => {
  const [buffStat] = StatEngine.pickRandomElements(CURSE_ATTRS, 1);
  const remaining = CURSE_ATTRS.filter((attr) => attr !== buffStat);
  const [debuffA, debuffB] = StatEngine.pickRandomElements(remaining, 2);
  return { buffStat, debuffStats: [debuffA, debuffB], floor };
};

// Aplica a pilha de maldições ativas sobre um conjunto de stats já calculados (ex: o retorno de
// `StatEngine.calculateFinalStats`) — compartilhada entre `CombatFSM` (aplicação real em combate)
// e `TowerPanel` (prévia dos valores reais dos atributos afetados na UI), para as duas fontes nunca divergirem.
export const applyCursesToStats = (stats: BaseStats, curses: TowerCurse[]): BaseStats => {
  const result = { ...stats };
  curses.forEach((curse) => {
    result[curse.buffStat] = (result[curse.buffStat] || 0) * (1 + CURSE_BUFF_PCT);
    curse.debuffStats.forEach((stat) => {
      result[stat] = (result[stat] || 0) * (1 - CURSE_DEBUFF_PCT);
    });
  });
  return result;
};

// Pools de títulos-marco, um por ramificação da Torre. Nomes usados tanto para o desbloqueio em
// `advanceTowerFloor` quanto para a galeria de títulos exibida em `TowerPanel.tsx` (`*_TITLES_CONFIG`
// espelha estes nomes — mesmo padrão de duplicação leve que já existia antes desta mudança).
export const NORMAL_TITLE_MILESTONES: Record<number, string> = {
  5: 'Iniciante da Torre',
  10: 'Desbravador da Torre',
  20: 'Conquistador das Alturas',
  30: 'Guardião da Torre',
  50: 'Mestre do Infinito',
  100: 'Lenda Eterna',
};
export const CURSE_TITLE_MILESTONES: Record<number, string> = {
  5: 'Tocado pela Sombra',
  10: 'Andarilho do Espelho Faminto',
  20: 'Herdeiro da Maldição',
  30: 'Senhor das Cicatrizes',
  50: 'Devorador de Bênçãos',
  100: 'Avatar do Vazio Eterno',
};

export interface TowerStoreState {
  towerActive: boolean;
  currentFloor: number;
  weeklyHighestFloor: number;
  historicalHighestFloor: number;
  unlockedTitles: string[];
  selectedTitle: string;
  // v8.0.0 "O Espelho Faminto": recordes/títulos da Ramificação de Maldições, independentes dos da Torre Normal acima
  curseWeeklyHighestFloor: number;
  curseHistoricalHighestFloor: number;
  curseUnlockedTitles: string[];
  curseSelectedTitle: string;
  weeklySeed: number;
  lastWeeklyResetTime: number;
  savedStageBeforeTower: number;
  savedEnemiesDefeatedBeforeTower: number;
  activeKeyType: 'normal' | 'evolved';
  towerBranch: 'normal' | 'curse';
  activeCurses: TowerCurse[];

  // Ações
  startTowerAttempt: (keyType?: 'normal' | 'evolved', branch?: 'normal' | 'curse') => void;
  advanceTowerFloor: () => void;
  exitTower: (success: boolean) => void;
  checkWeeklyReset: () => void;
  selectTitle: (title: string, branch: 'normal' | 'curse') => void;
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
      curseWeeklyHighestFloor: state.curseWeeklyHighestFloor,
      curseHistoricalHighestFloor: state.curseHistoricalHighestFloor,
      curseUnlockedTitles: state.curseUnlockedTitles,
      curseSelectedTitle: state.curseSelectedTitle,
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
        // v8.0.0: sem save legado para preservar, então o default fica limpo (sem título de graça)
        curseWeeklyHighestFloor: parsed.curseWeeklyHighestFloor || 0,
        curseHistoricalHighestFloor: parsed.curseHistoricalHighestFloor || 0,
        curseUnlockedTitles: parsed.curseUnlockedTitles || [],
        curseSelectedTitle: parsed.curseSelectedTitle || '',
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
    curseWeeklyHighestFloor: 0,
    curseHistoricalHighestFloor: 0,
    curseUnlockedTitles: [],
    curseSelectedTitle: '',
    weeklySeed: 0,
    lastWeeklyResetTime: 0,
  };
};

const initialData = loadTowerFromStorage();

export const useTowerStore = create<TowerStoreState>((set, get) => {
  // Centraliza a persistência: sempre lê o estado atual inteiro via `get()`, então nenhuma
  // action precisa se lembrar manualmente de repassar o par de campos do branch inativo.
  const persistTowerState = () => {
    const s = get();
    saveTowerToStorage({
      weeklyHighestFloor: s.weeklyHighestFloor,
      historicalHighestFloor: s.historicalHighestFloor,
      unlockedTitles: s.unlockedTitles,
      selectedTitle: s.selectedTitle,
      curseWeeklyHighestFloor: s.curseWeeklyHighestFloor,
      curseHistoricalHighestFloor: s.curseHistoricalHighestFloor,
      curseUnlockedTitles: s.curseUnlockedTitles,
      curseSelectedTitle: s.curseSelectedTitle,
      weeklySeed: s.weeklySeed,
      lastWeeklyResetTime: s.lastWeeklyResetTime,
    });
  };

  return {
  towerActive: false,
  currentFloor: 1,
  weeklyHighestFloor: initialData.weeklyHighestFloor || 0,
  historicalHighestFloor: initialData.historicalHighestFloor || 0,
  unlockedTitles: initialData.unlockedTitles || ['Iniciante da Torre'],
  selectedTitle: initialData.selectedTitle || '',
  curseWeeklyHighestFloor: initialData.curseWeeklyHighestFloor || 0,
  curseHistoricalHighestFloor: initialData.curseHistoricalHighestFloor || 0,
  curseUnlockedTitles: initialData.curseUnlockedTitles || [],
  curseSelectedTitle: initialData.curseSelectedTitle || '',
  weeklySeed: initialData.weeklySeed || 0,
  lastWeeklyResetTime: initialData.lastWeeklyResetTime || 0,
  savedStageBeforeTower: 1,
  savedEnemiesDefeatedBeforeTower: 0,
  activeKeyType: 'normal',
  towerBranch: 'normal',
  activeCurses: [],

  startTowerAttempt: (keyType: 'normal' | 'evolved' = 'normal', branch: 'normal' | 'curse' = 'normal') => {
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
      towerBranch: branch,
      activeCurses: [],
    });

    bridge.emit(GameEvent.LOG_EMITTED, {
      message: keyType === 'evolved'
        ? '🗝️ Você utilizou uma [Chave da Torre Evoluída] e entrou na Torre Infinita! Ouro e XP triplicados nesta subida. Iniciando a partir do Andar 1.'
        : '🔑 Você utilizou uma [Chave da Torre] e entrou na Torre Infinita! Iniciando subida a partir do Andar 1.'
    });
    if (branch === 'curse') {
      bridge.emit(GameEvent.LOG_EMITTED, {
        message: '🌀 Ramificação de Maldições ativada! A cada andar, uma nova maldição se acumula (+20% em 1 atributo, -10% em 2 outros) — em troca, +50% de Ouro e Fragmentos de Forja.'
      });
    }

    // Avisa que o combate precisa recomeçar no modo torre
    bridge.emit(GameEvent.START_COMBAT, { mode: 'tower' });
  },

  advanceTowerFloor: () => {
    const floorCompleted = get().currentFloor;
    const nextFloor = floorCompleted + 1;

    // v8.0.0 "O Espelho Faminto": recordes/títulos são independentes por ramificação — todo o
    // restante da função lê/escreve através destas chaves em vez dos campos fixos.
    const isCurse = get().towerBranch === 'curse';
    const weeklyKey = isCurse ? 'curseWeeklyHighestFloor' : 'weeklyHighestFloor';
    const historicalKey = isCurse ? 'curseHistoricalHighestFloor' : 'historicalHighestFloor';
    const titlesKey = isCurse ? 'curseUnlockedTitles' : 'unlockedTitles';
    const milestones = isCurse ? CURSE_TITLE_MILESTONES : NORMAL_TITLE_MILESTONES;

    // Se o andar completado é maior do que o recorde da semana, atualiza os recordes
    let nextWeeklyHighest = get()[weeklyKey];
    let nextHistoricalHighest = get()[historicalKey];
    let titleUnlockedMsg = '';
    const newTitles = [...get()[titlesKey]];

    // Se completou um andar inédito na semana atual, concede recompensas
    if (floorCompleted > get()[weeklyKey]) {
      nextWeeklyHighest = floorCompleted;
      
      // Recompensa básica em ouro por andar completado (inédito na semana)
      const baseGold = 100 * floorCompleted * (get().activeKeyType === 'evolved' ? 3 : 1) * (get().towerBranch === 'curse' ? CURSE_BRANCH_REWARD_MULT : 1);
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

    // Recompensa de Fragmentos de Forja: ganha sempre ao avançar andares (quadruplicado; 3x adicional com a Chave da Torre Evoluída; +50% na Ramificação de Maldições)
    const forgeFragmentsReward = Math.floor(Math.max(1, Math.floor(floorCompleted * 0.5)) * 4 * (get().activeKeyType === 'evolved' ? 3 : 1) * (get().towerBranch === 'curse' ? CURSE_BRANCH_REWARD_MULT : 1));
    useGameStore.getState().addForgeFragments(forgeFragmentsReward);
    bridge.emit(GameEvent.LOG_EMITTED, {
      message: `🔩 Recompensa de Conclusão: +${forgeFragmentsReward} Fragmento(s) de Forja!`
    });

    if (floorCompleted > get()[historicalKey]) {
      nextHistoricalHighest = floorCompleted;

      // Lógica de desbloqueio de títulos históricos (pool normal ou amaldiçoado, conforme a ramificação)
      const milestoneTitle = milestones[floorCompleted];
      if (milestoneTitle && !newTitles.includes(milestoneTitle)) {
        newTitles.push(milestoneTitle);
        titleUnlockedMsg = `🏆 TÍTULO DESBLOQUEADO: "${milestoneTitle}"!`;
      }
    }

    // Ramificação de Maldições: a cada andar concluído, acumula mais uma maldição sobre o herói
    let nextCurses = get().activeCurses;
    if (get().towerBranch === 'curse') {
      const newCurse = rollCurse(nextFloor);
      nextCurses = [...get().activeCurses, newCurse];
      const debuffLabels = newCurse.debuffStats.map((s) => CURSE_STAT_LABELS[s] || s).join(' e ');
      bridge.emit(GameEvent.LOG_EMITTED, {
        message: `🌀 Maldição do Andar ${nextFloor}: +${Math.round(CURSE_BUFF_PCT * 100)}% de ${CURSE_STAT_LABELS[newCurse.buffStat] || newCurse.buffStat} / -${Math.round(CURSE_DEBUFF_PCT * 100)}% de ${debuffLabels}.`
      });
    }

    set({
      currentFloor: nextFloor,
      [weeklyKey]: nextWeeklyHighest,
      [historicalKey]: nextHistoricalHighest,
      [titlesKey]: newTitles,
      activeCurses: nextCurses,
    } as Partial<TowerStoreState>);

    persistTowerState();

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
      towerBranch: 'normal',
      activeCurses: [],
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
      // Realiza o reset semanal das conquistas semanais — relógio global, vale para as duas
      // ramificações ao mesmo tempo (não faz sentido semântico ter dois resets semanais diferentes).
      set({
        weeklyHighestFloor: 0,
        curseWeeklyHighestFloor: 0,
        weeklySeed: currentSeed,
        lastWeeklyResetTime: Date.now(),
      });

      persistTowerState();

      bridge.emit(GameEvent.LOG_EMITTED, {
        message: '🔄 Uma nova semana se iniciou! O progresso da Torre e a Seed Semanal foram resetados.'
      });
    }
  },

  selectTitle: (title: string, branch: 'normal' | 'curse') => {
    const titlesKey = branch === 'curse' ? 'curseUnlockedTitles' : 'unlockedTitles';
    const selectedKey = branch === 'curse' ? 'curseSelectedTitle' : 'selectedTitle';
    if (get()[titlesKey].includes(title) || title === '') {
      set({ [selectedKey]: title } as Partial<TowerStoreState>);
      persistTowerState();
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
      curseWeeklyHighestFloor: 0,
      curseHistoricalHighestFloor: 0,
      curseUnlockedTitles: [],
      curseSelectedTitle: '',
      weeklySeed: getWeeklySeed(),
      lastWeeklyResetTime: Date.now(),
    });
    persistTowerState();
  }
  };
});
