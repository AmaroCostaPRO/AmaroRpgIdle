import { create } from 'zustand';
import { Character, BaseStats, EquipmentItem } from '../core/types';

// Configurações de Atributos e Crescimento para cada Classe
export const getSkillMaxLevel = (skillId: string, currentStage: number): number => {
  const skill = SKILLS_CATALOG[skillId];
  if (!skill) return 0;
  if (currentStage >= 11) {
    return Math.max(skill.maxLevel, 10);
  }
  return skill.maxLevel;
};

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
    baseStats: { strength: 12, magic: 4, dexterity: 8, constitution: 14, luck: 5, touch: 10, touchCritChance: 5, touchCritDamage: 150, robotClicks: 0 },
    growthRates: { strength: 2, magic: 0.5, dexterity: 1, constitution: 2.5, luck: 0.5, touch: 1.5, touchCritChance: 0.1, touchCritDamage: 1.0, robotClicks: 0 },
    initialSkills: ['slash'],
    primaryStat: 'strength'
  },
  mage: {
    name: 'Mago',
    description: 'Mestre das artes arcanas que conjura magias destrutivas de fogo, gelo e eletricidade.',
    baseStats: { strength: 4, magic: 15, dexterity: 7, constitution: 8, luck: 5, touch: 10, touchCritChance: 5, touchCritDamage: 150, robotClicks: 0 },
    growthRates: { strength: 0.5, magic: 3, dexterity: 1, constitution: 1, luck: 0.5, touch: 1.5, touchCritChance: 0.1, touchCritDamage: 1.0, robotClicks: 0 },
    initialSkills: ['fireball'],
    primaryStat: 'magic'
  },
  ranger: {
    name: 'Arqueiro',
    description: 'Atirador ágil que abate inimigos à distância com arco e flechas envenenadas.',
    baseStats: { strength: 6, magic: 5, dexterity: 15, constitution: 9, luck: 8, touch: 10, touchCritChance: 8, touchCritDamage: 160, robotClicks: 0 },
    growthRates: { strength: 1, magic: 0.5, dexterity: 3, constitution: 1.5, luck: 0.8, touch: 1.5, touchCritChance: 0.2, touchCritDamage: 1.5, robotClicks: 0 },
    initialSkills: ['arrow_shot'],
    primaryStat: 'dexterity'
  },
  paladin: {
    name: 'Paladino',
    description: 'Guerreiro sagrado que defende a justiça divina. Seu dano escala com Constituição.',
    baseStats: { strength: 10, magic: 6, dexterity: 5, constitution: 16, luck: 5, touch: 10, touchCritChance: 5, touchCritDamage: 150, robotClicks: 0 },
    growthRates: { strength: 1.5, magic: 1, dexterity: 0.5, constitution: 3, luck: 0.5, touch: 1.5, touchCritChance: 0.1, touchCritDamage: 1.0, robotClicks: 0 },
    initialSkills: ['holy_strike'],
    primaryStat: 'constitution'
  },
  cleric: {
    name: 'Clérigo',
    description: 'Servo dos deuses encarregado de curar aliados e punir infiéis com a ira divina.',
    baseStats: { strength: 7, magic: 13, dexterity: 5, constitution: 11, luck: 6, touch: 10, touchCritChance: 5, touchCritDamage: 150, robotClicks: 0 },
    growthRates: { strength: 1, magic: 2.5, dexterity: 0.5, constitution: 2, luck: 0.6, touch: 1.5, touchCritChance: 0.1, touchCritDamage: 1.0, robotClicks: 0 },
    initialSkills: ['holy_smite', 'heal'],
    primaryStat: 'magic'
  },
  rogue: {
    name: 'Ladrão',
    description: 'Assassino sorrateiro que ataca pelas sombras com adagas letais. Especialista em crítico.',
    baseStats: { strength: 8, magic: 3, dexterity: 16, constitution: 8, luck: 10, touch: 10, touchCritChance: 12, touchCritDamage: 180, robotClicks: 0 },
    growthRates: { strength: 1.5, magic: 0.5, dexterity: 3, constitution: 1, luck: 1.0, touch: 1.5, touchCritChance: 0.3, touchCritDamage: 2.0, robotClicks: 0 },
    initialSkills: ['stab'],
    primaryStat: 'dexterity'
  }
};

