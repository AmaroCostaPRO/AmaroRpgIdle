import { BaseStats, Character, EquipmentItem } from '../core/types';
import { useRelicStore } from '../store/useRelicStore';
import { SKILLS_CATALOG } from '../store/useGameStore';

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
      2: { strength: 160 },
      3: { constitution: 200, luck: 100 },
      5: { strength: 400 }
    }
  },
  'Set Pandemoníaco do Feiticeiro do Vazio': {
    name: 'Set Pandemoníaco do Feiticeiro do Vazio',
    classId: 'mage',
    bonuses: {
      2: { magic: 160 },
      3: { constitution: 200, luck: 100 },
      5: { magic: 400 }
    }
  },
  'Set Pandemoníaco do Franco-Atirador': {
    name: 'Set Pandemoníaco do Franco-Atirador',
    classId: 'ranger',
    bonuses: {
      2: { dexterity: 160 },
      3: { constitution: 200, luck: 100 },
      5: { dexterity: 400 }
    }
  },
  'Set Pandemoníaco do Vingador Sagrado': {
    name: 'Set Pandemoníaco do Vingador Sagrado',
    classId: 'paladin',
    bonuses: {
      2: { constitution: 160 },
      3: { strength: 200, luck: 100 },
      5: { constitution: 400 }
    }
  },
  'Set Pandemoníaco do Sumo-Inquisidor': {
    name: 'Set Pandemoníaco do Sumo-Inquisidor',
    classId: 'cleric',
    bonuses: {
      2: { magic: 160 },
      3: { constitution: 200, luck: 100 },
      5: { magic: 400 }
    }
  },
  'Set Pandemoníaco do Executor': {
    name: 'Set Pandemoníaco do Executor',
    classId: 'rogue',
    bonuses: {
      2: { dexterity: 160 },
      3: { strength: 200, luck: 100 },
      5: { dexterity: 400 }
    }
  },
  'Set do Arauto da Ceifa': {
    name: 'Set do Arauto da Ceifa',
    classId: 'necromancer',
    bonuses: {
      2: { magic: 15 },
      3: { constitution: 20 },
      5: { magic: 35 }
    }
  },
  'Set Ancestral do Senhor dos Ecos Perdidos': {
    name: 'Set Ancestral do Senhor dos Ecos Perdidos',
    classId: 'necromancer',
    bonuses: {
      2: { magic: 80 },
      3: { constitution: 100, luck: 50 },
      5: { magic: 200 }
    }
  },
  'Set Pandemoníaco do Devorador de Almas': {
    name: 'Set Pandemoníaco do Devorador de Almas',
    classId: 'necromancer',
    bonuses: {
      2: { magic: 160 },
      3: { constitution: 200, luck: 100 },
      5: { magic: 400 }
    }
  },
  'Set Celestial do Semideus': {
    name: 'Set Celestial do Semideus',
    classId: 'warrior',
    bonuses: {
      2: { strength: 250 },
      3: { constitution: 300, luck: 150 },
      5: { strength: 600 }
    }
  },
  'Set Celestial do Senhor do Tempo': {
    name: 'Set Celestial do Senhor do Tempo',
    classId: 'mage',
    bonuses: {
      2: { magic: 250 },
      3: { constitution: 300, luck: 150 },
      5: { magic: 600 }
    }
  },
  'Set Celestial do Observador Estelar': {
    name: 'Set Celestial do Observador Estelar',
    classId: 'ranger',
    bonuses: {
      2: { dexterity: 250 },
      3: { constitution: 300, luck: 150 },
      5: { dexterity: 600 }
    }
  },
  'Set Celestial do Arcanjo': {
    name: 'Set Celestial do Arcanjo',
    classId: 'paladin',
    bonuses: {
      2: { constitution: 250 },
      3: { strength: 300, luck: 150 },
      5: { constitution: 600 }
    }
  },
  'Set Celestial do Serafim': {
    name: 'Set Celestial do Serafim',
    classId: 'cleric',
    bonuses: {
      2: { magic: 250 },
      3: { constitution: 300, luck: 150 },
      5: { magic: 600 }
    }
  },
  'Set Celestial do Espectro Astral': {
    name: 'Set Celestial do Espectro Astral',
    classId: 'rogue',
    bonuses: {
      2: { dexterity: 250 },
      3: { strength: 300, luck: 150 },
      5: { dexterity: 600 }
    }
  },
  'Set Celestial do Ceifador de Estrelas': {
    name: 'Set Celestial do Ceifador de Estrelas',
    classId: 'necromancer',
    bonuses: {
      2: { magic: 250 },
      3: { constitution: 300, luck: 150 },
      5: { magic: 600 }
    }
  },
  'Set do Avatar Celestizado': {
    name: 'Set do Avatar Celestizado',
    classId: 'avatar',
    bonuses: {
      2: { strength: 10, magic: 10, dexterity: 10 },
      3: { constitution: 15, luck: 15 },
      5: { strength: 20, magic: 20, dexterity: 20, constitution: 20, luck: 20 }
    }
  },
  'Set Ancestral da Totalidade': {
    name: 'Set Ancestral da Totalidade',
    classId: 'avatar',
    bonuses: {
      2: { strength: 50, magic: 50, dexterity: 50 },
      3: { constitution: 80, luck: 80 },
      5: { strength: 120, magic: 120, dexterity: 120, constitution: 120, luck: 120 }
    }
  },
  'Set Pandemoníaco do Eco Supremo': {
    name: 'Set Pandemoníaco do Eco Supremo',
    classId: 'avatar',
    bonuses: {
      2: { strength: 100, magic: 100, dexterity: 100 },
      3: { constitution: 150, luck: 150 },
      5: { strength: 250, magic: 250, dexterity: 250, constitution: 250, luck: 250 }
    }
  },
  'Set Celestial do Avatar Supremo': {
    name: 'Set Celestial do Avatar Supremo',
    classId: 'avatar',
    bonuses: {
      2: { strength: 150, magic: 150, dexterity: 150 },
      3: { constitution: 200, luck: 200 },
      5: { strength: 350, magic: 350, dexterity: 350, constitution: 350, luck: 350 }
    }
  },
  'Set da Lua de Sangue do Carrasco': {
    name: 'Set da Lua de Sangue do Carrasco',
    classId: 'warrior',
    bonuses: {
      2: { strength: 133 },
      3: { constitution: 167, luck: 83 },
      5: { strength: 333 }
    }
  },
  'Set da Lua de Sangue do Arauto Rubro': {
    name: 'Set da Lua de Sangue do Arauto Rubro',
    classId: 'mage',
    bonuses: {
      2: { magic: 133 },
      3: { constitution: 167, luck: 83 },
      5: { magic: 333 }
    }
  },
  'Set da Lua de Sangue do Predador Noturno': {
    name: 'Set da Lua de Sangue do Predador Noturno',
    classId: 'ranger',
    bonuses: {
      2: { dexterity: 133 },
      3: { constitution: 167, luck: 83 },
      5: { dexterity: 333 }
    }
  },
  'Set da Lua de Sangue do Vingador Escarlate': {
    name: 'Set da Lua de Sangue do Vingador Escarlate',
    classId: 'paladin',
    bonuses: {
      2: { constitution: 133 },
      3: { strength: 167, luck: 83 },
      5: { constitution: 333 }
    }
  },
  'Set da Lua de Sangue do Profeta Sangrento': {
    name: 'Set da Lua de Sangue do Profeta Sangrento',
    classId: 'cleric',
    bonuses: {
      2: { magic: 133 },
      3: { constitution: 167, luck: 83 },
      5: { magic: 333 }
    }
  },
  'Set da Lua de Sangue do Ceifeiro Vermelho': {
    name: 'Set da Lua de Sangue do Ceifeiro Vermelho',
    classId: 'rogue',
    bonuses: {
      2: { dexterity: 133 },
      3: { strength: 167, luck: 83 },
      5: { dexterity: 333 }
    }
  },
  'Set da Lua de Sangue do Devorador Rubro': {
    name: 'Set da Lua de Sangue do Devorador Rubro',
    classId: 'necromancer',
    bonuses: {
      2: { magic: 133 },
      3: { constitution: 167, luck: 83 },
      5: { magic: 333 }
    }
  },
  'Set da Lua de Sangue do Eco Escarlate': {
    name: 'Set da Lua de Sangue do Eco Escarlate',
    classId: 'avatar',
    bonuses: {
      2: { strength: 83, magic: 83, dexterity: 83 },
      3: { constitution: 127, luck: 127 },
      5: { strength: 207, magic: 207, dexterity: 207, constitution: 207, luck: 207 }
    }
  }
};

