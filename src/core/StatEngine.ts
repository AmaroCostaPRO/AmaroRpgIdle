import { BaseStats, Character, EquipmentItem } from '../core/types';

export const SET_BONUSES: Record<string, {
  name: string;
  classId: string;
  bonuses: {
    2: Partial<BaseStats>;
    3: Partial<BaseStats>;
    5: Partial<BaseStats>;
  };
}> = {
  'Set do Senhor da Guerra': {
    name: 'Set do Senhor da Guerra',
    classId: 'warrior',
    bonuses: {
      2: { strength: 15 },
      3: { constitution: 20 },
      5: { strength: 35 }
    }
  },
  'Set do Mestre Arcano': {
    name: 'Set do Mestre Arcano',
    classId: 'mage',
    bonuses: {
      2: { magic: 15 },
      3: { constitution: 20 },
      5: { magic: 35 }
    }
  },
  'Set do Rastreador das Sombras': {
    name: 'Set do Rastreador das Sombras',
    classId: 'ranger',
    bonuses: {
      2: { dexterity: 15 },
      3: { constitution: 20 },
      5: { dexterity: 35 }
    }
  },
  'Set do Guardião Divino': {
    name: 'Set do Guardião Divino',
    classId: 'paladin',
    bonuses: {
      2: { constitution: 15 },
      3: { strength: 20 },
      5: { constitution: 35 }
    }
  },
  'Set do Sumosacerdote': {
    name: 'Set do Sumosacerdote',
    classId: 'cleric',
    bonuses: {
      2: { magic: 15 },
      3: { constitution: 20 },
      5: { magic: 35 }
    }
  },
  'Set do Assassino Fantasma': {
    name: 'Set do Assassino Fantasma',
    classId: 'rogue',
    bonuses: {
      2: { dexterity: 15 },
      3: { strength: 20 },
      5: { dexterity: 35 }
    }
  }
};

/**
 * Gerencia todos os cálculos de atributos do personagem baseados em taxas de crescimento, equipamentos e bônus de set.
 */
export class StatEngine {
  /**
   * Calcula o valor final consolidado dos atributos de um personagem.
   */
  static calculateFinalStats(character: Character): BaseStats {
    const finalStats: BaseStats = {
      strength: character.baseStats.strength || 0,
      magic: character.baseStats.magic || 0,
      dexterity: character.baseStats.dexterity || 0,
      constitution: character.baseStats.constitution || 0,
      luck: character.baseStats.luck || 0
    };

    // 1. Somar atributos diretos dos equipamentos equipados
    if (character.equipment) {
      Object.values(character.equipment).forEach((item) => {
        if (item && item.stats) {
          (Object.keys(item.stats) as Array<keyof BaseStats>).forEach((statKey) => {
            const val = item.stats[statKey];
            if (typeof val === 'number') {
              finalStats[statKey] += val;
            }
          });
        }
      });
    }

    // 2. Calcular bônus de conjunto (sets) equipados
    if (character.equipment) {
      const equippedItems = Object.values(character.equipment).filter(Boolean) as EquipmentItem[];
      
      // Contabilizar peças de cada conjunto
      const setCounts: Record<string, number> = {};
      equippedItems.forEach((item) => {
        if (item.setName) {
          setCounts[item.setName] = (setCounts[item.setName] || 0) + 1;
        }
      });

      // Aplicar bônus acumulativos para cada set
      Object.entries(setCounts).forEach(([setName, count]) => {
        const setBonusConfig = SET_BONUSES[setName];
        if (setBonusConfig) {
          // Bônus de 2 peças
          if (count >= 2) {
            this.applyPartialStats(finalStats, setBonusConfig.bonuses[2]);
          }
          // Bônus de 3 peças
          if (count >= 3) {
            this.applyPartialStats(finalStats, setBonusConfig.bonuses[3]);
          }
          // Bônus de 5 peças
          if (count >= 5) {
            this.applyPartialStats(finalStats, setBonusConfig.bonuses[5]);
          }
        }
      });
    }

    return finalStats;
  }

  private static applyPartialStats(target: BaseStats, source: Partial<BaseStats>) {
    if (!source) return;
    (Object.keys(source) as Array<keyof BaseStats>).forEach((key) => {
      const val = source[key];
      if (typeof val === 'number') {
        target[key] += val;
      }
    });
  }

  /**
   * Mantido para retrocompatibilidade da assinatura original.
   */
  static calculateStat(
    baseStats: BaseStats,
    growthRates: Record<keyof BaseStats, number> | BaseStats,
    skillMultipliers: Partial<BaseStats>,
    prestigeMultipliers: Partial<BaseStats>,
    statKey: keyof BaseStats
  ): number {
    const base = baseStats[statKey] || 0;
    const totalGrowth = growthRates[statKey] || 0;

    let multiplierSum = 1.0;
    if (skillMultipliers[statKey]) {
      multiplierSum += skillMultipliers[statKey]!;
    }
    if (prestigeMultipliers[statKey]) {
      multiplierSum += prestigeMultipliers[statKey]!;
    }

    return Math.floor((base + totalGrowth) * multiplierSum);
  }

  /**
   * Mantido para retrocompatibilidade da assinatura original.
   */
  static calculateAllStats(
    character: any,
    prestigeMultipliers: Partial<BaseStats>
  ): Record<keyof BaseStats, number> {
    const stats = {} as Record<keyof BaseStats, number>;
    for (const key of Object.keys(character.baseStats) as Array<keyof BaseStats>) {
      stats[key] = this.calculateStat(
        character.baseStats,
        character.growthRates,
        {},
        prestigeMultipliers,
        key
      );
    }
    return stats;
  }
}
