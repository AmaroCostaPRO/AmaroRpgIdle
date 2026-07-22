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

// v9.0.0 "O Que Espera no Pandemônio": Provações do Vácuo — 3ª ramificação da Torre, reaproveitando
// a mesma curva de escala sem teto (HP/dano em CombatFSM já chaveiam só por `currentFloor`, sem
// diferenciar ramificação — funciona automaticamente). Só registra o melhor andar pessoal (sem
// títulos, sem leaderboard). Concede Pontos de Transcendência (PT) — a moeda mais escassa do jogo,
// hoje só obtida via reset quase total em `performTranscendence` — mas com um teto semanal BAIXO e
// FIXO: o valor concedido escala com o andar batido na semana (a cada
// VOID_TRIALS_PT_FLOOR_INTERVAL andares = +1 PT), até o teto de VOID_TRIALS_WEEKLY_PT_CAP por
// semana. Uma vez batido o teto, andares além dele continuam contando para o recorde histórico mas
// não geram mais PT até o próximo reset semanal — nunca uma alternativa de farm ao hard-reset.
export const VOID_TRIALS_PT_FLOOR_INTERVAL = 40;
export const VOID_TRIALS_WEEKLY_PT_CAP = 3;

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
  // Título honorífico atualmente equipado — único e compartilhado entre a Torre Normal e a
  // Ramificação de Maldições (só um título fica visível acima do personagem por vez, então não
  // faz sentido ter um campo por ramificação; os pools de desbloqueio abaixo continuam separados).
  equippedTitle: string;
  // v8.0.0 "O Espelho Faminto": recordes/títulos da Ramificação de Maldições, independentes dos da Torre Normal acima
  curseWeeklyHighestFloor: number;
  curseHistoricalHighestFloor: number;
  curseUnlockedTitles: string[];
  // v9.0.0: recorde pessoal (sem reset semanal, sem títulos) e contador de PT já concedido na
  // semana atual das Provações do Vácuo — independentes dos campos normal/curse acima.
  voidTrialsHistoricalHighestFloor: number;
  voidTrialsWeeklyHighestFloor: number;
  voidTrialsPtGrantedThisWeek: number;
  weeklySeed: number;
  lastWeeklyResetTime: number;
  savedStageBeforeTower: number;
  savedEnemiesDefeatedBeforeTower: number;
  savedLevelBeforeTower: number;
  activeKeyType: 'normal' | 'evolved';
  towerBranch: 'normal' | 'curse' | 'voidTrials';
  activeCurses: TowerCurse[];

  // Ações
  startTowerAttempt: (keyType?: 'normal' | 'evolved', branch?: 'normal' | 'curse' | 'voidTrials') => void;
  advanceTowerFloor: () => void;
  exitTower: (success: boolean) => void;
  checkWeeklyReset: () => void;
  selectTitle: (title: string) => void;
  // v10.4.0 "O Leviatã do Ciclo": concessão genérica de título fora da progressão da Torre (usada
  // pelos marcos de profundidade das Profundezas e pela 1ª morte do Leviatã). Idempotente — não
  // duplica se já desbloqueado.
  unlockTitle: (title: string) => void;
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
      equippedTitle: state.equippedTitle,
      curseWeeklyHighestFloor: state.curseWeeklyHighestFloor,
      curseHistoricalHighestFloor: state.curseHistoricalHighestFloor,
      curseUnlockedTitles: state.curseUnlockedTitles,
      voidTrialsHistoricalHighestFloor: state.voidTrialsHistoricalHighestFloor,
      voidTrialsWeeklyHighestFloor: state.voidTrialsWeeklyHighestFloor,
      voidTrialsPtGrantedThisWeek: state.voidTrialsPtGrantedThisWeek,
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
        // Migração: saves antigos tinham `selectedTitle`/`curseSelectedTitle` separados — preserva
        // qualquer um dos dois que estivesse equipado (só um título pode estar visível por vez).
        equippedTitle: parsed.equippedTitle || parsed.selectedTitle || parsed.curseSelectedTitle || '',
        curseWeeklyHighestFloor: parsed.curseWeeklyHighestFloor || 0,
        curseHistoricalHighestFloor: parsed.curseHistoricalHighestFloor || 0,
        curseUnlockedTitles: parsed.curseUnlockedTitles || [],
        voidTrialsHistoricalHighestFloor: parsed.voidTrialsHistoricalHighestFloor || 0,
        voidTrialsWeeklyHighestFloor: parsed.voidTrialsWeeklyHighestFloor || 0,
        voidTrialsPtGrantedThisWeek: parsed.voidTrialsPtGrantedThisWeek || 0,
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
    equippedTitle: '',
    curseWeeklyHighestFloor: 0,
    curseHistoricalHighestFloor: 0,
    curseUnlockedTitles: [],
    voidTrialsHistoricalHighestFloor: 0,
    voidTrialsWeeklyHighestFloor: 0,
    voidTrialsPtGrantedThisWeek: 0,
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
      equippedTitle: s.equippedTitle,
      curseWeeklyHighestFloor: s.curseWeeklyHighestFloor,
      curseHistoricalHighestFloor: s.curseHistoricalHighestFloor,
      curseUnlockedTitles: s.curseUnlockedTitles,
      voidTrialsHistoricalHighestFloor: s.voidTrialsHistoricalHighestFloor,
      voidTrialsWeeklyHighestFloor: s.voidTrialsWeeklyHighestFloor,
      voidTrialsPtGrantedThisWeek: s.voidTrialsPtGrantedThisWeek,
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
  equippedTitle: initialData.equippedTitle || '',
  curseWeeklyHighestFloor: initialData.curseWeeklyHighestFloor || 0,
  curseHistoricalHighestFloor: initialData.curseHistoricalHighestFloor || 0,
  curseUnlockedTitles: initialData.curseUnlockedTitles || [],
  voidTrialsHistoricalHighestFloor: initialData.voidTrialsHistoricalHighestFloor || 0,
  voidTrialsWeeklyHighestFloor: initialData.voidTrialsWeeklyHighestFloor || 0,
  voidTrialsPtGrantedThisWeek: initialData.voidTrialsPtGrantedThisWeek || 0,
  weeklySeed: initialData.weeklySeed || 0,
  lastWeeklyResetTime: initialData.lastWeeklyResetTime || 0,
  savedStageBeforeTower: 1,
  savedEnemiesDefeatedBeforeTower: 0,
  savedLevelBeforeTower: 1,
  activeKeyType: 'normal',
  towerBranch: 'normal',
  activeCurses: [],

  startTowerAttempt: (keyType: 'normal' | 'evolved' = 'normal', branch: 'normal' | 'curse' | 'voidTrials' = 'normal') => {
    // Primeiro, verifica se há necessidade de reset semanal
    get().checkWeeklyReset();

    // Provações do Vácuo (v9.0.0): só libera após a primeira Transcendência — mesmo gate que a
    // Ecoterra já usa (`toggleEcoterra` em useGameStore.ts) para conteúdo pós-Transcendência.
    if (branch === 'voidTrials' && (useGameStore.getState().character.transcendenceCount || 0) < 1) {
      bridge.emit(GameEvent.LOG_EMITTED, {
        message: '🔒 As Provações do Vácuo só se abrem para quem já Transcendeu pelo menos uma vez!'
      });
      return;
    }

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
      savedLevelBeforeTower: char.level,
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
    if (branch === 'voidTrials') {
      bridge.emit(GameEvent.LOG_EMITTED, {
        message: `♾️ Provações do Vácuo ativadas! Sem teto de dificuldade, sem leaderboard — só o seu recorde pessoal. A cada ${VOID_TRIALS_PT_FLOOR_INTERVAL} andares batidos na semana, +1 Ponto de Transcendência (máximo ${VOID_TRIALS_WEEKLY_PT_CAP}/semana).`
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
    // v9.0.0: Provações do Vácuo (`isVoid`) não tem títulos nem recorde semanal público — usa as
    // mesmas chaves só para reaproveitar a checagem de "recorde inédito" que já dispara ouro/fragmentos.
    const branch = get().towerBranch;
    const isCurse = branch === 'curse';
    const isVoid = branch === 'voidTrials';
    const weeklyKey = isVoid ? 'voidTrialsWeeklyHighestFloor' : (isCurse ? 'curseWeeklyHighestFloor' : 'weeklyHighestFloor');
    const historicalKey = isVoid ? 'voidTrialsHistoricalHighestFloor' : (isCurse ? 'curseHistoricalHighestFloor' : 'historicalHighestFloor');
    const titlesKey = isCurse ? 'curseUnlockedTitles' : 'unlockedTitles';
    const milestones = isCurse ? CURSE_TITLE_MILESTONES : NORMAL_TITLE_MILESTONES;

    // Se o andar completado é maior do que o recorde da semana, atualiza os recordes
    let nextWeeklyHighest = get()[weeklyKey];
    let nextHistoricalHighest = get()[historicalKey];
    let nextVoidPtGranted = get().voidTrialsPtGrantedThisWeek;
    let titleUnlockedMsg = '';
    const newTitles = isVoid ? [] : [...get()[titlesKey]];

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

      // Provações do Vácuo (v9.0.0): PT escala com o andar batido NESTA semana, até o teto fixo —
      // concede só a DIFERENÇA entre o total "merecido" no novo andar e o que já foi concedido essa
      // semana, nunca mais que VOID_TRIALS_WEEKLY_PT_CAP no total.
      if (isVoid) {
        const candidateTotal = Math.min(VOID_TRIALS_WEEKLY_PT_CAP, Math.floor(nextWeeklyHighest / VOID_TRIALS_PT_FLOOR_INTERVAL));
        const delta = candidateTotal - nextVoidPtGranted;
        if (delta > 0) {
          useGameStore.getState().addTranscendencePoints(delta);
          nextVoidPtGranted = candidateTotal;
          bridge.emit(GameEvent.LOG_EMITTED, {
            message: `♾️ Provações do Vácuo: +${delta} Ponto${delta > 1 ? 's' : ''} de Transcendência! (${candidateTotal}/${VOID_TRIALS_WEEKLY_PT_CAP} nesta semana)`
          });
        }
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

      // Lógica de desbloqueio de títulos históricos (pool normal ou amaldiçoado) — Provações do
      // Vácuo não tem pool de títulos (roadmap: "sem leaderboard online"), só atualiza o recorde acima.
      if (!isVoid) {
        const milestoneTitle = milestones[floorCompleted];
        if (milestoneTitle && !newTitles.includes(milestoneTitle)) {
          newTitles.push(milestoneTitle);
          titleUnlockedMsg = `🏆 TÍTULO DESBLOQUEADO: "${milestoneTitle}"!`;
        }
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
      // Provações do Vácuo não tem array de títulos próprio — grava o contador de PT da semana
      // no lugar, em vez de sobrescrever `unlockedTitles`/`curseUnlockedTitles` com um array vazio.
      ...(isVoid ? { voidTrialsPtGrantedThisWeek: nextVoidPtGranted } : { [titlesKey]: newTitles }),
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
        // v9.0.0: teto semanal de PT das Provações do Vácuo também zera aqui — junto do recorde
        // semanal (que só existe internamente para calcular o PT concedido, não é exibido como recorde público).
        voidTrialsWeeklyHighestFloor: 0,
        voidTrialsPtGrantedThisWeek: 0,
        weeklySeed: currentSeed,
        lastWeeklyResetTime: Date.now(),
      });

      persistTowerState();

      bridge.emit(GameEvent.LOG_EMITTED, {
        message: '🔄 Uma nova semana se iniciou! O progresso da Torre e a Seed Semanal foram resetados.'
      });
    }
  },

  unlockTitle: (title: string) => {
    if (get().unlockedTitles.includes(title)) return;
    set((s) => ({ unlockedTitles: [...s.unlockedTitles, title] }));
    persistTowerState();
    bridge.emit(GameEvent.LOG_EMITTED, { message: `🏷️ Novo título desbloqueado: "${title}"!` });
  },

  selectTitle: (title: string) => {
    // Título equipado é único e compartilhado entre as duas ramificações — só valida que o título
    // pertence a algum dos dois pools de desbloqueio (o de origem não importa mais para exibição).
    if (title === '' || get().unlockedTitles.includes(title) || get().curseUnlockedTitles.includes(title)) {
      set({ equippedTitle: title });
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
      equippedTitle: '',
      curseWeeklyHighestFloor: 0,
      curseHistoricalHighestFloor: 0,
      curseUnlockedTitles: [],
      voidTrialsHistoricalHighestFloor: 0,
      voidTrialsWeeklyHighestFloor: 0,
      voidTrialsPtGrantedThisWeek: 0,
      weeklySeed: getWeeklySeed(),
      lastWeeklyResetTime: Date.now(),
    });
    persistTowerState();
  }
  };
});
