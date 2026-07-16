import { create } from 'zustand';
import { Character, BaseStats, EquipmentItem, GameEvent, CitadelState } from '../core/types';
import { bridge } from '../bridge/GameBridge';
import { useRelicStore } from './useRelicStore';
import { useTowerStore } from './useTowerStore';
import { StatEngine } from '../core/StatEngine';
import { getXpNeededForLevel, legacyReconstructTotalXp, getTotalXpEarned, calculatePrestigePointsFromTotalXp } from '../core/XpEngine';
import {
  COMMAND_CENTER_MAX_LEVEL, COMMAND_CENTER_UPGRADE_COST,
  VAULT_MAX_LEVEL, VAULT_UPGRADE_COST,
  EXPEDITIONS_MAX_LEVEL, ACADEMY_MAX_LEVEL,
  EXPEDITION_ALLOCATION_GOLD_COST, EXPEDITION_ALLOCATION_DURATION_MS,
  EXPEDITIONS_UPGRADE_COST, EXPEDITIONS_MAX_SLOTS,
  ACADEMY_UPGRADE_COST, ACADEMY_MAX_RESEARCH_LEVEL, RESEARCH_COST,
  WATCH_TOWER_MAX_LEVEL, WATCH_TOWER_UPGRADE_COST, WATCH_TOWER_HOURS_PER_KEY, WATCH_TOWER_KEY_CAPACITY,
  FORGE_WORKSHOP_MAX_LEVEL, FORGE_WORKSHOP_UPGRADE_COST, FORGE_ORDER_HOURS, FORGE_ORDER_GOLD_COST, FORGE_ORDER_WOOD_COST, FORGE_ORDER_FRAGMENT_YIELD,
  COSMIC_SIPHON_MAX_LEVEL, COSMIC_SIPHON_UPGRADE_COST,
  SYNCHRONY_ALTAR_MAX_LEVEL, SYNCHRONY_ALTAR_UPGRADE_COST,
  RELIC_LAB_MAX_LEVEL, RELIC_LAB_UPGRADE_COST, RELIC_LAB_OVERHEAT_SLOTS, RELIC_OVERHEAT_GOLD_COST, RELIC_OVERHEAT_SOUL_FRAGMENT_COST,
  computeClassExpeditionProduction, getMysticFusionCost,
  getStructureUpgradeDurationMs, CitadelStructureKey,
} from '../core/citadelFormulas';

export const calculateItemSellValue = (item: EquipmentItem): number => {
  if (item.rarity === 'consumable') return 0;

  let baseValue = 15;
  switch (item.rarity) {
    case 'common':
      baseValue = 15;
      break;
    case 'rare':
      baseValue = 40;
      break;
    case 'epic':
      baseValue = 100;
      break;
    case 'legendary':
      baseValue = 250;
      break;
    case 'mystic':
      baseValue = 1000 * (item.mysticLevel || 1);
      break;
    default:
      baseValue = 15;
  }

  // Fator de escala por dificuldade (estágio em que o item foi gerado ou o estágio atual como fallback)
  const itemStage = item.stage || 1;
  const goldScale = Math.pow(1.25, itemStage - 1);
  let finalValue = baseValue * goldScale;

  // Bônus para itens de sets especiais (Ancestral, Celestial ou Pandemoníaco)
  if (item.setName) {
    if (item.setName.startsWith('Set Pandemoníaco')) {
      finalValue *= 3.0; // Itens Pandemoníacos valem 3x mais
    } else if (item.setName.startsWith('Set Celestial')) {
      finalValue *= 2.0; // Itens Celestiais valem 2x mais
    } else if (item.setName.startsWith('Set Ancestral')) {
      finalValue *= 1.5; // Itens Ancestrais valem 1.5x mais
    }
  }

  return Math.floor(Math.min(finalValue, 5000));
};

export const formatNumber = (num: number, abbreviate: boolean = false): string => {
  if (!abbreviate || num < 1000) {
    return Math.floor(num).toLocaleString();
  }

  const suffixes = [
    { value: 1e12, suffix: 'T' },
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'K' }
  ];

  for (const item of suffixes) {
    if (num >= item.value) {
      const formatted = (num / item.value).toFixed(1);
      return formatted.endsWith('.0') 
        ? `${Math.floor(num / item.value)}${item.suffix}` 
        : `${formatted}${item.suffix}`;
    }
  }
  return Math.floor(num).toLocaleString();
};

// Configurações de Atributos e Crescimento para cada Classe
export const getSkillMaxLevel = (skillId: string, currentStage: number): number => {
  const skill = SKILLS_CATALOG[skillId];
  if (!skill) return 0;
  
  // Ultimates só estão liberadas a partir da dificuldade Inferno (Fase 11+)
  if (skill.isUltimate && currentStage < 11) {
    return 0;
  }

  if (currentStage >= 21) {
    if (skill.type === 'passive') {
      return Infinity;
    }
    // Habilidades ativas exclusivas do Avatar escalam além do teto padrão de 15,
    // já que a classe tem poucas habilidades e sobra ponto sem essa extensão.
    const activeCap = skill.classId === 'avatar' ? 25 : 15;
    return Math.max(skill.maxLevel, activeCap);
  }
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
    baseStats: { strength: 12, magic: 4, dexterity: 8, constitution: 14, luck: 5, touch: 10, critChance: 5, critDamage: 150, robotClicks: 0 },
    growthRates: { strength: 2, magic: 0.5, dexterity: 1, constitution: 2.5, luck: 0.5, touch: 1.5, critChance: 0.1, critDamage: 1.0, robotClicks: 0 },
    initialSkills: ['slash', 'heal'],
    primaryStat: 'strength'
  },
  mage: {
    name: 'Mago',
    description: 'Mestre das artes arcanas que conjura magias destrutivas de fogo, gelo e eletricidade.',
    baseStats: { strength: 4, magic: 15, dexterity: 7, constitution: 8, luck: 5, touch: 10, critChance: 5, critDamage: 150, robotClicks: 0 },
    growthRates: { strength: 0.5, magic: 3, dexterity: 1, constitution: 1, luck: 0.5, touch: 1.5, critChance: 0.1, critDamage: 1.0, robotClicks: 0 },
    initialSkills: ['fireball', 'heal'],
    primaryStat: 'magic'
  },
  ranger: {
    name: 'Arqueiro',
    description: 'Atirador ágil que abate inimigos à distância com arco e flechas envenenadas.',
    baseStats: { strength: 6, magic: 5, dexterity: 15, constitution: 9, luck: 8, touch: 10, critChance: 8, critDamage: 160, robotClicks: 0 },
    growthRates: { strength: 1, magic: 0.5, dexterity: 3, constitution: 1.5, luck: 0.8, touch: 1.5, critChance: 0.2, critDamage: 1.5, robotClicks: 0 },
    initialSkills: ['arrow_shot', 'heal'],
    primaryStat: 'dexterity'
  },
  paladin: {
    name: 'Paladino',
    description: 'Guerreiro sagrado que defende a justiça divina. Seu dano escala com Constituição.',
    baseStats: { strength: 10, magic: 6, dexterity: 5, constitution: 16, luck: 5, touch: 10, critChance: 5, critDamage: 150, robotClicks: 0 },
    growthRates: { strength: 1.5, magic: 1, dexterity: 0.5, constitution: 3, luck: 0.5, touch: 1.5, critChance: 0.1, critDamage: 1.0, robotClicks: 0 },
    initialSkills: ['holy_strike', 'heal'],
    primaryStat: 'constitution'
  },
  cleric: {
    name: 'Clérigo',
    description: 'Servo dos deuses encarregado de curar aliados e punir infiéis com a ira divina.',
    baseStats: { strength: 7, magic: 13, dexterity: 5, constitution: 11, luck: 6, touch: 10, critChance: 5, critDamage: 150, robotClicks: 0 },
    growthRates: { strength: 1, magic: 2.5, dexterity: 0.5, constitution: 2, luck: 0.6, touch: 1.5, critChance: 0.1, critDamage: 1.0, robotClicks: 0 },
    initialSkills: ['holy_smite', 'heal'],
    primaryStat: 'magic'
  },
  rogue: {
    name: 'Ladrão',
    description: 'Assassino sorrateiro que ataca pelas sombras com adagas letais. Especialista em crítico.',
    baseStats: { strength: 8, magic: 3, dexterity: 16, constitution: 8, luck: 10, touch: 10, critChance: 12, critDamage: 180, robotClicks: 0 },
    growthRates: { strength: 1.5, magic: 0.5, dexterity: 3, constitution: 1, luck: 1.0, touch: 1.5, critChance: 0.3, critDamage: 2.0, robotClicks: 0 },
    initialSkills: ['stab', 'heal'],
    primaryStat: 'dexterity'
  },
  necromancer: {
    name: 'Necromante',
    description: 'Mestre da morte que drena a vida dos vivos e comanda lacaios sombrios das profundezas.',
    baseStats: { strength: 5, magic: 15, dexterity: 6, constitution: 10, luck: 12, touch: 10, critChance: 6, critDamage: 150, robotClicks: 0 },
    growthRates: { strength: 0.8, magic: 3.2, dexterity: 0.8, constitution: 1.8, luck: 1.5, touch: 1.5, critChance: 0.15, critDamage: 1.2, robotClicks: 0 },
    initialSkills: ['death_touch', 'heal'],
    primaryStat: 'magic'
  },
  avatar: {
    name: 'Avatar',
    description: 'A fusão de todas as energias. Todo o seu dano escala com o maior atributo ativo.',
    baseStats: { strength: 15, magic: 15, dexterity: 15, constitution: 15, luck: 15, touch: 15, critChance: 10, critDamage: 180, robotClicks: 0 },
    growthRates: { strength: 2.5, magic: 2.5, dexterity: 2.5, constitution: 2.5, luck: 2.5, touch: 2.5, critChance: 0.25, critDamage: 2.0, robotClicks: 0 },
    initialSkills: ['unified_echo', 'prismatic_barrier', 'ultimate_avatar', 'cosmic_convergence', 'heal'],
    primaryStat: 'magic'
  }
};

// Catálogo estático de melhorias de Prestígio (Roguelite)
export const PRESTIGE_UPGRADES_CATALOG: Record<string, { name: string; description: string; stat: keyof BaseStats; bonusPerLevel: number; costPerLevel: number; maxLevel: number }> = {
  perm_str: { name: 'Força Divina', description: 'Aumento definitivo de +12 em Strength por nível', stat: 'strength', bonusPerLevel: 12, costPerLevel: 3, maxLevel: 10 },
  perm_mag: { name: 'Mente Arcana', description: 'Aumento definitivo de +12 em Magic por nível', stat: 'magic', bonusPerLevel: 12, costPerLevel: 3, maxLevel: 10 },
  perm_dex: { name: 'Foco Ágil', description: 'Aumento definitivo de +6 em Dexterity por nível', stat: 'dexterity', bonusPerLevel: 6, costPerLevel: 3, maxLevel: 10 },
  perm_con: { name: 'Vigor Eterno', description: 'Aumento definitivo de +18 em Constitution por nível', stat: 'constitution', bonusPerLevel: 18, costPerLevel: 3, maxLevel: 10 },
  perm_luk: { name: 'Bênção da Sorte', description: 'Aumento definitivo de +6 em Luck por nível', stat: 'luck', bonusPerLevel: 6, costPerLevel: 3, maxLevel: 10 },
  perm_touch: { name: 'Toque Divino', description: 'Aumento definitivo de +8 em Poder do Toque por nível', stat: 'touch', bonusPerLevel: 8, costPerLevel: 3, maxLevel: 10 },
  perm_touch_crit: { name: 'Foco Crítico', description: 'Aumento de +3% na Chance de Crítico por nível', stat: 'critChance', bonusPerLevel: 3, costPerLevel: 3, maxLevel: 10 },
  perm_touch_crit_dmg: { name: 'Poder Devastador', description: 'Aumento de +15% no Dano Crítico por nível', stat: 'critDamage', bonusPerLevel: 15, costPerLevel: 3, maxLevel: 10 },
  perm_robot: { name: 'Robô Assistente', description: 'Invoca um assistente automático que desfere +1 Toque por segundo por nível', stat: 'robotClicks', bonusPerLevel: 1, costPerLevel: 5, maxLevel: 5 }
};