/**
 * Gerencia todos os cálculos de atributos do personagem baseados em taxas de crescimento, equipamentos e bônus de set.
 */
export class StatEngine {
  /**
   * Sorteia `count` elementos distintos de `pool` sem repetição, com distribuição uniforme
   * (Fisher-Yates parcial). Substitui o padrão `array.sort(() => 0.5 - Math.random())`, que tem
   * viés conhecido e não sorteia os itens com probabilidade igual.
   */
  static pickRandomElements<T>(pool: T[], count: number): T[] {
    const arr = [...pool];
    const n = Math.min(count, arr.length);
    for (let i = 0; i < n; i++) {
      const j = i + Math.floor(Math.random() * (arr.length - i));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, n);
  }

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
      critChance: character.baseStats.critChance || 0,
      critDamage: character.baseStats.critDamage || 0,
      robotClicks: character.baseStats.robotClicks || 0,
      lifesteal: 0,
      touchDamageMult: 1,
      damageMultiplierPct: 0,
      maxHpPct: 0,
      attackSpeedPct: 0,
      maxManaPct: 0,
      dropChancePct: 0,
      damageReductionPct: 0,
      frenzyChancePct: 0
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

      // Contabilizar peças por categoria para aplicar os novos bônus especiais de 3 e 5 peças
      let ancestralCount = 0;
      let pandemoniumCount = 0;
      let celestialCount = 0;
      let bloodMoonCount = 0;