// Catálogo estático de melhorias de Prestígio (Roguelite)
export const PRESTIGE_UPGRADES_CATALOG: Record<string, { name: string; description: string; stat: keyof BaseStats; bonusPerLevel: number; costPerLevel: number; maxLevel: number }> = {
  perm_str: { name: 'Força Divina', description: 'Aumento definitivo de +6 em Strength por nível', stat: 'strength', bonusPerLevel: 6, costPerLevel: 3, maxLevel: 10 },
  perm_mag: { name: 'Mente Arcana', description: 'Aumento definitivo de +6 em Magic por nível', stat: 'magic', bonusPerLevel: 6, costPerLevel: 3, maxLevel: 10 },
  perm_dex: { name: 'Foco Ágil', description: 'Aumento definitivo de +3 em Dexterity por nível', stat: 'dexterity', bonusPerLevel: 3, costPerLevel: 3, maxLevel: 10 },
  perm_con: { name: 'Vigor Eterno', description: 'Aumento definitivo de +9 em Constitution por nível', stat: 'constitution', bonusPerLevel: 9, costPerLevel: 3, maxLevel: 10 },
  perm_luk: { name: 'Bênção da Sorte', description: 'Aumento definitivo de +3 em Luck por nível', stat: 'luck', bonusPerLevel: 3, costPerLevel: 3, maxLevel: 10 },
  perm_touch: { name: 'Toque Divino', description: 'Aumento definitivo de +8 em Poder do Toque por nível', stat: 'touch', bonusPerLevel: 8, costPerLevel: 3, maxLevel: 10 },
  perm_touch_crit: { name: 'Toque Crítico', description: 'Aumento de +3% na Chance de Crítico do Toque por nível', stat: 'touchCritChance', bonusPerLevel: 3, costPerLevel: 3, maxLevel: 10 },
  perm_touch_crit_dmg: { name: 'Toque Devastador', description: 'Aumento de +15% no Dano Crítico do Toque por nível', stat: 'touchCritDamage', bonusPerLevel: 15, costPerLevel: 3, maxLevel: 10 },
  perm_robot: { name: 'Robô Assistente', description: 'Invoca um assistente automático que desfere +1 Toque por segundo por nível', stat: 'robotClicks', bonusPerLevel: 1, costPerLevel: 5, maxLevel: 5 }
};

