import { create } from 'zustand';
import { Character, BaseStats } from '../core/types';

// Configurações de Atributos e Crescimento para cada Classe
export const CLASS_CONFIGS: Record<string, {
  name: string;
  description: string;
  baseStats: BaseStats;
  growthRates: BaseStats;
  initialSkills: string[];
  primaryStat: keyof BaseStats;
}> = {
  warrior: {
    name: 'Guerreiro',
    description: 'Um combatente robusto especializado em combate corporal, cujo dano escala com Força.',
    baseStats: { strength: 12, magic: 4, dexterity: 8, constitution: 14 },
    growthRates: { strength: 2, magic: 0.5, dexterity: 1, constitution: 2.5 },
    initialSkills: ['slash'],
    primaryStat: 'strength'
  },
  mage: {
    name: 'Mago',
    description: 'Mestre das artes arcanas que conjura magias destrutivas de fogo, gelo e eletricidade.',
    baseStats: { strength: 4, magic: 15, dexterity: 7, constitution: 8 },
    growthRates: { strength: 0.5, magic: 3, dexterity: 1, constitution: 1 },
    initialSkills: ['fireball'],
    primaryStat: 'magic'
  },
  ranger: {
    name: 'Arqueiro',
    description: 'Atirador ágil que abate inimigos à distância com arco e flechas envenenadas.',
    baseStats: { strength: 6, magic: 5, dexterity: 15, constitution: 9 },
    growthRates: { strength: 1, magic: 0.5, dexterity: 3, constitution: 1.5 },
    initialSkills: ['arrow_shot'],
    primaryStat: 'dexterity'
  },
  paladin: {
    name: 'Paladino',
    description: 'Guerreiro sagrado que defende a justiça divina. Seu dano escala com Constituição.',
    baseStats: { strength: 10, magic: 6, dexterity: 5, constitution: 16 },
    growthRates: { strength: 1.5, magic: 1, dexterity: 0.5, constitution: 3 },
    initialSkills: ['holy_strike'],
    primaryStat: 'constitution'
  },
  cleric: {
    name: 'Clérigo',
    description: 'Servo dos deuses encarregado de curar aliados e punir infiéis com a ira divina.',
    baseStats: { strength: 7, magic: 13, dexterity: 5, constitution: 11 },
    growthRates: { strength: 1, magic: 2.5, dexterity: 0.5, constitution: 2 },
    initialSkills: ['holy_smite', 'heal'],
    primaryStat: 'magic'
  },
  rogue: {
    name: 'Ladrão',
    description: 'Assassino sorrateiro que ataca pelas sombras com adagas letais. Especialista em crítico.',
    baseStats: { strength: 8, magic: 3, dexterity: 16, constitution: 8 },
    growthRates: { strength: 1.5, magic: 0.5, dexterity: 3, constitution: 1 },
    initialSkills: ['stab'],
    primaryStat: 'dexterity'
  }
};

// Catálogo estático de melhorias de Prestígio (Roguelite)
export const PRESTIGE_UPGRADES_CATALOG: Record<string, { name: string; description: string; stat: keyof BaseStats; bonusPerLevel: number; costPerLevel: number; maxLevel: number }> = {
  perm_str: { name: 'Força Divina', description: 'Aumento definitivo de +2 em Strength por nível', stat: 'strength', bonusPerLevel: 2, costPerLevel: 3, maxLevel: 10 },
  perm_mag: { name: 'Mente Arcana', description: 'Aumento definitivo de +2 em Magic por nível', stat: 'magic', bonusPerLevel: 2, costPerLevel: 3, maxLevel: 10 },
  perm_dex: { name: 'Foco Ágil', description: 'Aumento definitivo de +1 em Dexterity por nível', stat: 'dexterity', bonusPerLevel: 1, costPerLevel: 3, maxLevel: 10 },
  perm_con: { name: 'Vigor Eterno', description: 'Aumento definitivo de +3 em Constitution por nível', stat: 'constitution', bonusPerLevel: 3, costPerLevel: 3, maxLevel: 10 },
};