      Object.entries(setCounts).forEach(([setName, count]) => {
        if (setName.startsWith('Set Ancestral')) {
          ancestralCount += count;
        } else if (setName.startsWith('Set Pandemoníaco')) {
          pandemoniumCount += count;
        } else if (setName.startsWith('Set Celestial')) {
          celestialCount += count;
        } else if (setName.startsWith('Set da Lua de Sangue')) {
          bloodMoonCount += count;
        }
      });

      // Aplicar os novos bônus especiais de categoria
      if (ancestralCount >= 3) {
        finalStats.touchDamageMult = (finalStats.touchDamageMult || 1) * 2;
      }
      if (ancestralCount >= 5) {
        finalStats.damageMultiplierPct = (finalStats.damageMultiplierPct || 0) + 0.15;
      }

      if (pandemoniumCount >= 3) {
        finalStats.lifesteal = (finalStats.lifesteal || 0) + 0.05;
      }
      if (pandemoniumCount >= 5) {
        finalStats.damageMultiplierPct = (finalStats.damageMultiplierPct || 0) + 0.25;
        finalStats.maxHpPct = (finalStats.maxHpPct || 0) + 0.10;
      }

      if (celestialCount >= 3) {
        finalStats.robotClicks = (finalStats.robotClicks || 0) + 2;
        finalStats.lifesteal = (finalStats.lifesteal || 0) + 0.05;
      }
      if (celestialCount >= 5) {
        finalStats.damageMultiplierPct = (finalStats.damageMultiplierPct || 0) + 0.40;
        finalStats.maxHpPct = (finalStats.maxHpPct || 0) + 0.20;
        finalStats.attackSpeedPct = (finalStats.attackSpeedPct || 0) + 0.10;
      }

