// Fórmulas de custo/nível-máximo compartilhadas entre a lógica do store (useGameStore.ts)
// e os painéis de UI da Citadel/Forja, que antes reimplementavam os mesmos valores só para preview.

import type { HuntContract } from './types';

// Construção central da Cidadela — nunca fica "não construída" (começa no Nível 1) e seu
// nível funciona como teto para o nível de todas as outras construções (ex: o Depósito só
// pode subir para o Nível 2 depois que o Centro de Comando chegar ao Nível 2).
export const COMMAND_CENTER_MAX_LEVEL = 5;
export const COMMAND_CENTER_UPGRADE_COST = (nextLevel: number): { wood: number; stone: number; meat: number } => ({
  wood: Math.round(80 * Math.pow(1.7, nextLevel - 1)),
  stone: Math.round(80 * Math.pow(1.7, nextLevel - 1)),
  meat: Math.round(80 * Math.pow(1.7, nextLevel - 1)),
});
// +10% na quantidade de Madeira/Pedra/Carne dropada em combate por nível (até +50% no Nível 5)
export const COMMAND_CENTER_MATERIAL_DROP_BONUS = (level: number): number => level * 0.10;

export const VAULT_MAX_LEVEL = 5;
export const VAULT_UPGRADE_COST = (nextLevel: number): { wood: number; stone: number } => ({
  wood: Math.round(50 * Math.pow(1.8, nextLevel - 1)),
  stone: Math.round(50 * Math.pow(1.8, nextLevel - 1)),
});

export const EXPEDITION_CLASS_GROUP: Record<string, 'strength' | 'dexterity' | 'magic'> = {
  warrior: 'strength',
  paladin: 'strength',
  ranger: 'dexterity',
  rogue: 'dexterity',
  mage: 'magic',
  cleric: 'magic',
  necromancer: 'magic',
  avatar: 'magic',
};

export const EXPEDITION_BASE_HOURLY = { wood: 20, stone: 20, meat: 20, studyInsignias: 5 };
export const EXPEDITIONS_MAX_LEVEL = 5;
export const ACADEMY_MAX_LEVEL = 5;
export const EXPEDITION_ALLOCATION_GOLD_COST = (expeditionLevel: number): number => 20000 * expeditionLevel;
export const EXPEDITION_ALLOCATION_DURATION_MS = 8 * 60 * 60 * 1000;

export const EXPEDITIONS_UPGRADE_COST = (nextLevel: number): { wood: number; stone: number; meat: number } => ({
  wood: Math.round(150 * Math.pow(1.6, nextLevel - 1)),
  stone: Math.round(200 * Math.pow(1.6, nextLevel - 1)),
  meat: Math.round(100 * Math.pow(1.6, nextLevel - 1)),
});

export const EXPEDITIONS_MAX_SLOTS = (level: number): number => (level >= 5 ? 3 : level >= 3 ? 2 : level >= 1 ? 1 : 0);

export const ACADEMY_UPGRADE_COST = (nextLevel: number): { wood: number; stone: number; studyInsignias: number } => ({
  wood: Math.round(200 * Math.pow(1.6, nextLevel - 1)),
  stone: Math.round(300 * Math.pow(1.6, nextLevel - 1)),
  studyInsignias: Math.round(50 * Math.pow(1.6, nextLevel - 1)),
});

export const ACADEMY_MAX_RESEARCH_LEVEL = (academyLevel: number): number => academyLevel * 5;
export const RESEARCH_COST = (nextLevel: number): number => 20 * nextLevel;

export type ResearchKey = 'dmg' | 'hp' | 'speed' | 'touchDmg' | 'critDmg' | 'towerKey' | 'soulFragment';

// Valor aplicado por nível de cada pesquisa da Academia Militar (StatEngine.ts e CombatFSM.ts).
// Todas escalam linearmente com o nível (nível × valor), seja como pontos percentuais somados
// direto na stat, seja como acréscimo relativo multiplicando uma chance/valor base.
export const RESEARCH_PER_LEVEL: Record<ResearchKey, number> = {
  dmg: 0.015,
  hp: 0.02,
  speed: 0.01,
  touchDmg: 0.02,
  critDmg: 2,
  towerKey: 0.02,
  soulFragment: 0.02,
};

// Formata o bônus total atualmente acumulado por uma pesquisa em um dado nível, para exibição na UI.
export const getResearchTotalBonusLabel = (key: ResearchKey, level: number): string => {
  const total = level * RESEARCH_PER_LEVEL[key];
  return key === 'critDmg' ? `+${total.toFixed(0)} pts` : `+${(total * 100).toFixed(1)}%`;
};