// Multiplicadores base para as habilidades ativas (conforme a descrição)
export const SKILL_BASE_MULTIPLIERS: Record<string, number> = {
  // Warrior
  slash: 1.5,
  shield_bash: 1.2,
  execute: 3.0,
  bladestorm: 4.0,

  // Mage
  fireball: 2.5,
  frostbolt: 1.5,
  lightning: 3.5,
  meteor: 5.0,

  // Ranger
  arrow_shot: 1.5,
  poison_arrow: 1.0,
  double_shot: 2.8,
  rain_arrows: 4.2,

  // Paladin
  holy_strike: 1.5,
  shield_righteousness: 1.2,
  smite_paladin: 2.5, // Misto
  consecration: 3.8,

  // Cleric
  holy_smite: 1.5,
  wrath_heaven: 3.0,
  divine_judgement: 4.5,

  // Rogue
  stab: 1.8,
  poison_dagger: 1.2,
  backstab: 3.2,
  death_blossom: 4.5
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

export const GLOBAL_CLASS_LEVELS_KEY = 'medieval_idle_global_class_levels';

export const getGlobalClassLevels = (): Record<string, number> => {
  try {
    const saved = localStorage.getItem(GLOBAL_CLASS_LEVELS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export const updateGlobalClassLevels = (classLevels: Record<string, number>) => {
  try {
    const currentGlobal = getGlobalClassLevels();
    const updated = { ...currentGlobal };
    Object.entries(classLevels).forEach(([classId, level]) => {
      updated[classId] = Math.max(updated[classId] || 0, level);
    });
    localStorage.setItem(GLOBAL_CLASS_LEVELS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Erro ao atualizar níveis globais de classe:', e);
  }
};

export const isClassUnlocked = (classId: string, classLevels: Record<string, number>): boolean => {
  if (classId === 'warrior' || classId === 'mage' || classId === 'ranger') return true;
  
  const globalClassLevels = getGlobalClassLevels();
  const getLevel = (id: string) => Math.max(classLevels[id] || 0, globalClassLevels[id] || 0);

  if (classId === 'paladin') return getLevel('warrior') >= 10;
  if (classId === 'cleric') return getLevel('mage') >= 10;
  if (classId === 'rogue') return getLevel('ranger') >= 10;
  return false;
};

const saveToLocalStorage = (char: Character) => {
  try {
    // Adiciona carimbo de data/hora do salvamento
    const updatedChar = {
      ...char,
      lastSaved: new Date().toISOString()
    };
    
    // Salva o save ativo padrão (para compatibilidade/carregamento rápido)
    localStorage.setItem('medieval_idle_save', JSON.stringify(updatedChar));
    
    // Atualiza os níveis globais de classe com os dados desse save
    if (updatedChar.classLevels) {
      updateGlobalClassLevels(updatedChar.classLevels);
    }

    // Salva no slot ativo atual, se houver um selecionado
    const currentSlot = localStorage.getItem('medieval_idle_current_slot');
    if (currentSlot) {
      localStorage.setItem(`medieval_idle_save_slot_${currentSlot}`, JSON.stringify(updatedChar));
    }
  } catch (e) {
    console.error('Falha ao salvar jogo no localStorage:', e);
  }
};

interface GameState {
  character: Character;
  screen: 'menu' | 'character_select' | 'playing' | 'options' | 'saves';
  zoomLevel: number;
  sfxEnabled: boolean;
  bgmEnabled: boolean;
  sfxVolume: number;
  bgmVolume: number;
  consoleEnabled: boolean;
  currentSlot: number | null;
  toggleSfx(): void;
  toggleBgm(): void;
  setSfxVolume(vol: number): void;
  setBgmVolume(vol: number): void;
  toggleConsole(): void;
  setCharacter(character: Character): void;
  setScreen(screen: 'menu' | 'character_select' | 'playing' | 'options' | 'saves'): void;
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
  registerEnemyKill(enemyId: string): void;
  
  // Novos métodos de gerenciamento de save slots
  setCurrentSlot(slot: number | null): void;
  saveGameToSlot(slotIndex: number): void;
  loadGameFromSlot(slotIndex: number): boolean;
  deleteSlot(slotIndex: number): void;
  importSave(slotIndex: number, rawData: string): boolean;
  exportSave(slotIndex: number): string | null;

  // Novos métodos de equipamentos e inventário (v1.1.0)
  equipItem(itemId: string): void;
  unequipItem(slot: 'head' | 'chest' | 'legs' | 'gloves' | 'weapon'): void;
  discardItem(itemId: string): void;
  addItemToInventory(item: EquipmentItem): boolean;
  
  // Reforja de itens (v2.0.0)
  reforgeItems(item1Id: string, item2Id: string): { success: boolean; message: string; newItem?: EquipmentItem };
  
  // Controle de Velocidade de Jogo (v1.1.4 - Aceleração)
  gameSpeed: number;
  setGameSpeed(speed: number): void;
}

const DEFAULT_CHARACTER = (classId: string = 'warrior'): Character => {
  const config = CLASS_CONFIGS[classId] || CLASS_CONFIGS.warrior;
  return {
    id: 'default-char',
    classId: classId,
    level: 1,
    xp: 0,
    gold: 0,
    baseStats: { ...config.baseStats },
    growthRates: { ...config.growthRates },
    unlockedSkills: [...config.initialSkills],
    skillLevels: config.initialSkills.reduce((acc, skill) => ({ ...acc, [skill]: 1 }), {}),
    prestigePoints: 0,
    prestigeUpgrades: {},
    ascensionCount: 0,
    attributePoints: 5,
    skillPoints: 1,
    highestStageReached: 1,
    currentStage: 1,
    enemiesDefeatedInStage: 0,
    classLevels: {},
    autoCastEnabled: false,
    killCount: {},
    equipment: { head: null, chest: null, legs: null, gloves: null, weapon: null },
    inventory: [],
    inventorySlots: 30,
  };
};

export const useGameStore = create<GameState>((set) => ({
  character: DEFAULT_CHARACTER('warrior'),
  screen: 'menu',
  currentSlot: (() => {
    try {
      const saved = localStorage.getItem('medieval_idle_current_slot');
      return saved ? parseInt(saved, 10) : null;
    } catch {
      return null;
    }
  })(),
  zoomLevel: (() => {
    try {
      const saved = localStorage.getItem('rpg_game_zoom');
      return saved ? parseFloat(saved) : 1.0;
    } catch {
      return 1.0;
    }
  })(),

  sfxEnabled: (() => {
    try {
      const saved = localStorage.getItem('rpg_sfx_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  })(),

  bgmEnabled: (() => {
    try {
      const saved = localStorage.getItem('rpg_bgm_enabled');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  })(),

  sfxVolume: (() => {
    try {
      const saved = localStorage.getItem('rpg_sfx_volume');
      return saved !== null ? parseFloat(saved) : 0.5;
    } catch {
      return 0.5;
    }
  })(),

  bgmVolume: (() => {
    try {
      const saved = localStorage.getItem('rpg_bgm_volume');
      return saved !== null ? parseFloat(saved) : 0.5;
    } catch {
      return 0.5;
    }
  })(),

  consoleEnabled: (() => {
    try {
      const saved = localStorage.getItem('rpg_console_enabled');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  })(),

  toggleConsole: () => set((state) => {
    const val = !state.consoleEnabled;
    try {
      localStorage.setItem('rpg_console_enabled', String(val));
    } catch (e) {}
    return { consoleEnabled: val };
  }),

  toggleSfx: () => set((state) => {
    const val = !state.sfxEnabled;
    try {
      localStorage.setItem('rpg_sfx_enabled', String(val));
    } catch (e) {}
    return { sfxEnabled: val };
  }),

  toggleBgm: () => set((state) => {
    const val = !state.bgmEnabled;
    try {
      localStorage.setItem('rpg_bgm_enabled', String(val));
    } catch (e) {}
    return { bgmEnabled: val };
  }),

  setSfxVolume: (vol) => set(() => {
    try {
      localStorage.setItem('rpg_sfx_volume', String(vol));
    } catch (e) {}
    return { sfxVolume: vol };
  }),

  setBgmVolume: (vol) => set(() => {
    try {
      localStorage.setItem('rpg_bgm_volume', String(vol));
    } catch (e) {}
    return { bgmVolume: vol };
  }),

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

  gameSpeed: 1,
  setGameSpeed: (speed) => set({ gameSpeed: speed }),

  addGold: (amount) => set((state) => {
    const updated = {
      ...state.character,
      gold: (state.character.gold || 0) + amount
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
    const level = state.character.level;
    const xp = state.character.xp;
    const totalXp = 50 * level * (level - 1) + xp;
    const pointsEarned = Math.floor(Math.floor(Math.pow(totalXp / 1000, 0.85)) * 0.5);

    if (pointsEarned <= 0) return state;
    
    // Validar requisito de PP com base na quantidade de ascensões já realizadas
    const ascensionCount = state.character.ascensionCount || 0;
    const requiredPP = ascensionCount === 0 ? 1 : 3 + 2 * ascensionCount;
    if (pointsEarned < requiredPP) return state;

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
      gold: 0,
      attributePoints: 5,
      skillPoints: 1,
      unlockedSkills: [...config.initialSkills],
      skillLevels: config.initialSkills.reduce((acc, skill) => ({ ...acc, [skill]: 1 }), {}),
      prestigePoints: (state.character.prestigePoints || 0) + pointsEarned,
      prestigeUpgrades: upgrades,
      ascensionCount: ascensionCount + 1,
      baseStats: newBaseStats,
      currentStage: 1,
      enemiesDefeatedInStage: 0,
      equipment: { head: null, chest: null, legs: null, gloves: null, weapon: null },
      inventory: [],
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
    const maxLevel = getSkillMaxLevel(skillId, state.character.currentStage);

    console.log(`[Store] Skill: ${skillId}, Current Level: ${currentLvl}, Max Level allowed for Stage ${state.character.currentStage}: ${maxLevel}`);

    if (currentLvl >= maxLevel) return state;

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

  startNewGame: (classId) => set(() => {
    const newChar = DEFAULT_CHARACTER(classId);

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
            killCount: { ...defaults.killCount, ...(char.killCount || {}) },
            equipment: char.equipment ? { ...defaults.equipment, ...char.equipment } : defaults.equipment,
            inventory: char.inventory || defaults.inventory,
            inventorySlots: char.inventorySlots || defaults.inventorySlots,
          };

          const currentSlotVal = (() => {
            try {
              const savedSlot = localStorage.getItem('medieval_idle_current_slot');
              return savedSlot ? parseInt(savedSlot, 10) : null;
            } catch {
              return null;
            }
          })();

          if (merged.classLevels) {
            updateGlobalClassLevels(merged.classLevels);
          }

          set({ character: merged, currentSlot: currentSlotVal, screen: 'playing' });
          return true;
        }
      }
    } catch (e) {
      console.error('Falha ao carregar save:', e);
    }
    return false;
  },

  advanceStage: () => set((state) => {
    // Limita as fases a 20 no total (Normal: 1-5, Pesadelo: 6-10, Inferno: 11-15, Apocalipse: 16-20)
    const nextStage = Math.min(20, state.character.currentStage + 1);
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
      localStorage.removeItem('medieval_idle_current_slot');
      localStorage.removeItem(GLOBAL_CLASS_LEVELS_KEY);
      for (let i = 1; i <= 6; i++) {
        localStorage.removeItem(`medieval_idle_save_slot_${i}`);
      }
    } catch (e) {}
    const fresh = DEFAULT_CHARACTER('warrior');
    return { character: fresh, currentSlot: null, screen: 'menu' };
  }),

  toggleAutoCast: () => set((state) => {
    const updated = {
      ...state.character,
      autoCastEnabled: !state.character.autoCastEnabled
    };
    saveToLocalStorage(updated);
    return { character: updated };
  }),

  registerEnemyKill: (enemyId) => set((state) => {
    const currentKills = state.character.killCount || {};
    const updatedKills = {
      ...currentKills,
      [enemyId]: (currentKills[enemyId] || 0) + 1
    };
    const updated = {
      ...state.character,
      killCount: updatedKills
    };
    saveToLocalStorage(updated);
    return { character: updated };
  }),

  setCurrentSlot: (slot) => set(() => {
    try {
      if (slot === null) {
        localStorage.removeItem('medieval_idle_current_slot');
      } else {
        localStorage.setItem('medieval_idle_current_slot', String(slot));
      }
    } catch (e) {}
    return { currentSlot: slot };
  }),

  saveGameToSlot: (slotIndex) => set((state) => {
    const updatedChar = {
      ...state.character,
      lastSaved: new Date().toISOString()
    };
    try {
      localStorage.setItem(`medieval_idle_save_slot_${slotIndex}`, JSON.stringify(updatedChar));
      localStorage.setItem('medieval_idle_save', JSON.stringify(updatedChar));
      localStorage.setItem('medieval_idle_current_slot', String(slotIndex));
      
      if (updatedChar.classLevels) {
        updateGlobalClassLevels(updatedChar.classLevels);
      }
    } catch (e) {
      console.error('Erro ao salvar no slot:', e);
    }
    return { character: updatedChar, currentSlot: slotIndex };
  }),

  loadGameFromSlot: (slotIndex) => {
    try {
      const saved = localStorage.getItem(`medieval_idle_save_slot_${slotIndex}`);
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
            killCount: { ...defaults.killCount, ...(char.killCount || {}) },
            equipment: char.equipment ? { ...defaults.equipment, ...char.equipment } : defaults.equipment,
            inventory: char.inventory || defaults.inventory,
            inventorySlots: char.inventorySlots || defaults.inventorySlots,
          };

          if (merged.classLevels) {
            updateGlobalClassLevels(merged.classLevels);
          }

          localStorage.setItem('medieval_idle_save', JSON.stringify(merged));
          localStorage.setItem('medieval_idle_current_slot', String(slotIndex));
          set({ character: merged, currentSlot: slotIndex, screen: 'playing' });
          return true;
        }
      }
    } catch (e) {
      console.error(`Erro ao carregar slot ${slotIndex}:`, e);
    }
    return false;
  },

  deleteSlot: (slotIndex) => set((state) => {
    try {
      localStorage.removeItem(`medieval_idle_save_slot_${slotIndex}`);
      const currentSlot = localStorage.getItem('medieval_idle_current_slot');
      if (currentSlot === String(slotIndex)) {
        localStorage.removeItem('medieval_idle_current_slot');
        localStorage.removeItem('medieval_idle_save');
        return { currentSlot: null, character: DEFAULT_CHARACTER('warrior') };
      }
    } catch (e) {
      console.error(`Erro ao deletar slot ${slotIndex}:`, e);
    }
    return {};
  }),

  importSave: (slotIndex, rawData) => {
    try {
      const decodedStr = atob(rawData.trim());
      const char = JSON.parse(decodedStr) as Character;
      if (char && char.classId && typeof char.level === 'number') {
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
          killCount: { ...defaults.killCount, ...(char.killCount || {}) },
          equipment: char.equipment ? { ...defaults.equipment, ...char.equipment } : defaults.equipment,
          inventory: char.inventory || defaults.inventory,
          inventorySlots: char.inventorySlots || defaults.inventorySlots,
          lastSaved: new Date().toISOString()
        };

        if (merged.classLevels) {
          updateGlobalClassLevels(merged.classLevels);
        }

        localStorage.setItem(`medieval_idle_save_slot_${slotIndex}`, JSON.stringify(merged));
        
        const currentSlot = localStorage.getItem('medieval_idle_current_slot');
        if (currentSlot === String(slotIndex) || !currentSlot) {
          localStorage.setItem('medieval_idle_save', JSON.stringify(merged));
          localStorage.setItem('medieval_idle_current_slot', String(slotIndex));
          set({ character: merged, currentSlot: slotIndex });
        }
        return true;
      }
    } catch (e) {
      console.error('Falha ao importar save:', e);
    }
    return false;
  },

  exportSave: (slotIndex) => {
    try {
      const saved = localStorage.getItem(`medieval_idle_save_slot_${slotIndex}`);
      if (saved) {
        return btoa(saved);
      }
    } catch (e) {
      console.error('Falha ao exportar save:', e);
    }
    return null;
  },

  equipItem: (itemId) => set((state) => {
    const item = state.character.inventory.find(i => i.id === itemId);
    if (!item) return state;

    const slot = item.slot;
    const currentEquipped = state.character.equipment[slot];
    
    const newInventory = state.character.inventory.filter(i => i.id !== itemId);
    if (currentEquipped) {
      newInventory.push(currentEquipped);
    }

    const newEquipment = {
      ...state.character.equipment,
      [slot]: item
    };

    const updated = {
      ...state.character,
      equipment: newEquipment,
      inventory: newInventory
    };

    saveToLocalStorage(updated);
    return { character: updated };
  }),

  unequipItem: (slot) => set((state) => {
    const item = state.character.equipment[slot];
    if (!item) return state;

    if (state.character.inventory.length >= state.character.inventorySlots) {
      return state;
    }

    const newEquipment = {
      ...state.character.equipment,
      [slot]: null
    };

    const newInventory = [...state.character.inventory, item];

    const updated = {
      ...state.character,
      equipment: newEquipment,
      inventory: newInventory
    };

    saveToLocalStorage(updated);
    return { character: updated };
  }),

  discardItem: (itemId) => set((state) => {
    const newInventory = state.character.inventory.filter(i => i.id !== itemId);
    const updated = {
      ...state.character,
      inventory: newInventory
    };
    saveToLocalStorage(updated);
    return { character: updated };
  }),

  addItemToInventory: (item) => {
    let success = false;
    set((state) => {
      if (state.character.inventory.length < state.character.inventorySlots) {
        success = true;
        const updated = {
          ...state.character,
          inventory: [...state.character.inventory, item]
        };
        saveToLocalStorage(updated);
        return { character: updated };
      }
      return state;
    });
    return success;
  },

  reforgeItems: (item1Id, item2Id) => {
    let result: { success: boolean; message: string; newItem?: EquipmentItem } = { success: false, message: '' };

    set((state) => {
      const inv = state.character.inventory;
      const item1 = inv.find(i => i.id === item1Id);
      const item2 = inv.find(i => i.id === item2Id);

      if (!item1 || !item2) {
        result = { success: false, message: 'Itens não encontrados no inventário.' };
        return state;
      }
      if (item1.slot !== item2.slot) {
        result = { success: false, message: 'Os itens devem ser do mesmo tipo/slot.' };
        return state;
      }
      if (item1.setName !== item2.setName) {
        result = { success: false, message: 'Os itens devem pertencer ao mesmo conjunto (Set).' };
        return state;
      }

      const isBothMystic = item1.rarity === 'mystic' && item2.rarity === 'mystic';
      const isBothNormal = item1.rarity !== 'mystic' && item2.rarity !== 'mystic';

      if (!isBothMystic && !isBothNormal) {
        result = { success: false, message: 'Você só pode fundir dois itens Místicos ou dois itens normais.' };
        return state;
      }

      let cost = 500;
      let targetMysticLevel = 1;

      if (isBothMystic) {
        const lvl1 = item1.mysticLevel || 1;
        const lvl2 = item2.mysticLevel || 1;

        if (lvl1 !== lvl2) {
          result = { success: false, message: 'Itens Místicos devem ter o mesmo nível para fusão.' };
          return state;
        }
        if (lvl1 >= 5) {
          result = { success: false, message: 'O nível máximo de item Místico é +5.' };
          return state;
        }

        targetMysticLevel = lvl1 + 1;
        const costs = [0, 1000, 2500, 12500, 62500];
        cost = costs[lvl1] || 500;
      }

      if ((state.character.gold || 0) < cost) {
        result = { success: false, message: `Ouro insuficiente. Requer ${cost} Ouro.` };
        return state;
      }

      // Sorteio de Forja Lendária: 5% de chance de ganhar +50% em vez de perder 25%
      const isLegendaryForge = Math.random() < 0.05;

      // Calcula os novos stats com a fórmula assimétrica por stat:
      //
      // Lendário (5%) : Math.ceil((val1 + val2) * 1.50) — bônus de +50% sobre a soma total
      //
      // Normal  (95%) : Preserva 100% do stat MAIOR e aplica 50% apenas ao MENOR.
      //   • Ambos os itens têm o stat → maior + Math.ceil(menor * 0.50)
      //   • Só um item tem o stat     → valor copiado integralmente (sem redução)
      //
      // Exemplo: Força 50 + Força 5  →  50 + ceil(5 × 0.50) = 50 + 3 = 53
      // Exemplo: Sorte  0 + Sorte 12 →  12 (único portador, preservado inteiro)
      const mergedStats: Partial<BaseStats> = {};
      const allStatKeys = new Set([
        ...Object.keys(item1.stats),
        ...Object.keys(item2.stats)
      ]) as Set<keyof BaseStats>;

      allStatKeys.forEach((key) => {
        const val1 = item1.stats[key] || 0;
        const val2 = item2.stats[key] || 0;

        if (isLegendaryForge) {
          // Forja Lendária: soma total com bônus de +50%
          mergedStats[key] = Math.ceil((val1 + val2) * 1.5);
        } else if (val1 === 0 || val2 === 0) {
          // Stat exclusivo de um item: preservado integralmente
          mergedStats[key] = val1 + val2;
        } else {
          // Ambos têm o stat: maior preservado 100%, menor com redução de 50%
          const maior = Math.max(val1, val2);
          const menor = Math.min(val1, val2);
          mergedStats[key] = maior + Math.ceil(menor * 0.5);
        }
      });

      // Mapeamento dos nomes de slots traduzidos
      const slotNamesMap: Record<string, string> = {
        weapon: 'Arma Mística',
        head: 'Elmo Místico',
        chest: 'Armadura Mística',
        legs: 'Calça Mística',
        gloves: 'Luva Mística'
      };

      let baseName = slotNamesMap[item1.slot] || 'Item Místico';
      let newName = `${baseName} +${targetMysticLevel}`;

      if (item1.setName) {
        let cleanSetName = item1.setName;
        const isAncestral = item1.setName.startsWith('Set Ancestral');
        
        if (isAncestral) {
          if (cleanSetName.startsWith('Set Ancestral do ')) {
            cleanSetName = cleanSetName.replace('Set Ancestral do ', '');
          } else if (cleanSetName.startsWith('Set Ancestral de ')) {
            cleanSetName = cleanSetName.replace('Set Ancestral de ', '');
          }
          // Substitui Mística por Mística Ancestral
          baseName = baseName.replace('Mística', 'Mística Ancestral');
          baseName = baseName.replace('Místico', 'Místico Ancestral');
          
          if (item1.setName.includes(' do ')) {
            newName = `${baseName} do ${cleanSetName} +${targetMysticLevel}`;
          } else if (item1.setName.includes(' da ')) {
            newName = `${baseName} da ${cleanSetName} +${targetMysticLevel}`;
          } else {
            newName = `${baseName} de ${cleanSetName} +${targetMysticLevel}`;
          }
        } else {
          if (cleanSetName.startsWith('Set do ')) {
            cleanSetName = cleanSetName.replace('Set do ', '');
          } else if (cleanSetName.startsWith('Set de ')) {
            cleanSetName = cleanSetName.replace('Set de ', '');
          }
          
          if (item1.setName.includes(' do ')) {
            newName = `${baseName} do ${cleanSetName} +${targetMysticLevel}`;
          } else if (item1.setName.includes(' da ')) {
            newName = `${baseName} da ${cleanSetName} +${targetMysticLevel}`;
          } else {
            newName = `${baseName} de ${cleanSetName} +${targetMysticLevel}`;
          }
        }
      }

      const newId = `mystic-${item1.slot}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const newItem: EquipmentItem = {
        id: newId,
        name: newName,
        slot: item1.slot,
        rarity: 'mystic',
        stats: mergedStats,
        classId: item1.classId,
        spriteName: item1.spriteName,
        mysticLevel: targetMysticLevel,
        // Preserva o set do Item A: o item Místico continua contando
        // para os bônus de conjunto como se fosse um item Lendário do mesmo set.
        setName: item1.setName
      };

      // Remove os dois itens fundidos do inventário
      const filteredInventory = inv.filter(i => i.id !== item1Id && i.id !== item2Id);

      const updated = {
        ...state.character,
        gold: (state.character.gold || 0) - cost,
        inventory: [...filteredInventory, newItem]
      };

      saveToLocalStorage(updated);

      const successMsg = isLegendaryForge
        ? `⚡ FORJA LENDÁRIA! Os astros sorriram! ${newName} foi forjado com +50% de poder!`
        : `Fusão bem-sucedida! Gerou: ${newName}`;
      result = { success: true, message: successMsg, newItem };
      return { character: updated };
    });

    return result;
  }
}));