      if (bloodMoonCount >= 3) {
        finalStats.lifesteal = (finalStats.lifesteal || 0) + 0.045;
      }
      if (bloodMoonCount >= 5) {
        finalStats.damageMultiplierPct = (finalStats.damageMultiplierPct || 0) + 0.22;
        finalStats.maxHpPct = (finalStats.maxHpPct || 0) + 0.07;
      }
    }

    // 2.5. Somar atributos das relíquias
    try {
      const relicsState = useRelicStore.getState();
      const getRelicLvl = (id: string) => relicsState.relics[id]?.level || 0;

      finalStats.strength += getRelicLvl('gema_vontade') * 4;
      finalStats.magic += getRelicLvl('nucleo_pensamento') * 4;
      finalStats.dexterity += getRelicLvl('foco_precisao') * 4;
      finalStats.constitution += getRelicLvl('brasao_devoacao') * 6;
      finalStats.luck += getRelicLvl('olho_sobrevivencia') * 4;
    } catch (e) {
      console.error('Erro ao somar atributos das relíquias:', e);
    }

    // 2.6. v9.5.0 "Reformulação de Habilidades": aplicar os bônus de atributo das passivas
    // dinamicamente a partir de `skillLevels`, no mesmo padrão de equipamentos/relíquias, em vez de
    // ficarem "assados" permanentemente em baseStats (como antes desta versão).
    if (character.skillLevels) {
      Object.entries(character.skillLevels).forEach(([skillId, lvl]) => {
        if (!lvl || lvl <= 0) return;
        const skill = SKILLS_CATALOG[skillId];
        if (!skill || skill.type !== 'passive' || !skill.statBonuses) return;
        Object.entries(skill.statBonuses).forEach(([stat, val]) => {
          const key = stat as keyof BaseStats;
          finalStats[key] = (finalStats[key] || 0) + (val as number) * lvl;
        });
      });

      // Passo Ligeiro (Arqueiro): +3% de Esquiva por nível, capado em +30% (a fórmula de esquiva em
      // CombatFSM já limita o total a 75%/95%, mas o cap aqui evita que essa única passiva domine
      // sozinha o teto e torne Destreza irrelevante).
      const fleetFootedLvl = character.skillLevels['fleet_footed'] || 0;
      if (fleetFootedLvl > 0) {
        finalStats.dodgeChancePct = (finalStats.dodgeChancePct || 0) + Math.min(30, fleetFootedLvl * 3);
      }

      // Retribuição Aura (Paladino): reflete +4% do dano recebido de volta ao inimigo por nível,
      // capado em 50% (sem cap, níveis altos aproximariam de "imunidade com contra-ataque").
      const retributionLvl = character.skillLevels['retribution'] || 0;
      if (retributionLvl > 0) {
        finalStats.reflectDamagePct = (finalStats.reflectDamagePct || 0) + Math.min(50, retributionLvl * 4);
      }
    }

    // 3. Aplicar bônus do atributo Sorte (Luck) na chance e dano de crítico de toque
    const luckValue = finalStats.luck || 0;
    finalStats.critChance += luckValue * 0.05;
    finalStats.critDamage += luckValue * 0.2;

    // 4. Aplicar bônus do acúmulo de ascensões (ascensionCount) nos atributos de toque
    const ascensionCount = character.ascensionCount || 0;
    finalStats.touch += ascensionCount * 5;
    finalStats.critChance += ascensionCount * 0.1;
    finalStats.critDamage += ascensionCount * 1.0;

    // 4.5. Aplicar melhorias da Árvore de Transcendência
    const transUpgrades = character.transcendenceUpgrades || {};
    
    // Mana Suprema (mana_suprema): +10% de Max Mana Pct por nível
    const manaLvl = transUpgrades['mana_suprema'] || 0;
    if (manaLvl > 0) {
      finalStats.maxManaPct = (finalStats.maxManaPct || 0) + manaLvl * 10;
    }

    // Alma do Avatar (alma_avatar): Aumenta os atributos de base em +2% por nível (multiplicativo)
    const almaLvl = transUpgrades['alma_avatar'] || 0;
    if (almaLvl > 0) {
      const multiplier = 1 + almaLvl * 0.02;
      finalStats.strength = Math.floor(finalStats.strength * multiplier);
      finalStats.magic = Math.floor(finalStats.magic * multiplier);
      finalStats.dexterity = Math.floor(finalStats.dexterity * multiplier);
      finalStats.constitution = Math.floor(finalStats.constitution * multiplier);
      finalStats.luck = Math.floor(finalStats.luck * multiplier);
      finalStats.touch = Math.floor(finalStats.touch * multiplier);
    }

    // 4.6. Aplicar as pesquisas permanentes da Academia Militar da Cidadela (universais para todas as classes)
    const academy = character.citadel?.academy;
    if (academy) {
      finalStats.damageMultiplierPct = (finalStats.damageMultiplierPct || 0) + (academy.researchDmgLevel || 0) * 0.015;
      finalStats.maxHpPct = (finalStats.maxHpPct || 0) + (academy.researchHpLevel || 0) * 0.02;
      finalStats.attackSpeedPct = (finalStats.attackSpeedPct || 0) + (academy.researchSpeedLevel || 0) * 0.01;
      finalStats.touchDamageMult = (finalStats.touchDamageMult || 1) * (1 + (academy.researchTouchDmgLevel || 0) * 0.02);
      finalStats.critDamage = (finalStats.critDamage || 0) + (academy.researchCritDmgLevel || 0) * 2;
    }

    // 5. Aplicar o multiplicador do Modo de Teste (God Mode / 5x Atributos)
    if (character.testMode) {
      finalStats.strength *= 5;
      finalStats.magic *= 5;
      finalStats.dexterity *= 5;
      finalStats.constitution *= 5;
      finalStats.luck *= 5;
      finalStats.touch *= 5;
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
   * Calcula o multiplicador de dano acumulado do bestiário.
   * +1% por monstro com abates suficientes (+2% no Purgatório).
   * +2% adicionais por fase completada (+7% no Purgatório).
   * +20% adicionais se todas as fases forem completadas.
   */
  static calculateBestiaryDamageMultiplier(killCount: Record<string, number>): number {
    const BESTIARY_PHASES = [
      ['whisper_sprite', 'thorned_treant', 'fae_rabbit', 'boss_whispering_warden'],
      ['goblin', 'shadow_wolf', 'orc_warrior', 'boss_forest_golem'],
      ['sand_serpent', 'desert_bandit', 'desert_scorpion', 'boss_sand_scorpion'],
      ['frost_wolf', 'ice_elemental', 'cave_yeti', 'boss_frost_dragon'],
      ['skeleton_warrior', 'decaying_zombie', 'tormented_ghost', 'boss_necromancer'],
      ['stone_gargoyle', 'living_armor', 'demon_imp', 'boss_archdemon'],
      ['purgatory_specter', 'lost_soul', 'crystal_shatterer', 'boss_crystal_guardian']
    ];

    let bonusPct = 0;
    let completedPhases = 0;

    BESTIARY_PHASES.forEach((phaseEnemies, phaseIndex) => {
      let completedInPhase = 0;
      const isPurgatory = phaseIndex === BESTIARY_PHASES.length - 1;

      phaseEnemies.forEach((enemyId) => {
        const kills = killCount[enemyId] || 0;
        const requiredKills = enemyId === 'boss_crystal_guardian' ? 20 : (enemyId.startsWith('boss_') ? 50 : 200);
        if (kills >= requiredKills) {
          bonusPct += isPurgatory ? 2 : 1;
          completedInPhase++;
        }
      });

      if (completedInPhase === 4) {
        bonusPct += isPurgatory ? 7 : 2;
        completedPhases++;
      }
    });

    if (completedPhases === BESTIARY_PHASES.length) {
      bonusPct += 20;
    }

    return 1.0 + (bonusPct / 100);
  }

  static generateNecklaceStats(stage: number, mult: number, rarity: string): Partial<BaseStats> {
    const pool: Array<keyof BaseStats> = [
      'damageMultiplierPct',
      'maxHpPct',
      'maxManaPct',
      'attackSpeedPct',
      'robotClicks',
      'lifesteal',
      'touchDamageMult',
      'dropChancePct',
      'damageReductionPct',
      'frenzyChancePct'
    ];
    
    const numBonuses = rarity === 'common' ? 1 : (rarity === 'rare' ? 2 : 3);
    const selectedKeys = StatEngine.pickRandomElements(pool, numBonuses);
    
    const stats: Partial<BaseStats> = {};
    selectedKeys.forEach((key) => {
      if (key === 'damageMultiplierPct') {
        const raw = 0.02 * (1 + stage * 0.015) * mult;
        stats[key] = Math.round(Math.min(0.20, raw) * 100) / 100;
      } else if (key === 'maxHpPct') {
        const raw = 0.02 * (1 + stage * 0.015) * mult;
        stats[key] = Math.round(Math.min(0.20, raw) * 100) / 100;
      } else if (key === 'maxManaPct') {
        const raw = 0.02 * (1 + stage * 0.015) * mult;
        stats[key] = Math.round(Math.min(0.20, raw) * 100) / 100;
      } else if (key === 'attackSpeedPct') {
        const raw = 0.01 * (1 + stage * 0.01) * mult;
        stats[key] = Math.round(Math.min(0.10, raw) * 100) / 100;
      } else if (key === 'robotClicks') {
        stats[key] = Math.max(1, Math.min(3, Math.floor(1 + (stage * 0.01) * mult)));
      } else if (key === 'lifesteal') {
        const raw = 0.005 * (1 + stage * 0.01) * mult;
        stats[key] = Math.round(Math.min(0.04, raw) * 1000) / 1000;
      } else if (key === 'touchDamageMult') {
        const raw = 0.05 * (1 + stage * 0.02) * mult;
        stats[key] = Math.round(Math.min(0.50, raw) * 100) / 100;
      } else if (key === 'dropChancePct') {
        const raw = 0.01 * (1 + stage * 0.015) * mult;
        stats[key] = Math.round(Math.min(0.15, raw) * 100) / 100;
      } else if (key === 'damageReductionPct') {
        const raw = 0.01 * (1 + stage * 0.01) * mult;
        stats[key] = Math.round(Math.min(0.12, raw) * 100) / 100;
      } else if (key === 'frenzyChancePct') {
        const raw = 0.005 * (1 + stage * 0.005) * mult;
        stats[key] = Math.round(Math.min(0.03, raw) * 1000) / 1000;
      }
    });

    return stats;
  }

  // Amuleto (v7.0.0 "Ecos que Despertam"): item de entrada com exatamente 1 bônus passivo simples,
  // ao contrário do Colar (1-3 bônus) — reforça a primeira lição de itemização no early game.
  static generateAmuletStats(stage: number, mult: number, _rarity: string): Partial<BaseStats> {
    const pool: Array<keyof BaseStats> = ['dropChancePct', 'critChance', 'lifesteal'];
    const [key] = StatEngine.pickRandomElements(pool, 1);

    const stats: Partial<BaseStats> = {};
    if (key === 'dropChancePct') {
      const raw = 0.01 * (1 + stage * 0.01) * mult;
      stats[key] = Math.round(Math.min(0.08, raw) * 100) / 100;
    } else if (key === 'critChance') {
      const raw = 0.01 * (1 + stage * 0.01) * mult;
      stats[key] = Math.round(Math.min(0.05, raw) * 1000) / 1000;
    } else if (key === 'lifesteal') {
      const raw = 0.004 * (1 + stage * 0.01) * mult;
      stats[key] = Math.round(Math.min(0.025, raw) * 1000) / 1000;
    }

    return stats;
  }
}