export const WATCH_TOWER_MAX_LEVEL = 5;
export const WATCH_TOWER_UPGRADE_COST = (nextLevel: number): { wood: number; stone: number; meat: number } => ({
  wood: Math.round(500 * Math.pow(1.6, nextLevel - 1)),
  stone: Math.round(500 * Math.pow(1.6, nextLevel - 1)),
  meat: Math.round(300 * Math.pow(1.6, nextLevel - 1)),
});
export const WATCH_TOWER_HOURS_PER_KEY = (level: number): number => (level >= 5 ? 6 : level >= 3 ? 12 : 24);
export const WATCH_TOWER_KEY_CAPACITY = (level: number): number => (level >= 5 ? 4 : level >= 3 ? 2 : 1);

export const FORGE_WORKSHOP_MAX_LEVEL = 5;
export const FORGE_WORKSHOP_UPGRADE_COST = (nextLevel: number): { wood: number; stone: number; studyInsignias: number } => ({
  wood: Math.round(600 * Math.pow(1.6, nextLevel - 1)),
  stone: Math.round(800 * Math.pow(1.6, nextLevel - 1)),
  studyInsignias: Math.round(150 * Math.pow(1.6, nextLevel - 1)),
});
// Cada ordem de serviço consome 1h + recursos e converte em Fragmentos de Forja; o nível permite mais ordens paralelas por hora
export const FORGE_ORDER_HOURS = 1;
export const FORGE_ORDER_GOLD_COST = 50000;
export const FORGE_ORDER_WOOD_COST = 50;
export const FORGE_ORDER_FRAGMENT_YIELD = 15;

export const COSMIC_SIPHON_MAX_LEVEL = 5;
export const COSMIC_SIPHON_UPGRADE_COST = (nextLevel: number): { stone: number; wood: number; transcendenceEssence: number } => ({
  stone: Math.round(1500 * Math.pow(1.6, nextLevel - 1)),
  wood: Math.round(1000 * Math.pow(1.6, nextLevel - 1)),
  transcendenceEssence: Math.round(50 * Math.pow(1.6, nextLevel - 1)),
});

export const SYNCHRONY_ALTAR_MAX_LEVEL = 5;
export const SYNCHRONY_ALTAR_UPGRADE_COST = (nextLevel: number): { stone: number; transcendenceEssence: number; studyInsignias: number } => ({
  stone: Math.round(2000 * Math.pow(1.6, nextLevel - 1)),
  transcendenceEssence: Math.round(200 * Math.pow(1.6, nextLevel - 1)),
  studyInsignias: Math.round(500 * Math.pow(1.6, nextLevel - 1)),
});

export const ALCHEMY_LAB_MAX_LEVEL = 5;
export const ALCHEMY_LAB_UPGRADE_COST = (nextLevel: number): { wood: number; meat: number; studyInsignias: number } => ({
  wood: Math.round(400 * Math.pow(1.6, nextLevel - 1)),
  meat: Math.round(600 * Math.pow(1.6, nextLevel - 1)),
  studyInsignias: Math.round(100 * Math.pow(1.6, nextLevel - 1)),
});

export type AlchemyPotionType = 'damage' | 'regen' | 'speed' | 'manaRegen' | 'robotClick';
// Preparo manual sob demanda (sem produção automática por tick): consome materiais na hora e
// entrega o rendimento ao inventário após `ALCHEMY_BREW_DURATION_MS` de espera (v9.1.0).
export const ALCHEMY_POTION_RECIPE: Record<AlchemyPotionType, { wood: number; stone: number; meat: number }> = {
  damage: { wood: 100, stone: 50, meat: 150 },
  regen: { wood: 50, stone: 50, meat: 200 },
  speed: { wood: 100, stone: 50, meat: 100 },
  manaRegen: { wood: 50, stone: 100, meat: 100 },
  robotClick: { wood: 150, stone: 100, meat: 150 },
};
// Rendimento por preparo: 1 poção nos Níveis 1-2, 2 nos Níveis 3-4, 3 no Nível 5
export const ALCHEMY_POTION_YIELD = (labLevel: number): number => 1 + Math.floor(labLevel / 2);
// Tempo de espera entre iniciar o preparo e a entrega automática ao inventário (v9.1.0)
export const ALCHEMY_BREW_DURATION_MS = 10 * 60 * 1000;

export const HUNT_SANCTUARY_MAX_LEVEL = 5;
export const HUNT_SANCTUARY_UPGRADE_COST = (nextLevel: number): { wood: number; meat: number; studyInsignias: number } => ({
  wood: Math.round(300 * Math.pow(1.6, nextLevel - 1)),
  meat: Math.round(300 * Math.pow(1.6, nextLevel - 1)),
  studyInsignias: Math.round(80 * Math.pow(1.6, nextLevel - 1)),
});