// Catálogo estático de melhorias de Transcendência
export const TRANSCENDENCE_UPGRADES_CATALOG: Record<string, {
  name: string;
  description: string;
  costPerLevel: number;
  maxLevel: number;
  bonusPerLevel: number;
}> = {
  mana_suprema: {
    name: 'Mana Suprema',
    description: 'Aumento de +10% de Max Mana Pct por nível (acumulativo)',
    costPerLevel: 1,
    maxLevel: 10,
    bonusPerLevel: 10
  },
  dominio_vazio: {
    name: 'Domínio do Vazio',
    description: 'Aumento de +5% de Dano contra Elites por nível',
    costPerLevel: 1,
    maxLevel: 10,
    bonusPerLevel: 5
  },
  foco_temporal: {
    name: 'Foco Temporal',
    description: 'Reduz o tempo de recarga de todas as habilidades em 3% por nível',
    costPerLevel: 1,
    maxLevel: 10,
    bonusPerLevel: 3
  },
  alma_avatar: {
    name: 'Alma do Avatar',
    description: 'Aumento multiplicativo de atributos base em +2% por nível',
    costPerLevel: 2,
    maxLevel: 5,
    bonusPerLevel: 2
  },
  avatar_pleno: {
    name: 'Avatar Pleno',
    description: 'Desbloqueia a classe Suprema Avatar (exige nível 5 nos outros upgrades)',
    costPerLevel: 5,
    maxLevel: 1,
    bonusPerLevel: 1
  }
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
  death_blossom: 4.5,

  // Ultimates (dano dobrado em relação ao valor original, para compensar o cooldown alto)
  ultimate_warrior: 24.0,
  ultimate_mage: 30.0,
  ultimate_ranger: 22.0,
  ultimate_paladin: 20.0,
  ultimate_cleric: 18.0,
  ultimate_rogue: 28.0,
  ultimate_necromancer: 26.0,

  // Necromancer
  death_touch: 1.6,
  bone_shield: 1.5,
  soul_siphon: 3.2,
  skeleton_army: 1.2,

  // Avatar
  unified_echo: 2.5,
  prismatic_barrier: 0.3,
  ultimate_avatar: 5.0
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
  isUltimate?: boolean;
  cooldown?: number;
  manaCost?: number;
}> = {
  // Guerreiro (Warrior)
  slash: { name: 'Slash', description: 'Corte rápido causando 150% do dano de Força.', cost: 1, maxLevel: 5, dependencies: [], type: 'active', requiredLevel: 1, classId: 'warrior' },
  shield_bash: { name: 'Impacto de Escudo', description: 'Impacto que causa 120% do dano de Força e atordoa o inimigo.', cost: 1, maxLevel: 5, dependencies: ['slash'], type: 'active', requiredLevel: 3, classId: 'warrior' },
  berserk: { name: 'Fúria Berserk', description: 'Aumento passivo permanente de +5 em Força.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { strength: 5 }, requiredLevel: 5, classId: 'warrior' },
  execute: { name: 'Executar', description: 'Golpe de misericórdia causando 300% do dano de Força.', cost: 2, maxLevel: 5, dependencies: ['shield_bash'], type: 'active', requiredLevel: 7, classId: 'warrior' },
  battle_cry: { name: 'Grito de Guerra', description: 'Intimida oponentes. Aumento passivo de +5 em Constituição.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { constitution: 5 }, requiredLevel: 9, classId: 'warrior' },
  bladestorm: { name: 'Tempestade de Aço', description: 'Ataque giratório contínuo que causa 400% de Força.', cost: 3, maxLevel: 5, dependencies: ['execute'], type: 'active', requiredLevel: 11, classId: 'warrior' },
  ultimate_warrior: { name: 'Cólera dos Titãs', description: 'Guerreia com fúria divina descarregando um golpe sísmico que causa 2400% de Força. (Ultimate)', cost: 5, maxLevel: 5, dependencies: ['bladestorm'], type: 'active', requiredLevel: 15, classId: 'warrior', isUltimate: true, cooldown: 60000, manaCost: 50 },

  // Mago (Mage)
  fireball: { name: 'Fireball', description: 'Conjura uma esfera de fogo causando 250% de Magia.', cost: 1, maxLevel: 5, dependencies: [], type: 'active', requiredLevel: 1, classId: 'mage' },
  frostbolt: { name: 'Raio de Gelo', description: 'Causa 150% de Magia e reduz a velocidade do oponente.', cost: 1, maxLevel: 5, dependencies: ['fireball'], type: 'active', requiredLevel: 3, classId: 'mage' },
  mana_shield: { name: 'Escudo de Mana', description: 'Converte mana em barreira. Aumento passivo de +5 em Magia.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { magic: 5 }, requiredLevel: 5, classId: 'mage' },
  lightning: { name: 'Relâmpago', description: 'Descarga elétrica que causa 350% de Magia.', cost: 2, maxLevel: 5, dependencies: ['frostbolt'], type: 'active', requiredLevel: 7, classId: 'mage' },
  arcane_intellect: { name: 'Brilho Arcano', description: 'Expansão mental. Aumento passivo de +5 em Magia.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { magic: 5 }, requiredLevel: 9, classId: 'mage' },
  meteor: { name: 'Meteoro', description: 'Evoca um meteoro cataclísmico que causa 500% de Magia.', cost: 3, maxLevel: 5, dependencies: ['lightning'], type: 'active', requiredLevel: 11, classId: 'mage' },
  ultimate_mage: { name: 'Supernova', description: 'Colapsa energia arcana em uma explosão estelar massiva, causando 3000% de Magia. (Ultimate)', cost: 5, maxLevel: 5, dependencies: ['meteor'], type: 'active', requiredLevel: 15, classId: 'mage', isUltimate: true, cooldown: 70000, manaCost: 80 },

  // Arqueiro (Ranger)
  arrow_shot: { name: 'Disparo Preciso', description: 'Tiro rápido causando 150% do dano de Destreza.', cost: 1, maxLevel: 5, dependencies: [], type: 'active', requiredLevel: 1, classId: 'ranger' },
  poison_arrow: { name: 'Flecha Venenosa', description: 'Flecha tóxica causando 100% de Destreza com veneno ativo.', cost: 1, maxLevel: 5, dependencies: ['arrow_shot'], type: 'active', requiredLevel: 3, classId: 'ranger' },
  eagle_eye: { name: 'Olho de Águia', description: 'Visão aprimorada. Aumento passivo de +5 em Destreza.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { dexterity: 5 }, requiredLevel: 5, classId: 'ranger' },
  double_shot: { name: 'Disparo Duplo', description: 'Dispara duas flechas simultâneas causadoras de 280% de Destreza.', cost: 2, maxLevel: 5, dependencies: ['poison_arrow'], type: 'active', requiredLevel: 7, classId: 'ranger' },
  fleet_footed: { name: 'Passo Ligeiro', description: 'Passividade ágil. Aumento de +3 em Destreza e +2 em Constituição.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { dexterity: 3, constitution: 2 }, requiredLevel: 9, classId: 'ranger' },
  rain_arrows: { name: 'Chuva de Flechas', description: 'Saraivada de flechas que causa 420% de Destreza.', cost: 3, maxLevel: 5, dependencies: ['double_shot'], type: 'active', requiredLevel: 11, classId: 'ranger' },
  ultimate_ranger: { name: 'Flecha do Juízo Final', description: 'Dispara um projétil infundido com energia cósmica que perfura e causa 2200% de Destreza. (Ultimate)', cost: 5, maxLevel: 5, dependencies: ['rain_arrows'], type: 'active', requiredLevel: 15, classId: 'ranger', isUltimate: true, cooldown: 55000, manaCost: 45 },

  // Paladino (Paladin)
  holy_strike: { name: 'Golpe Sagrado', description: 'Ataque abençoado causando 150% de Constituição.', cost: 1, maxLevel: 5, dependencies: [], type: 'active', requiredLevel: 1, classId: 'paladin' },
  shield_righteousness: { name: 'Escudo da Justiça', description: 'Golpe de escudo causando 120% de Constituição.', cost: 1, maxLevel: 5, dependencies: ['holy_strike'], type: 'active', requiredLevel: 3, classId: 'paladin' },
  retribution: { name: 'Retribuição Aura', description: 'Aura passiva. Aumento de +5 em Constituição permanentemente.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { constitution: 5 }, requiredLevel: 5, classId: 'paladin' },
  smite_paladin: { name: 'Punição da Luz', description: 'Causa 250% de dano misto de Constituição e Força.', cost: 2, maxLevel: 5, dependencies: ['shield_righteousness'], type: 'active', requiredLevel: 7, classId: 'paladin' },
  sacred_duty: { name: 'Dever Sagrado', description: 'Aumento passivo de +3 em Força e +3 em Constituição.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { strength: 3, constitution: 3 }, requiredLevel: 9, classId: 'paladin' },
  consecration: { name: 'Consagração', description: 'Santifica o solo causando 380% de Constituição.', cost: 3, maxLevel: 5, dependencies: ['smite_paladin'], type: 'active', requiredLevel: 11, classId: 'paladin' },
  ultimate_paladin: { name: 'Julgamento Sagrado', description: 'Evoca uma espada de luz do céu causando 2000% de Constituição sagrada. (Ultimate)', cost: 5, maxLevel: 5, dependencies: ['consecration'], type: 'active', requiredLevel: 15, classId: 'paladin', isUltimate: true, cooldown: 65000, manaCost: 60 },

  // Clérigo (Cleric)
  holy_smite: { name: 'Golpe de Fé', description: 'Punição divina causando 150% de Magia.', cost: 1, maxLevel: 5, dependencies: [], type: 'active', requiredLevel: 1, classId: 'cleric' },
  bless: { name: 'Bênção Divina', description: 'Preces sagradas. Aumento passivo de +5 em Magia.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { magic: 5 }, requiredLevel: 3, classId: 'cleric' },
  divine_shield: { name: 'Escudo Sagrado', description: 'Barreira passiva. Aumento de +5 em Constituição.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { constitution: 5 }, requiredLevel: 5, classId: 'cleric' },
  wrath_heaven: { name: 'Ira do Céu', description: 'Relâmpago sagrado que causa 300% de Magia.', cost: 2, maxLevel: 5, dependencies: ['holy_smite'], type: 'active', requiredLevel: 7, classId: 'cleric' },
  spirit_growth: { name: 'Crescimento Espiritual', description: 'Conexão divina. Aumento passivo de +3 em Magia e +3 em Constituição.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { magic: 3, constitution: 3 }, requiredLevel: 9, classId: 'cleric' },
  divine_judgement: { name: 'Julgamento Final', description: 'Raios sagrados massivos causando 450% de Magia.', cost: 3, maxLevel: 5, dependencies: ['wrath_heaven'], type: 'active', requiredLevel: 11, classId: 'cleric' },
  ultimate_cleric: { name: 'Ascensão Celestial', description: 'Prece suprema que causa 1800% de Magia e cura 100% da vida máxima. (Ultimate)', cost: 5, maxLevel: 5, dependencies: ['divine_judgement'], type: 'active', requiredLevel: 15, classId: 'cleric', isUltimate: true, cooldown: 80000, manaCost: 70 },

  // Ladrão (Rogue)
  stab: { name: 'Apunhalar', description: 'Golpe rápido com adagas causando 180% de Destreza.', cost: 1, maxLevel: 5, dependencies: [], type: 'active', requiredLevel: 1, classId: 'rogue' },
  poison_dagger: { name: 'Adaga de Veneno', description: 'Lança adaga tóxica causando 120% de Destreza mais veneno ao longo do tempo.', cost: 1, maxLevel: 5, dependencies: ['stab'], type: 'active', requiredLevel: 3, classId: 'rogue' },
  stealth: { name: 'Manto de Sombras', description: 'Furtividade passiva. Aumento definitivo de +5 em Destreza.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { dexterity: 5 }, requiredLevel: 5, classId: 'rogue' },
  backstab: { name: 'Ataque Furtivo', description: 'Ataque surpresa por trás causando 320% de Destreza.', cost: 2, maxLevel: 5, dependencies: ['poison_dagger'], type: 'active', requiredLevel: 7, classId: 'rogue' },
  shadowstep: { name: 'Passo Sombrio', description: 'Aumento passivo de +3 em Destreza e +3 em Força.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { dexterity: 3, strength: 3 }, requiredLevel: 9, classId: 'rogue' },
  death_blossom: { name: 'Florescer Letal', description: 'Redemoinho de cortes causando 450% de Destreza.', cost: 3, maxLevel: 5, dependencies: ['backstab'], type: 'active', requiredLevel: 11, classId: 'rogue' },
  ultimate_rogue: { name: 'Lâmina da Aniquilação', description: 'Surge das sombras desferindo um corte letal instantâneo que causa 2800% de Destreza. (Ultimate)', cost: 5, maxLevel: 5, dependencies: ['death_blossom'], type: 'active', requiredLevel: 15, classId: 'rogue', isUltimate: true, cooldown: 50000, manaCost: 50 },

  // Necromante (Necromancer)
  death_touch: { name: 'Toque da Morte', description: 'Causa 160% de dano mágico e cura o herói através da mecânica de Cura de Drenagem.', cost: 1, maxLevel: 5, dependencies: [], type: 'active', requiredLevel: 1, classId: 'necromancer' },
  bone_shield: { name: 'Escudo Ósseo', description: 'Reduz o damage recebido em 20% por 6 segundos. Ao expirar, causa 150% de dano de Constituição.', cost: 1, maxLevel: 5, dependencies: ['death_touch'], type: 'active', requiredLevel: 3, classId: 'necromancer' },
  cold_blood: { name: 'Sangue Frio', description: 'Aumento passivo de +5 em Magia e +2 em Sorte por nível na árvore.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { magic: 5, luck: 2 }, requiredLevel: 5, classId: 'necromancer' },
  soul_siphon: { name: 'Sifão de Almas', description: 'Causa 320% de dano mágico. Se o inimigo morrer sob o efeito, restaura 20% da mana total.', cost: 2, maxLevel: 5, dependencies: ['bone_shield'], type: 'active', requiredLevel: 7, classId: 'necromancer' },
  grave_echoes: { name: 'Ecos da Tumba', description: 'Aumento passivo permanente de +5 em Constituição por nível na árvore.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { constitution: 5 }, requiredLevel: 9, classId: 'necromancer' },
  skeleton_army: { name: 'Exército de Esqueletos', description: 'Conjura servos que atacam continuamente causando 120% de dano por segundo por 8 segundos.', cost: 3, maxLevel: 5, dependencies: ['soul_siphon'], type: 'active', requiredLevel: 11, classId: 'necromancer' },
  ultimate_necromancer: { name: 'Ceifa das Almas Perdidas', description: 'Ressuscita o último monstro morto como lacaio por 10s, causando o dobro do dano de ataque que ele causava em vida. (Ultimate)', cost: 5, maxLevel: 5, dependencies: ['skeleton_army'], type: 'active', requiredLevel: 15, classId: 'necromancer', isUltimate: true, cooldown: 60000, manaCost: 75 },

  // Avatar
  unified_echo: { name: 'Eco Unificado', description: 'Causa 250% do maior atributo como dano do tipo elemental do inimigo.', cost: 1, maxLevel: 5, dependencies: [], type: 'active', requiredLevel: 1, classId: 'avatar' },
  prismatic_barrier: { name: 'Barreira Prismática', description: 'Escuda o jogador em 30% do maior atributo por 5 segundos.', cost: 1, maxLevel: 5, dependencies: [], type: 'active', requiredLevel: 1, classId: 'avatar' },
  ultimate_avatar: { name: 'Coro da Alma Inteira', description: 'Canaliza o poder de todos os cacos, causando dano imediato de (Str + Mag + Dex + Con + Luk) x 10.0. (Ultimate)', cost: 5, maxLevel: 5, dependencies: [], type: 'active', requiredLevel: 1, classId: 'avatar', isUltimate: true, cooldown: 60000, manaCost: 100 },
  cosmic_convergence: { name: 'Convergência das Cinco Almas', description: 'Sintoniza permanentemente as cinco energias cardinais. Aumento passivo de +5 em Força, Magia, Destreza, Constituição e Sorte por nível.', cost: 1, maxLevel: 5, dependencies: [], type: 'passive', statBonuses: { strength: 5, magic: 5, dexterity: 5, constitution: 5, luck: 5 }, requiredLevel: 1, classId: 'avatar' },

  // Comum
  heal: { name: 'Cura', description: 'Restaura 15% da vida máxima usando mana.', cost: 1, maxLevel: 5, dependencies: [], type: 'active', requiredLevel: 1, classId: 'common' }
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

// Registro paralelo ao de níveis globais, mas preservando a identidade (slot + nome do personagem)
// de cada save — usado para permitir que a mesma classe apareça mais de uma vez na Expedição
// quando nivelada por personagens diferentes.
export const GLOBAL_CLASS_CHARACTERS_KEY = 'medieval_idle_global_class_characters';

export interface GlobalClassCharacterEntry {
  slotIndex: number;
  characterName: string;
  level: number;
}

export const getGlobalClassCharacters = (): Record<string, GlobalClassCharacterEntry[]> => {
  try {
    const saved = localStorage.getItem(GLOBAL_CLASS_CHARACTERS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export const updateGlobalClassCharacters = (
  slotIndex: number,
  characterName: string,
  classLevels: Record<string, number>
) => {
  try {
    const current = getGlobalClassCharacters();
    const updated = { ...current };
    Object.entries(classLevels).forEach(([classId, level]) => {
      if (!level || level <= 0) return;
      const list = (updated[classId] || []).filter((e) => e.slotIndex !== slotIndex);
      list.push({ slotIndex, characterName, level });
      updated[classId] = list;
    });
    localStorage.setItem(GLOBAL_CLASS_CHARACTERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Erro ao atualizar registro global de personagens por classe:', e);
  }
};

export const isClassUnlocked = (classId: string, classLevels: Record<string, number>): boolean => {
  if (classId === 'warrior' || classId === 'mage' || classId === 'ranger') return true;
  
  const globalClassLevels = getGlobalClassLevels();
  const getLevel = (id: string) => Math.max(classLevels[id] || 0, globalClassLevels[id] || 0);

  if (classId === 'paladin') return getLevel('warrior') >= 50;
  if (classId === 'cleric') return getLevel('mage') >= 50;
  if (classId === 'rogue') return getLevel('ranger') >= 50;
  if (classId === 'necromancer') return getLevel('cleric') >= 50 && getLevel('rogue') >= 50;
  if (classId === 'avatar') {
    try {
      const state = useGameStore.getState();
      if (state && state.character) {
        const hasPleno = state.character.transcendenceUpgrades?.['avatar_pleno'] || 0;
        if (hasPleno > 0) return true;
      }
    } catch {}
    try {
      const activeCharSlot = localStorage.getItem('medieval_idle_current_slot');
      if (activeCharSlot) {
        const savedCharRaw = localStorage.getItem(`medieval_idle_save_slot_${activeCharSlot}`);
        if (savedCharRaw) {
          const savedChar = JSON.parse(savedCharRaw);
          const hasPleno = savedChar.transcendenceUpgrades?.['avatar_pleno'] || 0;
          if (hasPleno > 0) return true;
        }
      }
    } catch {}
    return false;
  }
  return false;
};

let savedStageBeforeChallenge = 1;
let savedEnemiesDefeatedBeforeChallenge = 0;

// Versão do formato de save — incrementar ao introduzir uma mudança de formato que precise de
// migração explícita em mergeLoadedCharacter (hoje nenhuma migração depende disso ainda).
const CURRENT_SAVE_VERSION = 1;

const saveToLocalStorage = (char: Character) => {
  try {
    // Adiciona carimbo de data/hora do salvamento
    const updatedChar = {
      ...char,
      lastSaved: new Date().toISOString(),
      saveVersion: CURRENT_SAVE_VERSION,
    };
    
    // Se o salvamento ocorrer durante o Desafio Diário, restaura os dados originais no JSON salvo
    if (updatedChar.activeDailyChallenge) {
      updatedChar.activeDailyChallenge = false;
      updatedChar.currentStage = savedStageBeforeChallenge;
      updatedChar.enemiesDefeatedInStage = savedEnemiesDefeatedBeforeChallenge;
    }
    
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

      // Atualiza o registro de personagens por classe (com identidade de save), usado pela Expedição
      if (updatedChar.classLevels) {
        updateGlobalClassCharacters(Number(currentSlot), updatedChar.name, updatedChar.classLevels);
      }
    }
  } catch (e) {
    console.error('Falha ao salvar jogo no localStorage:', e);
  }
};

// Normaliza allocatedClasses de saves antigos (formato { classId, expiresAt }, sem slotIndex/characterName)
// para o formato atual, evitando quebrar a tela de Expedição ao carregar saves pré-existentes.
const normalizeAllocatedClasses = (
  raw: { classId: string; slotIndex?: number; characterName?: string; expiresAt: number }[] | undefined
): { classId: string; slotIndex: number; characterName: string; expiresAt: number }[] => {
  if (!raw) return [];
  return raw.map((a) => ({
    classId: a.classId,
    slotIndex: typeof a.slotIndex === 'number' ? a.slotIndex : -1,
    characterName: a.characterName || CLASS_CONFIGS[a.classId]?.name || a.classId,
    expiresAt: a.expiresAt,
  }));
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
  abbreviateNumbers: boolean;
  autoSellCommon: boolean;
  autoSellRare: boolean;
  disableRobotTap: boolean;
  economyModeEnabled: boolean;
  currentSlot: number | null;
  toggleSfx(): void;
  toggleBgm(): void;
  setSfxVolume(vol: number): void;
  setBgmVolume(vol: number): void;
  toggleConsole(): void;
  toggleAbbreviateNumbers(): void;
  toggleAutoSellCommon(): void;
  toggleAutoSellRare(): void;
  toggleDisableRobotTap(): void;
  toggleEconomyMode(): void;
  setCharacter(character: Character): void;
  setScreen(screen: 'menu' | 'character_select' | 'playing' | 'options' | 'saves'): void;
  setZoomLevel(zoomLevel: number): void;
  addGold(amount: number): void;
  addForgeFragments(amount: number): void;
  addTranscendenceEssence(amount: number): void;
  addMaterials(wood: number, stone: number, meat: number): void;
  buildOrUpgradeCommandCenter(): { success: boolean; message: string };
  buildOrUpgradeVault(): { success: boolean; message: string };
  depositItemToVault(itemId: string): { success: boolean; message: string };
  withdrawItemFromVault(itemId: string): { success: boolean; message: string };
  tickCitadelProduction(): void;
  buildOrUpgradeExpeditions(): { success: boolean; message: string };
  allocateClassToExpedition(classId: string, slotIndex: number): { success: boolean; message: string };
  deallocateClassFromExpedition(classId: string, slotIndex: number): { success: boolean; message: string };
  buildOrUpgradeAcademy(): { success: boolean; message: string };
  upgradeAcademyResearch(type: 'dmg' | 'hp' | 'speed' | 'touchDmg' | 'critDmg' | 'towerKey' | 'soulFragment'): { success: boolean; message: string };
  buildOrUpgradeWatchTower(): { success: boolean; message: string };
  buildOrUpgradeForgeWorkshop(): { success: boolean; message: string };
  buildOrUpgradeCosmicSiphon(): { success: boolean; message: string };
  buildOrUpgradeSynchronyAltar(): { success: boolean; message: string };
  buildOrUpgradeRelicLab(): { success: boolean; message: string };
  overheatRelic(relicId: string): { success: boolean; message: string };
  addXp(amount: number): void;
  upgradeAttribute(stat: keyof BaseStats, amount?: number): void;
  unlockSkill(skillId: string): void;
  updateLevel(level: number, xp: number): void;
  incrementPrestigePoints(points: number): void;
  performPrestige(): void;
  unlockPandemonium(): void;
  upgradePrestigeStat(upgradeId: string): void;
  performTranscendence(): void;
  upgradeTranscendenceStat(upgradeId: string): void;
  resetTranscendenceUpgrades(): void;
  unlockOrUpgradeSkill(skillId: string): void;
  selectClass(classId: string): void;
  startNewGame(classId: string, name?: string): void;
  loadSavedGame(): boolean;
  advanceStage(): void;
  resetStageProgress(): void;
  resetAllData(): void;
  toggleAutoCast(): void;
  updateAutoCastSettings(healPercent: number, disabledSkills: string[]): void;
  toggleTestMode(): void;
  toggleEcoterra(): void;
  registerEnemyKill(enemyId: string): void;

  // Estatísticas completas: recordes de combate (v)
  updateBestCombatStats(stats: {
    damageDealt?: number;
    maxHP?: number;
    critChance?: number;
    dropChancePct?: number;
    damageReductionPct?: number;
    attackSpeedMultiplier?: number;
    dodgeChance?: number;
  }): void;

  // Novos métodos de gerenciamento de save slots
  setCurrentSlot(slot: number | null): void;
  saveGameToSlot(slotIndex: number): void;
  loadGameFromSlot(slotIndex: number): boolean;
  deleteSlot(slotIndex: number): void;
  importSave(slotIndex: number, rawData: string): boolean;
  exportSave(slotIndex: number): string | null;

  // Novos métodos de equipamentos e inventário (v1.1.0)
  equipItem(itemId: string): void;
  unequipItem(slot: 'head' | 'chest' | 'legs' | 'gloves' | 'weapon' | 'necklace'): void;
  discardItem(itemId: string): void;
  sellItem(itemId: string): void;
  dismantleItem(itemId: string): void;
  sellAllCommonAndRare(): void;
  sellAllLegendary(): void;
  addItemToInventory(item: EquipmentItem): boolean;
  
  // Reforja de itens (v2.0.0)
  reforgeItems(item1Id: string, item2Id: string): { success: boolean; message: string; newItem?: EquipmentItem };

  // Loja e Consumíveis (v3.0.0)
  buyConsumable(type: 'chest_legendary' | 'chest_ancestral' | 'boost_touch' | 'boost_touch_x3' | 'relic_chest' | 'inventory_slot'): { success: boolean; message: string };
  buyTranscendenceConsumable(type: 'elixir_transcendental' | 'cristal_forja_eterna' | 'chave_fenda_temporal'): { success: boolean; message: string };
  useConsumable(itemId: string): { success: boolean; message: string };
  
  // Controle de Velocidade de Jogo (v1.1.4 - Aceleração)
  gameSpeed: number;
  setGameSpeed(speed: number): void;
  markIntroLoreAsShown(): void;

  // Desafio Diário e Recordes Pessoais (v3.6.0)
  startDailyChallenge(): void;
  completeDailyChallenge(): void;
  exitDailyChallenge(success: boolean): void;
  getTodayYYYYMMDD(): string;
}

export interface PersonalRecords {
  maxStageReached: number;
  maxPPGainedInSingleReset: number;
  minTimeToStage20: number;
  totalAscensions: number;
}

export const getPersonalRecords = (): PersonalRecords => {
  try {
    const raw = localStorage.getItem('medieval_idle_personal_records');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        maxStageReached: parsed.maxStageReached ?? 0,
        maxPPGainedInSingleReset: parsed.maxPPGainedInSingleReset ?? 0,
        minTimeToStage20: parsed.minTimeToStage20 ?? 999999,
        totalAscensions: parsed.totalAscensions ?? 0
      };
    }
  } catch (e) {
    console.error(e);
  }
  return {
    maxStageReached: 0,
    maxPPGainedInSingleReset: 0,
    minTimeToStage20: 999999,
    totalAscensions: 0
  };
};

export const savePersonalRecords = (records: PersonalRecords): void => {
  try {
    localStorage.setItem('medieval_idle_personal_records', JSON.stringify(records));
  } catch (e) {
    console.error('Erro ao salvar recordes pessoais:', e);
  }
};

const DEFAULT_CITADEL = (): CitadelState => ({
  unlocked: false,
  commandCenter: { level: 1, lastTick: Date.now() },
  vault: { level: 0, lastTick: Date.now(), storedItems: [] as EquipmentItem[] },
  expeditions: { level: 0, lastTick: Date.now(), allocatedClasses: [] as { classId: string; slotIndex: number; characterName: string; expiresAt: number }[] },
  academy: {
    level: 0, lastTick: Date.now(),
    researchDmgLevel: 0, researchHpLevel: 0, researchSpeedLevel: 0,
    researchTouchDmgLevel: 0, researchCritDmgLevel: 0,
    researchTowerKeyLevel: 0, researchSoulFragmentLevel: 0,
  },
  watchTower: { level: 0, lastTick: Date.now(), storedKeys: 0 },
  forgeWorkshop: { level: 0, lastTick: Date.now() },
  cosmicSiphon: { level: 0, lastTick: Date.now() },
  synchronyAltar: { level: 0, lastTick: Date.now() },
  relicLab: { level: 0, lastTick: Date.now(), overheatedRelicIds: [] as string[] },
});

const DEFAULT_MATERIALS = () => ({ wood: 0, stone: 0, meat: 0, studyInsignias: 0 });

const DEFAULT_CHARACTER = (classId: string = 'warrior', name?: string): Character => {
  const config = CLASS_CONFIGS[classId] || CLASS_CONFIGS.warrior;
  return {
    id: 'default-char',
    name: name?.trim() || config.name,
    classId: classId,
    level: 1,
    xp: 0,
    totalXpEarned: 0,
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
    autoCastHealPercent: 50,
    autoCastDisabledSkills: [],
    killCount: {},
    equipment: { head: null, chest: null, legs: null, gloves: null, weapon: null, necklace: null },
    inventory: [],
    inventorySlots: 30,
    pandemoniumUnlocked: false,
    activePandemonium: false,
    testMode: false,
    introLoreShown: false,
    lastCompletedDailyChallenge: '',
    activeDailyChallenge: false,
    runStartTime: Date.now(),
    purgatoryCompleted: false,
    forgeFragments: 0,
    ascensionNotified: false,
    transcendencePoints: 0,
    transcendenceUpgrades: {},
    lifetimePrestigePointsAccumulated: 0,
    transcendenceCount: 0,
    transcendenceLoreShown: false,
    activeEcoterra: false,
    transcendenceEssence: 0,
    materials: DEFAULT_MATERIALS(),
    citadel: DEFAULT_CITADEL(),
    bestDamageDealt: 0,
    bestMaxHP: 0,
    bestCritChance: 0,
    bestDropChancePct: 0,
    bestDamageReductionPct: 0,
    bestAttackSpeedMultiplier: 0,
    bestDodgeChance: 0,
    totalEnemiesKilledLifetime: 0,
    totalEquipmentDropped: 0,
    totalFragmentsDropped: 0,
    totalTowerKeysDropped: 0,
    fastestAscensionSeconds: undefined,
    totalForgeFragmentsSpent: 0,
    totalGoldSpentInForge: 0,
    totalGoldEarnedLifetime: 0,
    totalXpEarnedLifetime: 0,
    totalMaterialsFarmedByCitadel: DEFAULT_MATERIALS(),
  };
};

const clampNonNegativeFinite = (value: number | undefined, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, value);
};

// Reconstrói um Character salvo (localStorage, slot ou import) aplicando os defaults da classe
// para qualquer campo ausente/corrompido. Usado por loadSavedGame, loadGameFromSlot e importSave
// para evitar que a lógica de merge divirja entre os três caminhos de carregamento.
const mergeLoadedCharacter = (char: Character): Character => {
  const defaults = DEFAULT_CHARACTER(char.classId);
  const hasProgress = (char.level && char.level > 1) ||
                      (char.highestStageReached && char.highestStageReached > 1) ||
                      (char.gold && char.gold > 0) ||
                      (char.ascensionCount && char.ascensionCount > 0);
  const merged: Character = {
    ...defaults,
    ...char,
    introLoreShown: char.introLoreShown !== undefined ? char.introLoreShown : (hasProgress ? true : false),
    lastCompletedDailyChallenge: char.lastCompletedDailyChallenge || '',
    activeDailyChallenge: false,
    runStartTime: char.runStartTime !== undefined ? char.runStartTime : Date.now(),
    gold: clampNonNegativeFinite(char.gold, defaults.gold),
    level: clampNonNegativeFinite(char.level, defaults.level) || 1,
    currentStage: clampNonNegativeFinite(char.currentStage, defaults.currentStage) || 1,
    attributePoints: clampNonNegativeFinite(char.attributePoints, defaults.attributePoints),
    skillPoints: clampNonNegativeFinite(char.skillPoints, defaults.skillPoints),
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
    forgeFragments: char.forgeFragments !== undefined ? char.forgeFragments : 0,
    transcendencePoints: char.transcendencePoints !== undefined ? char.transcendencePoints : 0,
    transcendenceUpgrades: char.transcendenceUpgrades || {},
    transcendenceCount: char.transcendenceCount !== undefined ? char.transcendenceCount : 0,
    transcendenceLoreShown: char.transcendenceLoreShown !== undefined ? char.transcendenceLoreShown : false,
    activeEcoterra: char.activeEcoterra !== undefined ? char.activeEcoterra : false,
    transcendenceEssence: char.transcendenceEssence !== undefined ? char.transcendenceEssence : 0,
    materials: { ...(defaults.materials || DEFAULT_MATERIALS()), ...(char.materials || DEFAULT_MATERIALS()) },
    // Estatísticas completas: contadores novos, sem forma de reconstruir retroativamente o histórico
    // de saves anteriores a esta versão — começam do zero via defaults.
    totalMaterialsFarmedByCitadel: { ...(defaults.totalMaterialsFarmedByCitadel || DEFAULT_MATERIALS()), ...(char.totalMaterialsFarmedByCitadel || {}) },
    citadel: {
      ...defaults.citadel,
      ...(char.citadel || {}),
      // Retrocompatibilidade: saves que já haviam ascendido antes da v5.1.0 desbloqueiam a Cidadela retroativamente
      unlocked: (char.citadel?.unlocked || false) || (char.ascensionCount || 0) >= 1,
      commandCenter: { ...defaults.citadel!.commandCenter, ...(char.citadel?.commandCenter || {}) },
      vault: { ...defaults.citadel!.vault, ...(char.citadel?.vault || {}), storedItems: char.citadel?.vault?.storedItems || [] },
      expeditions: { ...defaults.citadel!.expeditions, ...(char.citadel?.expeditions || {}), allocatedClasses: normalizeAllocatedClasses(char.citadel?.expeditions?.allocatedClasses) },
      academy: { ...defaults.citadel!.academy, ...(char.citadel?.academy || {}) },
      watchTower: { ...defaults.citadel!.watchTower, ...(char.citadel?.watchTower || {}) },
      forgeWorkshop: { ...defaults.citadel!.forgeWorkshop, ...(char.citadel?.forgeWorkshop || {}) },
      cosmicSiphon: { ...defaults.citadel!.cosmicSiphon, ...(char.citadel?.cosmicSiphon || {}) },
      synchronyAltar: { ...defaults.citadel!.synchronyAltar, ...(char.citadel?.synchronyAltar || {}) },
      relicLab: { ...defaults.citadel!.relicLab, ...(char.citadel?.relicLab || {}), overheatedRelicIds: char.citadel?.relicLab?.overheatedRelicIds || [] },
    },
    totalXpEarned: char.totalXpEarned !== undefined
      ? char.totalXpEarned
      : legacyReconstructTotalXp(char.level || 1, char.xp || 0),
    lifetimePrestigePointsAccumulated: (() => {
      if (char.lifetimePrestigePointsAccumulated !== undefined) return char.lifetimePrestigePointsAccumulated;
      const curPP = char.prestigePoints || 0;
      const spentPP = Object.entries(char.prestigeUpgrades || {}).reduce((sum, [id, lvl]) => {
        const upgrade = PRESTIGE_UPGRADES_CATALOG[id];
        if (upgrade && lvl > 0) {
          for (let i = 1; i <= lvl; i++) {
            sum += upgrade.costPerLevel * i;
          }
        }
        return sum;
      }, 0);
      return curPP + spentPP;
    })(),
  };

  if (merged.classLevels) {
    updateGlobalClassLevels(merged.classLevels);
  }

  return merged;
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

  abbreviateNumbers: (() => {
    try {
      const saved = localStorage.getItem('rpg_abbreviate_numbers');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  })(),

  autoSellCommon: (() => {
    try {
      const saved = localStorage.getItem('rpg_auto_sell_common');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  })(),

  autoSellRare: (() => {
    try {
      const saved = localStorage.getItem('rpg_auto_sell_rare');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  })(),

  disableRobotTap: (() => {
    try {
      const saved = localStorage.getItem('rpg_disable_robot_tap');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  })(),

  economyModeEnabled: (() => {
    try {
      const saved = localStorage.getItem('rpg_economy_mode');
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

  toggleAbbreviateNumbers: () => set((state) => {
    const val = !state.abbreviateNumbers;
    try {
      localStorage.setItem('rpg_abbreviate_numbers', String(val));
    } catch (e) {}
    return { abbreviateNumbers: val };
  }),

  toggleAutoSellCommon: () => set((state) => {
    const isAutoDismantleActive = (state.character.citadel?.forgeWorkshop.level || 0) >= 5;
    if (isAutoDismantleActive) return state;
    const val = !state.autoSellCommon;
    try {
      localStorage.setItem('rpg_auto_sell_common', String(val));
    } catch (e) {}
    return { autoSellCommon: val };
  }),

  toggleAutoSellRare: () => set((state) => {
    const isAutoDismantleActive = (state.character.citadel?.forgeWorkshop.level || 0) >= 5;
    if (isAutoDismantleActive) return state;
    const val = !state.autoSellRare;
    try {
      localStorage.setItem('rpg_auto_sell_rare', String(val));
    } catch (e) {}
    return { autoSellRare: val };
  }),

  toggleDisableRobotTap: () => set((state) => {
    const val = !state.disableRobotTap;
    try {
      localStorage.setItem('rpg_disable_robot_tap', String(val));
    } catch (e) {}
    return { disableRobotTap: val };
  }),

  toggleEconomyMode: () => set((state) => {
    const val = !state.economyModeEnabled;
    try {
      localStorage.setItem('rpg_economy_mode', String(val));
    } catch (e) {}
    return { economyModeEnabled: val };
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
  setGameSpeed: (speed) => set((state) => {
    const ascensionCount = state.character.ascensionCount || 0;
    if (speed === 2 && ascensionCount < 1) return state;
    if (speed === 3 && ascensionCount < 5) return state;
    return { gameSpeed: speed };
  }),

  addGold: (amount) => set((state) => {
    const updated = {
      ...state.character,
      gold: (state.character.gold || 0) + amount,
      totalGoldEarnedLifetime: amount > 0
        ? (state.character.totalGoldEarnedLifetime || 0) + amount
        : (state.character.totalGoldEarnedLifetime || 0)
    };
    saveToLocalStorage(updated);
    return { character: updated };
  }),

  addForgeFragments: (amount) => set((state) => {
    const updated = {
      ...state.character,
      forgeFragments: (state.character.forgeFragments || 0) + amount
    };
    saveToLocalStorage(updated);
    return { character: updated };
  }),

  addTranscendenceEssence: (amount) => set((state) => {
    const updated = {
      ...state.character,
      transcendenceEssence: (state.character.transcendenceEssence || 0) + amount
    };
    saveToLocalStorage(updated);
    return { character: updated };
  }),

  addMaterials: (wood, stone, meat) => set((state) => {
    const current = state.character.materials || DEFAULT_MATERIALS();
    const farmedLifetime = state.character.totalMaterialsFarmedByCitadel || DEFAULT_MATERIALS();
    const updated = {
      ...state.character,
      materials: {
        ...current,
        wood: current.wood + wood,
        stone: current.stone + stone,
        meat: current.meat + meat,
      },
      totalMaterialsFarmedByCitadel: {
        ...farmedLifetime,
        wood: farmedLifetime.wood + wood,
        stone: farmedLifetime.stone + stone,
        meat: farmedLifetime.meat + meat,
      }
    };
    saveToLocalStorage(updated);
    return { character: updated };
  }),

  buildOrUpgradeCommandCenter: () => {
    let result: { success: boolean; message: string } = { success: false, message: '' };
    set((state) => {
      const citadel = state.character.citadel || DEFAULT_CITADEL();
      const materials = state.character.materials || DEFAULT_MATERIALS();
      const nextLevel = citadel.commandCenter.level + 1;

      if (!citadel.unlocked) {
        result = { success: false, message: 'A Cidadela ainda não foi desbloqueada.' };
        return state;
      }
      if (citadel.commandCenter.upgradeInProgress) {
        result = { success: false, message: 'O Centro de Comando já está em melhoria.' };
        return state;
      }
      if (nextLevel > COMMAND_CENTER_MAX_LEVEL) {
        result = { success: false, message: 'O Centro de Comando já está no nível máximo.' };
        return state;
      }

      const cost = COMMAND_CENTER_UPGRADE_COST(nextLevel);
      if (materials.wood < cost.wood || materials.stone < cost.stone || materials.meat < cost.meat) {
        result = { success: false, message: `Materiais insuficientes: requer ${cost.wood} Madeira, ${cost.stone} Pedra e ${cost.meat} Carne.` };
        return state;
      }

      const now = Date.now();
      const durationMs = getStructureUpgradeDurationMs('commandCenter', nextLevel);
      const updated = {
        ...state.character,
        materials: { ...materials, wood: materials.wood - cost.wood, stone: materials.stone - cost.stone, meat: materials.meat - cost.meat },
        citadel: {
          ...citadel,
          commandCenter: { ...citadel.commandCenter, upgradeInProgress: { targetLevel: nextLevel, startedAt: now, completesAt: now + durationMs } }
        }
      };
      saveToLocalStorage(updated);
      result = { success: true, message: `Melhoria do Centro de Comando iniciada! Conclusão em ${Math.round(durationMs / 3600000)}h.` };
      return { character: updated };
    });
    return result;
  },

  buildOrUpgradeVault: () => {
    let result: { success: boolean; message: string } = { success: false, message: '' };
    set((state) => {
      const citadel = state.character.citadel || DEFAULT_CITADEL();
      const materials = state.character.materials || DEFAULT_MATERIALS();
      const nextLevel = citadel.vault.level + 1;

      if (!citadel.unlocked) {
        result = { success: false, message: 'A Cidadela ainda não foi desbloqueada.' };
        return state;
      }
      if (citadel.vault.upgradeInProgress) {
        result = { success: false, message: 'O Depósito já está em melhoria.' };
        return state;
      }
      if (nextLevel > VAULT_MAX_LEVEL) {
        result = { success: false, message: 'O Depósito já está no nível máximo.' };
        return state;
      }
      if (nextLevel > citadel.commandCenter.level) {
        result = { success: false, message: `Requer o Centro de Comando no Nível ${nextLevel} primeiro.` };
        return state;
      }

      const cost = VAULT_UPGRADE_COST(nextLevel);
      if (materials.wood < cost.wood || materials.stone < cost.stone) {
        result = { success: false, message: `Materiais insuficientes: requer ${cost.wood} Madeira e ${cost.stone} Pedra.` };
        return state;
      }

      const now = Date.now();
      const durationMs = getStructureUpgradeDurationMs('vault', nextLevel);
      const updated = {
        ...state.character,
        materials: { ...materials, wood: materials.wood - cost.wood, stone: materials.stone - cost.stone },
        citadel: {
          ...citadel,
          vault: { ...citadel.vault, upgradeInProgress: { targetLevel: nextLevel, startedAt: now, completesAt: now + durationMs } }
        }
      };
      saveToLocalStorage(updated);
      result = { success: true, message: `Melhoria do Depósito iniciada! Conclusão em ${Math.round(durationMs / 3600000)}h.` };
      return { character: updated };
    });
    return result;
  },

  depositItemToVault: (itemId) => {
    let result: { success: boolean; message: string } = { success: false, message: '' };
    set((state) => {
      const citadel = state.character.citadel || DEFAULT_CITADEL();
      const item = state.character.inventory.find(i => i.id === itemId);

      if (!item) {
        result = { success: false, message: 'Item não encontrado no inventário.' };
        return state;
      }
      if (item.slot === 'consumable') {
        result = { success: false, message: 'Apenas peças de equipamento podem ser guardadas no Depósito.' };
        return state;
      }
      const maxSlots = Math.min(10, citadel.vault.level * 2);
      if (citadel.vault.storedItems.length >= maxSlots) {
        result = { success: false, message: 'O Depósito está cheio.' };
        return state;
      }

      const updated = {
        ...state.character,
        inventory: state.character.inventory.filter(i => i.id !== itemId),
        citadel: {
          ...citadel,
          vault: { ...citadel.vault, storedItems: [...citadel.vault.storedItems, item] }
        }
      };
      saveToLocalStorage(updated);
      result = { success: true, message: `[${item.name}] guardado no Depósito.` };
      return { character: updated };
    });
    return result;
  },

  withdrawItemFromVault: (itemId) => {
    let result: { success: boolean; message: string } = { success: false, message: '' };
    set((state) => {
      const citadel = state.character.citadel || DEFAULT_CITADEL();
      const item = citadel.vault.storedItems.find(i => i.id === itemId);

      if (!item) {
        result = { success: false, message: 'Item não encontrado no Depósito.' };
        return state;
      }
      if (state.character.inventory.length >= state.character.inventorySlots) {
        result = { success: false, message: 'Seu inventário está cheio.' };
        return state;
      }

      const updated = {
        ...state.character,
        inventory: [...state.character.inventory, item],
        citadel: {
          ...citadel,
          vault: { ...citadel.vault, storedItems: citadel.vault.storedItems.filter(i => i.id !== itemId) }
        }
      };
      saveToLocalStorage(updated);
      result = { success: true, message: `[${item.name}] retirado do Depósito.` };
      return { character: updated };
    });
    return result;
  },

  tickCitadelProduction: () => set((state) => {
    let citadel = state.character.citadel;
    if (!citadel || !citadel.unlocked) return state;
    const now = Date.now();
    let materials = state.character.materials || DEFAULT_MATERIALS();
    let gold = state.character.gold;
    let inventory = state.character.inventory;
    let forgeFragments = state.character.forgeFragments || 0;
    let farmedByCitadel = state.character.totalMaterialsFarmedByCitadel || DEFAULT_MATERIALS();
    let changed = false;
    let autoSellCommon: boolean | undefined;
    let autoSellRare: boolean | undefined;

    // Resolve upgrades de estruturas cujo tempo de melhoria já decorreu (inclusive contando o tempo offline)
    const structureLabels: Record<CitadelStructureKey, string> = {
      commandCenter: 'Centro de Comando',
      vault: 'Depósito',
      expeditions: 'Quartel de Expedições',
      academy: 'Academia Militar',
      watchTower: 'Torre de Vigia Astral',
      forgeWorkshop: 'Oficina de Automação da Forja',
      cosmicSiphon: 'Sifão de Essência Cósmica',
      synchronyAltar: 'Altar de Sincronia Elemental',
      relicLab: 'Laboratório de Relíquias Místicas',
    };
    (Object.keys(structureLabels) as CitadelStructureKey[]).forEach((key) => {
      const building = citadel![key];
      if (building.upgradeInProgress && now >= building.upgradeInProgress.completesAt) {
        const targetLevel = building.upgradeInProgress.targetLevel;
        citadel = { ...citadel!, [key]: { ...building, level: targetLevel, upgradeInProgress: undefined } };
        changed = true;
        bridge.emit(GameEvent.LOG_EMITTED, { message: `🏗️ ${structureLabels[key]} alcançou o Nível ${targetLevel}!` });
        bridge.emit(GameEvent.CITADEL_BUILDING_UPGRADED, { buildingKey: key, buildingName: structureLabels[key], newLevel: targetLevel });
        if (key === 'forgeWorkshop' && targetLevel >= 5) {
          try {
            localStorage.setItem('rpg_auto_sell_common', 'false');
            localStorage.setItem('rpg_auto_sell_rare', 'false');
          } catch (e) {}
          autoSellCommon = false;
          autoSellRare = false;
          bridge.emit(GameEvent.LOG_EMITTED, { message: '🔨 Mestre Forjador! Desmonte Automatizado ativado. Auto-venda de itens Comuns e Raros foi desativada.' });
        }
        if (key === 'cosmicSiphon' && targetLevel >= 5) {
          bridge.emit(GameEvent.LOG_EMITTED, { message: '🌌 Sincronia Perfeita! Penalidades da Ecoterra neutralizadas.' });
        }
      }
    });

    let nextExpeditions = citadel.expeditions;
    let nextWatchTower = citadel.watchTower;
    let nextForgeWorkshop = citadel.forgeWorkshop;

    // Quartel de Expedições: materiais e Insígnias de Estudo por hora; cada classe expira 8h após ser alocada
    if (citadel.expeditions.level > 0 && citadel.expeditions.allocatedClasses.length > 0) {
      const lastTick = citadel.expeditions.lastTick;
      if (now > lastTick) {
        let totalWood = 0, totalStone = 0, totalMeat = 0, totalStudy = 0;
        const stillActive: { classId: string; slotIndex: number; characterName: string; expiresAt: number }[] = [];
        const returnedClassIds: string[] = [];
        for (const allocation of citadel.expeditions.allocatedClasses) {
          const activeUntil = Math.min(now, allocation.expiresAt);
          const activeHours = Math.max(0, (activeUntil - lastTick) / (1000 * 60 * 60));
          if (activeHours > 0) {
            const gained = computeClassExpeditionProduction(allocation.classId, citadel.expeditions.level, activeHours);
            totalWood += gained.wood;
            totalStone += gained.stone;
            totalMeat += gained.meat;
            totalStudy += gained.studyInsignias;
          }
          if (allocation.expiresAt > now) {
            stillActive.push(allocation);
          } else {
            returnedClassIds.push(allocation.classId);
          }
        }
        materials = {
          wood: materials.wood + Math.floor(totalWood),
          stone: materials.stone + Math.floor(totalStone),
          meat: materials.meat + Math.floor(totalMeat),
          studyInsignias: materials.studyInsignias + Math.floor(totalStudy),
        };
        farmedByCitadel = {
          wood: farmedByCitadel.wood + Math.floor(totalWood),
          stone: farmedByCitadel.stone + Math.floor(totalStone),
          meat: farmedByCitadel.meat + Math.floor(totalMeat),
          studyInsignias: farmedByCitadel.studyInsignias + Math.floor(totalStudy),
        };
        nextExpeditions = { ...citadel.expeditions, allocatedClasses: stillActive, lastTick: now };
        changed = true;
        if (returnedClassIds.length > 0) {
          const names = returnedClassIds.map(id => CLASS_CONFIGS[id]?.name || id).join(', ');
          bridge.emit(GameEvent.LOG_EMITTED, { message: `🎖️ Expedição concluída! ${names} retornou(aram) ao Quartel.` });
        }
      }
    }

    // Torre de Vigia Astral: fabrica Chaves da Torre passivamente, respeitando a capacidade interna
    if (citadel.watchTower.level > 0) {
      const elapsedHours = (now - citadel.watchTower.lastTick) / (1000 * 60 * 60);
      if (elapsedHours > 0) {
        const hoursPerKey = WATCH_TOWER_HOURS_PER_KEY(citadel.watchTower.level);
        const capacity = WATCH_TOWER_KEY_CAPACITY(citadel.watchTower.level);
        const potentialKeys = Math.floor(elapsedHours / hoursPerKey);
        const availableSpace = Math.max(0, capacity - citadel.watchTower.storedKeys);
        const keysToStore = Math.min(potentialKeys, availableSpace);
        let storedKeys = citadel.watchTower.storedKeys + keysToStore;

        // Escoa as chaves armazenadas para o inventário assim que houver espaço
        let flushed = 0;
        while (storedKeys > 0 && inventory.length < state.character.inventorySlots) {
          inventory = [...inventory, {
            id: `tower_key_evolved-citadel-${now}-${flushed}`,
            name: 'Chave da Torre Evoluída',
            slot: 'consumable',
            classId: state.character.classId,
            rarity: 'legendary',
            spriteName: 'tower_key_evolved',
            consumableType: 'tower_key_evolved',
            stats: {}
          }];
          storedKeys -= 1;
          flushed += 1;
        }

        nextWatchTower = { ...citadel.watchTower, storedKeys, lastTick: now };
        changed = true;
      }
    }

    // Oficina de Automação da Forja: converte Ouro e Madeira em Fragmentos de Forja por ordens de serviço de 1h
    if (citadel.forgeWorkshop.level > 0) {
      const elapsedHours = (now - citadel.forgeWorkshop.lastTick) / (1000 * 60 * 60);
      if (elapsedHours > 0) {
        const maxOrdersByTime = Math.floor(elapsedHours / FORGE_ORDER_HOURS) * citadel.forgeWorkshop.level;
        const maxOrdersByGold = Math.floor(gold / FORGE_ORDER_GOLD_COST);
        const maxOrdersByWood = Math.floor(materials.wood / FORGE_ORDER_WOOD_COST);
        const orders = Math.max(0, Math.min(maxOrdersByTime, maxOrdersByGold, maxOrdersByWood));

        if (orders > 0) {
          gold -= orders * FORGE_ORDER_GOLD_COST;
          materials = { ...materials, wood: materials.wood - orders * FORGE_ORDER_WOOD_COST };
          forgeFragments += orders * FORGE_ORDER_FRAGMENT_YIELD;
        }
        nextForgeWorkshop = { ...citadel.forgeWorkshop, lastTick: now };
        changed = true;
      }
    }

    if (!changed) return state;
    const updated = {
      ...state.character,
      gold,
      materials,
      inventory,
      forgeFragments,
      totalMaterialsFarmedByCitadel: farmedByCitadel,
      citadel: { ...citadel, expeditions: nextExpeditions, watchTower: nextWatchTower, forgeWorkshop: nextForgeWorkshop }
    };
    saveToLocalStorage(updated);
    return { character: updated, ...(autoSellCommon !== undefined ? { autoSellCommon, autoSellRare } : {}) };
  }),

  buildOrUpgradeExpeditions: () => {
    let result: { success: boolean; message: string } = { success: false, message: '' };
    useGameStore.getState().tickCitadelProduction();
    set((state) => {
      const citadel = state.character.citadel || DEFAULT_CITADEL();
      const materials = state.character.materials || DEFAULT_MATERIALS();
      const nextLevel = citadel.expeditions.level + 1;

      if (!citadel.unlocked) {
        result = { success: false, message: 'A Cidadela ainda não foi desbloqueada.' };
        return state;
      }
      if (citadel.expeditions.upgradeInProgress) {
        result = { success: false, message: 'O Quartel de Expedições já está em melhoria.' };
        return state;
      }
      if (nextLevel > EXPEDITIONS_MAX_LEVEL) {
        result = { success: false, message: 'O Quartel de Expedições já está no nível máximo.' };
        return state;
      }
      if (nextLevel > citadel.commandCenter.level) {
        result = { success: false, message: `Requer o Centro de Comando no Nível ${nextLevel} primeiro.` };
        return state;
      }
      const cost = EXPEDITIONS_UPGRADE_COST(nextLevel);
      if (materials.wood < cost.wood || materials.stone < cost.stone || materials.meat < cost.meat) {
        result = { success: false, message: `Materiais insuficientes: requer ${cost.wood} Madeira, ${cost.stone} Pedra e ${cost.meat} Carne.` };
        return state;
      }

      const now = Date.now();
      const durationMs = getStructureUpgradeDurationMs('expeditions', nextLevel);
      const updated = {
        ...state.character,
        materials: { ...materials, wood: materials.wood - cost.wood, stone: materials.stone - cost.stone, meat: materials.meat - cost.meat },
        citadel: { ...citadel, expeditions: { ...citadel.expeditions, upgradeInProgress: { targetLevel: nextLevel, startedAt: now, completesAt: now + durationMs } } }
      };
      saveToLocalStorage(updated);
      result = { success: true, message: `Melhoria do Quartel de Expedições iniciada! Conclusão em ${Math.round(durationMs / 3600000)}h.` };
      return { character: updated };
    });
    return result;
  },

  allocateClassToExpedition: (classId, slotIndex) => {
    let result: { success: boolean; message: string } = { success: false, message: '' };
    useGameStore.getState().tickCitadelProduction();
    set((state) => {
      const citadel = state.character.citadel || DEFAULT_CITADEL();
      const expeditions = citadel.expeditions;
      const currentSlotRaw = localStorage.getItem('medieval_idle_current_slot');
      const currentSlotIndex = currentSlotRaw ? Number(currentSlotRaw) : -1;

      if (expeditions.level === 0) {
        result = { success: false, message: 'O Quartel de Expedições ainda não foi construído.' };
        return state;
      }
      if (classId === state.character.classId && slotIndex === currentSlotIndex) {
        result = { success: false, message: 'Você não pode alocar a classe/personagem que está jogando ativamente.' };
        return state;
      }
      if (expeditions.allocatedClasses.some(a => a.classId === classId && a.slotIndex === slotIndex)) {
        result = { success: false, message: 'Esta classe já está em expedição.' };
        return state;
      }
      const maxSlots = EXPEDITIONS_MAX_SLOTS(expeditions.level);
      if (expeditions.allocatedClasses.length >= maxSlots) {
        result = { success: false, message: 'Não há slots de expedição disponíveis.' };
        return state;
      }
      const globalLevels = getGlobalClassLevels();
      const classLevel = Math.max(state.character.classLevels?.[classId] || 0, globalLevels[classId] || 0);
      if (classLevel <= 0) {
        result = { success: false, message: 'Você precisa ter jogado com esta classe ao menos uma vez.' };
        return state;
      }
      const goldCost = EXPEDITION_ALLOCATION_GOLD_COST(expeditions.level);
      if (state.character.gold < goldCost) {
        result = { success: false, message: `Ouro insuficiente: enviar uma classe em expedição custa 🪙 ${goldCost}.` };
        return state;
      }

      const characterName = slotIndex === currentSlotIndex
        ? state.character.name
        : (getGlobalClassCharacters()[classId]?.find(e => e.slotIndex === slotIndex)?.characterName || CLASS_CONFIGS[classId]?.name || classId);

      const updated = {
        ...state.character,
        gold: state.character.gold - goldCost,
        citadel: {
          ...citadel,
          expeditions: {
            ...expeditions,
            allocatedClasses: [...expeditions.allocatedClasses, { classId, slotIndex, characterName, expiresAt: Date.now() + EXPEDITION_ALLOCATION_DURATION_MS }],
            lastTick: expeditions.allocatedClasses.length === 0 ? Date.now() : expeditions.lastTick
          }
        }
      };
      saveToLocalStorage(updated);
      result = { success: true, message: `Classe enviada em expedição por 8h! (custou 🪙 ${goldCost})` };
      return { character: updated };
    });
    return result;
  },

  deallocateClassFromExpedition: (classId, slotIndex) => {
    let result: { success: boolean; message: string } = { success: false, message: '' };
    useGameStore.getState().tickCitadelProduction();
    set((state) => {
      const citadel = state.character.citadel || DEFAULT_CITADEL();
      const expeditions = citadel.expeditions;
      const updated = {
        ...state.character,
        citadel: {
          ...citadel,
          expeditions: { ...expeditions, allocatedClasses: expeditions.allocatedClasses.filter(a => !(a.classId === classId && a.slotIndex === slotIndex)) }
        }
      };
      saveToLocalStorage(updated);
      result = { success: true, message: 'Classe retornou da expedição.' };
      return { character: updated };
    });
    return result;
  },

  buildOrUpgradeAcademy: () => {
    let result: { success: boolean; message: string } = { success: false, message: '' };
    set((state) => {
      const citadel = state.character.citadel || DEFAULT_CITADEL();
      const materials = state.character.materials || DEFAULT_MATERIALS();
      const nextLevel = citadel.academy.level + 1;

      if (!citadel.unlocked) {
        result = { success: false, message: 'A Cidadela ainda não foi desbloqueada.' };
        return state;
      }
      if (citadel.academy.upgradeInProgress) {
        result = { success: false, message: 'A Academia Militar já está em melhoria.' };
        return state;
      }
      if (nextLevel > ACADEMY_MAX_LEVEL) {
        result = { success: false, message: 'A Academia Militar já está no nível máximo.' };
        return state;
      }
      if (nextLevel > citadel.commandCenter.level) {
        result = { success: false, message: `Requer o Centro de Comando no Nível ${nextLevel} primeiro.` };
        return state;
      }
      const cost = ACADEMY_UPGRADE_COST(nextLevel);
      if (materials.wood < cost.wood || materials.stone < cost.stone || materials.studyInsignias < cost.studyInsignias) {
        result = { success: false, message: `Materiais insuficientes: requer ${cost.wood} Madeira, ${cost.stone} Pedra e ${cost.studyInsignias} Insígnias de Estudo.` };
        return state;
      }

      const now = Date.now();
      const durationMs = getStructureUpgradeDurationMs('academy', nextLevel);
      const updated = {
        ...state.character,
        materials: { ...materials, wood: materials.wood - cost.wood, stone: materials.stone - cost.stone, studyInsignias: materials.studyInsignias - cost.studyInsignias },
        citadel: { ...citadel, academy: { ...citadel.academy, upgradeInProgress: { targetLevel: nextLevel, startedAt: now, completesAt: now + durationMs } } }
      };
      saveToLocalStorage(updated);
      result = { success: true, message: `Melhoria da Academia Militar iniciada! Conclusão em ${Math.round(durationMs / 3600000)}h.` };
      return { character: updated };
    });
    return result;
  },

  upgradeAcademyResearch: (type) => {
    let result: { success: boolean; message: string } = { success: false, message: '' };
    set((state) => {
      const citadel = state.character.citadel || DEFAULT_CITADEL();
      const academy = citadel.academy;
      const materials = state.character.materials || DEFAULT_MATERIALS();

      if (academy.level === 0) {
        result = { success: false, message: 'A Academia Militar ainda não foi construída.' };
        return state;
      }

      const levelKey = type === 'dmg' ? 'researchDmgLevel'
        : type === 'hp' ? 'researchHpLevel'
        : type === 'speed' ? 'researchSpeedLevel'
        : type === 'touchDmg' ? 'researchTouchDmgLevel'
        : type === 'critDmg' ? 'researchCritDmgLevel'
        : type === 'towerKey' ? 'researchTowerKeyLevel'
        : 'researchSoulFragmentLevel';
      const currentLevel = academy[levelKey] || 0;
      const nextLevel = currentLevel + 1;
      const cap = ACADEMY_MAX_RESEARCH_LEVEL(academy.level);

      if (nextLevel > cap) {
        result = { success: false, message: `Esta pesquisa está limitada ao nível ${cap} pelo nível atual da Academia.` };
        return state;
      }
      const cost = RESEARCH_COST(nextLevel);
      if (materials.studyInsignias < cost) {
        result = { success: false, message: `Insígnias de Estudo insuficientes: requer ${cost}.` };
        return state;
      }

      const updated = {
        ...state.character,
        materials: { ...materials, studyInsignias: materials.studyInsignias - cost },
        citadel: { ...citadel, academy: { ...academy, [levelKey]: nextLevel } }
      };
      saveToLocalStorage(updated);
      result = { success: true, message: `Pesquisa melhorada para o Nível ${nextLevel}!` };
      return { character: updated };
    });
    return result;
  },

  buildOrUpgradeWatchTower: () => {
    let result: { success: boolean; message: string } = { success: false, message: '' };
    useGameStore.getState().tickCitadelProduction();
    set((state) => {
      const citadel = state.character.citadel || DEFAULT_CITADEL();
      const materials = state.character.materials || DEFAULT_MATERIALS();
      const nextLevel = citadel.watchTower.level + 1;

      if (!citadel.unlocked) {
        result = { success: false, message: 'A Cidadela ainda não foi desbloqueada.' };
        return state;
      }
      if (citadel.watchTower.upgradeInProgress) {
        result = { success: false, message: 'A Torre de Vigia Astral já está em melhoria.' };
        return state;
      }
      if (nextLevel > WATCH_TOWER_MAX_LEVEL) {
        result = { success: false, message: 'A Torre de Vigia Astral já está no nível máximo.' };
        return state;
      }
      if (nextLevel > citadel.commandCenter.level) {
        result = { success: false, message: `Requer o Centro de Comando no Nível ${nextLevel} primeiro.` };
        return state;
      }
      const cost = WATCH_TOWER_UPGRADE_COST(nextLevel);
      if (materials.wood < cost.wood || materials.stone < cost.stone || materials.meat < cost.meat) {
        result = { success: false, message: `Materiais insuficientes: requer ${cost.wood} Madeira, ${cost.stone} Pedra e ${cost.meat} Carne.` };
        return state;
      }

      const now = Date.now();
      const durationMs = getStructureUpgradeDurationMs('watchTower', nextLevel);
      const updated = {
        ...state.character,
        materials: { ...materials, wood: materials.wood - cost.wood, stone: materials.stone - cost.stone, meat: materials.meat - cost.meat },
        citadel: { ...citadel, watchTower: { ...citadel.watchTower, upgradeInProgress: { targetLevel: nextLevel, startedAt: now, completesAt: now + durationMs } } }
      };
      saveToLocalStorage(updated);
      result = { success: true, message: `Melhoria da Torre de Vigia Astral iniciada! Conclusão em ${Math.round(durationMs / 3600000)}h.` };
      return { character: updated };
    });
    return result;
  },

  buildOrUpgradeForgeWorkshop: () => {
    let result: { success: boolean; message: string } = { success: false, message: '' };
    useGameStore.getState().tickCitadelProduction();
    set((state) => {
      const citadel = state.character.citadel || DEFAULT_CITADEL();
      const materials = state.character.materials || DEFAULT_MATERIALS();
      const nextLevel = citadel.forgeWorkshop.level + 1;

      if (!citadel.unlocked) {
        result = { success: false, message: 'A Cidadela ainda não foi desbloqueada.' };
        return state;
      }
      if (citadel.forgeWorkshop.upgradeInProgress) {
        result = { success: false, message: 'A Oficina de Automação da Forja já está em melhoria.' };
        return state;
      }
      if (nextLevel > FORGE_WORKSHOP_MAX_LEVEL) {
        result = { success: false, message: 'A Oficina de Automação da Forja já está no nível máximo.' };
        return state;
      }
      if (nextLevel > citadel.commandCenter.level) {
        result = { success: false, message: `Requer o Centro de Comando no Nível ${nextLevel} primeiro.` };
        return state;
      }
      const cost = FORGE_WORKSHOP_UPGRADE_COST(nextLevel);
      if (materials.wood < cost.wood || materials.stone < cost.stone || materials.studyInsignias < cost.studyInsignias) {
        result = { success: false, message: `Materiais insuficientes: requer ${cost.wood} Madeira, ${cost.stone} Pedra e ${cost.studyInsignias} Insígnias de Estudo.` };
        return state;
      }

      const now = Date.now();
      const durationMs = getStructureUpgradeDurationMs('forgeWorkshop', nextLevel);
      const updated = {
        ...state.character,
        materials: { ...materials, wood: materials.wood - cost.wood, stone: materials.stone - cost.stone, studyInsignias: materials.studyInsignias - cost.studyInsignias },
        citadel: { ...citadel, forgeWorkshop: { ...citadel.forgeWorkshop, upgradeInProgress: { targetLevel: nextLevel, startedAt: now, completesAt: now + durationMs } } }
      };
      saveToLocalStorage(updated);
      result = { success: true, message: `Melhoria da Oficina de Automação da Forja iniciada! Conclusão em ${Math.round(durationMs / 3600000)}h.` };
      return { character: updated };
    });
    return result;
  },

  buildOrUpgradeCosmicSiphon: () => {
    let result: { success: boolean; message: string } = { success: false, message: '' };
    set((state) => {
      const citadel = state.character.citadel || DEFAULT_CITADEL();
      const materials = state.character.materials || DEFAULT_MATERIALS();
      const essence = state.character.transcendenceEssence || 0;
      const nextLevel = citadel.cosmicSiphon.level + 1;

      if (!citadel.unlocked) {
        result = { success: false, message: 'A Cidadela ainda não foi desbloqueada.' };
        return state;
      }
      if (citadel.cosmicSiphon.upgradeInProgress) {
        result = { success: false, message: 'O Sifão de Essência Cósmica já está em melhoria.' };
        return state;
      }
      if (nextLevel > COSMIC_SIPHON_MAX_LEVEL) {
        result = { success: false, message: 'O Sifão de Essência Cósmica já está no nível máximo.' };
        return state;
      }
      if (nextLevel > citadel.commandCenter.level) {
        result = { success: false, message: `Requer o Centro de Comando no Nível ${nextLevel} primeiro.` };
        return state;
      }
      const cost = COSMIC_SIPHON_UPGRADE_COST(nextLevel);
      if (materials.stone < cost.stone || materials.wood < cost.wood || essence < cost.transcendenceEssence) {
        result = { success: false, message: `Materiais insuficientes: requer ${cost.stone} Pedra, ${cost.wood} Madeira e ${cost.transcendenceEssence} Essências de Transcendência.` };
        return state;
      }

      const now = Date.now();
      const durationMs = getStructureUpgradeDurationMs('cosmicSiphon', nextLevel);
      const updated = {
        ...state.character,
        materials: { ...materials, stone: materials.stone - cost.stone, wood: materials.wood - cost.wood },
        transcendenceEssence: essence - cost.transcendenceEssence,
        citadel: { ...citadel, cosmicSiphon: { ...citadel.cosmicSiphon, upgradeInProgress: { targetLevel: nextLevel, startedAt: now, completesAt: now + durationMs } } }
      };
      saveToLocalStorage(updated);
      result = { success: true, message: `Melhoria do Sifão de Essência Cósmica iniciada! Conclusão em ${Math.round(durationMs / 3600000)}h.` };
      return { character: updated };
    });
    return result;
  },

  buildOrUpgradeSynchronyAltar: () => {
    let result: { success: boolean; message: string } = { success: false, message: '' };
    set((state) => {
      const citadel = state.character.citadel || DEFAULT_CITADEL();
      const materials = state.character.materials || DEFAULT_MATERIALS();
      const essence = state.character.transcendenceEssence || 0;
      const nextLevel = citadel.synchronyAltar.level + 1;

      if (!citadel.unlocked) {
        result = { success: false, message: 'A Cidadela ainda não foi desbloqueada.' };
        return state;
      }
      if (citadel.synchronyAltar.upgradeInProgress) {
        result = { success: false, message: 'O Altar de Sincronia Elemental já está em melhoria.' };
        return state;
      }
      if (nextLevel > SYNCHRONY_ALTAR_MAX_LEVEL) {
        result = { success: false, message: 'O Altar de Sincronia Elemental já está no nível máximo.' };
        return state;
      }
      if (nextLevel > citadel.commandCenter.level) {
        result = { success: false, message: `Requer o Centro de Comando no Nível ${nextLevel} primeiro.` };
        return state;
      }
      const cost = SYNCHRONY_ALTAR_UPGRADE_COST(nextLevel);
      if (materials.stone < cost.stone || essence < cost.transcendenceEssence || materials.studyInsignias < cost.studyInsignias) {
        result = { success: false, message: `Materiais insuficientes: requer ${cost.stone} Pedra, ${cost.transcendenceEssence} Essências de Transcendência e ${cost.studyInsignias} Insígnias de Estudo.` };
        return state;
      }

      const now = Date.now();
      const durationMs = getStructureUpgradeDurationMs('synchronyAltar', nextLevel);
      const updated = {
        ...state.character,
        materials: { ...materials, stone: materials.stone - cost.stone, studyInsignias: materials.studyInsignias - cost.studyInsignias },
        transcendenceEssence: essence - cost.transcendenceEssence,
        citadel: { ...citadel, synchronyAltar: { ...citadel.synchronyAltar, upgradeInProgress: { targetLevel: nextLevel, startedAt: now, completesAt: now + durationMs } } }
      };
      saveToLocalStorage(updated);
      result = { success: true, message: `Melhoria do Altar de Sincronia Elemental iniciada! Conclusão em ${Math.round(durationMs / 3600000)}h.` };
      return { character: updated };
    });
    return result;
  },

  buildOrUpgradeRelicLab: () => {
    let result: { success: boolean; message: string } = { success: false, message: '' };
    set((state) => {
      const citadel = state.character.citadel || DEFAULT_CITADEL();
      const materials = state.character.materials || DEFAULT_MATERIALS();
      const soulFragments = useRelicStore.getState().unstableSoulFragments;
      const nextLevel = citadel.relicLab.level + 1;

      if (!citadel.unlocked) {
        result = { success: false, message: 'A Cidadela ainda não foi desbloqueada.' };
        return state;
      }
      if (citadel.relicLab.upgradeInProgress) {
        result = { success: false, message: 'O Laboratório de Relíquias Místicas já está em melhoria.' };
        return state;
      }
      if (nextLevel > RELIC_LAB_MAX_LEVEL) {
        result = { success: false, message: 'O Laboratório de Relíquias Místicas já está no nível máximo.' };
        return state;
      }
      if (nextLevel > citadel.commandCenter.level) {
        result = { success: false, message: `Requer o Centro de Comando no Nível ${nextLevel} primeiro.` };
        return state;
      }
      const cost = RELIC_LAB_UPGRADE_COST(nextLevel);
      if (materials.stone < cost.stone || materials.wood < cost.wood || soulFragments < cost.unstableSoulFragments) {
        result = { success: false, message: `Materiais insuficientes: requer ${cost.stone} Pedra, ${cost.wood} Madeira e ${cost.unstableSoulFragments} Fragmentos de Alma Instável.` };
        return state;
      }
      if (!useRelicStore.getState().spendFragments(cost.unstableSoulFragments)) {
        result = { success: false, message: 'Fragmentos de Alma Instável insuficientes.' };
        return state;
      }

      const now = Date.now();
      const durationMs = getStructureUpgradeDurationMs('relicLab', nextLevel);
      const updated = {
        ...state.character,
        materials: { ...materials, stone: materials.stone - cost.stone, wood: materials.wood - cost.wood },
        citadel: { ...citadel, relicLab: { ...citadel.relicLab, upgradeInProgress: { targetLevel: nextLevel, startedAt: now, completesAt: now + durationMs } } }
      };
      saveToLocalStorage(updated);
      result = { success: true, message: `Melhoria do Laboratório de Relíquias Místicas iniciada! Conclusão em ${Math.round(durationMs / 3600000)}h.` };
      return { character: updated };
    });
    return result;
  },

  overheatRelic: (relicId) => {
    let result: { success: boolean; message: string } = { success: false, message: '' };
    set((state) => {
      const citadel = state.character.citadel || DEFAULT_CITADEL();
      const relicLab = citadel.relicLab;

      if (relicLab.level === 0) {
        result = { success: false, message: 'O Laboratório de Relíquias Místicas ainda não foi construído.' };
        return state;
      }
      const relic = useRelicStore.getState().relics[relicId];
      if (!relic || relic.level < relic.maxLevel) {
        result = { success: false, message: 'Esta relíquia precisa estar no nível máximo para ser Superaquecida.' };
        return state;
      }
      if (relicLab.overheatedRelicIds.includes(relicId)) {
        result = { success: false, message: 'Esta relíquia já foi Superaquecida.' };
        return state;
      }
      const maxSlots = RELIC_LAB_OVERHEAT_SLOTS(relicLab.level);
      if (relicLab.overheatedRelicIds.length >= maxSlots) {
        result = { success: false, message: 'Não há mais vagas de Superaquecimento liberadas pelo nível atual do Laboratório.' };
        return state;
      }
      if (state.character.gold < RELIC_OVERHEAT_GOLD_COST) {
        result = { success: false, message: `Ouro insuficiente: requer ${RELIC_OVERHEAT_GOLD_COST}.` };
        return state;
      }
      if (!useRelicStore.getState().spendFragments(RELIC_OVERHEAT_SOUL_FRAGMENT_COST)) {
        result = { success: false, message: `Fragmentos de Alma Instável insuficientes: requer ${RELIC_OVERHEAT_SOUL_FRAGMENT_COST}.` };
        return state;
      }

      const updated = {
        ...state.character,
        gold: state.character.gold - RELIC_OVERHEAT_GOLD_COST,
        citadel: { ...citadel, relicLab: { ...relicLab, overheatedRelicIds: [...relicLab.overheatedRelicIds, relicId] } }
      };
      saveToLocalStorage(updated);
      result = { success: true, message: `🔥 [${relic.name}] passou pelo Superaquecimento de Alma! Seu efeito Capstone foi amplificado.` };
      return { character: updated };
    });
    return result;
  },

  addXp: (amount) => set((state) => {
    const currentStage = state.character.currentStage;
    const newTotalXpEarned = (state.character.totalXpEarned ?? legacyReconstructTotalXp(state.character.level, state.character.xp)) + amount;

    let newXp = state.character.xp + amount;
    let newLevel = state.character.level;
    let newPoints = state.character.attributePoints;
    let newSkillPoints = state.character.skillPoints;
    const stats = { ...state.character.baseStats };

    let leveledUp = false;
    let safetyCounter = 0;
    while (newXp >= getXpNeededForLevel(newLevel, currentStage) && safetyCounter++ < 10000) {
      newXp -= getXpNeededForLevel(newLevel, currentStage);
      newLevel += 1;
      newPoints += 5;
      newSkillPoints += 1; // +1 ponto de habilidade por nível

      // Aplica crescimento de atributos base
      (Object.keys(stats) as Array<keyof BaseStats>).forEach((key) => {
        stats[key] = Math.round((stats[key] || 0) + (state.character.growthRates[key] || 0));
      });
      leveledUp = true;
    }

    // --- VERIFICAÇÃO DE DESBLOQUEIO DE CLASSE ---
    const oldClassLevels = state.character.classLevels || {};
    const globalClassLevels = getGlobalClassLevels();
    const getLevelOld = (id: string) => Math.max(oldClassLevels[id] || 0, globalClassLevels[id] || 0);

    const wasPaladinUnlocked = getLevelOld('warrior') >= 50;
    const wasClericUnlocked = getLevelOld('mage') >= 50;
    const wasRogueUnlocked = getLevelOld('ranger') >= 50;
    const wasNecromancerUnlocked = getLevelOld('cleric') >= 50 && getLevelOld('rogue') >= 50;

    // Atualiza maior nível alcançado para esta classe de forma persistente
    const updatedClassLevels = {
      ...state.character.classLevels,
      [state.character.classId]: Math.max(state.character.classLevels[state.character.classId] || 1, newLevel)
    };

    const getLevelNew = (id: string) => Math.max(updatedClassLevels[id] || 0, globalClassLevels[id] || 0);

    const isPaladinUnlockedNow = getLevelNew('warrior') >= 50;
    const isClericUnlockedNow = getLevelNew('mage') >= 50;
    const isRogueUnlockedNow = getLevelNew('ranger') >= 50;
    const isNecromancerUnlockedNow = getLevelNew('cleric') >= 50 && getLevelNew('rogue') >= 50;

    if (!wasPaladinUnlocked && isPaladinUnlockedNow) {
      setTimeout(() => bridge.emit(GameEvent.CLASS_UNLOCKED, { classId: 'paladin' }), 100);
    }
    if (!wasClericUnlocked && isClericUnlockedNow) {
      setTimeout(() => bridge.emit(GameEvent.CLASS_UNLOCKED, { classId: 'cleric' }), 100);
    }
    if (!wasRogueUnlocked && isRogueUnlockedNow) {
      setTimeout(() => bridge.emit(GameEvent.CLASS_UNLOCKED, { classId: 'rogue' }), 100);
    }
    if (!wasNecromancerUnlocked && isNecromancerUnlockedNow) {
      setTimeout(() => bridge.emit(GameEvent.CLASS_UNLOCKED, { classId: 'necromancer' }), 100);
    }

    // --- VERIFICAÇÃO DE ASCENSÃO DISPONÍVEL ---
    const ascensionCount = state.character.ascensionCount || 0;
    const requiredPP = ascensionCount === 0 ? 1 : 3 + 2 * ascensionCount;
    
    // canPrestige com novos dados
    const newPrestigeEarned = calculatePrestigePointsFromTotalXp(newTotalXpEarned);
    const newIsProgressReqMet = state.character.highestStageReached >= 6;
    const isPrestigeAvailableNow = newIsProgressReqMet && newPrestigeEarned >= requiredPP;

    let ascensionNotifiedVal = state.character.ascensionNotified || false;
    if (!ascensionNotifiedVal && isPrestigeAvailableNow) {
      ascensionNotifiedVal = true;
      setTimeout(() => bridge.emit(GameEvent.ASCENSION_AVAILABLE, {}), 100);
    }

    const updated = {
      ...state.character,
      level: newLevel,
      xp: newXp,
      totalXpEarned: newTotalXpEarned,
      totalXpEarnedLifetime: (state.character.totalXpEarnedLifetime || 0) + amount,
      attributePoints: newPoints,
      skillPoints: newSkillPoints,
      baseStats: stats,
      classLevels: updatedClassLevels,
      ascensionNotified: ascensionNotifiedVal
    };

    saveToLocalStorage(updated);
    return { character: updated };
  }),

  upgradeAttribute: (stat, amount = 1) => set((state) => {
    const pointsToUse = Math.min(state.character.attributePoints, amount);
    if (pointsToUse <= 0) return state;
    const updated = {
      ...state.character,
      attributePoints: state.character.attributePoints - pointsToUse,
      baseStats: {
        ...state.character.baseStats,
        [stat]: (state.character.baseStats[stat] || 0) + pointsToUse
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
    if (useTowerStore.getState().towerActive || state.character.activeDailyChallenge) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: '⚠️ Saia da Torre Infinita ou do Desafio Diário antes de realizar a Ascensão.' });
      return state;
    }

    const totalXp = getTotalXpEarned(state.character);
    const pointsEarned = calculatePrestigePointsFromTotalXp(totalXp);

    if (pointsEarned <= 0) return state;
    
    // Validar requisito de progresso (Fase 5 completa para a primeira, Nível 5 para as subsequentes)
    const ascensionCount = state.character.ascensionCount || 0;
    const isProgressReqMet = state.character.highestStageReached >= 6;
      
    if (!isProgressReqMet) return state;
    
    // Validar requisito de PP com base na quantidade de ascensões já realizadas
    const requiredPP = ascensionCount === 0 ? 1 : 3 + 2 * ascensionCount;
    if (pointsEarned < requiredPP) return state;

    const config = CLASS_CONFIGS[state.character.classId] || CLASS_CONFIGS.warrior;

    // Duração desta ascensão, usada para atualizar o recorde de ascensão mais rápida
    const ascensionDurationSeconds = (Date.now() - (state.character.runStartTime || Date.now())) / 1000;
    const prevFastest = state.character.fastestAscensionSeconds;
    const newFastestAscensionSeconds = (prevFastest === undefined || ascensionDurationSeconds < prevFastest)
      ? ascensionDurationSeconds
      : prevFastest;

    // Recalcular os novos stats iniciais com base nos upgrades de prestígio permanentes já adquiridos
    const newBaseStats = { ...config.baseStats };
    const upgrades = state.character.prestigeUpgrades || {};
    Object.entries(upgrades).forEach(([upgradeId, lvl]) => {
      const upgrade = PRESTIGE_UPGRADES_CATALOG[upgradeId];
      if (upgrade) {
        newBaseStats[upgrade.stat] += upgrade.bonusPerLevel * lvl;
      }
    });

    const updated = {
      ...state.character,
      level: 1,
      xp: 0,
      totalXpEarned: 0,
      gold: 0,
      forgeFragments: 0,
      attributePoints: 5,
      skillPoints: 1,
      unlockedSkills: [...config.initialSkills],
      skillLevels: config.initialSkills.reduce((acc, skill) => ({ ...acc, [skill]: 1 }), {}),
      prestigePoints: (state.character.prestigePoints || 0) + pointsEarned,
      lifetimePrestigePointsAccumulated: (state.character.lifetimePrestigePointsAccumulated || 0) + pointsEarned,
      prestigeUpgrades: upgrades,
      ascensionCount: ascensionCount + 1,
      fastestAscensionSeconds: newFastestAscensionSeconds,
      baseStats: newBaseStats,
      currentStage: 1,
      enemiesDefeatedInStage: 0,
      equipment: (state.character.pandemoniumUnlocked)
        ? state.character.equipment
        : { head: null, chest: null, legs: null, gloves: null, weapon: null, necklace: null },
      // Chaves da Torre Evoluídas sobrevivem à Ascensão; demais itens do inventário são zerados
      inventory: state.character.inventory.filter(i => i.consumableType === 'tower_key_evolved'),
      pandemoniumUnlocked: state.character.pandemoniumUnlocked,
      activePandemonium: false,
      runStartTime: Date.now(),
      ascensionNotified: false,
      citadel: { ...(state.character.citadel || DEFAULT_CITADEL()), unlocked: true },
      // Ascensão retém apenas 2% dos materiais farmados na run, evitando acúmulo exagerado entre runs
      materials: {
        wood: Math.floor((state.character.materials?.wood || 0) * 0.02),
        stone: Math.floor((state.character.materials?.stone || 0) * 0.02),
        meat: Math.floor((state.character.materials?.meat || 0) * 0.02),
        studyInsignias: Math.floor((state.character.materials?.studyInsignias || 0) * 0.02),
      },
    };

    // Processa os recordes pessoais
    const records = getPersonalRecords();
    let broken = false;
    let messages: string[] = [];

    if (pointsEarned > records.maxPPGainedInSingleReset) {
      records.maxPPGainedInSingleReset = pointsEarned;
      broken = true;
      messages.push(`🏆 NOVO RECORDE: Maior quantidade de PP obtida em um único reset (${pointsEarned} PP)!`);
    }

    records.totalAscensions = ascensionCount + 1;
    savePersonalRecords(records);

    if (broken) {
      messages.forEach(msg => {
        setTimeout(() => {
          bridge.emit(GameEvent.RECORD_BROKEN, { message: msg });
        }, 1000);
      });
    }

    saveToLocalStorage(updated);
    return { character: updated };
  }),

  unlockPandemonium: () => set((state) => {
    if (useTowerStore.getState().towerActive || state.character.activeDailyChallenge) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: '⚠️ Saia da Torre Infinita ou do Desafio Diário antes de ativar o Modo Pandemônio.' });
      return state;
    }

    const cost = 100;
    const baseKeys = ['perm_str', 'perm_mag', 'perm_dex', 'perm_con', 'perm_luk'];
    const upgrades = state.character.prestigeUpgrades || {};
    const maxed = baseKeys.every(key => (upgrades[key] || 0) >= 10);

    const purgatoryCompleted = state.character.purgatoryCompleted || false;
    if (!maxed || (state.character.prestigePoints || 0) < cost || !purgatoryCompleted) return state;

    const config = CLASS_CONFIGS[state.character.classId] || CLASS_CONFIGS.warrior;
    const newBaseStats = { ...config.baseStats };
    Object.entries(upgrades).forEach(([upgradeId, lvl]) => {
      const upgrade = PRESTIGE_UPGRADES_CATALOG[upgradeId];
      if (upgrade) {
        newBaseStats[upgrade.stat] += upgrade.bonusPerLevel * lvl;
      }
    });

    const updated = {
      ...state.character,
      level: 1,
      xp: 0,
      totalXpEarned: 0,
      gold: 0,
      forgeFragments: 0,
      attributePoints: 5,
      skillPoints: 1,
      unlockedSkills: [...config.initialSkills],
      skillLevels: config.initialSkills.reduce((acc, skill) => ({ ...acc, [skill]: 1 }), {}),
      prestigePoints: (state.character.prestigePoints || 0) - cost,
      prestigeUpgrades: upgrades,
      ascensionCount: (state.character.ascensionCount || 0) + 1,
      baseStats: newBaseStats,
      currentStage: 1,
      enemiesDefeatedInStage: 0,
      equipment: state.character.equipment,
      // Chaves da Torre Evoluídas sobrevivem ao desbloqueio do Pandemônio
      inventory: state.character.inventory.filter(i => i.consumableType === 'tower_key_evolved'),
      pandemoniumUnlocked: true,
      activePandemonium: false,
      ascensionNotified: false,
    };

    saveToLocalStorage(updated);
    return { character: updated };
  }),

  upgradePrestigeStat: (upgradeId) => set((state) => {
    const upgrade = PRESTIGE_UPGRADES_CATALOG[upgradeId];
    if (!upgrade) return state;

    const currentLvl = state.character.prestigeUpgrades[upgradeId] || 0;
    const isBaseStatUpgrade = ['perm_str', 'perm_mag', 'perm_dex', 'perm_con', 'perm_luk'].includes(upgradeId);
    const maxLevel = (isBaseStatUpgrade && state.character.pandemoniumUnlocked) ? Infinity : upgrade.maxLevel;
    if (currentLvl >= maxLevel) return state;

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

  performTranscendence: () => set((state) => {
    if (useTowerStore.getState().towerActive || state.character.activeDailyChallenge) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: '⚠️ Saia da Torre Infinita ou do Desafio Diário antes de realizar a Transcendência.' });
      return state;
    }

    const currentPP = state.character.prestigePoints || 0;
    const spentPP = Object.entries(state.character.prestigeUpgrades || {}).reduce((sum, [id, lvl]) => {
      const upgrade = PRESTIGE_UPGRADES_CATALOG[id];
      if (upgrade && lvl > 0) {
        for (let i = 1; i <= lvl; i++) {
          sum += upgrade.costPerLevel * i;
        }
      }
      return sum;
    }, 0);
    const totalPP = Math.max(state.character.lifetimePrestigePointsAccumulated || 0, currentPP + spentPP);
    const pointsEarned = Math.floor(Math.pow(totalPP / 500, 0.75));

    const isEligible = state.character.pandemoniumUnlocked && state.character.highestStageReached >= 50 && pointsEarned > 0;
    if (!isEligible) return state;

    const currentClassId = state.character.classId;
    const config = CLASS_CONFIGS[currentClassId] || CLASS_CONFIGS.warrior;


    const updatedChar = {
      ...state.character,
      level: 1,
      xp: 0,
      totalXpEarned: 0,
      gold: 0,
      forgeFragments: 0,
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
      equipment: { head: null, chest: null, legs: null, gloves: null, weapon: null, necklace: null },
      // Chaves da Torre Evoluídas sobrevivem à Transcendência
      inventory: state.character.inventory.filter(i => i.consumableType === 'tower_key_evolved'),
      pandemoniumUnlocked: false,
      activePandemonium: false,
      purgatoryCompleted: false,
      runStartTime: Date.now(),
      ascensionNotified: false,
      transcendencePoints: (state.character.transcendencePoints || 0) + pointsEarned,
      lifetimePrestigePointsAccumulated: 0,
      transcendenceCount: (state.character.transcendenceCount || 0) + 1,
      transcendenceLoreShown: true,
      // Diferente da Ascensão, a Transcendência zera o Depósito da Cidadela: os itens guardados não sobrevivem a este reset mais profundo.
      citadel: {
        ...(state.character.citadel || DEFAULT_CITADEL()),
        vault: { ...(state.character.citadel?.vault || DEFAULT_CITADEL().vault), storedItems: [] }
      }
    };

    saveToLocalStorage(updatedChar);
    return { character: updatedChar, screen: 'playing' };
  }),

  upgradeTranscendenceStat: (upgradeId) => set((state) => {
    const upgrade = TRANSCENDENCE_UPGRADES_CATALOG[upgradeId];
    if (!upgrade) return state;

    const currentUpgrades = state.character.transcendenceUpgrades || {};
    const currentLvl = currentUpgrades[upgradeId] || 0;
    if (currentLvl >= upgrade.maxLevel) return state;

    if (upgradeId === 'avatar_pleno') {
      const otherKeys = ['mana_suprema', 'dominio_vazio', 'foco_temporal', 'alma_avatar'];
      const allAtLeast5 = otherKeys.every(k => (currentUpgrades[k] || 0) >= 5);
      if (!allAtLeast5) return state;
    }

    const cost = upgrade.costPerLevel;
    if ((state.character.transcendencePoints || 0) < cost) return state;

    const newUpgrades = {
      ...currentUpgrades,
      [upgradeId]: currentLvl + 1
    };

    const updatedChar = {
      ...state.character,
      transcendencePoints: (state.character.transcendencePoints || 0) - cost,
      transcendenceUpgrades: newUpgrades
    };

    saveToLocalStorage(updatedChar);
    return { character: updatedChar };
  }),

  resetTranscendenceUpgrades: () => set((state) => {
    const currentEssence = state.character.transcendenceEssence || 0;
    if (currentEssence < 10) return state;

    const currentUpgrades = state.character.transcendenceUpgrades || {};
    let refundedPT = 0;
    
    Object.entries(currentUpgrades).forEach(([upgradeId, lvl]) => {
      const upgrade = TRANSCENDENCE_UPGRADES_CATALOG[upgradeId];
      if (upgrade && lvl > 0) {
        refundedPT += upgrade.costPerLevel * lvl;
      }
    });

    const updatedChar = {
      ...state.character,
      transcendencePoints: (state.character.transcendencePoints || 0) + refundedPT,
      transcendenceEssence: currentEssence - 10,
      transcendenceUpgrades: {}
    };

    saveToLocalStorage(updatedChar);
    return { character: updatedChar };
  }),

  unlockOrUpgradeSkill: (skillId) => set((state) => {
    const skill = SKILLS_CATALOG[skillId];
    if (!skill) return state;

    const currentLvl = state.character.skillLevels[skillId] || 0;
    const maxLevel = getSkillMaxLevel(skillId, state.character.currentStage);

    if (currentLvl >= maxLevel) return state;

    // Validar nível requerido
    if (state.character.level < skill.requiredLevel) {
      return state;
    }

    // Validar dependências de habilidades
    const dependenciesMet = skill.dependencies.every(depId => (state.character.skillLevels[depId] || 0) > 0);
    if (!dependenciesMet) {
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

  startNewGame: (classId, name) => set(() => {
    const newChar = DEFAULT_CHARACTER(classId, name);

    saveToLocalStorage(newChar);
    return { character: newChar, screen: 'playing' };
  }),

  loadSavedGame: () => {
    try {
      const saved = localStorage.getItem('medieval_idle_save');
      if (saved) {
        const char = JSON.parse(saved) as Character;
        if (char && char.classId) {
          const merged = mergeLoadedCharacter(char);

          const currentSlotVal = (() => {
            try {
              const savedSlot = localStorage.getItem('medieval_idle_current_slot');
              return savedSlot ? parseInt(savedSlot, 10) : null;
            } catch {
              return null;
            }
          })();

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
    const isPandemoniumUnlocked = state.character.pandemoniumUnlocked;
    let nextStage = state.character.currentStage + 1;
    let activePandemonium = state.character.activePandemonium || false;
    let purgatoryCompleted = state.character.purgatoryCompleted || false;

    // Se o jogador derrotou o chefe da Fase 30 (vencendo o Purgatório)
    if (state.character.currentStage === 30) {
      if (!purgatoryCompleted) {
        purgatoryCompleted = true;
        setTimeout(() => {
          bridge.emit(GameEvent.LOG_EMITTED, { 
            message: `🎉 PARABÉNS! Você derrotou o Guardião dos Cacos e completou o Purgatório! O Modo Pandemônio agora está disponível para ser desbloqueado no Painel de Prestígio!` 
          });
        }, 1000);
      }
      if (!isPandemoniumUnlocked) {
        nextStage = 21;
        setTimeout(() => {
          bridge.emit(GameEvent.LOG_EMITTED, { 
            message: `🔄 O Purgatório foi reiniciado! Você retorna à Fase 21 para continuar coletando fragmentos.` 
          });
        }, 1500);
      }
    }

    if (isPandemoniumUnlocked) {
      if (nextStage >= 31) {
        activePandemonium = true;
      }
    } else {
      if (nextStage > 30) {
        nextStage = 30;
      }
    }

    // Processamento de recordes pessoais de fase e tempo
    const records = getPersonalRecords();
    let broken = false;
    let messages: string[] = [];

    if (nextStage > records.maxStageReached) {
      records.maxStageReached = nextStage;
      broken = true;
      messages.push(`🏆 NOVO RECORDE: Maior fase alcançada na sua jornada (Fase ${nextStage})!`);
    }

    if (nextStage === 20 && state.character.runStartTime) {
      const duration = (Date.now() - state.character.runStartTime) / 1000;
      if (duration < records.minTimeToStage20) {
        records.minTimeToStage20 = duration;
        broken = true;
        const mins = Math.floor(duration / 60);
        const secs = Math.floor(duration % 60);
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        messages.push(`🏆 NOVO RECORDE: Menor tempo de run até a Fase 20 (${timeStr})!`);
      }
    }

    if (broken) {
      savePersonalRecords(records);
      messages.forEach(msg => {
        setTimeout(() => {
          bridge.emit(GameEvent.RECORD_BROKEN, { message: msg });
        }, 1000);
      });
    }

    const nextHighest = Math.max(state.character.highestStageReached, nextStage);
    const level = state.character.level;
    const totalXp = getTotalXpEarned(state.character);
    const prestigeEarnedOnReset = calculatePrestigePointsFromTotalXp(totalXp);
    const ascensionCount = state.character.ascensionCount || 0;
    const requiredPP = ascensionCount === 0 ? 1 : 3 + 2 * ascensionCount;
    const isProgressReqMet = ascensionCount === 0 
      ? (nextHighest >= 6) 
      : (level >= 5);
    const isPrestigeAvailableNow = isProgressReqMet && prestigeEarnedOnReset >= requiredPP;

    let ascensionNotifiedVal = state.character.ascensionNotified || false;
    if (!ascensionNotifiedVal && isPrestigeAvailableNow) {
      ascensionNotifiedVal = true;
      setTimeout(() => bridge.emit(GameEvent.ASCENSION_AVAILABLE, {}), 100);
    }

    const updated = {
      ...state.character,
      currentStage: nextStage,
      enemiesDefeatedInStage: 0,
      highestStageReached: nextHighest,
      activePandemonium: activePandemonium,
      purgatoryCompleted: purgatoryCompleted,
      ascensionNotified: ascensionNotifiedVal
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
      for (let i = 1; i <= 12; i++) {
        localStorage.removeItem(`medieval_idle_save_slot_${i}`);
      }
      // Sistemas persistidos fora do nó do personagem (adicionados após a criação
      // original deste reset) — precisam ser limpos explicitamente, senão sobrevivem
      // ao "Resetar Todos os Dados" tanto no localStorage quanto na memória da store.
      localStorage.removeItem('medieval_idle_relics');
      localStorage.removeItem('medieval_idle_tower');
      localStorage.removeItem('medieval_idle_personal_records');
    } catch (e) {}

    // Reseta também o estado em memória dessas stores, já que a tela permanece
    // montada (volta para 'menu' sem recarregar a página) — sem isso, o jogador
    // veria relíquias/torre antigas até um refresh manual do navegador.
    try {
      useRelicStore.getState().resetRelics();
      useTowerStore.getState().resetTowerProgress();
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

  toggleTestMode: () => set((state) => {
    const updated = {
      ...state.character,
      testMode: !state.character.testMode
    };
    saveToLocalStorage(updated);
    bridge.emit(GameEvent.LOG_EMITTED, { 
      message: updated.testMode 
        ? '🧪 MODO DE TESTE ATIVADO! (5x Atributos / Dano / XP)' 
        : '🧪 Modo de teste desativado.' 
    });
    return { character: updated };
  }),

  toggleEcoterra: () => set((state) => {
    if ((state.character.transcendenceCount || 0) < 1) {
      bridge.emit(GameEvent.LOG_EMITTED, { 
        message: '🔒 Você precisa transcender pelo menos uma vez para acessar a Ecoterra!' 
      });
      return state;
    }
    const updated = {
      ...state.character,
      activeEcoterra: !state.character.activeEcoterra
    };
    saveToLocalStorage(updated);
    bridge.emit(GameEvent.LOG_EMITTED, { 
      message: updated.activeEcoterra 
        ? '🌌 ECOTERRA ATIVADA! O ciclo espelhado está ativo (Fases 1-20 possuem dificuldade elevada e drop de Essência).' 
        : '🌌 Ecoterra desativada. Retornando ao ciclo normal.' 
    });
    return { character: updated };
  }),

  markIntroLoreAsShown: () => set((state) => {
    const updated = {
      ...state.character,
      introLoreShown: true
    };
    saveToLocalStorage(updated);
    return { character: updated };
  }),

  getTodayYYYYMMDD: () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}${m}${day}`;
  },

  startDailyChallenge: () => set((state) => {
    // Salva o progresso normal atual do jogador na memória
    savedStageBeforeChallenge = state.character.currentStage;
    savedEnemiesDefeatedBeforeChallenge = state.character.enemiesDefeatedInStage;

    const today = useGameStore.getState().getTodayYYYYMMDD();
    const seed = parseInt(today, 10);
    // Fase Espelho baseada no dia (entre 10 e 19)
    const challengeStage = (seed % 10) + 10;

    const updated = {
      ...state.character,
      currentStage: challengeStage,
      enemiesDefeatedInStage: 0,
      activeDailyChallenge: true
    };

    setTimeout(() => {
      bridge.emit(GameEvent.START_COMBAT, {});
      bridge.emit(GameEvent.LOG_EMITTED, { message: `⚔️ Desafio Diário iniciado! Bem-vindo à Fase Espelho ${challengeStage}.` });
    }, 100);

    return { character: updated };
  }),

  completeDailyChallenge: () => set((state) => {
    const today = useGameStore.getState().getTodayYYYYMMDD();
    const seed = parseInt(today, 10);
    const challengeStage = (seed % 10) + 10;

    const rewardGold = 1000 * challengeStage;
    
    // Adiciona até 2 itens de Fragmento de Alma Instável ao inventário
    const inventory = [...state.character.inventory];
    let addedCount = 0;
    
    for (let i = 0; i < 2; i++) {
      if (inventory.length < state.character.inventorySlots) {
        const soulFragmentItem: EquipmentItem = {
          id: `soul_fragment-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
          name: 'Fragmento de Alma Instável',
          slot: 'consumable',
          rarity: 'epic',
          classId: state.character.classId,
          spriteName: 'unstable_soul_fragment',
          consumableType: 'unstable_soul_fragment',
          stage: challengeStage,
          stats: {}
        };
        inventory.push(soulFragmentItem);
        addedCount++;
      }
    }

    let addedMsg = '';
    if (addedCount === 2) {
      addedMsg = ` e recebeu [2x Fragmento de Alma Instável] em seu inventário!`;
    } else if (addedCount === 1) {
      addedMsg = ` e recebeu [1x Fragmento de Alma Instável] em seu inventário (o outro foi perdido pois o inventário encheu)!`;
    } else {
      addedMsg = `, mas seu inventário estava cheio para receber os fragmentos!`;
    }

    const updated = {
      ...state.character,
      gold: state.character.gold + rewardGold,
      lastCompletedDailyChallenge: today,
      activeDailyChallenge: false,
      currentStage: savedStageBeforeChallenge,
      enemiesDefeatedInStage: savedEnemiesDefeatedBeforeChallenge,
      inventory
    };

    saveToLocalStorage(updated);

    setTimeout(() => {
      bridge.emit(GameEvent.START_COMBAT, {});
      bridge.emit(GameEvent.LOG_EMITTED, { message: `🏆 Desafio Diário concluído! Você recebeu +${rewardGold} de Ouro${addedMsg}` });
    }, 100);

    return { character: updated };
  }),

  exitDailyChallenge: (success) => set((state) => {
    const updated = {
      ...state.character,
      activeDailyChallenge: false,
      currentStage: savedStageBeforeChallenge,
      enemiesDefeatedInStage: savedEnemiesDefeatedBeforeChallenge
    };

    setTimeout(() => {
      bridge.emit(GameEvent.START_COMBAT, {});
      if (!success) {
        bridge.emit(GameEvent.LOG_EMITTED, { message: `Retornando ao combate normal na Fase ${savedStageBeforeChallenge}.` });
      }
    }, 100);

    return { character: updated };
  }),

  updateAutoCastSettings: (healPercent, disabledSkills) => set((state) => {
    const updated = {
      ...state.character,
      autoCastHealPercent: healPercent,
      autoCastDisabledSkills: disabledSkills
    };
    saveToLocalStorage(updated);
    return { character: updated };
  }),

  registerEnemyKill: (enemyId) => set((state) => {
    const currentKills = state.character.killCount || {};
    const prevKills = currentKills[enemyId] || 0;
    const newKills = prevKills + 1;

    const isBoss = enemyId.startsWith('boss_');
    const reqKills = enemyId === 'boss_crystal_guardian' ? 20 : (isBoss ? 50 : 200);

    if (prevKills < reqKills && newKills >= reqKills) {
      setTimeout(() => {
        bridge.emit(GameEvent.BESTIARY_COMPLETED, { enemyId });
      }, 100);
    }

    const updatedKills = {
      ...currentKills,
      [enemyId]: newKills
    };
    const updated = {
      ...state.character,
      killCount: updatedKills,
      totalEnemiesKilledLifetime: (state.character.totalEnemiesKilledLifetime || 0) + 1
    };
    saveToLocalStorage(updated);
    return { character: updated };
  }),

  updateBestCombatStats: (stats) => set((state) => {
    const char = state.character;
    const patch: Partial<Character> = {};
    let changed = false;

    const maybeUpdate = (field: keyof Character, value: number | undefined) => {
      if (value === undefined) return;
      const prev = (char[field] as number | undefined) || 0;
      if (value > prev) {
        (patch as any)[field] = value;
        changed = true;
      }
    };

    maybeUpdate('bestDamageDealt', stats.damageDealt);
    maybeUpdate('bestMaxHP', stats.maxHP);
    maybeUpdate('bestCritChance', stats.critChance);
    maybeUpdate('bestDropChancePct', stats.dropChancePct);
    maybeUpdate('bestDamageReductionPct', stats.damageReductionPct);
    maybeUpdate('bestAttackSpeedMultiplier', stats.attackSpeedMultiplier);
    maybeUpdate('bestDodgeChance', stats.dodgeChance);

    if (!changed) return state;
    const updated = { ...char, ...patch };
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
      lastSaved: new Date().toISOString(),
      saveVersion: CURRENT_SAVE_VERSION,
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
          const merged = mergeLoadedCharacter(char);

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
        const merged: Character = {
          ...mergeLoadedCharacter(char),
          lastSaved: new Date().toISOString(),
          saveVersion: CURRENT_SAVE_VERSION,
        };

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
    if (slot === 'consumable') return state;
    
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

    const equipmentCount = state.character.inventory.filter(i => 
      i.slot !== 'consumable' || 
      i.consumableType === 'chest_legendary' || 
      i.consumableType === 'chest_ancestral'
    ).length;

    if (equipmentCount >= state.character.inventorySlots) {
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

  sellItem: (itemId) => set((state) => {
    const item = state.character.inventory.find(i => i.id === itemId);
    if (!item) return state;

    const goldEarned = calculateItemSellValue(item);
    const newInventory = state.character.inventory.filter(i => i.id !== itemId);
    
    const updated = {
      ...state.character,
      gold: (state.character.gold || 0) + goldEarned,
      inventory: newInventory
    };
    saveToLocalStorage(updated);

    if (goldEarned > 0) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Você vendeu [${item.name}] por +${goldEarned} Ouro!` });
    }

    return { character: updated };
  }),

  dismantleItem: (itemId) => set((state) => {
    const item = state.character.inventory.find(i => i.id === itemId);
    if (!item) return state;

    if (item.slot === 'consumable') return state;

    const newInventory = state.character.inventory.filter(i => i.id !== itemId);
    
    const updated = {
      ...state.character,
      forgeFragments: (state.character.forgeFragments || 0) + 1,
      inventory: newInventory
    };
    saveToLocalStorage(updated);

    bridge.emit(GameEvent.LOG_EMITTED, { 
      message: `🛠️ Você desmontou [${item.name}] e obteve +1 Fragmento de Forja!` 
    });

    return { character: updated };
  }),

  sellAllCommonAndRare: () => set((state) => {
    const itemsToSell = state.character.inventory.filter(i => i.rarity === 'common' || i.rarity === 'rare');
    if (itemsToSell.length === 0) return state;

    let totalGold = 0;
    itemsToSell.forEach(item => {
      totalGold += calculateItemSellValue(item);
    });

    const newInventory = state.character.inventory.filter(i => i.rarity !== 'common' && i.rarity !== 'rare');
    const updated = {
      ...state.character,
      gold: (state.character.gold || 0) + totalGold,
      inventory: newInventory
    };
    saveToLocalStorage(updated);

    if (totalGold > 0) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Você limpou seu inventário vendendo ${itemsToSell.length} equipamentos comuns/mágicos por +${totalGold} Ouro!` });
    }

    return { character: updated };
  }),

  sellAllLegendary: () => set((state) => {
    const itemsToSell = state.character.inventory.filter(i => i.rarity === 'legendary');
    if (itemsToSell.length === 0) return state;

    let totalGold = 0;
    itemsToSell.forEach(item => {
      totalGold += calculateItemSellValue(item);
    });

    const newInventory = state.character.inventory.filter(i => i.rarity !== 'legendary');
    const updated = {
      ...state.character,
      gold: (state.character.gold || 0) + totalGold,
      inventory: newInventory
    };
    saveToLocalStorage(updated);

    if (totalGold > 0) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Você vendeu todos os ${itemsToSell.length} equipamentos lendários do seu inventário por +${totalGold} Ouro!` });
    }

    return { character: updated };
  }),

  addItemToInventory: (item) => {
    let success = false;
    let autoSold = false;
    let goldEarned = 0;

    set((state) => {
      const isCommonAutoSell = item.rarity === 'common' && state.autoSellCommon;
      const isRareAutoSell = item.rarity === 'rare' && state.autoSellRare;

      if (isCommonAutoSell || isRareAutoSell) {
        success = true;
        autoSold = true;
        goldEarned = calculateItemSellValue(item);
        const updated = {
          ...state.character,
          gold: (state.character.gold || 0) + goldEarned,
          totalEquipmentDropped: item.slot !== 'consumable'
            ? (state.character.totalEquipmentDropped || 0) + 1
            : (state.character.totalEquipmentDropped || 0)
        };
        saveToLocalStorage(updated);
        return { character: updated };
      }

      const isEquipment = item.slot !== 'consumable' || 
                          item.consumableType === 'chest_legendary' || 
                          item.consumableType === 'chest_ancestral';

      if (isEquipment) {
        const equipmentCount = state.character.inventory.filter(i => 
          i.slot !== 'consumable' || 
          i.consumableType === 'chest_legendary' || 
          i.consumableType === 'chest_ancestral'
        ).length;

        if (equipmentCount >= state.character.inventorySlots) {
          return state;
        }
      }

      success = true;
      const isFragment = item.consumableType === 'unstable_soul_fragment';
      const isTowerKey = item.consumableType === 'tower_key' || item.consumableType === 'tower_key_evolved';
      const updated = {
        ...state.character,
        inventory: [...state.character.inventory, item],
        totalEquipmentDropped: item.slot !== 'consumable'
          ? (state.character.totalEquipmentDropped || 0) + 1
          : (state.character.totalEquipmentDropped || 0),
        totalFragmentsDropped: isFragment
          ? (state.character.totalFragmentsDropped || 0) + 1
          : (state.character.totalFragmentsDropped || 0),
        totalTowerKeysDropped: isTowerKey
          ? (state.character.totalTowerKeysDropped || 0) + 1
          : (state.character.totalTowerKeysDropped || 0),
      };
      saveToLocalStorage(updated);
      return { character: updated };
    });

    if (autoSold && goldEarned > 0) {
      bridge.emit(GameEvent.LOG_EMITTED, { 
        message: `[Auto-Venda] [${item.name}] foi vendido automaticamente por +${goldEarned} Ouro!` 
      });
    }

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
      if (item1.slot === 'consumable' || item2.slot === 'consumable') {
        result = { success: false, message: 'Consumíveis não podem ser forjados.' };
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
      let fragmentCost = 250;
      let targetMysticLevel = 1;

      if (isBothMystic) {
        const lvl1 = item1.mysticLevel || 1;
        const lvl2 = item2.mysticLevel || 1;

        if (lvl1 !== lvl2) {
          result = { success: false, message: 'Itens Místicos devem ter o mesmo nível para fusão.' };
          return state;
        }
        if (lvl1 >= 8) {
          result = { success: false, message: 'O nível máximo de item Místico é +8.' };
          return state;
        }

        targetMysticLevel = lvl1 + 1;
        const fusionCost = getMysticFusionCost(lvl1);
        cost = fusionCost.cost;
        fragmentCost = fusionCost.fragmentCost;
      }

      if ((state.character.gold || 0) < cost) {
        result = { success: false, message: `Ouro insuficiente. Requer ${cost} Ouro.` };
        return state;
      }

      if ((state.character.forgeFragments || 0) < fragmentCost) {
        result = { success: false, message: `Fragmentos de Forja insuficientes. Requer ${fragmentCost} Fragmentos.` };
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

        const isDecimal = [
          'damageMultiplierPct',
          'maxHpPct',
          'maxManaPct',
          'attackSpeedPct',
          'lifesteal',
          'touchDamageMult',
          'dropChancePct',
          'damageReductionPct',
          'frenzyChancePct'
        ].includes(key);

        if (isLegendaryForge) {
          const raw = (val1 + val2) * 1.5;
          mergedStats[key] = isDecimal ? Math.round(raw * 1000) / 1000 : Math.ceil(raw);
        } else if (val1 === 0 || val2 === 0) {
          mergedStats[key] = val1 + val2;
        } else {
          const maior = Math.max(val1, val2);
          const menor = Math.min(val1, val2);
          const rawBonus = isDecimal ? (menor * 0.5) : Math.ceil(menor * 0.5);
          const raw = maior + rawBonus;
          mergedStats[key] = isDecimal ? Math.round(raw * 1000) / 1000 : raw;
        }
      });

      const slotNamesMap: Record<string, string> = {
        weapon: 'Arma Mística',
        head: 'Elmo Místico',
        chest: 'Armadura Mística',
        legs: 'Calça Mística',
        gloves: 'Luva Mística',
        necklace: 'Colar Místico'
      };

      let baseName = slotNamesMap[item1.slot] || 'Item Místico';
      let newName = `${baseName} +${targetMysticLevel}`;

      if (item1.setName) {
        let cleanSetName = item1.setName;
        const isAncestral = item1.setName.startsWith('Set Ancestral');
        const isPandemonium = item1.setName.startsWith('Set Pandemoníaco');
        const isCelestial = item1.setName.startsWith('Set Celestial');
        
        if (isAncestral) {
          if (cleanSetName.startsWith('Set Ancestral do ')) {
            cleanSetName = cleanSetName.replace('Set Ancestral do ', '');
          } else if (cleanSetName.startsWith('Set Ancestral de ')) {
            cleanSetName = cleanSetName.replace('Set Ancestral de ', '');
          } else if (cleanSetName.startsWith('Set Ancestral da ')) {
            cleanSetName = cleanSetName.replace('Set Ancestral da ', '');
          }
          // Substitui Mística por Mística Ancestral
          baseName = baseName.replace('Mística', 'Mística Ancestral');
          baseName = baseName.replace('Místico', 'Místico Ancestral');
          
          let prep = 'do';
          if (item1.setName.includes(' da ')) {
            prep = 'da';
          } else if (item1.setName.includes(' de ')) {
            prep = 'de';
          }
          newName = `${baseName} ${prep} ${cleanSetName} +${targetMysticLevel}`;
        } else if (isPandemonium) {
          if (cleanSetName.startsWith('Set Pandemoníaco do ')) {
            cleanSetName = cleanSetName.replace('Set Pandemoníaco do ', '');
          } else if (cleanSetName.startsWith('Set Pandemoníaco de ')) {
            cleanSetName = cleanSetName.replace('Set Pandemoníaco de ', '');
          } else if (cleanSetName.startsWith('Set Pandemoníaco da ')) {
            cleanSetName = cleanSetName.replace('Set Pandemoníaco da ', '');
          }
          // Substitui Mística por Mística Pandemoníaca
          baseName = baseName.replace('Mística', 'Mística Pandemoníaca');
          baseName = baseName.replace('Místico', 'Místico Pandemoníaco');
          
          let prep = 'do';
          if (item1.setName.includes(' da ')) {
            prep = 'da';
          } else if (item1.setName.includes(' de ')) {
            prep = 'de';
          }
          newName = `${baseName} ${prep} ${cleanSetName} +${targetMysticLevel}`;
        } else if (isCelestial) {
          if (cleanSetName.startsWith('Set Celestial do ')) {
            cleanSetName = cleanSetName.replace('Set Celestial do ', '');
          } else if (cleanSetName.startsWith('Set Celestial de ')) {
            cleanSetName = cleanSetName.replace('Set Celestial de ', '');
          } else if (cleanSetName.startsWith('Set Celestial da ')) {
            cleanSetName = cleanSetName.replace('Set Celestial da ', '');
          }
          // Substitui Mística por Mística Celestial
          baseName = baseName.replace('Mística', 'Mística Celestial');
          baseName = baseName.replace('Místico', 'Místico Celestial');
          
          let prep = 'do';
          if (item1.setName.includes(' da ')) {
            prep = 'da';
          } else if (item1.setName.includes(' de ')) {
            prep = 'de';
          }
          newName = `${baseName} ${prep} ${cleanSetName} +${targetMysticLevel}`;
        } else {
          if (cleanSetName.startsWith('Set do ')) {
            cleanSetName = cleanSetName.replace('Set do ', '');
          } else if (cleanSetName.startsWith('Set de ')) {
            cleanSetName = cleanSetName.replace('Set de ', '');
          } else if (cleanSetName.startsWith('Set da ')) {
            cleanSetName = cleanSetName.replace('Set da ', '');
          }
          
          let prep = 'do';
          if (item1.setName.includes(' da ')) {
            prep = 'da';
          } else if (item1.setName.includes(' de ')) {
            prep = 'de';
          }
          newName = `${baseName} ${prep} ${cleanSetName} +${targetMysticLevel}`;
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
        setName: item1.setName,
        stage: Math.max(item1.stage || 1, item2.stage || 1)
      };

      // Remove os dois itens fundidos do inventário
      const filteredInventory = inv.filter(i => i.id !== item1Id && i.id !== item2Id);

      const updated = {
        ...state.character,
        gold: (state.character.gold || 0) - cost,
        forgeFragments: (state.character.forgeFragments || 0) - fragmentCost,
        inventory: [...filteredInventory, newItem],
        totalGoldSpentInForge: (state.character.totalGoldSpentInForge || 0) + cost,
        totalForgeFragmentsSpent: (state.character.totalForgeFragmentsSpent || 0) + fragmentCost
      };

      saveToLocalStorage(updated);

      const successMsg = isLegendaryForge
        ? `⚡ FORJA LENDÁRIA! Os astros sorriram! ${newName} foi forjado com +50% de poder!`
        : `Fusão bem-sucedida! Gerou: ${newName}`;
      result = { success: true, message: successMsg, newItem };
      return { character: updated };
    });

    return result;
  },

  buyConsumable: (type) => {
    let result: { success: boolean; message: string } = { success: false, message: '' };
    set((state) => {
      const costs = {
        chest_legendary: 500,
        chest_ancestral: 3000,
        boost_touch: 1000,
        boost_touch_x3: 5000,
        relic_chest: 500000,
        inventory_slot: 100000
      };
      const cost = costs[type];
      if ((state.character.gold || 0) < cost) {
        result = { success: false, message: `Ouro insuficiente. Requer ${cost} Ouro.` };
        return state;
      }

      if (type === 'inventory_slot') {
        const currentSlots = state.character.inventorySlots || 30;
        if (currentSlots >= 100) {
          result = { success: false, message: 'Capacidade máxima de inventário atingida (100 espaços).' };
          return state;
        }

        const updated = {
          ...state.character,
          gold: (state.character.gold || 0) - cost,
          inventorySlots: currentSlots + 1
        };

        saveToLocalStorage(updated);
        result = { success: true, message: `Espaço no inventário aumentado para ${currentSlots + 1}!` };
        return { character: updated };
      }

      const isEquipmentChest = type === 'chest_legendary' || type === 'chest_ancestral';
      if (isEquipmentChest) {
        const equipmentCount = state.character.inventory.filter(i => 
          i.slot !== 'consumable' || 
          i.consumableType === 'chest_legendary' || 
          i.consumableType === 'chest_ancestral'
        ).length;

        if (equipmentCount >= state.character.inventorySlots) {
          result = { success: false, message: 'Inventário de equipamentos cheio! Libere espaço antes de comprar.' };
          return state;
        }
      }

      const names = {
        chest_legendary: 'Baú Lendário',
        chest_ancestral: 'Baú Ancestral',
        boost_touch: 'Boost de Toque',
        boost_touch_x3: 'Boost de Toque x3',
        relic_chest: 'Baú de Relíquias',
        inventory_slot: 'Espaço no Inventário'
      };
      const name = names[type];

      const newItem: EquipmentItem = {
        id: `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name,
        slot: 'consumable',
        rarity: 'consumable',
        stats: {},
        classId: state.character.classId,
        spriteName: type,
        consumableType: type as any
      };

      const updated = {
        ...state.character,
        gold: (state.character.gold || 0) - cost,
        inventory: [...state.character.inventory, newItem]
      };

      saveToLocalStorage(updated);
      result = { success: true, message: `Compra de [${name}] realizada com sucesso!` };
      return { character: updated };
    });
    return result;
  },

  buyTranscendenceConsumable: (type) => {
    let result: { success: boolean; message: string } = { success: false, message: '' };
    set((state) => {
      const costs = {
        elixir_transcendental: 15,
        cristal_forja_eterna: 25,
        chave_fenda_temporal: 20
      };
      const cost = costs[type];
      const currentEssence = state.character.transcendenceEssence || 0;
      if (currentEssence < cost) {
        result = { success: false, message: `Essência de Transcendência insuficiente. Requer ${cost} ET.` };
        return state;
      }

      if (state.character.inventory.length >= state.character.inventorySlots) {
        result = { success: false, message: 'Inventário cheio! Libere espaço antes de comprar.' };
        return state;
      }

      const names = {
        elixir_transcendental: 'Elixir Transcendental',
        cristal_forja_eterna: 'Cristal de Forja Eterna',
        chave_fenda_temporal: 'Chave da Fenda Temporal'
      };
      const name = names[type];

      const newItem: EquipmentItem = {
        id: `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name,
        slot: 'consumable',
        rarity: 'consumable',
        stats: {},
        classId: state.character.classId,
        spriteName: type,
        consumableType: type as any
      };

      const updated = {
        ...state.character,
        transcendenceEssence: currentEssence - cost,
        inventory: [...state.character.inventory, newItem]
      };

      saveToLocalStorage(updated);
      result = { success: true, message: `Compra de [${name}] realizada com sucesso!` };
      return { character: updated };
    });
    return result;
  },

  useConsumable: (itemId) => {
    let result: { success: boolean; message: string } = { success: false, message: '' };
    set((state) => {
      const itemIndex = state.character.inventory.findIndex(i => i.id === itemId);
      if (itemIndex === -1) {
        result = { success: false, message: 'Item não encontrado no inventário.' };
        return state;
      }
      const item = state.character.inventory[itemIndex];
      if (item.slot !== 'consumable') {
        result = { success: false, message: 'Este item não é um consumível.' };
        return state;
      }

      // Copia o inventário e remove o consumível
      const nextInventory = state.character.inventory.filter(i => i.id !== itemId);

      if (item.consumableType === 'relic_chest') {
        const fragmentsGained = Math.floor(Math.random() * 3) + 1;
        useRelicStore.getState().addFragments(fragmentsGained);

        const updated = {
          ...state.character,
          inventory: nextInventory
        };
        saveToLocalStorage(updated);
        result = { success: true, message: `Baú de Relíquias aberto! +${fragmentsGained} Fragmento(s) de Alma Instável no Altar de Relíquias.` };
        return { character: updated };
      }

      if (item.consumableType === 'unstable_soul_fragment') {
        useRelicStore.getState().addFragments(1);
        
        const updated = {
          ...state.character,
          inventory: nextInventory
        };
        saveToLocalStorage(updated);
        result = { success: true, message: 'Fragmento de Alma absorvido! +1 Fragmento no Altar de Alma.' };
        return { character: updated };
      }

      if (item.consumableType === 'elixir_transcendental') {
        const levelsToAdd = 10;
        const newLevel = state.character.level + levelsToAdd;
        const newPoints = (state.character.attributePoints || 0) + (levelsToAdd * 5);
        const newSkillPoints = (state.character.skillPoints || 0) + (levelsToAdd * 1);
        const stats = { ...state.character.baseStats };
        
        for (let i = 0; i < levelsToAdd; i++) {
          (Object.keys(stats) as Array<keyof BaseStats>).forEach((key) => {
            stats[key] = Math.round((stats[key] || 0) + (state.character.growthRates[key] || 0));
          });
        }

        const updatedClassLevels = {
          ...state.character.classLevels,
          [state.character.classId]: Math.max(state.character.classLevels[state.character.classId] || 1, newLevel)
        };

        const updated = {
          ...state.character,
          level: newLevel,
          attributePoints: newPoints,
          skillPoints: newSkillPoints,
          baseStats: stats,
          classLevels: updatedClassLevels,
          inventory: nextInventory
        };
        saveToLocalStorage(updated);
        result = { success: true, message: `Elixir Transcendental consumido! Nível aumentado em +10! (+50 Pontos de Atributo, +10 Pontos de Habilidade).` };
        return { character: updated };
      }

      if (item.consumableType === 'cristal_forja_eterna') {
        const updated = {
          ...state.character,
          forgeFragments: (state.character.forgeFragments || 0) + 25,
          inventory: nextInventory
        };
        saveToLocalStorage(updated);
        result = { success: true, message: 'Cristal de Forja Eterna consumido! +25 Fragmentos de Forja adicionados.' };
        return { character: updated };
      }

      if (item.consumableType === 'chave_fenda_temporal') {
        const occupancyAfterUse = state.character.inventory.length + 1;
        if (occupancyAfterUse > state.character.inventorySlots) {
          result = { success: false, message: 'Inventário cheio! Libere pelo menos 1 slot para usar a Chave da Fenda Temporal.' };
          return state;
        }

        const key1: EquipmentItem = {
          id: `tower_key-${Date.now()}-1`,
          name: 'Chave da Torre',
          slot: 'consumable',
          rarity: 'consumable',
          stats: {},
          classId: state.character.classId,
          spriteName: 'tower_key',
          consumableType: 'tower_key'
        };
        const key2: EquipmentItem = {
          id: `tower_key-${Date.now()}-2`,
          name: 'Chave da Torre',
          slot: 'consumable',
          rarity: 'consumable',
          stats: {},
          classId: state.character.classId,
          spriteName: 'tower_key',
          consumableType: 'tower_key'
        };

        const updated = {
          ...state.character,
          inventory: [...nextInventory, key1, key2]
        };
        saveToLocalStorage(updated);
        result = { success: true, message: 'Chave da Fenda Temporal consumida! +2 Chaves da Torre Infinita adicionadas ao inventário.' };
        return { character: updated };
      }

      if (item.consumableType === 'boost_touch') {
        // Ativar Frenesi do Toque por 1 minuto
        bridge.emit('ACTIVATE_FRENZY_BOOST' as any, { duration: 60000 });
        
        const updated = {
          ...state.character,
          inventory: nextInventory
        };
        saveToLocalStorage(updated);
        result = { success: true, message: 'Boost de Toque ativado! Frenesi de 1 minuto iniciado!' };
        return { character: updated };
      }

      if (item.consumableType === 'boost_touch_x3') {
        // Ativar Frenesi do Toque por 3 minutos
        bridge.emit('ACTIVATE_FRENZY_BOOST' as any, { duration: 180000 });
        
        const updated = {
          ...state.character,
          inventory: nextInventory
        };
        saveToLocalStorage(updated);
        result = { success: true, message: 'Boost de Toque x3 ativado! Frenesi de 3 minutos iniciado!' };
        return { character: updated };
      }

      if (item.consumableType === 'tower_key') {
        result = { success: false, message: 'Chaves da Torre Infinita devem ser usadas no painel de Entrada da Torre.' };
        return state;
      }

      if (item.consumableType === 'chest_legendary' || item.consumableType === 'chest_ancestral') {
        const count = Math.floor(Math.random() * 3) + 1; // 1 a 3 itens
        
        const equipmentCount = state.character.inventory.filter(i => 
          i.slot !== 'consumable' || 
          i.consumableType === 'chest_legendary' || 
          i.consumableType === 'chest_ancestral'
        ).length;

        const slotsLivres = state.character.inventorySlots - equipmentCount;
        
        if (slotsLivres + 1 < count) {
          result = { success: false, message: `Espaço insuficiente no inventário! Libere pelo menos ${count - slotsLivres - 1} slot(s) de equipamento adicional(is).` };
          return state;
        }

        const classId = state.character.classId;
        const stage = state.character.currentStage;
        
        const setNames: Record<string, string> = {
          warrior: 'Set do Senhor da Guerra',
          mage: 'Set do Mestre Arcano',
          ranger: 'Set do Rastreador das Sombras',
          paladin: 'Set do Guardião Divino',
          cleric: 'Set do Sumosacerdote',
          rogue: 'Set do Assassino Fantasma',
          necromancer: 'Set do Arauto da Ceifa',
          avatar: 'Set do Avatar Celestizado'
        };

        const ancestralSetNames: Record<string, string> = {
          warrior: 'Set Ancestral do Conquistador',
          mage: 'Set Ancestral do Arquimago',
          ranger: 'Set Ancestral do Caçador Estelar',
          paladin: 'Set Ancestral do Sentinela Eterno',
          cleric: 'Set Ancestral do Sábio Divino',
          rogue: 'Set Ancestral do Ceifador de Almas',
          necromancer: 'Set Ancestral do Senhor dos Ecos Perdidos',
          avatar: 'Set Ancestral da Totalidade'
        };

        const slotNames: Record<string, Record<string, string>> = {
          warrior: { weapon: 'Espada', head: 'Elmo', chest: 'Armadura', legs: 'Perneiras', gloves: 'Manoplas', necklace: 'Colar' },
          mage: { weapon: 'Cajado', head: 'Capuz', chest: 'Manto', legs: 'Calças', gloves: 'Luvas', necklace: 'Amulet' },
          ranger: { weapon: 'Arco', head: 'Máscara', chest: 'Colete', legs: 'Perneiras', gloves: 'Luvas', necklace: 'Colar' },
          paladin: { weapon: 'Martelo', head: 'Elmo', chest: 'Armadura', legs: 'Perneiras', gloves: 'Manoplas', necklace: 'Amulet' },
          cleric: { weapon: 'Maça', head: 'Mitra', chest: 'Túnica', legs: 'Calças', gloves: 'Luvas', necklace: 'Rosário' },
          rogue: { weapon: 'Adaga', head: 'Capuz', chest: 'Manto', legs: 'Calças', gloves: 'Luvas', necklace: 'Colar' },
          necromancer: { weapon: 'Glaive', head: 'Capuz Sombrio', chest: 'Toga', legs: 'Calças', gloves: 'Manoplas', necklace: 'Amulet' },
          avatar: { weapon: 'Cetro Estelar', head: 'Coroa da Alma', chest: 'Túnica do Infinito', legs: 'Gamas da Totalidade', gloves: 'Manoplas Cósmicas', necklace: 'Colar' }
        };

        const possibleStatsMap: Record<string, string[]> = {
          warrior: ['strength', 'constitution', 'luck'],
          mage: ['magic', 'constitution', 'luck'],
          ranger: ['dexterity', 'constitution', 'luck'],
          paladin: ['constitution', 'strength', 'luck'],
          cleric: ['magic', 'constitution', 'luck'],
          rogue: ['dexterity', 'strength', 'luck'],
          necromancer: ['magic', 'luck', 'constitution'],
          avatar: ['strength', 'magic', 'dexterity', 'constitution', 'luck']
        };

        const slots: Array<'head' | 'chest' | 'legs' | 'gloves' | 'weapon' | 'necklace'> = ['head', 'chest', 'legs', 'gloves', 'weapon', 'necklace'];
        const newItems: EquipmentItem[] = [];

        for (let i = 0; i < count; i++) {
          const slot = slots[Math.floor(Math.random() * slots.length)];
          const baseName = slotNames[classId]?.[slot] || 'Equipamento';
          
          let setName = '';
          let mult = 2.5;
          let name = '';

          if (item.consumableType === 'chest_legendary') {
            setName = setNames[classId] || `Set do ${classId}`;
            let cleanSetName = setName;
            if (cleanSetName.startsWith('Set do ')) {
              cleanSetName = cleanSetName.replace('Set do ', '');
            } else if (cleanSetName.startsWith('Set de ')) {
              cleanSetName = cleanSetName.replace('Set de ', '');
            } else if (cleanSetName.startsWith('Set da ')) {
              cleanSetName = cleanSetName.replace('Set da ', '');
            }
            let prep = 'do';
            if (setName.includes(' da ')) {
              prep = 'da';
            } else if (setName.includes(' de ')) {
              prep = 'de';
            }
            name = `${baseName} ${prep} ${cleanSetName}`;
            mult = 2.5;
          } else {
            setName = ancestralSetNames[classId] || `Set Ancestral de ${classId}`;
            let cleanSetName = setName;
            if (cleanSetName.startsWith('Set Ancestral do ')) {
              cleanSetName = cleanSetName.replace('Set Ancestral do ', '');
            } else if (cleanSetName.startsWith('Set Ancestral de ')) {
              cleanSetName = cleanSetName.replace('Set Ancestral de ', '');
            } else if (cleanSetName.startsWith('Set Ancestral da ')) {
              cleanSetName = cleanSetName.replace('Set Ancestral da ', '');
            }
            let prep = 'do';
            if (setName.includes(' da ')) {
              prep = 'da';
            } else if (setName.includes(' de ')) {
              prep = 'de';
            }
            name = `${baseName} Ancestral ${prep} ${cleanSetName}`;
            mult = 4.5;
          }

          let itemStats: Partial<BaseStats> = {};
          if (slot === 'necklace') {
            itemStats = StatEngine.generateNecklaceStats(stage, mult, 'legendary');
          } else {
            const possibleStats = possibleStatsMap[classId] || ['strength', 'constitution', 'luck'];
            const numAttributes = 3; // Baú lendário ou ancestral sempre tem 3 atributos

            const pickedStats = StatEngine.pickRandomElements(possibleStats, numAttributes);
            pickedStats.forEach((statKey) => {
              const val = Math.max(1, Math.round(stage * mult * (0.8 + Math.random() * 0.4)));
              itemStats[statKey as keyof BaseStats] = val;
            });
          }

          newItems.push({
            id: `${classId}-${slot}-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
            name,
            slot,
            rarity: 'legendary',
            stats: itemStats,
            setName,
            classId,
            spriteName: `${classId}-${slot}`,
            stage
          });
        }

        const updated = {
          ...state.character,
          inventory: [...nextInventory, ...newItems]
        };

        saveToLocalStorage(updated);

        // Notifica no log de combate de cada item recebido
        newItems.forEach(ni => {
          bridge.emit(GameEvent.LOG_EMITTED, { message: `Você abriu o baú e obteve: [${ni.name}]!` });
        });

        result = { success: true, message: `Baú aberto com sucesso! Recebido(s) ${count} equipamento(s).` };
        return { character: updated };
      }

      return state;
    });
    return result;
  }
}));
