// Módulo compartilhado de fórmulas de mana — usado pelo CombatFSM (com stats já calculados em
// cache durante o combate) e pela UI fora de combate (aba de Habilidades, barra de ações), que
// precisa recalcular os mesmos valores sem uma instância de combate ativa.
import { Character } from './types';
import { StatEngine } from './StatEngine';

export const getManaPerMagic = (classId: string): number => {
  return (classId === 'mage' || classId === 'cleric') ? 6 : 18;
};

export const calculateMaxManaFromStats = (magic: number, manaBoost: number, classId: string): number => {
  return Math.floor(magic * getManaPerMagic(classId) * manaBoost);
};

export const calculateMaxMana = (character: Character): number => {
  const finalStats = StatEngine.calculateFinalStats(character);
  const manaBoost = 1 + (character.ascensionCount || 0) * 0.025;
  return calculateMaxManaFromStats(finalStats.magic, manaBoost, character.classId || 'warrior');
};

// Custo de mana de uma habilidade como PORCENTAGEM da mana máxima do jogador, em vez de um valor
// fixo — assim o custo escala automaticamente com qualquer fonte de crescimento de mana (nível de
// personagem, atributos de sets/equipamento, ascensão), sem nunca "ficar para trás" e virar
// irrisório como acontecia com a fórmula fixa anterior. Cura é sempre gratuita.
// Ajuste pós-lançamento: os percentuais abaixo já foram reduzidos pela metade duas vezes em
// relação à primeira versão (feedback de que o custo tinha ficado alto demais) — 25% do valor
// percentual original.
export const getSkillManaCost = (
  skillId: string,
  skill: { isUltimate?: boolean; requiredLevel: number; manaCost?: number },
  skillLevel: number,
  maxMana: number
): number => {
  if (skillId === 'heal') return 0;
  const lvl = Math.max(1, skillLevel);
  if (skill.isUltimate) {
    const pct = Math.min(0.075 + (lvl - 1) * 0.005, 0.1375);
    return Math.round(maxMana * pct);
  }
  const tierPct = 0.01125 + skill.requiredLevel * 0.0015;
  const lvlMult = 1 + (lvl - 1) * 0.12;
  return Math.round(maxMana * tierPct * lvlMult);
};