// Pool de inimigos elegíveis para contrato — mesmo elenco de `ENEMY_TYPES` (CombatFSM.ts), duplicado
// aqui como lista de ids para evitar import circular (CombatFSM.ts já importa deste arquivo). Igual
// ao `reqKills`/`BESTIARY_PHASES` do Bestiário, precisa ser mantido em sincronia manualmente se novos
// inimigos forem adicionados.
export const HUNT_CONTRACT_ENEMY_POOL: string[] = [
  'whisper_sprite', 'thorned_treant', 'fae_rabbit', 'boss_whispering_warden',
  'goblin', 'shadow_wolf', 'orc_warrior', 'boss_forest_golem',
  'sand_serpent', 'desert_bandit', 'desert_scorpion', 'boss_sand_scorpion',
  'frost_wolf', 'ice_elemental', 'cave_yeti', 'boss_frost_dragon',
  'skeleton_warrior', 'decaying_zombie', 'tormented_ghost', 'boss_necromancer',
  'stone_gargoyle', 'living_armor', 'demon_imp', 'boss_archdemon',
  'purgatory_specter', 'lost_soul', 'crystal_shatterer', 'boss_crystal_guardian',
];

// 2 contratos ativos a partir do Nível 1, 3 a partir do Nível 3
export const HUNT_CONTRACT_SLOTS = (sanctuaryLevel: number): number => (sanctuaryLevel >= 3 ? 3 : sanctuaryLevel >= 1 ? 2 : 0);

// Janela de rotação fixa de 8h, igual para todos os jogadores (mesmo espírito do `getWeeklySeed` da Torre)
export const HUNT_CONTRACT_ROTATION_INTERVAL_MS = 8 * 60 * 60 * 1000;
export const getHuntContractRotationId = (now: number = Date.now()): number => Math.floor(now / HUNT_CONTRACT_ROTATION_INTERVAL_MS);

const huntSeedRandom = (seed: number): number => { const x = Math.sin(seed) * 10000; return x - Math.floor(x); };

// Alvo de mortes por contrato: bosses pedem bem menos que inimigos comuns — fração pequena do
// `reqKills` que o Bestiário já usa para marco de conclusão (20/50 para chefes, 200 para comuns).
export const HUNT_CONTRACT_KILL_TARGET = (enemyId: string): number => (enemyId.startsWith('boss_') ? 5 : 15);

const HUNT_CONTRACT_REWARD_MATERIALS: ('wood' | 'stone' | 'meat' | 'studyInsignias')[] = ['wood', 'stone', 'meat', 'studyInsignias'];

// Gera os contratos de uma janela de rotação de forma pura/determinística — mesma seed produz o
// mesmo resultado em qualquer sessão/recarregamento, sem precisar persistir a escolha em si.
export const generateHuntContracts = (sanctuaryLevel: number, rotationId: number): Omit<HuntContract, 'id' | 'currentKills' | 'claimed'>[] => {
  const slots = HUNT_CONTRACT_SLOTS(sanctuaryLevel);
  const contracts: Omit<HuntContract, 'id' | 'currentKills' | 'claimed'>[] = [];
  for (let i = 0; i < slots; i++) {
    const enemySeed = rotationId * 97 + i * 13;
    const enemyId = HUNT_CONTRACT_ENEMY_POOL[Math.floor(huntSeedRandom(enemySeed) * HUNT_CONTRACT_ENEMY_POOL.length)];
    const isBoss = enemyId.startsWith('boss_');
    const rewardMaterial = HUNT_CONTRACT_REWARD_MATERIALS[Math.floor(huntSeedRandom(enemySeed + 500) * HUNT_CONTRACT_REWARD_MATERIALS.length)];
    const levelMult = 1 + (sanctuaryLevel - 1) * 0.2;
    contracts.push({
      enemyId,
      requiredKills: HUNT_CONTRACT_KILL_TARGET(enemyId),
      rewardMaterial,
      rewardAmount: Math.round((isBoss ? 120 : 40) * levelMult),
    });
  }
  return contracts;
};

// Bônus extra por completar todos os contratos da rotação atual
export const HUNT_CONTRACT_FULL_CLEAR_BONUS = (sanctuaryLevel: number): { unstableSoulFragments: number } => ({
  unstableSoulFragments: 1 + Math.floor(sanctuaryLevel / 2),
});

