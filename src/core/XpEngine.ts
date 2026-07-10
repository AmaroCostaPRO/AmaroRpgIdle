import { Character } from './types';

/**
 * XP necessário para subir do nível `level` para `level + 1`, escalando com a fase atual
 * pelo mesmo fator exponencial usado no ganho de XP por abate (CombatFSM.ts). Como o mesmo
 * fator multiplica ganho e custo, a proporção ganho/custo permanece constante em qualquer fase.
 */
export const getXpNeededForLevel = (level: number, currentStage: number): number =>
  Math.floor(level * 100 * Math.pow(1.35, currentStage - 1));

/** Fórmula antiga (pré-fase-scaling), usada só como fallback de migração para saves sem totalXpEarned. */
export const legacyReconstructTotalXp = (level: number, xp: number): number =>
  50 * level * (level - 1) + xp;

/** Retorna o XP vitalício do personagem, com fallback seguro para saves antigos sem o campo. */
export const getTotalXpEarned = (character: Pick<Character, 'totalXpEarned' | 'level' | 'xp'>): number =>
  character.totalXpEarned ?? legacyReconstructTotalXp(character.level, character.xp);

export const calculatePrestigePointsFromTotalXp = (totalXp: number): number =>
  Math.floor(Math.floor(Math.pow(totalXp / 1000, 0.45)) * 1.5);
