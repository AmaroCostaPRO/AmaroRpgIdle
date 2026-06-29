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
  },
  'Set Ancestral do Conquistador': {
    name: 'Set Ancestral do Conquistador',
    classId: 'warrior',
    bonuses: {
      2: { strength: 80 },
      3: { constitution: 100, luck: 50 },
      5: { strength: 200 }
    }
  },
  'Set Ancestral do Arquimago': {
    name: 'Set Ancestral do Arquimago',
    classId: 'mage',
    bonuses: {
      2: { magic: 80 },
      3: { constitution: 100, luck: 50 },
      5: { magic: 200 }
    }
  },
  'Set Ancestral do Caçador Estelar': {
    name: 'Set Ancestral do Caçador Estelar',
    classId: 'ranger',
    bonuses: {
      2: { dexterity: 80 },
      3: { constitution: 100, luck: 50 },
      5: { dexterity: 200 }
    }
  },
  'Set Ancestral do Sentinela Eterno': {
    name: 'Set Ancestral do Sentinela Eterno',
    classId: 'paladin',
    bonuses: {
      2: { constitution: 80 },
      3: { strength: 100, luck: 50 },
      5: { constitution: 200 }
    }
  },
  'Set Ancestral do Sábio Divino': {
    name: 'Set Ancestral do Sábio Divino',
    classId: 'cleric',
    bonuses: {
      2: { magic: 80 },
      3: { constitution: 100, luck: 50 },
      5: { magic: 200 }
    }
  },
  'Set Ancestral do Ceifador de Almas': {
    name: 'Set Ancestral do Ceifador de Almas',
    classId: 'rogue',
    bonuses: {
      2: { dexterity: 80 },
      3: { strength: 100, luck: 50 },
      5: { dexterity: 200 }
    }
  },
  'Set Pandemoníaco do Destruidor': {
    name: 'Set Pandemoníaco do Destruidor',
    classId: 'warrior',
    bonuses: {
      2: { strength: 250 },
      3: { constitution: 300, luck: 150 },
      5: { strength: 600 }
    }
  },
  'Set Pandemoníaco do Feiticeiro do Vazio': {
    name: 'Set Pandemoníaco do Feiticeiro do Vazio',
    classId: 'mage',
    bonuses: {
      2: { magic: 250 },
      3: { constitution: 300, luck: 150 },
      5: { magic: 600 }
    }
  },
  'Set Pandemoníaco do Franco-Atirador': {
    name: 'Set Pandemoníaco do Franco-Atirador',
    classId: 'ranger',
    bonuses: {
      2: { dexterity: 250 },
      3: { constitution: 300, luck: 150 },
      5: { dexterity: 600 }
    }
  },
  'Set Pandemoníaco do Vingador Sagrado': {
    name: 'Set Pandemoníaco do Vingador Sagrado',
    classId: 'paladin',
    bonuses: {
      2: { constitution: 250 },
      3: { strength: 300, luck: 150 },
      5: { constitution: 600 }
    }
  },
  'Set Pandemoníaco do Sumo-Inquisidor': {
    name: 'Set Pandemoníaco do Sumo-Inquisidor',
    classId: 'cleric',
    bonuses: {
      2: { magic: 250 },
      3: { constitution: 300, luck: 150 },
      5: { magic: 600 }
    }
  },
  'Set Pandemoníaco do Executor': {
    name: 'Set Pandemoníaco do Executor',
    classId: 'rogue',
    bonuses: {
      2: { dexterity: 250 },
      3: { strength: 300, luck: 150 },
      5: { dexterity: 600 }
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
      luck: character.baseStats.luck || 0,
      touch: character.baseStats.touch || 0,
      touchCritChance: character.baseStats.touchCritChance || 0,
      touchCritDamage: character.baseStats.touchCritDamage || 0,
      robotClicks: character.baseStats.robotClicks || 0
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

    // 3. Aplicar bônus do atributo Sorte (Luck) na chance e dano de crítico de toque
    const luckValue = finalStats.luck || 0;
    finalStats.touchCritChance += luckValue * 0.05;
    finalStats.touchCritDamage += luckValue * 0.2;

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