// Catálogo estático de Habilidades (Árvore de Habilidades por Classe)
export const SKILLS_CATALOG: Record<string, {
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
  dependencies: string[];
  type: 'active' | 'passive';
  statBonuses?: Partial<BaseStats>;
  requiredLevel: number;
  classId: string;
}> = {
  // Guerreiro (Warrior)
  slash: { name: 'Slash', description: 'Corte rápido causando 150% do dano de Força.', cost: 1, maxLevel: 5, dependencies: [], type: 'active', requiredLevel: 1, classId: 'warrior' },
  shield_bash: { name: 'Impacto de Escudo', description: 'Impacto que causa 120% do dano de Força e atordoa o inimigo.', cost: 1, maxLevel: 5, dependencies: ['slash'], type: 'active', requiredLevel: 3, classId: 'warrior' },
  berserk: { name: 'Fúria Berserk', description: 'Aumento passivo permanente de +5 em Força.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { strength: 5 }, requiredLevel: 5, classId: 'warrior' },
  execute: { name: 'Executar', description: 'Golpe de misericórdia causando 300% do dano de Força.', cost: 2, maxLevel: 5, dependencies: ['shield_bash'], type: 'active', requiredLevel: 7, classId: 'warrior' },
  battle_cry: { name: 'Grito de Guerra', description: 'Intimida oponentes. Aumento passivo de +5 em Constituição.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { constitution: 5 }, requiredLevel: 9, classId: 'warrior' },
  bladestorm: { name: 'Tempestade de Aço', description: 'Ataque giratório contínuo que causa 400% de Força.', cost: 3, maxLevel: 5, dependencies: ['execute'], type: 'active', requiredLevel: 11, classId: 'warrior' },

  // Mago (Mage)
  fireball: { name: 'Fireball', description: 'Conjura uma esfera de fogo causando 250% de Magia.', cost: 1, maxLevel: 5, dependencies: [], type: 'active', requiredLevel: 1, classId: 'mage' },
  frostbolt: { name: 'Raio de Gelo', description: 'Causa 150% de Magia e reduz a velocidade do oponente.', cost: 1, maxLevel: 5, dependencies: ['fireball'], type: 'active', requiredLevel: 3, classId: 'mage' },
  mana_shield: { name: 'Escudo de Mana', description: 'Converte mana em barreira. Aumento passivo de +5 em Magia.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { magic: 5 }, requiredLevel: 5, classId: 'mage' },
  lightning: { name: 'Relâmpago', description: 'Descarga elétrica que causa 350% de Magia.', cost: 2, maxLevel: 5, dependencies: ['frostbolt'], type: 'active', requiredLevel: 7, classId: 'mage' },
  arcane_intellect: { name: 'Brilho Arcano', description: 'Expansão mental. Aumento passivo de +5 em Magia.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { magic: 5 }, requiredLevel: 9, classId: 'mage' },
  meteor: { name: 'Meteoro', description: 'Evoca um meteoro cataclísmico que causa 500% de Magia.', cost: 3, maxLevel: 5, dependencies: ['lightning'], type: 'active', requiredLevel: 11, classId: 'mage' },

  // Arqueiro (Ranger)
  arrow_shot: { name: 'Disparo Preciso', description: 'Tiro rápido causando 150% do dano de Destreza.', cost: 1, maxLevel: 5, dependencies: [], type: 'active', requiredLevel: 1, classId: 'ranger' },
  poison_arrow: { name: 'Flecha Venenosa', description: 'Flecha tóxica causando 100% de Destreza com veneno ativo.', cost: 1, maxLevel: 5, dependencies: ['arrow_shot'], type: 'active', requiredLevel: 3, classId: 'ranger' },
  eagle_eye: { name: 'Olho de Águia', description: 'Visão aprimorada. Aumento passivo de +5 em Destreza.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { dexterity: 5 }, requiredLevel: 5, classId: 'ranger' },
  double_shot: { name: 'Disparo Duplo', description: 'Dispara duas flechas simultâneas causadoras de 280% de Destreza.', cost: 2, maxLevel: 5, dependencies: ['poison_arrow'], type: 'active', requiredLevel: 7, classId: 'ranger' },
  fleet_footed: { name: 'Passo Ligeiro', description: 'Passividade ágil. Aumento de +3 em Destreza e +2 em Constituição.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { dexterity: 3, constitution: 2 }, requiredLevel: 9, classId: 'ranger' },
  rain_arrows: { name: 'Chuva de Flechas', description: 'Saraivada de flechas que causa 420% de Destreza.', cost: 3, maxLevel: 5, dependencies: ['double_shot'], type: 'active', requiredLevel: 11, classId: 'ranger' },

  // Paladino (Paladin)
  holy_strike: { name: 'Golpe Sagrado', description: 'Ataque abençoado causando 150% de Constituição.', cost: 1, maxLevel: 5, dependencies: [], type: 'active', requiredLevel: 1, classId: 'paladin' },
  shield_righteousness: { name: 'Escudo da Justiça', description: 'Golpe de escudo causando 120% de Constituição.', cost: 1, maxLevel: 5, dependencies: ['holy_strike'], type: 'active', requiredLevel: 3, classId: 'paladin' },
  retribution: { name: 'Retribuição Aura', description: 'Aura passiva. Aumento de +5 em Constituição permanentemente.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { constitution: 5 }, requiredLevel: 5, classId: 'paladin' },
  smite_paladin: { name: 'Punição da Luz', description: 'Causa 250% de dano misto de Constituição e Força.', cost: 2, maxLevel: 5, dependencies: ['shield_righteousness'], type: 'active', requiredLevel: 7, classId: 'paladin' },
  sacred_duty: { name: 'Dever Sagrado', description: 'Aumento passivo de +3 em Força e +3 em Constituição.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { strength: 3, constitution: 3 }, requiredLevel: 9, classId: 'paladin' },
  consecration: { name: 'Consagração', description: 'Santifica o solo causando 380% de Constituição.', cost: 3, maxLevel: 5, dependencies: ['smite_paladin'], type: 'active', requiredLevel: 11, classId: 'paladin' },

  // Clérigo (Cleric)
  holy_smite: { name: 'Golpe de Fé', description: 'Punição divina causando 150% de Magia.', cost: 1, maxLevel: 5, dependencies: [], type: 'active', requiredLevel: 1, classId: 'cleric' },
  bless: { name: 'Bênção Divina', description: 'Preces sagradas. Aumento passivo de +5 em Magia.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { magic: 5 }, requiredLevel: 3, classId: 'cleric' },
  divine_shield: { name: 'Escudo Sagrado', description: 'Barreira passiva. Aumento de +5 em Constituição.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { constitution: 5 }, requiredLevel: 5, classId: 'cleric' },
  wrath_heaven: { name: 'Ira do Céu', description: 'Relâmpago sagrado que causa 300% de Magia.', cost: 2, maxLevel: 5, dependencies: ['holy_smite'], type: 'active', requiredLevel: 7, classId: 'cleric' },
  spirit_growth: { name: 'Crescimento Espiritual', description: 'Conexão divina. Aumento passivo de +3 em Magia e +3 em Constituição.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { magic: 3, constitution: 3 }, requiredLevel: 9, classId: 'cleric' },
  divine_judgement: { name: 'Julgamento Final', description: 'Raios sagrados massivos causando 450% de Magia.', cost: 3, maxLevel: 5, dependencies: ['wrath_heaven'], type: 'active', requiredLevel: 11, classId: 'cleric' },

  // Ladrão (Rogue)
  stab: { name: 'Apunhalar', description: 'Golpe rápido com adagas causando 180% de Destreza.', cost: 1, maxLevel: 5, dependencies: [], type: 'active', requiredLevel: 1, classId: 'rogue' },
  poison_dagger: { name: 'Adaga de Veneno', description: 'Lança adaga tóxica causando 120% de Destreza mais veneno ao longo do tempo.', cost: 1, maxLevel: 5, dependencies: ['stab'], type: 'active', requiredLevel: 3, classId: 'rogue' },
  stealth: { name: 'Manto de Sombras', description: 'Furtividade passiva. Aumento definitivo de +5 em Destreza.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { dexterity: 5 }, requiredLevel: 5, classId: 'rogue' },
  backstab: { name: 'Ataque Furtivo', description: 'Ataque surpresa por trás causando 320% de Destreza.', cost: 2, maxLevel: 5, dependencies: ['poison_dagger'], type: 'active', requiredLevel: 7, classId: 'rogue' },
  shadowstep: { name: 'Passo Sombrio', description: 'Aumento passivo de +3 em Destreza e +3 em Força.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { dexterity: 3, strength: 3 }, requiredLevel: 9, classId: 'rogue' },
  death_blossom: { name: 'Florescer Letal', description: 'Redemoinho de cortes causando 450% de Destreza.', cost: 3, maxLevel: 5, dependencies: ['backstab'], type: 'active', requiredLevel: 11, classId: 'rogue' },

  // Comum
  heal: { name: 'Cura', description: 'Restaura 30% da vida máxima usando mana.', cost: 1, maxLevel: 5, dependencies: [], type: 'active', requiredLevel: 1, classId: 'common' }
};

export const isClassUnlocked = (classId: string, classLevels: Record<string, number>): boolean => {
  if (classId === 'warrior' || classId === 'mage' || classId === 'ranger') return true;
  if (classId === 'paladin') return (classLevels['warrior'] || 0) >= 10;
  if (classId === 'cleric') return (classLevels['mage'] || 0) >= 10;
  if (classId === 'rogue') return (classLevels['ranger'] || 0) >= 10;
  return false;
};

const saveToLocalStorage = (char: Character) => {
  try {
    localStorage.setItem('medieval_idle_save', JSON.stringify(char));
  } catch (e) {
    console.error('Falha ao salvar jogo no localStorage:', e);
  }
};

interface GameState {
  character: Character;
  screen: 'menu' | 'character_select' | 'playing' | 'options';
  zoomLevel: number;
  setCharacter(character: Character): void;
  setScreen(screen: 'menu' | 'character_select' | 'playing' | 'options'): void;
  setZoomLevel(zoomLevel: number): void;
  addGold(amount: number): void;
  addXp(amount: number): void;
  upgradeAttribute(stat: keyof BaseStats): void;
  unlockSkill(skillId: string): void;
  updateLevel(level: number, xp: number): void;
  incrementPrestigePoints(points: number): void;
  performPrestige(): void;
  upgradePrestigeStat(upgradeId: string): void;
  unlockOrUpgradeSkill(skillId: string): void;
  selectClass(classId: string): void;
  startNewGame(classId: string): void;
  loadSavedGame(): boolean;
  advanceStage(): void;
  resetStageProgress(): void;
  resetAllData(): void;
  toggleAutoCast(): void;
}

const DEFAULT_CHARACTER = (classId: string = 'warrior'): Character => {
  const config = CLASS_CONFIGS[classId] || CLASS_CONFIGS.warrior;
  return {
    id: 'default-char',
    classId: classId,
    level: 1,
    xp: 0,
    baseStats: { ...config.baseStats },
    growthRates: { ...config.growthRates },
    unlockedSkills: [...config.initialSkills],
    skillLevels: config.initialSkills.reduce((acc, skill) => ({ ...acc, [skill]: 1 }), {}),
    prestigePoints: 0,
    prestigeUpgrades: {},
    attributePoints: 5,
    skillPoints: 1,
    highestStageReached: 1,
    currentStage: 1,
    enemiesDefeatedInStage: 0,
    classLevels: {},
    autoCastEnabled: false,
  };
};

export const useGameStore = create<GameState>((set) => ({
  character: DEFAULT_CHARACTER('warrior'),
  screen: 'menu',
  zoomLevel: (() => {
    try {
      const saved = localStorage.getItem('rpg_game_zoom');
      return saved ? parseFloat(saved) : 1.3;
    } catch {
      return 1.3;
    }
  })(),

  setCharacter: (character) => set(() => {
    saveToLocalStorage(character);
    return { character };
  }),

  setScreen: (screen) => set({ screen }),

  setZoomLevel: (zoomLevel) => set(() => {
    try {
      localStorage.setItem('rpg_game_zoom', String(zoomLevel));
    } catch (e) {}
    return { zoomLevel };
  }),

  addGold: (amount) => set((state) => {
    const updated = {
      ...state.character,
      xp: state.character.xp + amount
    };
    saveToLocalStorage(updated);
    return { character: updated };
  }),

  addXp: (amount) => set((state) => {
    let newXp = state.character.xp + amount;
    let newLevel = state.character.level;
    let newPoints = state.character.attributePoints;
    let newSkillPoints = state.character.skillPoints;
    const stats = { ...state.character.baseStats };
    const xpNeeded = newLevel * 100;

    if (newXp >= xpNeeded) {
      newXp -= xpNeeded;
      newLevel += 1;
      newPoints += 5;
      newSkillPoints += 1; // +1 ponto de habilidade por nível
      
      // Aplica crescimento de atributos base
      (Object.keys(stats) as Array<keyof BaseStats>).forEach((key) => {
        stats[key] = Math.round(stats[key] + state.character.growthRates[key]);
      });
      console.log(`[Store] LEVEL UP! Novo Level: ${newLevel}. +5 atributos, +1 skill point.`);
    }

    // Atualiza maior nível alcançado para esta classe de forma persistente
    const updatedClassLevels = {
      ...state.character.classLevels,
      [state.character.classId]: Math.max(state.character.classLevels[state.character.classId] || 1, newLevel)
    };

    const updated = {
      ...state.character,
      level: newLevel,
      xp: newXp,
      attributePoints: newPoints,
      skillPoints: newSkillPoints,
      baseStats: stats,
      classLevels: updatedClassLevels
    };

    saveToLocalStorage(updated);
    return { character: updated };
  }),

  upgradeAttribute: (stat) => set((state) => {
    if (state.character.attributePoints <= 0) return state;
    const updated = {
      ...state.character,
      attributePoints: state.character.attributePoints - 1,
      baseStats: {
        ...state.character.baseStats,
        [stat]: state.character.baseStats[stat] + 1
      }
    };
    saveToLocalStorage(updated);
    return { character: updated };
  }),

  unlockSkill: (skillId) => set((state) => {
    const updated = {
      ...state.character,
      unlockedSkills: [...new Set([...state.character.unlockedSkills, skillId])]
    };
    saveToLocalStorage(updated);
    return { character: updated };
  }),

  updateLevel: (level, xp) => set((state) => {
    const updated = { ...state.character, level, xp };
    saveToLocalStorage(updated);
    return { character: updated };
  }),

  incrementPrestigePoints: (points) => set((state) => {
    const updated = { ...state.character, prestigePoints: state.character.prestigePoints + points };
    saveToLocalStorage(updated);
    return { character: updated };
  }),

  performPrestige: () => set((state) => {
    const pointsEarned = Math.max(1, Math.floor(state.character.level * 1.5));
    const config = CLASS_CONFIGS[state.character.classId] || CLASS_CONFIGS.warrior;
    
    // Recalcular os novos stats iniciais com base nos upgrades de prestígio permanentes já adquiridos
    const newBaseStats = { ...config.baseStats };
    const upgrades = state.character.prestigeUpgrades || {};
    Object.entries(upgrades).forEach(([upgradeId, lvl]) => {
      const upgrade = PRESTIGE_UPGRADES_CATALOG[upgradeId];
      if (upgrade) {
        newBaseStats[upgrade.stat] += upgrade.bonusPerLevel * lvl;
      }
    });

    console.log(`[Prestige] Ascendido! Ganhou ${pointsEarned} pontos de prestígio.`);

    const updated = {
      ...state.character,
      level: 1,
      xp: 0,
      attributePoints: 5,
      skillPoints: 1,
      unlockedSkills: [...config.initialSkills],
      skillLevels: config.initialSkills.reduce((acc, skill) => ({ ...acc, [skill]: 1 }), {}),
      prestigePoints: (state.character.prestigePoints || 0) + pointsEarned,
      prestigeUpgrades: upgrades,
      baseStats: newBaseStats,
      currentStage: 1,
      enemiesDefeatedInStage: 0,
    };

    saveToLocalStorage(updated);
    return { character: updated };
  }),

  upgradePrestigeStat: (upgradeId) => set((state) => {
    const upgrade = PRESTIGE_UPGRADES_CATALOG[upgradeId];
    if (!upgrade) return state;

    const currentLvl = state.character.prestigeUpgrades[upgradeId] || 0;
    if (currentLvl >= upgrade.maxLevel) return state;

    const cost = upgrade.costPerLevel * (currentLvl + 1);
    if (state.character.prestigePoints < cost) return state;

    const newUpgrades = {
      ...state.character.prestigeUpgrades,
      [upgradeId]: currentLvl + 1
    };

    const newStats = { ...state.character.baseStats };
    newStats[upgrade.stat] += upgrade.bonusPerLevel;

    const updated = {
      ...state.character,
      prestigePoints: state.character.prestigePoints - cost,
      prestigeUpgrades: newUpgrades,
      baseStats: newStats
    };

    saveToLocalStorage(updated);
    return { character: updated };
  }),

  unlockOrUpgradeSkill: (skillId) => set((state) => {
    const skill = SKILLS_CATALOG[skillId];
    if (!skill) return state;

    const currentLvl = state.character.skillLevels[skillId] || 0;
    if (currentLvl >= skill.maxLevel) return state;

    // Validar nível requerido
    if (state.character.level < skill.requiredLevel) {
      console.log(`[Store] Requisito de nível não atingido: requer nível ${skill.requiredLevel}.`);
      return state;
    }

    // Validar dependências de habilidades
    const dependenciesMet = skill.dependencies.every(depId => (state.character.skillLevels[depId] || 0) > 0);
    if (!dependenciesMet) {
      console.log(`[Store] Dependências não liberadas: ${skill.dependencies.join(', ')}.`);
      return state;
    }

    const cost = skill.cost;
    if (state.character.skillPoints < cost) return state;

    const newSkillLevels = {
      ...state.character.skillLevels,
      [skillId]: currentLvl + 1
    };

    const newUnlocked = [...new Set([...state.character.unlockedSkills, skillId])];
    const newStats = { ...state.character.baseStats };

    // Se a habilidade possuir bônus de atributos passivos, aplica-os
    if (skill.statBonuses) {
      Object.entries(skill.statBonuses).forEach(([stat, val]) => {
        const key = stat as keyof BaseStats;
        newStats[key] += val;
      });
    }

    const updated = {
      ...state.character,
      skillPoints: state.character.skillPoints - cost,
      skillLevels: newSkillLevels,
      unlockedSkills: newUnlocked,
      baseStats: newStats
    };

    saveToLocalStorage(updated);
    return { character: updated };
  }),

  selectClass: (classId) => set((state) => {
    const config = CLASS_CONFIGS[classId];
    if (!config) return state;
    const updated = {
      ...state.character,
      classId: classId
    };
    saveToLocalStorage(updated);
    return { character: updated };
  }),

  startNewGame: (classId) => set((state) => {
    const config = CLASS_CONFIGS[classId] || CLASS_CONFIGS.warrior;
    
    // Mantém as informações persistentes do roguelite: pontos de prestígio, upgrades e níveis de classe
    const currentPrestigePoints = state.character.prestigePoints || 0;
    const currentPrestigeUpgrades = state.character.prestigeUpgrades || {};
    const currentClassLevels = {
      ...(state.character.classLevels || {}),
      [state.character.classId]: Math.max((state.character.classLevels || {})[state.character.classId] || 1, state.character.level || 1)
    };

    // Aplica bônus de prestígio nos atributos base da nova classe
    const newBaseStats = { ...config.baseStats };
    Object.entries(currentPrestigeUpgrades).forEach(([upgradeId, lvl]) => {
      const upgrade = PRESTIGE_UPGRADES_CATALOG[upgradeId];
      if (upgrade) {
        newBaseStats[upgrade.stat] += upgrade.bonusPerLevel * lvl;
      }
    });

    const newChar: Character = {
      id: 'default-char',
      classId: classId,
      level: 1,
      xp: 0,
      baseStats: newBaseStats,
      growthRates: { ...config.growthRates },
      unlockedSkills: [...config.initialSkills],
      skillLevels: config.initialSkills.reduce((acc, skill) => ({ ...acc, [skill]: 1 }), {}),
      prestigePoints: currentPrestigePoints,
      prestigeUpgrades: currentPrestigeUpgrades,
      attributePoints: 5,
      skillPoints: 1,
      highestStageReached: Math.max(state.character.highestStageReached || 1, state.character.currentStage || 1),
      currentStage: 1,
      enemiesDefeatedInStage: 0,
      classLevels: currentClassLevels,
      autoCastEnabled: state.character.autoCastEnabled ?? false,
    };

    saveToLocalStorage(newChar);
    return { character: newChar, screen: 'playing' };
  }),

  loadSavedGame: () => {
    try {
      const saved = localStorage.getItem('medieval_idle_save');
      if (saved) {
        const char = JSON.parse(saved) as Character;
        if (char && char.classId) {
          const defaults = DEFAULT_CHARACTER(char.classId);
          const merged: Character = {
            ...defaults,
            ...char,
            baseStats: { ...defaults.baseStats, ...(char.baseStats || {}) },
            growthRates: { ...defaults.growthRates, ...(char.growthRates || {}) },
            skillLevels: { ...defaults.skillLevels, ...(char.skillLevels || {}) },
            prestigeUpgrades: { ...defaults.prestigeUpgrades, ...(char.prestigeUpgrades || {}) },
            classLevels: { ...defaults.classLevels, ...(char.classLevels || {}) },
            unlockedSkills: char.unlockedSkills || defaults.unlockedSkills,
          };
          set({ character: merged, screen: 'playing' });
          return true;
        }
      }
    } catch (e) {
      console.error('Falha ao carregar save:', e);
    }
    return false;
  },

  advanceStage: () => set((state) => {
    // Limita as fases normais/pesadelos a 10 no total
    const nextStage = Math.min(10, state.character.currentStage + 1);
    const updated = {
      ...state.character,
      currentStage: nextStage,
      enemiesDefeatedInStage: 0,
      highestStageReached: Math.max(state.character.highestStageReached, nextStage)
    };
    saveToLocalStorage(updated);
    return { character: updated };
  }),

  resetStageProgress: () => set((state) => {
    const updated = {
      ...state.character,
      enemiesDefeatedInStage: 0
    };
    saveToLocalStorage(updated);
    return { character: updated };
  }),

  resetAllData: () => set(() => {
    try {
      localStorage.removeItem('medieval_idle_save');
    } catch (e) {}
    const fresh = DEFAULT_CHARACTER('warrior');
    return { character: fresh, screen: 'menu' };
  }),

  toggleAutoCast: () => set((state) => {
    const updated = {
      ...state.character,
      autoCastEnabled: !state.character.autoCastEnabled
    };
    saveToLocalStorage(updated);
    return { character: updated };
  })
}));