export const RELIC_LAB_MAX_LEVEL = 5;
export const RELIC_LAB_UPGRADE_COST = (nextLevel: number): { stone: number; wood: number; unstableSoulFragments: number } => ({
  stone: Math.round(3000 * Math.pow(1.6, nextLevel - 1)),
  wood: Math.round(2000 * Math.pow(1.6, nextLevel - 1)),
  unstableSoulFragments: Math.round(100 * Math.pow(1.6, nextLevel - 1)),
});
// Cada nível do Laboratório libera o Superaquecimento de Alma de 2 relíquias adicionais (até as 8 existentes no Nível 4+)
export const RELIC_LAB_OVERHEAT_SLOTS = (labLevel: number): number => labLevel * 2;
export const RELIC_OVERHEAT_GOLD_COST = 50000;
export const RELIC_OVERHEAT_SOUL_FRAGMENT_COST = 20;

// v10.0.0 "A Cidadela Submersa": Câmara de Gravação — 12ª construção (página 2 do pátio).
// Ancora o Sistema de Soquetes/Runas Abissais: N1 perfura armas (1 soquete) | N2 peitorais +
// remoção destrutiva | N3 2º soquete em armas + qualquer slot pesado | N4 extração intacta +
// fusão de runas 3→1 | N5 3º soquete em armas/peitorais + Palavras Rúnicas (versão futura).
// Primeiro uso ESTRUTURAL do Coral Vivo (pesca do Litoral + inimigos aquáticos).
export const ENGRAVING_CHAMBER_MAX_LEVEL = 5;
export const ENGRAVING_CHAMBER_UPGRADE_COST = (nextLevel: number): { wood: number; stone: number; coral: number } => ({
  wood: Math.round(800 * Math.pow(1.6, nextLevel - 1)),
  stone: Math.round(800 * Math.pow(1.6, nextLevel - 1)),
  coral: Math.round(200 * Math.pow(1.6, nextLevel - 1)),
});

// Tempo real de construção/melhoria de cada estrutura da Cidadela.
// Centro de Comando (já começa no Nível 1): Nível 2 leva 5h, +2h por upgrade seguinte (2→3=7h, 3→4=9h, 4→5=11h).
// Demais estruturas (começam no Nível 0/não construídas): Nível 1 leva 1h, +1h por nível (1→2=2h ... 4→5=5h).
export type CitadelStructureKey =
  | 'commandCenter'
  | 'vault'
  | 'expeditions'
  | 'academy'
  | 'watchTower'
  | 'forgeWorkshop'
  | 'cosmicSiphon'
  | 'synchronyAltar'
  | 'relicLab'
  | 'alchemyLab'
  | 'huntSanctuary'
  | 'engravingChamber';

export const getStructureUpgradeDurationMs = (structureKey: CitadelStructureKey, nextLevel: number): number => {
  const HOUR = 60 * 60 * 1000;
  if (structureKey === 'commandCenter') {
    return (5 + (nextLevel - 2) * 2) * HOUR;
  }
  return nextLevel * HOUR;
};

export const computeClassExpeditionProduction = (classId: string, expeditionLevel: number, hours: number) => {
  const levelMult = 1 + (Math.max(expeditionLevel, 1) - 1) * 0.15;
  const group = EXPEDITION_CLASS_GROUP[classId];
  return {
    wood: EXPEDITION_BASE_HOURLY.wood * hours * levelMult * (group === 'dexterity' ? 1.25 : 1),
    stone: EXPEDITION_BASE_HOURLY.stone * hours * levelMult * (group === 'strength' ? 1.25 : 1),
    meat: EXPEDITION_BASE_HOURLY.meat * hours * levelMult * (group === 'dexterity' ? 1.25 : 1),
    studyInsignias: EXPEDITION_BASE_HOURLY.studyInsignias * hours * levelMult * (group === 'magic' ? 1.30 : 1),
  };
};

// Custo de fusão de dois itens Místicos de mesmo nível (compartilhado entre a mutação real e a validação/preview da UI)
export const getMysticFusionCost = (currentMysticLevel: number): { cost: number; fragmentCost: number } => {
  if (currentMysticLevel < 5) {
    const costs = [0, 1000, 2500, 12500, 62500];
    const fragmentCosts = [0, 625, 1250, 2500, 6250];
    return {
      cost: costs[currentMysticLevel] || 500,
      fragmentCost: fragmentCosts[currentMysticLevel] || 625,
    };
  }
  const extraFragmentCosts: Record<number, number> = { 5: 12500, 6: 25000, 7: 50000 };
  return {
    cost: 100 * Math.pow(5, currentMysticLevel),
    fragmentCost: extraFragmentCosts[currentMysticLevel] || 50000,
  };
};
