// Fórmulas de custo/nível-máximo compartilhadas entre a lógica do store (useGameStore.ts)
// e os painéis de UI da Citadel/Forja, que antes reimplementavam os mesmos valores só para preview.

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
export const FORGE_ORDER_GOLD_COST = 200;
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
    const fragmentCosts = [0, 250, 500, 1000, 2500];
    return {
      cost: costs[currentMysticLevel] || 500,
      fragmentCost: fragmentCosts[currentMysticLevel] || 250,
    };
  }
  const extraFragmentCosts: Record<number, number> = { 5: 5000, 6: 10000, 7: 20000 };
  return {
    cost: 100 * Math.pow(5, currentMysticLevel),
    fragmentCost: extraFragmentCosts[currentMysticLevel] || 20000,
  };
};
