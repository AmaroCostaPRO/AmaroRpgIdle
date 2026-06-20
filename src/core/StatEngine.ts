import { BaseStats } from '../core/types';

/**
 * Handles all character attribute calculations based on growth rates and multipliers.
 */
export class StatEngine {
  /**
   * Calculates the final value of a specific stat for a character.
   * Formula: (Base + Growth) * Multipliers
   *
   * @param baseStats The character's initial stats.
   * @param growthRates The rates at which stats increase per level or other factors.
   * @param skillMultipliers A record of multipliers from unlocked skills (e.g., { strength: 1.1 }).
   * @param prestigeMultipliers A record of global multipliers from meta-upgrades.
   * @param statKey The key of the stat to calculate ('strength', 'magic', etc.).
   * @returns The calculated final value.
   */
  static calculateStat(
    baseStats: BaseStats,
    growthRates: Record<keyof BaseStats, number> | BaseStats,
    skillMultipliers: Partial<BaseStats>,
    prestigeMultipliers: Partial<BaseStats>,
    statKey: keyof BaseStats
  ): number {
    const base = baseStats[statKey];
    // In a full implementation, growth would be calculated based on current level and other factors.
    // For now, we assume growthRates are the accumulated growth values.
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
   * Calculates all primary stats for a character.
   */
  static calculateAllStats(
    character: any, // Character type from types.ts (will be typed once full models are ready)
    prestigeMultipliers: Partial<BaseStats>
  ): Record<keyof BaseStats, number> {
    const stats = {} as Record<keyof BaseStats, number>;

    // This is a placeholder for the full calculation logic
    // which will iterate through skills and growth factors.
    for (const key of Object.keys(character.baseStats) as Array<keyof BaseStats>) {
      stats[key] = this.calculateStat(
        character.baseStats,
        character.growthRates,
        {}, // To be populated by skill evaluation logic
        prestigeMultipliers,
        key
      );
    }

    return stats;
  }
}
