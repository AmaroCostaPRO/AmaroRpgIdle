import { GameEvent, EnemyType, ENEMIES_PER_STAGE, BaseStats, EquipmentItem } from './types';
import { bridge } from '../bridge/GameBridge';
import { useGameStore, SKILLS_CATALOG, SKILL_BASE_MULTIPLIERS, formatNumber } from '../store/useGameStore';
import { useRelicStore } from '../store/useRelicStore';
import { useTowerStore } from '../store/useTowerStore';
import { StatEngine } from './StatEngine';
import { COMMAND_CENTER_MATERIAL_DROP_BONUS } from './citadelFormulas';


export const ENEMY_TYPES: EnemyType[] = [
  // === FASE 1: Floresta ===
  {
    id: 'goblin',
    name: 'Goblin Ladino',
    texture: 'enemy_goblin',
    hpMultiplier: 0.75,
    damageMultiplier: 0.85,
    attackSpeedMultiplier: 1.35,
    xpValue: 25,
    color: '#4ade80',
    flipX: false,
    yOffset: 0,
    materialDrops: ['wood']
  },
  {
    id: 'shadow_wolf',
    name: 'Lobo das Sombras',
    texture: 'enemy_wolf',
    hpMultiplier: 0.9,
    damageMultiplier: 1.0,
    attackSpeedMultiplier: 1.2,
    xpValue: 30,
    color: '#94a3b8',
    flipX: false,
    yOffset: 0,
    materialDrops: ['wood', 'meat']
  },
  {
    id: 'orc_warrior',
    name: 'Guerreiro Orc',
    texture: 'enemy_orc',
    hpMultiplier: 1.2,
    damageMultiplier: 1.1,
    attackSpeedMultiplier: 0.9,
    xpValue: 40,
    color: '#f87171',
    flipX: false,
    yOffset: 0,
    materialDrops: ['wood']
  },
  {
    id: 'boss_forest_golem',
    name: 'Golem de Pedra Silvestre',
    texture: 'boss_forest_golem',
    hpMultiplier: 2.5,
    damageMultiplier: 1.4,
    attackSpeedMultiplier: 0.7,
    xpValue: 120,
    color: '#34d399',
    flipX: false,
    yOffset: 0,
    materialDrops: ['wood', 'stone']
  },

  // === FASE 2: Deserto ===
  {
    id: 'sand_serpent',
    name: 'Serpente da Areia',
    texture: 'enemy_sand_serpent',
    hpMultiplier: 0.85,
    damageMultiplier: 1.15,
    attackSpeedMultiplier: 1.1,
    xpValue: 35,
    color: '#fbbf24',
    flipX: false,
    yOffset: 0,
    materialDrops: ['wood', 'meat']
  },
  {
    id: 'desert_bandit',
    name: 'Bandido Nômade',
    texture: 'enemy_desert_bandit',
    hpMultiplier: 1.0,
    damageMultiplier: 1.0,
    attackSpeedMultiplier: 1.25,
    xpValue: 35,
    color: '#f59e0b',
    flipX: false,
    yOffset: 0,
    materialDrops: ['wood']
  },
  {
    id: 'desert_scorpion',
    name: 'Escorpião de Fogo',
    texture: 'enemy_scorpion',
    hpMultiplier: 0.9,
    damageMultiplier: 1.2,
    attackSpeedMultiplier: 1.15,
    xpValue: 38,
    color: '#ef4444',
    flipX: false,
    yOffset: 0,
    materialDrops: ['wood', 'meat']
  },
  {
    id: 'boss_sand_scorpion',
    name: 'Rei Escorpião de Ouro',
    texture: 'boss_sand_scorpion',
    hpMultiplier: 2.8,
    damageMultiplier: 1.5,
    attackSpeedMultiplier: 0.95,
    xpValue: 150,
    color: '#fbbf24',
    flipX: false,
    yOffset: 0,
    materialDrops: ['wood', 'meat']
  },

  // === FASE 3: Neve ===
  {
    id: 'frost_wolf',
    name: 'Lobo Invernal',
    texture: 'enemy_wolf',
    hpMultiplier: 0.95,
    damageMultiplier: 1.0,
    attackSpeedMultiplier: 1.2,
    xpValue: 40,
    color: '#38bdf8',
    flipX: false,
    yOffset: 0,
    materialDrops: ['meat']
  },
  {
    id: 'ice_elemental',
    name: 'Elemental de Gelo',
    texture: 'enemy_ice_elemental',
    hpMultiplier: 1.15,
    damageMultiplier: 1.25,
    attackSpeedMultiplier: 0.9,
    xpValue: 45,
    color: '#7dd3fc',
    flipX: false,
    yOffset: 0
  },
  {
    id: 'cave_yeti',
    name: 'Yeti das Cavernas',
    texture: 'enemy_yeti',
    hpMultiplier: 1.4,
    damageMultiplier: 1.1,
    attackSpeedMultiplier: 0.8,
    xpValue: 50,
    color: '#e2e8f0',
    flipX: false,
    yOffset: 0
  },
  {
    id: 'boss_frost_dragon',
    name: 'Dragão de Gelo Ancião',
    texture: 'boss_frost_dragon',
    hpMultiplier: 3.2,
    damageMultiplier: 1.6,
    attackSpeedMultiplier: 0.85,
    xpValue: 200,
    color: '#0ea5e9',
    flipX: false,
    yOffset: 0
  },

  // === FASE 4: Cemitério ===
  {
    id: 'skeleton_warrior',
    name: 'Esqueleto Guerreiro',
    texture: 'enemy_skeleton',
    hpMultiplier: 1.0,
    damageMultiplier: 1.0,
    attackSpeedMultiplier: 1.0,
    xpValue: 45,
    color: '#94a3b8',
    flipX: false,
    yOffset: 0
  },
  {
    id: 'decaying_zombie',
    name: 'Zumbi Putrefato',
    texture: 'enemy_zombie',
    hpMultiplier: 1.3,
    damageMultiplier: 0.9,
    attackSpeedMultiplier: 0.8,
    xpValue: 48,
    color: '#84cc16',
    flipX: false,
    yOffset: 0
  },
  {
    id: 'tormented_ghost',
    name: 'Fantasma Atormentado',
    texture: 'enemy_ghost',
    hpMultiplier: 0.8,
    damageMultiplier: 1.3,
    attackSpeedMultiplier: 1.1,
    xpValue: 52,
    color: '#67e8f9',
    flipX: false,
    yOffset: 0
  },
  {
    id: 'boss_necromancer',
    name: 'Necromante Sombrio',
    texture: 'enemy_necromancer',
    hpMultiplier: 2.7,
    damageMultiplier: 1.6,
    attackSpeedMultiplier: 0.9,
    xpValue: 250,
    color: '#c084fc',
    flipX: false,
    yOffset: 0
  },

  // === FASE 5: Ruínas ===
  {
    id: 'stone_gargoyle',
    name: 'Gárgula de Pedra',
    texture: 'enemy_gargoyle',
    hpMultiplier: 1.2,
    damageMultiplier: 1.1,
    attackSpeedMultiplier: 1.1,
    xpValue: 55,
    color: '#64748b',
    flipX: false,
    yOffset: 0,
    materialDrops: ['stone']
  },
  {
    id: 'living_armor',
    name: 'Armadura Possuída',
    texture: 'enemy_living_armor',
    hpMultiplier: 1.5,
    damageMultiplier: 1.25,
    attackSpeedMultiplier: 0.85,
    xpValue: 60,
    color: '#a78bfa',
    flipX: false,
    yOffset: 0,
    materialDrops: ['stone']
  },
  {
    id: 'demon_imp',
    name: 'Diabrete Menor',
    texture: 'enemy_imp',
    hpMultiplier: 0.9,
    damageMultiplier: 1.35,
    attackSpeedMultiplier: 1.3,
    xpValue: 58,
    color: '#f43f5e',
    flipX: false,
    yOffset: 0
  },
  {
    id: 'boss_archdemon',
    name: 'Arquidemônio das Ruínas',
    texture: 'boss_archdemon',
    hpMultiplier: 3.5,
    damageMultiplier: 1.7,
    attackSpeedMultiplier: 0.9,
    xpValue: 300,
    color: '#f43f5e',
    flipX: false,
    yOffset: 0
  },
  // === FASE 6: Purgatório (Fases 21-30) ===
  {
    id: 'purgatory_specter',
    name: 'Espectro do Purgatório',
    texture: 'enemy_shadow_reflection',
    hpMultiplier: 3.8,
    damageMultiplier: 3.2,
    attackSpeedMultiplier: 1.2,
    xpValue: 60,
    color: '#e9d5ff',
    flipX: false,
    yOffset: 0,
    materialDrops: ['stone']
  },
  {
    id: 'lost_soul',
    name: 'Alma Perdida',
    texture: 'enemy_mirror_illusion',
    hpMultiplier: 4.2,
    damageMultiplier: 2.8,
    attackSpeedMultiplier: 1.0,
    xpValue: 65,
    color: '#a5f3fc',
    flipX: false,
    yOffset: 0,
    materialDrops: ['meat']
  },
  {
    id: 'crystal_shatterer',
    name: 'Quebrador de Cristais',
    texture: 'enemy_glass_shard',
    hpMultiplier: 4.6,
    damageMultiplier: 3.5,
    attackSpeedMultiplier: 0.85,
    xpValue: 70,
    color: '#f472b6',
    flipX: false,
    yOffset: 0,
    materialDrops: ['wood', 'stone']
  },
  {
    id: 'boss_crystal_guardian',
    name: 'Guardião dos Cacos',
    texture: 'boss_crystal_guardian',
    hpMultiplier: 8.0,
    damageMultiplier: 4.5,
    attackSpeedMultiplier: 1.1,
    xpValue: 500,
    color: '#38bdf8',
    flipX: false,
    yOffset: 0,
    materialDrops: ['wood', 'stone', 'meat']
  }
];

export enum CombatState {
  IDLE = 'IDLE',
  MOVING = 'MOVING',
  ATTACKING = 'ATTACKING',
  CASTING = 'CASTING',
  TRANSITION = 'TRANSITION',
  DEAD = 'DEAD'
}

export interface StatusEffect {
  id: 'stun' | 'poison' | 'slow' | 'burn' | 'consecration' | 'weakness' | 'exposed' | 'bone_shield' | 'soul_siphon' | 'skeleton_army' | 'prismatic_barrier';
  name: string;
  duration: number; // em ms
  tickTimer: number; // em ms
  value: number; // valor associado ao efeito (dano, cura ou percentual)
}

export class CombatFSM {
  private currentState: CombatState = CombatState.IDLE;
  public characterData: any;
  private playerFinalStats!: BaseStats;
  private target?: any;

  public playerHP: number = 100;
  public playerMaxHP: number = 100;
  public playerMana: number = 50;
  public playerMaxMana: number = 50;
  public playerShield: number = 0;

  public enemyHP: number = 100;
  public enemyMaxHP: number = 100;
  public enemyLevel: number = 1;
  public currentEnemy: EnemyType = ENEMY_TYPES[0];
  public isElite: boolean = false;
  public eliteAfix?: 'enfurecido' | 'blindado' | 'vampirico' | 'volatil' | 'regenerador';

  private attackCooldown: number = 0;
  private enemyAttackCooldown: number = 0;
  public enemyEffects: StatusEffect[] = [];
  public playerEffects: StatusEffect[] = [];
  private scene: any;
  private skillCooldowns: Record<string, number> = {};
  private cooldownEmitTimer: number = 0;
  private autoCastTimer: number = 0;

  private storeUnsubscribe?: () => void;
  private unsubscribeStartCombat?: () => void;
  private lastEmitHP: number = -1;
  private lastEmitMaxHP: number = -1;
  private lastEmitMana: number = -1;
  private lastEmitMaxMana: number = -1;
  private hadActiveCooldowns: boolean = true;
  
  // Mecânicas de Toque (Tap Combat)
  public frenzyEnergy: number = 0;
  public isFrenzyActive: boolean = false;
  private frenzyDuration: number = 0;
  private frenzyAutoTapTimer: number = 0;
  public comboCount: number = 0;
  public comboTimer: number = 0;
  private lastTapTimestamp: number = 0;
  private robotTapTimer: number = 0;
  private creepingPoisonTimer: number = 0;
  private crystalGuardianSecondPhase: boolean = false;
  private lastCommonEnemyDefeated: any = null;
  private summonedAlly: any = null;
  private summonedAllyTimer: number = 0;
  private summonedAllyAttackCooldown: number = 0;

  // Métodos auxiliares de balanceamento de atributos por classe
  private calculatePlayerMaxHP(constitution: number, hpBoost: number, classId: string): number {
    // Se constituição é o atributo primário (Paladino), escala menos: 8 HP por ponto
    // Se NÃO é o atributo primário (outras classes), escala mais: 18 HP por ponto
    const hpPerCon = (classId === 'paladin') ? 8 : 18;
    const setHpMultiplier = 1 + (this.playerFinalStats?.maxHpPct || 0);
    return Math.floor(constitution * hpPerCon * hpBoost * setHpMultiplier);
  }

  private calculatePlayerMaxMana(magic: number, manaBoost: number, classId: string): number {
    // Se magia é o atributo primário (Mago, Clérigo), escala menos: 6 Mana por ponto
    // Se NÃO é o atributo primário (outras classes), escala mais: 18 Mana por ponto
    const manaPerMagic = (classId === 'mage' || classId === 'cleric') ? 6 : 18;
    return Math.floor(magic * manaPerMagic * manaBoost);
  }

  private getHpRegen(constitution: number, classId: string): number {
    // Se constituição é o atributo primário (Paladino), escala menos: 0.03 por ponto
    // Se NÃO é o atributo primário (outras classes), escala mais: 0.08 por ponto
    const regenPerCon = (classId === 'paladin') ? 0.03 : 0.08;
    return constitution * regenPerCon;
  }

  private getManaRegen(magic: number, classId: string): number {
    // Se magia é o atributo primário (Mago, Clérigo), escala menos: 0.02 por ponto
    // Se NÃO é o atributo primário (outras classes), escala mais: 0.05 por ponto
    const regenPerMagic = (classId === 'mage' || classId === 'cleric') ? 0.02 : 0.05;
    return magic * regenPerMagic;
  }

  private getSpeedMultiplier(dexterity: number, classId: string, attackSpeedBoost: number): number {
    // Se destreza é o atributo primário (Arqueiro, Ladrão), usa um multiplicador menor baseado na raiz quadrada
    // Se NÃO é o atributo primário (outras classes), o multiplicador de raiz quadrada é maior para compensar a falta de destreza base
    const factor = (classId === 'ranger' || classId === 'rogue') ? 0.15 : 0.40;
    const setSpeedMultiplier = 1 + (this.playerFinalStats?.attackSpeedPct || 0);
    return (1 + Math.sqrt(dexterity) * factor) * attackSpeedBoost * setSpeedMultiplier;
  }

  // Verifica se uma relíquia foi submetida ao Superaquecimento de Alma no Laboratório de Relíquias Místicas da Cidadela
  private isRelicOverheated(relicId: string): boolean {
    return (this.characterData?.citadel?.relicLab?.overheatedRelicIds || []).includes(relicId);
  }

  // Atributo Efetivo do Avatar: Maior Atributo Ativo + % dos demais injetada pelo Altar de Sincronia Elemental da Cidadela
  private getAvatarEffectiveAttribute(): number {
    const stats = [
      this.playerFinalStats.strength || 0,
      this.playerFinalStats.magic || 0,
      this.playerFinalStats.dexterity || 0,
      this.playerFinalStats.constitution || 0,
      this.playerFinalStats.luck || 0
    ];
    const highest = Math.max(...stats);
    const sumOthers = stats.reduce((sum, val) => sum + val, 0) - highest;
    const altarLevel = this.characterData?.citadel?.synchronyAltar?.level || 0;
    return highest + Math.floor(sumOthers * altarLevel * 0.03);
  }

  constructor(scene: any, initialTarget?: any) {
    this.scene = scene;
    this.target = initialTarget;
    
    const char = useGameStore.getState().character;
    const isTower = useTowerStore.getState().towerActive;
    if (isTower) {
      this.setupEnemyForLevel(useTowerStore.getState().currentFloor, 0);
    } else {
      this.setupEnemyForLevel(char.currentStage, char.enemiesDefeatedInStage);
    }
    this.updateStatsFromStore();

    this.storeUnsubscribe = useGameStore.subscribe(() => {
      this.updateStatsFromStore();
    });

    this.unsubscribeStartCombat = bridge.subscribe(GameEvent.START_COMBAT, (payload) => {
      const activeTower = useTowerStore.getState().towerActive;
      if (activeTower) {
        const floor = useTowerStore.getState().currentFloor;
        this.enemyLevel = floor;
        this.setupEnemyForLevel(floor, 0);
        this.playerHP = this.playerMaxHP;
        this.playerMana = this.playerMaxMana;
        this.skillCooldowns = {};
        this.currentState = CombatState.IDLE;
        
        if (this.scene && this.scene.sys && this.scene.sys.isActive()) {
          this.scene.respawnEnemyAt(900, this.currentEnemy);
          this.scene.respawnPlayer();
        }
      } else {
        const activeChar = useGameStore.getState().character;
        this.enemyLevel = activeChar.currentStage;
        this.setupEnemyForLevel(activeChar.currentStage, activeChar.enemiesDefeatedInStage);
        const devocaoLvl = useRelicStore.getState().relics['brasao_devoacao']?.level || 0;
        this.playerHP = devocaoLvl === 5 ? Math.floor(this.playerMaxHP * (this.isRelicOverheated('brasao_devoacao') ? 1.05 : 1.02)) : this.playerMaxHP;
        this.playerMana = this.playerMaxMana;
        this.skillCooldowns = {};
        this.currentState = CombatState.IDLE;

        if (this.scene && this.scene.sys && this.scene.sys.isActive()) {
          this.scene.respawnEnemyAt(900, this.currentEnemy);
          this.scene.respawnPlayer();
        }
      }
      bridge.emit(GameEvent.COOLDOWNS_CHANGED, { cooldowns: {} });
    });
  }

  public cleanup(): void {
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = undefined;
    }
    if (this.unsubscribeStartCombat) {
      this.unsubscribeStartCombat();
      this.unsubscribeStartCombat = undefined;
    }
  }

  private setupEnemyForLevel(stage: number, defeatedInStage: number): void {
    this.enemyEffects = [];
    this.playerEffects = [];
    this.playerShield = 0;
    this.enemyLevel = stage;
    this.crystalGuardianSecondPhase = false; // Reset da flag da segunda fase
    this.summonedAlly = null;
    this.summonedAllyTimer = 0;

    const isBoss = defeatedInStage === ENEMIES_PER_STAGE;
    const isTower = useTowerStore.getState().towerActive;

    if (isTower) {
      const floor = useTowerStore.getState().currentFloor;
      this.enemyLevel = floor;
      const isTowerBoss = floor % 5 === 0;
      
      // Geração determinística baseada na seed semanal e no andar da torre
      const weeklySeed = useTowerStore.getState().weeklySeed || 1;
      const randSin = (s: number) => {
        const x = Math.sin(s) * 10000;
        return x - Math.floor(x);
      };
      const lookupSeed = weeklySeed * 37 + floor;
      const randVal = randSin(lookupSeed);

      if (isTowerBoss) {
        const bosses = ENEMY_TYPES.filter(e => e.id.startsWith('boss_') && e.id !== 'boss_crystal_guardian');
        const idx = Math.floor(randVal * bosses.length);
        this.currentEnemy = bosses[idx];
      } else {
        const commons = ENEMY_TYPES.filter(e => !e.id.startsWith('boss_'));
        const idx = Math.floor(randVal * commons.length);
        this.currentEnemy = commons[idx];
      }

      // Escala de dificuldade e vida da torre (exponencial suave)
      const difficultyScale = Math.pow(1.14, floor - 1);
      this.enemyMaxHP = Math.floor((150 + (floor * 40)) * difficultyScale * this.currentEnemy.hpMultiplier);
      
      if (isTowerBoss) {
        this.enemyMaxHP = Math.floor(this.enemyMaxHP * 3.0);
      }
      this.enemyHP = this.enemyMaxHP;

      this.isElite = false;
      this.eliteAfix = undefined;
      
      if (!isTowerBoss && floor >= 5) {
        const eliteChance = Math.min(0.35, 0.08 + (floor - 5) * 0.01);
        const lcgEliteVal = randSin(lookupSeed + 999);
        if (lcgEliteVal < eliteChance) {
          this.isElite = true;
          const afixos = ['enfurecido', 'blindado', 'vampirico', 'volatil', 'regenerador'] as const;
          const afixIdx = Math.floor(randSin(lookupSeed + 888) * afixos.length);
          this.eliteAfix = afixos[afixIdx];
          this.enemyMaxHP = Math.floor(this.enemyMaxHP * 3.0);
          this.enemyHP = this.enemyMaxHP;
        }
      }

      return;
    }

    // Multiplicador de HP/Dano por dificuldade:
    // Normal (1-5): 1.0× | Pesadelo (6-10): 2.0× | Inferno (11-15): 3.0× | Apocalipse (16-20): 4.0× | Purgatório (21-30): 5.0× | Pandemônio (31+): 6.0×
    const hpBoost = stage >= 31 ? 6.0 : stage >= 21 ? 5.0 : stage >= 16 ? 4.0 : stage >= 11 ? 3.0 : stage >= 6 ? 2.0 : 1.0;

    // Escala de dificuldade exponencial para tornar fases progressivamente mais difíceis (ajustada para 1.30x por fase)
    const difficultyScale = Math.pow(1.30, stage - 1);

    if (stage >= 31) {
      // No Pandemônio, todos os inimigos comuns podem aparecer aleatoriamente
      const nonBossEnemies = ENEMY_TYPES.filter(e => !e.id.startsWith('boss_'));
      const randIndex = Math.floor(Math.random() * nonBossEnemies.length);
      this.currentEnemy = nonBossEnemies[randIndex];
      if (isBoss) {
        // Boss aleatório no Pandemônio
        const bossEnemies = ENEMY_TYPES.filter(e => e.id.startsWith('boss_'));
        const randBossIndex = Math.floor(Math.random() * bossEnemies.length);
        this.currentEnemy = bossEnemies[randBossIndex];
        this.enemyMaxHP = Math.floor((150 + (stage * 50)) * difficultyScale * this.currentEnemy.hpMultiplier * 3.0 * hpBoost);
      } else {
        this.enemyMaxHP = Math.floor((150 + (stage * 50)) * difficultyScale * this.currentEnemy.hpMultiplier * hpBoost);
      }
      this.enemyHP = this.enemyMaxHP;
    } else if (stage >= 21 && stage <= 30) {
      // Purgatório: fases fixas
      if (isBoss) {
        if (stage === 30) {
          // Guardião dos Cacos
          this.currentEnemy = ENEMY_TYPES.find(e => e.id === 'boss_crystal_guardian') || ENEMY_TYPES[ENEMY_TYPES.length - 1];
        } else {
          // Outros chefes para fases 21-29 do Purgatório (cíclico dos chefes normais)
          const bossIds = ['boss_forest_golem', 'boss_sand_scorpion', 'boss_frost_dragon', 'boss_necromancer', 'boss_archdemon'];
          const idx = (stage - 21) % bossIds.length;
          this.currentEnemy = ENEMY_TYPES.find(e => e.id === bossIds[idx]) || ENEMY_TYPES[0];
        }
        this.enemyMaxHP = Math.floor((150 + (stage * 50)) * difficultyScale * this.currentEnemy.hpMultiplier * 3.0 * hpBoost);
      } else {
        // Monstros comuns do Purgatório
        const purgatoryEnemies = ENEMY_TYPES.filter(e => ['purgatory_specter', 'lost_soul', 'crystal_shatterer'].includes(e.id));
        const randIndex = defeatedInStage % purgatoryEnemies.length;
        this.currentEnemy = purgatoryEnemies[randIndex];
        this.enemyMaxHP = Math.floor((150 + (stage * 50)) * difficultyScale * this.currentEnemy.hpMultiplier * hpBoost);
      }
      this.enemyHP = this.enemyMaxHP;
    } else if (isBoss) {
      const theme = ((stage - 1) % 5) + 1;
      let bossId = 'boss_forest_golem';
      if (theme === 2) bossId = 'boss_sand_scorpion';
      else if (theme === 3) bossId = 'boss_frost_dragon';
      else if (theme === 4) bossId = 'boss_necromancer';
      else if (theme === 5) bossId = 'boss_archdemon';

      this.currentEnemy = ENEMY_TYPES.find(e => e.id === bossId) || ENEMY_TYPES[0];
      this.enemyMaxHP = Math.floor((150 + (stage * 50)) * difficultyScale * this.currentEnemy.hpMultiplier * 3.0 * hpBoost);
      this.enemyHP = this.enemyMaxHP;
    } else {
      const theme = ((stage - 1) % 5) + 1;
      let commonIds: string[] = [];
      if (theme === 1) commonIds = ['goblin', 'shadow_wolf', 'orc_warrior'];
      else if (theme === 2) commonIds = ['sand_serpent', 'desert_bandit', 'desert_scorpion'];
      else if (theme === 3) commonIds = ['frost_wolf', 'ice_elemental', 'cave_yeti'];
      else if (theme === 4) commonIds = ['skeleton_warrior', 'decaying_zombie', 'tormented_ghost'];
      else if (theme === 5) commonIds = ['stone_gargoyle', 'living_armor', 'demon_imp'];

      const commonEnemies = ENEMY_TYPES.filter(e => commonIds.includes(e.id));
      const activeList = commonEnemies.length > 0 ? commonEnemies : ENEMY_TYPES.slice(0, 3);
      
      const randIndex = defeatedInStage % activeList.length;
      this.currentEnemy = activeList[randIndex];
      this.enemyMaxHP = Math.floor((150 + (stage * 50)) * difficultyScale * this.currentEnemy.hpMultiplier * hpBoost);
      this.enemyHP = this.enemyMaxHP;
    }

    // Inicializar estado de elite como falso por padrão
    this.isElite = false;
    this.eliteAfix = undefined;

    // Aplicar lógica de Elite se não for chefe e a dificuldade for Inferno ou superior (stage >= 11)
    if (!isBoss && stage >= 11) {
      let eliteChance = 0.08;
      if (stage >= 21) {
        // Pandemônio: +0.5% chance por fase adicional
        eliteChance += (stage - 20) * 0.005;
      }
      if (Math.random() < eliteChance) {
        this.isElite = true;
        const afixos = ['enfurecido', 'blindado', 'vampirico', 'volatil', 'regenerador'] as const;
        this.eliteAfix = afixos[Math.floor(Math.random() * afixos.length)];
        
        // HP do Elite é multiplicado por 3.0x
        this.enemyMaxHP = Math.floor(this.enemyMaxHP * 3.0);
        this.enemyHP = this.enemyMaxHP;
      }
    }

    // Modificadores da Ecoterra (+30% HP)
    const char = useGameStore.getState().character;
    const isEcoterra = !isTower && char?.activeEcoterra && stage <= 20;
    if (isEcoterra) {
      this.enemyMaxHP = Math.floor(this.enemyMaxHP * 1.3);
      this.enemyHP = this.enemyMaxHP;
    }
  }

  private updateStatsFromStore() {
    const char = useGameStore.getState().character;
    this.characterData = char;
    this.playerFinalStats = StatEngine.calculateFinalStats(char);

    const ascensionCount = char.ascensionCount || 0;
    const hpBoost = 1 + (ascensionCount * 0.025); // +2.5% por ascensão
    const manaBoost = 1 + (ascensionCount * 0.025); // +2.5% por ascensão

    const prevMaxHP = this.playerMaxHP;
    this.playerMaxHP = this.calculatePlayerMaxHP(this.playerFinalStats.constitution, hpBoost, char.classId || 'warrior');

    if (this.playerMaxHP > prevMaxHP) {
      this.playerHP += (this.playerMaxHP - prevMaxHP);
    }
    this.playerHP = Math.min(this.playerHP, this.playerMaxHP);

    const prevMaxMana = this.playerMaxMana;
    this.playerMaxMana = this.calculatePlayerMaxMana(this.playerFinalStats.magic, manaBoost, char.classId || 'warrior');
    if (this.playerMaxMana > prevMaxMana) {
      this.playerMana += (this.playerMaxMana - prevMaxMana);
    }
    this.playerMana = Math.min(this.playerMana, this.playerMaxMana);

    const isTower = useTowerStore.getState().towerActive;
    if (isTower) {
      const currentFloor = useTowerStore.getState().currentFloor;
      if (this.enemyLevel !== currentFloor) {
        this.enemyLevel = currentFloor;
        this.setupEnemyForLevel(currentFloor, 0);
        if (this.scene && this.scene.sys && this.scene.sys.isActive()) {
          this.scene.respawnEnemyAt(900, this.currentEnemy);
        }
      }
      this.playerHP = Math.min(this.playerHP, this.playerMaxHP);
      this.playerMana = Math.min(this.playerMana, this.playerMaxMana);
    } else {
      // Reinicia ou ajusta inimigo se mudou de fase/prestígio
      const hasPrestigeReset = char.level === 1 && char.xp === 0;
      if (this.enemyLevel !== char.currentStage || hasPrestigeReset) {
        this.enemyLevel = char.currentStage;
        this.setupEnemyForLevel(char.currentStage, char.enemiesDefeatedInStage);
        const devocaoLvl = useRelicStore.getState().relics['brasao_devoacao']?.level || 0;
        if (devocaoLvl === 5) {
          this.playerHP = Math.floor(this.playerMaxHP * (this.isRelicOverheated('brasao_devoacao') ? 1.05 : 1.02));
        } else {
          this.playerHP = this.playerMaxHP;
        }
        this.playerMana = this.playerMaxMana;
        this.currentState = CombatState.IDLE;
        this.skillCooldowns = {};
        
        if (this.scene && this.scene.sys && this.scene.sys.isActive()) {
          this.scene.respawnEnemyAt(900, this.currentEnemy);
          this.scene.respawnPlayer();
        }
      }
    }
  }

  public update(delta: number): void {
    if (this.currentState === CombatState.DEAD || this.currentState === CombatState.TRANSITION) return;

    // Processamento do servo ressuscitado (Necromancia)
    if (this.summonedAlly && this.summonedAllyTimer > 0) {
      this.summonedAllyTimer -= delta;
      if (this.summonedAllyTimer <= 0) {
        bridge.emit(GameEvent.LOG_EMITTED, { message: `💀 O servo ressuscitado de ${this.summonedAlly.name} retornou ao descanso eterno.` });
        this.summonedAlly = null;
      } else {
        this.summonedAllyAttackCooldown -= delta;
        if (this.summonedAllyAttackCooldown <= 0 && this.enemyHP > 0) {
          const dmgScale = Math.pow(1.25, this.enemyLevel - 1);
          const dmgBoost = this.enemyLevel >= 31 ? 22.0 : this.enemyLevel >= 21 ? 18.0 : this.enemyLevel >= 16 ? 4.0 : this.enemyLevel >= 11 ? 3.0 : this.enemyLevel >= 6 ? 2.0 : 1.0;
          // x2: dano do servo ressuscitado pela ultimate do Necromante foi dobrado junto com as demais ultimates
          let summonDmg = Math.floor((10 + this.enemyLevel * 4.0) * dmgScale * this.summonedAlly.damageMultiplier * dmgBoost * 2);
          
          if (this.characterData && this.characterData.classId === 'necromancer') {
            const luckBonus = 1 + (this.playerFinalStats.luck * 0.001);
            summonDmg = Math.floor(summonDmg * luckBonus);
          }
          
          this.damageEnemy(summonDmg, false);
          this.summonedAllyAttackCooldown = 1500;
          
          if (this.scene && typeof this.scene.spawnDamageText === 'function') {
            this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 60, `-${summonDmg} (${this.summonedAlly.name})`, '#a855f7');
          }
          bridge.emit(GameEvent.LOG_EMITTED, { message: `💀 Seu servo ${this.summonedAlly.name} atacou o inimigo e causou ${formatNumber(summonDmg, useGameStore.getState().abbreviateNumbers)} de dano!` });
        }
      }
    }

    // Atualização de Frenesi
    if (this.isFrenzyActive) {
      this.frenzyDuration -= delta;
      if (this.frenzyDuration <= 0) {
        this.isFrenzyActive = false;
        this.frenzyEnergy = 0;
        bridge.emit(GameEvent.FRENZY_STATE_CHANGED, { active: false, energy: 0 });
        bridge.emit(GameEvent.LOG_EMITTED, { message: `O modo Frenesi acabou.` });
      } else {
        this.frenzyAutoTapTimer += delta;
        if (this.frenzyAutoTapTimer >= 200) { // 5 toques por segundo (a cada 200ms)
          this.frenzyAutoTapTimer = 0;
          this.performTap(true);
        }
      }
    }

    // Atualização de Combo
    if (this.comboCount > 0) {
      if (this.isFrenzyActive) {
        // O combo não decai e o timer de expiração permanece zerado durante o Frenesi
        this.comboTimer = 0;
      } else {
        this.comboTimer += delta;
        if (this.comboTimer >= 1500) {
          this.comboCount = 0;
          this.comboTimer = 0;
          bridge.emit(GameEvent.COMBO_STATE_CHANGED, { combo: 0 });
          bridge.emit(GameEvent.LOG_EMITTED, { message: `Combo resetado!` });
        }
      }
    }
    
    // Atualização de Cliques do Robô Assistente
    if (this.playerFinalStats.robotClicks > 0 && this.enemyHP > 0 && !useGameStore.getState().disableRobotTap) {
      this.robotTapTimer += delta;
      const tapInterval = 1000 / this.playerFinalStats.robotClicks;
      if (this.robotTapTimer >= tapInterval) {
        this.robotTapTimer = 0;
        this.performTap(true);
      }
    }

    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    // Lentidão e atordoamento afetam a recarga do ataque do inimigo
    const isEnemyStunned = this.enemyEffects.some(e => e.id === 'stun');
    if (this.enemyAttackCooldown > 0 && !isEnemyStunned) {
      const slowEffect = this.enemyEffects.find(e => e.id === 'slow');
      const slowMultiplier = slowEffect ? (1 - slowEffect.value) : 1.0;
      this.enemyAttackCooldown -= delta * slowMultiplier;
    }

    // Recuperação de HP/Mana baseada em atributos e balanceada por classe
    const classId = this.characterData?.classId || 'warrior';
    this.playerHP = Math.min(this.playerMaxHP, this.playerHP + (this.getHpRegen(this.playerFinalStats.constitution, classId) * (delta / 1000)));
    const regenPctBoost = useRelicStore.getState().relics['nucleo_pensamento']?.level === 5
      ? (this.isRelicOverheated('nucleo_pensamento') ? 1.375 : 1.15)
      : 1.0;
    this.playerMana = Math.min(this.playerMaxMana, this.playerMana + (this.getManaRegen(this.playerFinalStats.magic, classId) * regenPctBoost * (delta / 1000)));

    const isEcoterraActive = !useTowerStore.getState().towerActive && this.characterData?.activeEcoterra && (this.characterData?.currentStage || 1) <= 20;
    if (isEcoterraActive) {
      // Sifão de Essência Cósmica da Cidadela: mitiga a drenagem de mana ambiental de 1.5%/s (Nível 0) até 0%/s (Nível 5, Sincronia Perfeita)
      const siphonLevel = this.characterData?.citadel?.cosmicSiphon?.level || 0;
      const manaDrainPct = Math.max(0, 0.015 - siphonLevel * 0.003);
      const manaDrain = this.playerMaxMana * manaDrainPct * (delta / 1000);
      this.playerMana = Math.max(0, this.playerMana - manaDrain);
    }

    // Processamento do afixo diário Veneno Rastejante (perde 1% do HP máximo a cada 1.5s)
    if (this.characterData.activeDailyChallenge) {
      const today = useGameStore.getState().getTodayYYYYMMDD();
      const seed = parseInt(today, 10);
      const activeModifierIndex = seed % 5;
      if (activeModifierIndex === 4 && this.enemyHP > 0 && this.playerHP > 0) { // 4: creeping_poison
        this.creepingPoisonTimer += delta;
        if (this.creepingPoisonTimer >= 1500) {
          this.creepingPoisonTimer = 0;
          const poisonDmg = Math.max(1, Math.floor(this.playerMaxHP * 0.01));
          this.playerHP = Math.max(0, this.playerHP - poisonDmg);
          if (this.scene && typeof this.scene.spawnDamageText === 'function') {
            this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 30, `-${poisonDmg} (Veneno)`, '#10b981');
          }
          bridge.emit(GameEvent.LOG_EMITTED, { message: `🤢 O Veneno Rastejante causou ${formatNumber(poisonDmg, useGameStore.getState().abbreviateNumbers)} de dano contínuo a você.` });
          if (this.playerHP <= 0) {
            this.handlePlayerDefeat();
          }
        }
      }
    }

    // Regeneração de HP para inimigos Elite com o afixo 'regenerador' (2% do HP Máximo por segundo)
    if (this.isElite && this.eliteAfix === 'regenerador' && this.enemyHP > 0 && this.enemyHP < this.enemyMaxHP) {
      const regenAmount = this.enemyMaxHP * 0.02 * (delta / 1000);
      this.enemyHP = Math.min(this.enemyMaxHP, this.enemyHP + regenAmount);
    }

    // Processar e atualizar durações de efeitos de status no inimigo
    const wasEnemyStunned = this.enemyEffects.some(e => e.id === 'stun');

    this.enemyEffects = this.enemyEffects.filter(effect => {
      effect.duration -= delta;
      if (effect.duration <= 0) return false;

      effect.tickTimer -= delta;
      if (effect.tickTimer <= 0) {
        effect.tickTimer = 1000;
        if (effect.id === 'poison' || effect.id === 'burn' || effect.id === 'skeleton_army') {
          const tickDmg = Math.floor(effect.value);
          let color = '#22c55e';
          let label = 'Veneno';
          if (effect.id === 'burn') {
            color = '#f97316';
            label = 'Queima';
          } else if (effect.id === 'skeleton_army') {
            color = '#8b5cf6';
            label = 'Esqueleto';
          }
          
          if (this.scene && typeof this.scene.spawnDamageText === 'function') {
            this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `-${tickDmg} (${label})`, color);
          }
          bridge.emit(GameEvent.LOG_EMITTED, { message: `O inimigo sofreu ${formatNumber(tickDmg, useGameStore.getState().abbreviateNumbers)} de dano por ${label}.` });

          this.damageEnemy(tickDmg, false);
          if (this.enemyHP <= 0) {
            return false;
          }
        }
      }
      return true;
    });

    const isEnemyStunnedNow = this.enemyEffects.some(e => e.id === 'stun');
    if (wasEnemyStunned && !isEnemyStunnedNow && this.enemyHP > 0) {
      const baseCooldown = 3600 - (this.enemyLevel * 30);
      let speedMult = this.currentEnemy.attackSpeedMultiplier;
      if (this.isElite && this.eliteAfix === 'enfurecido') {
        speedMult *= 1.4;
      }
      const isTower = useTowerStore.getState().towerActive;
      const char = useGameStore.getState().character;
      const isEcoterra = !isTower && char?.activeEcoterra && this.enemyLevel <= 20;
      if (isEcoterra) {
        speedMult *= 1.2;
      }
      this.enemyAttackCooldown = Math.max(1000, baseCooldown / speedMult);
      bridge.emit(GameEvent.LOG_EMITTED, { message: `O inimigo se recuperou do atordoamento e recomeça a preparar seu ataque!` });
    }

    // Processar e atualizar durações de efeitos de status no jogador
    this.playerEffects = this.playerEffects.filter(effect => {
      effect.duration -= delta;
      if (effect.duration <= 0) {
        if (effect.id === 'prismatic_barrier') {
          this.playerShield = 0;
          bridge.emit(GameEvent.LOG_EMITTED, { message: `🛡️ A Barreira Prismática expirou.` });
        }
        if (effect.id === 'bone_shield') {
          const constVal = this.playerFinalStats.constitution || 0;
          const levelMultiplier = effect.value;
          const boneShieldDmg = Math.floor(1.50 * constVal * levelMultiplier * 3.0);
          this.damageEnemy(boneShieldDmg, false);
          if (this.scene && typeof this.scene.spawnDamageText === 'function') {
            this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `-${boneShieldDmg} (Escudo Ósseo)`, '#7c3aed');
          }
          bridge.emit(GameEvent.LOG_EMITTED, { message: `💀 Seu Escudo Ósseo expirou e explodiu causando ${boneShieldDmg} de dano ao inimigo!` });
        }
        return false;
      }

      effect.tickTimer -= delta;
      if (effect.tickTimer <= 0) {
        effect.tickTimer = 1000;
        if (effect.id === 'consecration') {
          const healVal = Math.floor(effect.value);
          this.playerHP = Math.min(this.playerMaxHP, this.playerHP + healVal);
          
          if (this.scene && typeof this.scene.spawnDamageText === 'function') {
            this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 30, `+${healVal}`, '#10b981');
          }
          bridge.emit(GameEvent.LOG_EMITTED, { message: `Consagração curou você em +${healVal} HP.` });
        }
      }
      return true;
    });

    // Atualizar cooldowns
    Object.keys(this.skillCooldowns).forEach((skillId) => {
      if (this.skillCooldowns[skillId] > 0) {
        this.skillCooldowns[skillId] = Math.max(0, this.skillCooldowns[skillId] - delta);
      }
    });

    const hasActiveCooldowns = Object.values(this.skillCooldowns).some(val => val > 0);
    this.cooldownEmitTimer += delta;
    if (this.cooldownEmitTimer >= 250) {
      this.cooldownEmitTimer = 0;
      if (hasActiveCooldowns || this.hadActiveCooldowns) {
        bridge.emit(GameEvent.COOLDOWNS_CHANGED, { cooldowns: { ...this.skillCooldowns } });
        this.hadActiveCooldowns = hasActiveCooldowns;
      }
    }

    // Executar Auto-Cast
    this.autoCastTimer += delta;
    if (this.autoCastTimer >= 300) {
      this.autoCastTimer = 0;
      this.runAutoCastAI();
    }

    const currentHP = Math.floor(this.playerHP);
    const currentMana = Math.floor(this.playerMana);

    if (currentHP !== this.lastEmitHP || this.playerMaxHP !== this.lastEmitMaxHP) {
      this.lastEmitHP = currentHP;
      this.lastEmitMaxHP = this.playerMaxHP;
      bridge.emit(GameEvent.PLAYER_HP_CHANGED, {
        pct: Math.floor((currentHP / this.playerMaxHP) * 100),
        current: currentHP,
        max: this.playerMaxHP
      });
    }

    if (currentMana !== this.lastEmitMana || this.playerMaxMana !== this.lastEmitMaxMana) {
      this.lastEmitMana = currentMana;
      this.lastEmitMaxMana = this.playerMaxMana;
      bridge.emit(GameEvent.PLAYER_MANA_CHANGED, {
        pct: Math.floor((currentMana / this.playerMaxMana) * 100),
        current: currentMana,
        max: this.playerMaxMana
      });
    }

    switch (this.currentState) {
      case CombatState.IDLE:
        this.handleIdle();
        break;
      case CombatState.MOVING:
        this.handleMoving(delta);
        break;
      case CombatState.ATTACKING:
        this.handleAttacking(delta);
        break;
    }
  }

  public getCurrentState(): CombatState {
    return this.currentState;
  }

  public getPassiveDPS(): number {
    const char = this.characterData || useGameStore.getState().character;
    if (!char) return 0;
    
    const finalStats = this.playerFinalStats || StatEngine.calculateFinalStats(char);
    const ascensionCount = char.ascensionCount || 0;
    const relicLvlFoco = useRelicStore.getState().relics['foco_precisao']?.level || 0;
    const precisionSpeedBoost = relicLvlFoco === 5 ? (this.isRelicOverheated('foco_precisao') ? 0.125 : 0.05) : 0;
    const attackSpeedBoost = 1 + (ascensionCount * 0.01) + precisionSpeedBoost;
    const speedMultiplier = Math.min(15, this.getSpeedMultiplier(finalStats.dexterity, char.classId || 'warrior', attackSpeedBoost));
    const attackSpeedHz = speedMultiplier / 3.0; // ataques por segundo

    const classId = char.classId || 'warrior';
    let primaryStatVal = finalStats.strength;
    if (classId === 'mage' || classId === 'cleric') {
      primaryStatVal = finalStats.magic;
    } else if (classId === 'ranger' || classId === 'rogue') {
      primaryStatVal = finalStats.dexterity;
    } else if (classId === 'paladin') {
      primaryStatVal = finalStats.constitution;
    }

    const bestiaryMult = StatEngine.calculateBestiaryDamageMultiplier(char.killCount || {});
    const damageBoost = (1 + (ascensionCount * 0.05)) * bestiaryMult;
    const basicDmg = primaryStatVal * 3.0 * damageBoost;
    
    let dps = basicDmg * attackSpeedHz;
    return Math.max(1, dps);
  }

  public activateFrenzyBoost(durationMs: number): void {
    this.isFrenzyActive = true;
    this.frenzyDuration = durationMs;
    this.frenzyAutoTapTimer = 0;
    this.frenzyEnergy = 100;
    bridge.emit(GameEvent.FRENZY_STATE_CHANGED, { active: true, energy: 100 });
    bridge.emit(GameEvent.LOG_EMITTED, { message: `🔥 BOOST DE FRENESI! Auto-ataques críticos ativos por ${Math.round(durationMs / 1000)} segundos!` });
  }

  public handlePlayerTap(clickX?: number, clickY?: number): void {
    // Impede toques caso o jogo esteja pausado (velocidade do jogo igual a 0)
    if (useGameStore.getState().gameSpeed === 0) return;

    if (this.currentState === CombatState.DEAD || this.currentState === CombatState.MOVING || this.currentState === CombatState.TRANSITION || this.enemyHP <= 0) return;
    
    // Throttling: limite de 20 cliques por segundo (50ms por clique)
    const now = Date.now();
    if (now - this.lastTapTimestamp < 50) {
      return;
    }
    this.lastTapTimestamp = now;

    if (this.isFrenzyActive) return;

    const frenzyChance = this.playerFinalStats.frenzyChancePct || 0;
    if (Math.random() < frenzyChance) {
      this.frenzyEnergy = 100;
      bridge.emit(GameEvent.LOG_EMITTED, { message: `⚡ Sorte do Colar: Frenesi ativado instantaneamente!` });
    } else {
      this.frenzyEnergy = Math.min(100, this.frenzyEnergy + 1);
    }
    this.comboCount++;
    this.comboTimer = 0;

    bridge.emit(GameEvent.COMBO_STATE_CHANGED, { combo: this.comboCount });
    bridge.emit(GameEvent.FRENZY_STATE_CHANGED, { active: this.isFrenzyActive, energy: this.frenzyEnergy });

    if (this.frenzyEnergy >= 100) {
      this.isFrenzyActive = true;
      this.frenzyDuration = 10000;
      this.frenzyAutoTapTimer = 0;
      bridge.emit(GameEvent.FRENZY_STATE_CHANGED, { active: true, energy: 100 });
      bridge.emit(GameEvent.LOG_EMITTED, { message: `🔥 MODO FRENESI ATIVADO! Toques automáticos críticos por 10 segundos!` });
    }

    this.performTap(false, clickX, clickY);
  }

  private performTap(isAuto: boolean, clickX?: number, clickY?: number): void {
    // Impede a execução de toques caso o jogo esteja pausado
    if (useGameStore.getState().gameSpeed === 0) return;

    if (this.currentState === CombatState.DEAD || this.currentState === CombatState.MOVING || this.currentState === CombatState.TRANSITION || this.enemyHP <= 0) return;

    const dpsPassivo = this.getPassiveDPS();
    const effectiveTouch = this.playerFinalStats.touch * 0.5;
    const baseTouchDmg = effectiveTouch + (dpsPassivo * (effectiveTouch * 0.0005));

    // Multiplicador de combo só afeta cliques do jogador (não automáticos do robô assistente, mas do frenesi sim)
    let comboMultiplier = 1.0;
    if (this.isFrenzyActive) {
      comboMultiplier = 2.0; // Durante o frenesi (normal ou boost), o multiplicador é fixado no máximo (x2)
    } else if (!isAuto) {
      comboMultiplier = 1.0 + Math.min(1.0, this.comboCount * 0.10); // Capped at x2 at 10 combo
    }

    let isCrit = false;
    let critMultiplier = 1.0;
    const relicLvlLuz = useRelicStore.getState().relics['luz_alma']?.level || 0;
    const extraCritMult = relicLvlLuz === 5 ? (this.isRelicOverheated('luz_alma') ? 25 : 10) : 0;
    if (this.isFrenzyActive) {
      isCrit = true;
      critMultiplier = (this.playerFinalStats.critDamage + extraCritMult) / 100;
    } else {
      const roll = Math.random() * 100;
      if (roll < this.playerFinalStats.critChance) {
        isCrit = true;
        critMultiplier = (this.playerFinalStats.critDamage + extraCritMult) / 100;
      }
    }

    const bestiaryMult = StatEngine.calculateBestiaryDamageMultiplier(this.characterData.killCount || {});
    const relicDmgBonus = useRelicStore.getState().getRelicEffectBonus('luz_alma');
    const gemaVontadeLvl = useRelicStore.getState().relics['gema_vontade']?.level || 0;
    const armorPenMult = gemaVontadeLvl === 5 ? (this.isRelicOverheated('gema_vontade') ? 1.25 : 1.10) : 1.0;
    const setDamageMultiplier = 1 + (this.playerFinalStats.damageMultiplierPct || 0);
    const touchDamageMult = this.playerFinalStats.touchDamageMult || 1;
    let finalTouchDmg = Math.floor(baseTouchDmg * comboMultiplier * critMultiplier * bestiaryMult * (1 + relicDmgBonus) * armorPenMult * touchDamageMult * setDamageMultiplier);
    if (this.characterData.testMode) {
      finalTouchDmg *= 5;
    }
    if (this.isElite && this.eliteAfix === 'blindado') {
      finalTouchDmg = Math.floor(finalTouchDmg * 0.75);
    }
    if (finalTouchDmg < 1) finalTouchDmg = 1;

    if (this.scene && typeof this.scene.spawnTouchEffect === 'function') {
      this.scene.spawnTouchEffect(isCrit, finalTouchDmg, clickX, clickY);
    }

    this.damageEnemy(finalTouchDmg, true);
  }

  private handleIdle(): void {
    if (this.target) {
      const distance = this.getDistanceToTarget();
      if (distance > 400) {
        this.currentState = CombatState.MOVING;
      } else {
        this.currentState = CombatState.ATTACKING;
      }
    }
  }

  private handleMoving(delta: number): void {
    if (!this.target) return;

    this.scene.scrollWorld(delta);

    const distance = this.getDistanceToTarget();
    if (distance <= 400) {
      this.currentState = CombatState.ATTACKING;
      this.scene.resetPlayerPosition();
    }
  }

  private handleAttacking(delta: number): void {
    const distance = this.getDistanceToTarget();
    if (distance > 420) {
      this.currentState = CombatState.MOVING;
      return;
    }

    const isEnemyStunned = this.enemyEffects.some(e => e.id === 'stun');

    if (this.attackCooldown <= 0 && this.enemyHP > 0) {
      this.performPlayerAttack();
    }

    if (this.enemyAttackCooldown <= 0 && this.playerHP > 0 && this.enemyHP > 0 && !isEnemyStunned) {
      this.performEnemyAttack();
    }
  }

  private performPlayerAttack() {
    if (this.enemyHP <= 0) return;
    const ascensionCount = this.characterData.ascensionCount || 0;
    const relicLvlFoco = useRelicStore.getState().relics['foco_precisao']?.level || 0;
    const precisionSpeedBoost = relicLvlFoco === 5 ? (this.isRelicOverheated('foco_precisao') ? 0.125 : 0.05) : 0;
    const attackSpeedBoost = 1 + (ascensionCount * 0.01) + precisionSpeedBoost;
    const classId = this.characterData.classId || 'warrior';
    const speedMultiplier = Math.min(15, this.getSpeedMultiplier(this.playerFinalStats.dexterity, classId, attackSpeedBoost));
    this.attackCooldown = Math.max(200, 3000 / speedMultiplier);

    // Escala de Dano baseado no Atributo Principal da Classe ativa
    let primaryStatVal = this.playerFinalStats.strength;
    let damageType = 'físico';
    let secondaryBoost = 0; // Bônus secundário de Força para outras classes

    if (classId === 'mage' || classId === 'cleric' || classId === 'necromancer') {
      primaryStatVal = this.playerFinalStats.magic;
      damageType = classId === 'necromancer' ? 'sombrio' : 'mágico';
      secondaryBoost = this.playerFinalStats.strength * 0.25; // Força aumenta levemente o dano geral (+0.25 por ponto)
    } else if (classId === 'ranger' || classId === 'rogue') {
      primaryStatVal = this.playerFinalStats.dexterity;
      damageType = 'de perfuração';
      secondaryBoost = this.playerFinalStats.strength * 0.25; // Força aumenta levemente o dano geral (+0.25 por ponto)
    } else if (classId === 'paladin') {
      primaryStatVal = this.playerFinalStats.constitution;
      damageType = 'sagrado';
      secondaryBoost = this.playerFinalStats.strength * 0.25; // Força aumenta levemente o dano geral (+0.25 por ponto)
    } else if (classId === 'avatar') {
      primaryStatVal = this.getAvatarEffectiveAttribute();
      damageType = 'cósmico';
      secondaryBoost = 0;
    }

    // Inimigo sob status EXPOSTO sofre 20% a mais de dano
    const exposedEffect = this.enemyEffects.find(e => e.id === 'exposed');
    const exposedMultiplier = exposedEffect ? (1 + exposedEffect.value) : 1.0;
    const bestiaryMult = StatEngine.calculateBestiaryDamageMultiplier(this.characterData.killCount || {});
    const damageBoost = (1 + (ascensionCount * 0.05)) * bestiaryMult; // +5% por ascensão e bônus do bestiário

    // Chance de Crítico global no Ataque Básico
    let isCrit = false;
    let critMultiplier = 1.0;
    const relicLvlLuz = useRelicStore.getState().relics['luz_alma']?.level || 0;
    const extraCritMult = relicLvlLuz === 5 ? (this.isRelicOverheated('luz_alma') ? 25 : 10) : 0;
    if (this.isFrenzyActive) {
      isCrit = true;
      critMultiplier = (this.playerFinalStats.critDamage + extraCritMult) / 100;
    } else {
      const roll = Math.random() * 100;
      if (roll < this.playerFinalStats.critChance) {
        isCrit = true;
        critMultiplier = (this.playerFinalStats.critDamage + extraCritMult) / 100;
      }
    }

    const strengthMult = 1 + (this.playerFinalStats.strength * 0.0005);
    const relicDmgBonus = useRelicStore.getState().getRelicEffectBonus('luz_alma');
    const gemaVontadeLvl = useRelicStore.getState().relics['gema_vontade']?.level || 0;
    const armorPenMult = gemaVontadeLvl === 5 ? (this.isRelicOverheated('gema_vontade') ? 1.25 : 1.10) : 1.0;
    const setDamageMultiplier = 1 + (this.playerFinalStats.damageMultiplierPct || 0);
    let damage = Math.floor(((primaryStatVal + secondaryBoost) * 3.0 + Math.random() * 3) * exposedMultiplier * damageBoost * critMultiplier * strengthMult * (1 + relicDmgBonus) * armorPenMult * setDamageMultiplier);
    if (this.characterData.testMode) {
      damage *= 5;
    }
    if (this.isElite && this.eliteAfix === 'blindado') {
      damage = Math.floor(damage * 0.75);
    }

    this.scene.animatePlayerAttack();
    this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `${isCrit ? '⚡' : ''}-${damage}`, isCrit ? '#ef4444' : '#f59e0b');

    bridge.emit(GameEvent.LOG_EMITTED, { message: `Você causou ${formatNumber(damage, useGameStore.getState().abbreviateNumbers)} de dano ${damageType}${isCrit ? ' (Crítico!)' : ''}.` });

    this.damageEnemy(damage, true);
  }

  private performEnemyAttack() {
    const isTower = useTowerStore.getState().towerActive;
    const baseCooldown = 3600 - (this.enemyLevel * 30);
    let speedMult = this.currentEnemy.attackSpeedMultiplier;
    if (this.isElite && this.eliteAfix === 'enfurecido') {
      speedMult *= 1.4;
    }
    
    // Aplicar afixo diário Frenesi Sombrio (+30% velocidade de ataque)
    if (this.characterData.activeDailyChallenge) {
      const today = useGameStore.getState().getTodayYYYYMMDD();
      const seed = parseInt(today, 10);
      const activeModifierIndex = seed % 5;
      if (activeModifierIndex === 2) { // 2: shadow_frenzy
        speedMult *= 1.3;
      }
    }

    // Aplicar bônus de velocidade da Ecoterra (+20% velocidade de ataque)
    const isEcoterra = !isTower && this.characterData?.activeEcoterra && this.enemyLevel <= 20;
    if (isEcoterra) {
      speedMult *= 1.2;
    }

    this.enemyAttackCooldown = Math.max(1000, baseCooldown / speedMult);

    // Inimigo sob status ENFRAQUECIDO causa 30% a menos de dano
    const weaknessEffect = this.enemyEffects.find(e => e.id === 'weakness');
    const weaknessMultiplier = weaknessEffect ? (1 - weaknessEffect.value) : 1.0;

    // Constituição reduz o dano recebido em 0.05% por ponto (Redução Máxima de 95%)
    const constitutionReduction = Math.max(0.05, 1 - (this.playerFinalStats.constitution * 0.0005));

    let damage = 0;

    if (isTower) {
      const floor = useTowerStore.getState().currentFloor;
      const dmgScale = Math.pow(1.10, floor - 1);
      damage = Math.floor((10 + floor * 3.0 + Math.random() * 2) * dmgScale * this.currentEnemy.damageMultiplier * weaknessMultiplier * constitutionReduction);
    } else {
      // Multiplicador de dano por dificuldade (espelha o hpBoost em setupEnemyForLevel):
      // Normal (1-5): 1.0× | Pesadelo (6-10): 2.0× | Inferno (11-15): 3.0× | Apocalipse (16-20): 4.0× | Purgatório (21-30): 5.0× | Pandemônio (31+): 6.0×
      const dmgBoost = this.enemyLevel >= 31 ? 6.0 : this.enemyLevel >= 21 ? 5.0 : this.enemyLevel >= 16 ? 4.0 : this.enemyLevel >= 11 ? 3.0 : this.enemyLevel >= 6 ? 2.0 : 1.0;
      
      // Escala exponencial de dano baseado no estágio (ajustada para 1.18x por fase, para conter o dano em fases avançadas)
      const dmgScale = Math.pow(1.18, this.enemyLevel - 1);
      
      damage = Math.floor((10 + this.enemyLevel * 4.0 + Math.random() * 2) * dmgScale * this.currentEnemy.damageMultiplier * dmgBoost * weaknessMultiplier * constitutionReduction);
    }
    
    // Inimigos Elite causam 3.0x de dano base
    if (this.isElite) {
      damage = Math.floor(damage * 3.0);
    }

    if (this.currentEnemy.id === 'boss_crystal_guardian' && this.crystalGuardianSecondPhase) {
      damage = Math.floor(damage * 1.5);
    }

    // Se o jogador estiver sob efeito do Escudo Ósseo (Necromante), mitiga 20% do dano recebido
    const boneShieldEffect = this.playerEffects.find(e => e.id === 'bone_shield');
    if (boneShieldEffect) {
      damage = Math.floor(damage * 0.80);
    }

    // Redução de dano adicional do Colar (damageReductionPct)
    if (this.playerFinalStats.damageReductionPct && this.playerFinalStats.damageReductionPct > 0) {
      damage = Math.floor(damage * (1 - this.playerFinalStats.damageReductionPct));
    }

    this.scene.animateEnemyAttack();

    // Chance de Esquiva: 0.1% por ponto de Destreza (limite de 75% para balanceamento)
    const ascensionCount = this.characterData.ascensionCount || 0;
    let dodgeChance = Math.min(75, this.playerFinalStats.dexterity * 0.1 + (ascensionCount * 0.5));
    
    // Aplicar afixo diário Vento Cortante (-15% de Esquiva para o jogador)
    if (this.characterData.activeDailyChallenge) {
      const today = useGameStore.getState().getTodayYYYYMMDD();
      const seed = parseInt(today, 10);
      const activeModifierIndex = seed % 5;
      if (activeModifierIndex === 3) { // 3: cutting_wind
        dodgeChance = Math.max(0, dodgeChance - 15);
      }
    }

    const isDodge = Math.random() * 100 < dodgeChance;

    if (isDodge) {
      this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 30, 'Desviou!', '#38bdf8');
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Você se esquivou do ataque do ${this.currentEnemy.name} (Esquiva: ${dodgeChance.toFixed(1)}%).` });
      return;
    }

    let damageToHP = damage;
    if (this.playerShield > 0) {
      if (this.playerShield >= damage) {
        this.playerShield -= damage;
        damageToHP = 0;
        bridge.emit(GameEvent.LOG_EMITTED, { message: `🛡️ Barreira Prismática absorveu todo o dano! (${formatNumber(damage, useGameStore.getState().abbreviateNumbers)} absorvido, Escudo restante: ${formatNumber(this.playerShield, useGameStore.getState().abbreviateNumbers)})` });
        this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 30, `🛡️ Absorvido`, '#38bdf8');
      } else {
        damageToHP = damage - this.playerShield;
        bridge.emit(GameEvent.LOG_EMITTED, { message: `🛡️ Barreira Prismática absorveu ${formatNumber(this.playerShield, useGameStore.getState().abbreviateNumbers)} de dano!` });
        this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 30, `🛡️ -${formatNumber(this.playerShield, useGameStore.getState().abbreviateNumbers)}`, '#38bdf8');
        this.playerShield = 0;
        this.playerEffects = this.playerEffects.filter(e => e.id !== 'prismatic_barrier');
      }
    }

    if (damageToHP > 0) {
      this.playerHP = Math.max(0, this.playerHP - damageToHP);
      this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 30, `-${damageToHP}`, '#ef4444');
    }

    const enemyLabel = this.isElite ? `ELITE ${this.currentEnemy.name}` : this.currentEnemy.name;
    bridge.emit(GameEvent.LOG_EMITTED, { message: `O ${enemyLabel} causou ${formatNumber(damage, useGameStore.getState().abbreviateNumbers)} de dano a você.` });

    // Vampírico: cura a si mesmo em 10% do dano causado
    if (this.isElite && this.eliteAfix === 'vampirico') {
      const healVal = Math.floor(damage * 0.10);
      if (healVal > 0 && this.enemyHP > 0) {
        this.enemyHP = Math.min(this.enemyMaxHP, this.enemyHP + healVal);
        if (this.scene && typeof this.scene.spawnDamageText === 'function') {
          this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `+${healVal} (Vampírico)`, '#10b981');
        }
        bridge.emit(GameEvent.LOG_EMITTED, { message: `O ${enemyLabel} drenou sua vida e curou-se em +${healVal} HP!` });
      }
    }

    // Aplicar afixo diário Drenagem de Alma (cura 5% do HP máximo do inimigo ao acertar)
    if (this.characterData.activeDailyChallenge && this.enemyHP > 0) {
      const today = useGameStore.getState().getTodayYYYYMMDD();
      const seed = parseInt(today, 10);
      const activeModifierIndex = seed % 5;
      if (activeModifierIndex === 0) { // 0: soul_drain
        const healVal = Math.floor(this.enemyMaxHP * 0.05);
        this.enemyHP = Math.min(this.enemyMaxHP, this.enemyHP + healVal);
        if (this.scene && typeof this.scene.spawnDamageText === 'function') {
          this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `+${healVal} (Drenagem)`, '#10b981');
        }
        bridge.emit(GameEvent.LOG_EMITTED, { message: `O inimigo drenou sua alma e curou-se em +${healVal} HP!` });
      }
    }

    if (this.playerHP <= 0) {
      this.handlePlayerDefeat();
    }
  }

  private damageEnemy(amount: number, isDirect: boolean): void {
    if (amount <= 0 || this.enemyHP <= 0 || this.currentState === CombatState.MOVING || this.currentState === CombatState.TRANSITION) return;
    
    let finalAmount = amount;
    if (this.isElite) {
      const transUpgrades = this.characterData.transcendenceUpgrades || {};
      const dominioVazioLvl = transUpgrades['dominio_vazio'] || 0;
      if (dominioVazioLvl > 0) {
        finalAmount = Math.floor(finalAmount * (1 + dominioVazioLvl * 0.05));
      }
    }

    this.enemyHP = Math.max(0, this.enemyHP - finalAmount);

    // Aplicar afixo diário Escudo de Espinhos (reflete 20% de dano direto recebido, limitado a 5% da vida máxima por golpe)
    if (isDirect && this.characterData.activeDailyChallenge && this.playerHP > 0) {
      const today = useGameStore.getState().getTodayYYYYMMDD();
      const seed = parseInt(today, 10);
      const activeModifierIndex = seed % 5;
      if (activeModifierIndex === 1) { // 1: thorns_shield
        const reflectedLimit = Math.floor(this.playerMaxHP * 0.05);
        const reflected = Math.min(Math.floor(amount * 0.20), reflectedLimit);
        if (reflected > 0) {
          this.playerHP = Math.max(0, this.playerHP - reflected);
          this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 30, `-${reflected} (Refletido)`, '#ef4444');
          bridge.emit(GameEvent.LOG_EMITTED, { message: `💥 Você recebeu ${reflected} de dano refletido pelo Escudo de Espinhos!` });
          
          if (this.playerHP <= 0) {
            this.handlePlayerDefeat();
            return;
          }
        }
      }
    }

    // Drenagem de vida da classe Necromante: 15% do dano direto causado
    if (isDirect && this.characterData && this.characterData.classId === 'necromancer' && this.playerHP > 0 && this.playerHP < this.playerMaxHP) {
      const drainAmount = Math.floor(amount * 0.15);
      if (drainAmount > 0) {
        this.playerHP = Math.min(this.playerMaxHP, this.playerHP + drainAmount);
        if (this.scene && typeof this.scene.spawnDamageText === 'function') {
          this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 30, `+${drainAmount} (Dreno)`, '#10b981');
        }
      }
    }

    // Roubo de Vida (Lifesteal) do Set Pandemônio (3 peças)
    if (isDirect && this.playerFinalStats && this.playerFinalStats.lifesteal && this.playerFinalStats.lifesteal > 0 && this.playerHP > 0 && this.playerHP < this.playerMaxHP) {
      const drainAmount = Math.floor(amount * this.playerFinalStats.lifesteal);
      if (drainAmount > 0) {
        this.playerHP = Math.min(this.playerMaxHP, this.playerHP + drainAmount);
        if (this.scene && typeof this.scene.spawnDamageText === 'function') {
          this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 30, `+${drainAmount} (Roubo de Vida)`, '#10b981');
        }
      }
    }

    if (this.enemyHP <= 0) {
      if (this.currentEnemy.id === 'boss_crystal_guardian' && !this.crystalGuardianSecondPhase) {
        this.enemyHP = this.enemyMaxHP;
        this.crystalGuardianSecondPhase = true;
        
        // Atualiza dinamicamente a textura e o nome do chefe na cena do Phaser para a Fase 2 (Guardião do Espelho)
        if (this.scene) {
          if (this.scene.enemyBody) {
            this.scene.enemyBody.setTexture('boss_mirror_guardian_transparent');
          }
          if (this.scene.enemyLevelText) {
            this.scene.enemyLevelText.setText(`CHEFE Guardião do Espelho (Lv. ${this.enemyLevel})`);
            this.scene.enemyLevelText.setColor('#fda4af'); // Rosa brilhante indicando a transformação caótica
          }
        }

        if (this.scene && typeof this.scene.spawnDamageText === 'function') {
          this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, 'REGENERADO!', '#10b981');
        }
        bridge.emit(GameEvent.LOG_EMITTED, { 
          message: `✨ O Guardião dos Cacos estilhaça sua carcaça de cristal e se regenera com fúria elemental como o Guardião do Espelho! SEGUNDA FASE ATIVADA (Frenesi: +50% de dano!).` 
        });
        return;
      }
      this.handleEnemyDefeat();
    }
  }

  private handleEnemyDefeat() {
    const char = useGameStore.getState().character;
    const isBoss = char.enemiesDefeatedInStage === ENEMIES_PER_STAGE;

    // Se o inimigo foi derrotado sob o efeito do Sifão de Almas (Necromante), restaura 20% da mana máxima do jogador
    const soulSiphonActive = this.enemyEffects.some(e => e.id === 'soul_siphon');
    if (soulSiphonActive) {
      const manaHeal = Math.floor(this.playerMaxMana * 0.20);
      this.playerMana = Math.min(this.playerMaxMana, this.playerMana + manaHeal);
      if (this.scene && typeof this.scene.spawnDamageText === 'function') {
        this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 60, `+${manaHeal} (Mana)`, '#3b82f6');
      }
      bridge.emit(GameEvent.LOG_EMITTED, { message: `🔮 Sifão de Almas: O inimigo foi derrotado e você restaurou +${manaHeal} de mana!` });
    }

    // Limpa os efeitos do inimigo imediatamente para evitar ticks residuais durante o respawn
    this.enemyEffects = [];

    // Lógica do afixo Volátil: explode ao morrer causando 20% da Vida Máxima do herói, mitigada por Constituição
    let volatileDamage = 0;
    if (this.isElite && this.eliteAfix === 'volatil') {
      const constitutionReduction = Math.max(0.05, 1 - (this.playerFinalStats.constitution * 0.0005));
      volatileDamage = Math.floor(this.playerMaxHP * 0.20 * constitutionReduction);
      if (this.playerFinalStats.damageReductionPct && this.playerFinalStats.damageReductionPct > 0) {
        volatileDamage = Math.floor(volatileDamage * (1 - this.playerFinalStats.damageReductionPct));
      }
      this.playerHP = Math.max(0, this.playerHP - volatileDamage);
    }

    // Registra a morte do monstro no bestiário
    useGameStore.getState().registerEnemyKill(this.currentEnemy.id);

    // Armazena o último inimigo comum derrotado para ser ressuscitado pelo Necromante
    if (!isBoss && !this.isElite) {
      this.lastCommonEnemyDefeated = this.currentEnemy;
    }

    // Escala acelerada de XP por fase para acompanhar a curva de XP necessária
    const xpScale = Math.pow(1.35, char.currentStage - 1);
    const baseGainedXp = Math.floor((this.currentEnemy.xpValue + Math.floor(char.currentStage * 2.0)) * xpScale);
    let gainedXp = isBoss ? baseGainedXp * 3 : baseGainedXp;
    
    // Inimigos Elite concedem 2.0x mais XP
    if (this.isElite) {
      gainedXp *= 2.0;
    }
    
    if (char.testMode) {
      gainedXp *= 5;
    }

    // Chave da Torre Evoluída: a subida atual concede 3x XP e Ouro
    const isEvolvedTowerRun = useTowerStore.getState().towerActive && useTowerStore.getState().activeKeyType === 'evolved';
    if (isEvolvedTowerRun) {
      gainedXp *= 3;
    }

    // Escala de Gold por fase e sorte (reduzida para conter o acúmulo em fases avançadas)
    const goldScale = Math.pow(1.15, char.currentStage - 1);
    const baseGainedGold = Math.floor((10 + Math.floor(char.currentStage * 1.5)) * goldScale);
    let gainedGold = isBoss ? baseGainedGold * 3.5 : baseGainedGold;

    // Inimigos Elite concedem 2.0x mais Ouro (acumula com multiplicador base)
    if (this.isElite) {
      gainedGold *= 2.0;
    }

    if (isEvolvedTowerRun) {
      gainedGold *= 3;
    }

    const luckBonus = 1 + Math.sqrt(this.playerFinalStats.luck || 0) * 0.1;
    const relicGoldBonus = useRelicStore.getState().getRelicEffectBonus('moeda_ciclo');
    gainedGold = Math.floor(gainedGold * luckBonus * (1 + relicGoldBonus));

    // Capstone da Moeda do Ciclo Eterno (Lvl 5): +5% de chance de monstros normais droparem ouro em dobro
    const coinRelicLvl = useRelicStore.getState().relics['moeda_ciclo']?.level || 0;
    let isGoldDoubled = false;
    const coinDoubleChance = coinRelicLvl === 5 ? (this.isRelicOverheated('moeda_ciclo') ? 0.125 : 0.05) : 0;
    if (!isBoss && coinRelicLvl === 5 && Math.random() < coinDoubleChance) {
      gainedGold *= 2;
      isGoldDoubled = true;
    }

    if (isBoss) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Chefe ${this.currentEnemy.name} derrotado! Você avançou para a Fase ${char.currentStage + 1}, ganhou +${gainedXp} XP e +${gainedGold} Ouro!` });
    } else if (this.isElite) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `👾 ELITE ${this.currentEnemy.name} derrotado! Você ganhou +${gainedXp} XP e +${gainedGold} Ouro (Bônus Elite 2x)!${isGoldDoubled ? " (🪙 Ouro Duplicado!)" : ""}` });
    } else {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `${this.currentEnemy.name} derrotado! Você ganhou +${gainedXp} XP e +${gainedGold} Ouro!${isGoldDoubled ? " (🪙 Ouro Duplicado!)" : ""}` });
    }

    useGameStore.getState().addXp(gainedXp);
    useGameStore.getState().addGold(gainedGold);

    // Drop de materiais da Cidadela (Madeira/Pedra/Carne), sem influência da Sorte
    if (this.currentEnemy.materialDrops && this.currentEnemy.materialDrops.length > 0) {
      const commandCenterLevel = char.citadel?.commandCenter.level || 1;
      const commandCenterMult = 1 + COMMAND_CENTER_MATERIAL_DROP_BONUS(commandCenterLevel);
      const materialAmount = Math.max(1, Math.floor(char.currentStage * 0.5)) * (this.isElite ? 2.0 : 1.0) * commandCenterMult;
      const gainedMaterials = { wood: 0, stone: 0, meat: 0 };
      for (const material of this.currentEnemy.materialDrops) {
        gainedMaterials[material] += materialAmount;
      }
      useGameStore.getState().addMaterials(Math.round(gainedMaterials.wood), Math.round(gainedMaterials.stone), Math.round(gainedMaterials.meat));
    }

    // Drop de Essência de Transcendência na Ecoterra (apenas campanha normal, fases <= 20)
    if (!useTowerStore.getState().towerActive && char.activeEcoterra && char.currentStage <= 20) {
      const essenceAmount = isBoss ? 5 : (this.isElite ? 2 : 1);
      useGameStore.getState().addTranscendenceEssence(essenceAmount);
      bridge.emit(GameEvent.LOG_EMITTED, { 
        message: `🌌 Ecoterra: Você extraiu +${essenceAmount} Essência de Transcendência das cinzas do inimigo!` 
      });
    }

    // Se houve dano explosivo do afixo Volátil, exibe o texto na tela e loga o dano
    if (volatileDamage > 0) {
      if (this.scene && typeof this.scene.spawnDamageText === 'function') {
        this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 30, `-${volatileDamage} (Volátil)`, '#ef4444');
      }
      bridge.emit(GameEvent.LOG_EMITTED, { message: `💥 O inimigo Elite explodiu ao morrer, causando ${volatileDamage} de dano explosivo!` });
    }

    // Se a explosão do Volátil matou o jogador, encerra o combate e não dropa item
    if (this.playerHP <= 0) {
      this.handlePlayerDefeat();
      return;
    }

    // Drop raro de 5% de Fragmento de Alma Instável em Chefes de Fase, aumentado pela pesquisa da Academia (Cidadela)
    const soulFragmentResearchLevel = char.citadel?.academy.researchSoulFragmentLevel || 0;
    const soulFragmentChance = 0.05 * (1 + soulFragmentResearchLevel * 0.02);
    if (isBoss && Math.random() < soulFragmentChance) {
      const stage = char.currentStage;
      const classId = char.classId;
      const soulFragmentItem: EquipmentItem = {
        id: `soul_fragment-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: 'Fragmento de Alma Instável',
        slot: 'consumable',
        rarity: 'epic',
        classId: classId,
        spriteName: 'unstable_soul_fragment',
        consumableType: 'unstable_soul_fragment',
        stage: stage,
        stats: {}
      };
      const addedFragment = useGameStore.getState().addItemToInventory(soulFragmentItem);
      if (addedFragment) {
        bridge.emit(GameEvent.LOG_EMITTED, { 
          message: `✨ Você encontrou um [${soulFragmentItem.name}] raro ao derrotar o Chefe!` 
        });
        bridge.emit(GameEvent.ITEM_DROPPED, { item: soulFragmentItem });
      } else {
        bridge.emit(GameEvent.LOG_EMITTED, { 
          message: `Um [${soulFragmentItem.name}] caiu do Chefe, mas seu inventário está cheio!` 
        });
      }
    }

    // Lógica de drop da Chave da Torre (apenas na campanha normal, não na torre e nem no desafio diário)
    const isDaily = char.activeDailyChallenge;
    const isTower = useTowerStore.getState().towerActive;

    if (!isTower && !isDaily) {
      const keyDropChance = isBoss ? 0.0375 : (this.isElite ? 0.01875 : 0.00625);
      const towerKeyResearchLevel = char.citadel?.academy.researchTowerKeyLevel || 0;
      const finalKeyChance = keyDropChance * (1 + towerKeyResearchLevel * 0.02);

      if (Math.random() < finalKeyChance) {
        const towerKeyItem: EquipmentItem = {
          id: `tower_key-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: 'Chave da Torre',
          slot: 'consumable',
          rarity: 'epic',
          classId: char.classId,
          spriteName: 'tower_key',
          consumableType: 'tower_key',
          stage: char.currentStage,
          stats: {}
        };
        const addedKey = useGameStore.getState().addItemToInventory(towerKeyItem);
        if (addedKey) {
          bridge.emit(GameEvent.LOG_EMITTED, { 
            message: `🔑 Você encontrou uma [${towerKeyItem.name}]!` 
          });
          bridge.emit(GameEvent.ITEM_DROPPED, { item: towerKeyItem });
        }
      }
    }

    // === SISTEMA DE DROP DE EQUIPAMENTOS ===
    const luck = this.playerFinalStats.luck || 0;
    const baseDropChance = 0.05;
    // Elites e Chefes têm 100% de chance de drop de equipamento
    const relicDropBonus = useRelicStore.getState().getRelicEffectBonus('simbolo_aprendizado');
    const dropPctBonus = this.playerFinalStats.dropChancePct || 0;
    const dropChance = (isBoss || this.isElite) ? 1.0 : Math.min(0.50, baseDropChance + luck * 0.002 + relicDropBonus + dropPctBonus);
    
    const slotsToDrop: ('head' | 'chest' | 'legs' | 'gloves' | 'weapon' | 'necklace')[] = [];

    // Colar: drop fixo de 5%, sem influência da Sorte.
    if (Math.random() < 0.05) {
      slotsToDrop.push('necklace');
    }

    // Equipamentos normais: usam a chance padrão (sem o colar)
    if (Math.random() < dropChance) {
      const normalSlots = ['head', 'chest', 'legs', 'gloves', 'weapon'] as const;
      const slot = normalSlots[Math.floor(Math.random() * normalSlots.length)];
      slotsToDrop.push(slot);
    }

    for (const slot of slotsToDrop) {
      const rareWeight = Math.min(600, 250 + luck * 5);
      const legendaryWeight = Math.min(300, 50 + luck * 2);
      const commonWeight = Math.max(100, 700 - (rareWeight - 250) - (legendaryWeight - 50));
      
      const totalWeight = commonWeight + rareWeight + legendaryWeight;
      const roll = Math.random() * totalWeight;
      
      let rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mystic' = 'common';
      if (roll < legendaryWeight) {
        rarity = 'legendary';
      } else if (roll < legendaryWeight + rareWeight) {
        rarity = 'rare';
      }
      
      // Capstone do Simbolo do Aprendizado (Lvl 5): +10% de chance de Raro ou superior
      const learningRelicLvl = useRelicStore.getState().relics['simbolo_aprendizado']?.level || 0;
      const learningPromoteChance = learningRelicLvl === 5 ? (this.isRelicOverheated('simbolo_aprendizado') ? 0.25 : 0.10) : 0;
      if (learningRelicLvl === 5 && rarity === 'common' && Math.random() < learningPromoteChance) {
        rarity = Math.random() < 0.20 ? 'legendary' : 'rare';
        bridge.emit(GameEvent.LOG_EMITTED, { message: `✨ Símbolo do Aprendizado: Item comum promovido a [${rarity === 'legendary' ? 'Lendário' : 'Raro'}]!` });
      }

      const stage = char.currentStage;
      const classId = char.classId;
      const ascensionCount = char.ascensionCount || 0;
      
      // Verificação de desbloqueio celestial (derrotar o Guardião dos Cacos / boss_crystal_guardian pela segunda vez em diante)
      const crystalGuardianKills = char.killCount?.['boss_crystal_guardian'] || 0;
      const isCelestialUnlocked = crystalGuardianKills >= 2;
      const isCelestialDrop = isCelestialUnlocked && Math.random() < 0.10;

      // Chance de ser um item do Set Pandemoníaco: apenas no Modo Pandemônio e 15% de chance sobre o drop (se não for Celestial)
      const isPandemoniumDrop = !isCelestialDrop && (stage >= 21 || char.activePandemonium) && Math.random() < 0.15;
      
      // Chance de ser um item do Set Ancestral: apenas após a 1ª ascensão e 10% de chance sobre o drop (se não for Celestial e nem Pandemônio)
      const isAncestralDrop = !isCelestialDrop && !isPandemoniumDrop && ascensionCount >= 1 && Math.random() < 0.10;
      
      // Se for drop Celestial o multiplicador é 6.0; se for Pandemônio é 7.0; se for Ancestral é 4.5; senão segue o padrão
      const mult = isCelestialDrop ? 6.0 : (isPandemoniumDrop ? 7.0 : (isAncestralDrop ? 4.5 : (rarity === 'legendary' ? 2.5 : (rarity === 'rare' ? 1.5 : 1.0))));
      
      const possibleStatsMap: Record<string, string[]> = {
        warrior: ['strength', 'constitution', 'luck'],
        magic: ['magic', 'constitution', 'luck'],
        mage: ['magic', 'constitution', 'luck'],
        ranger: ['dexterity', 'constitution', 'luck'],
        paladin: ['constitution', 'strength', 'luck'],
        cleric: ['magic', 'constitution', 'luck'],
        rogue: ['dexterity', 'strength', 'luck'],
        necromancer: ['magic', 'luck', 'constitution'],
        avatar: ['strength', 'magic', 'dexterity', 'constitution', 'luck']
      };
      
      let itemStats: Partial<BaseStats> = {};
      
      if (slot === 'necklace') {
        itemStats = StatEngine.generateNecklaceStats(stage, mult, rarity);
      } else {
        const possibleStats = possibleStatsMap[classId] || ['strength', 'constitution', 'luck'];
        const numAttributes = isCelestialDrop || isPandemoniumDrop || isAncestralDrop || rarity === 'legendary' ? 3 : (rarity === 'rare' ? 2 : 1);
        const pickedStats = [...possibleStats].sort(() => 0.5 - Math.random()).slice(0, numAttributes);
        pickedStats.forEach((statKey) => {
          const val = Math.max(1, Math.round(stage * mult * (0.8 + Math.random() * 0.4)));
          itemStats[statKey as keyof BaseStats] = val;
        });
      }
      
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

      const pandemoniumSetNames: Record<string, string> = {
        warrior: 'Set Pandemoníaco do Destruidor',
        mage: 'Set Pandemoníaco do Feiticeiro do Vazio',
        ranger: 'Set Pandemoníaco do Franco-Atirador',
        paladin: 'Set Pandemoníaco do Vingador Sagrado',
        cleric: 'Set Pandemoníaco do Sumo-Inquisidor',
        rogue: 'Set Pandemoníaco do Executor',
        necromancer: 'Set Pandemoníaco do Devorador de Almas',
        avatar: 'Set Pandemoníaco do Eco Supremo'
      };

      const celestialSetNames: Record<string, string> = {
        warrior: 'Set Celestial do Semideus',
        mage: 'Set Celestial do Senhor do Tempo',
        ranger: 'Set Celestial do Observador Estelar',
        paladin: 'Set Celestial do Arcanjo',
        cleric: 'Set Celestial do Serafim',
        rogue: 'Set Celestial do Espectro Astral',
        necromancer: 'Set Celestial do Ceifador de Estrelas',
        avatar: 'Set Celestial do Avatar Supremo'
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
      
      const baseName = slotNames[classId]?.[slot] || 'Equipamento';
      let name = '';
      let setName: string | undefined = undefined;
      
      if (isCelestialDrop) {
        setName = celestialSetNames[classId] || `Set Celestial de ${classId}`;
        let cleanSetName = setName;
        if (cleanSetName.startsWith('Set Celestial do ')) {
          cleanSetName = cleanSetName.replace('Set Celestial do ', '');
        } else if (cleanSetName.startsWith('Set Celestial de ')) {
          cleanSetName = cleanSetName.replace('Set Celestial de ', '');
        } else if (cleanSetName.startsWith('Set Celestial da ')) {
          cleanSetName = cleanSetName.replace('Set Celestial da ', '');
        }
        let suffix = 'Celestial';
        if (baseName.endsWith('as')) {
          suffix = 'Celestiais';
        } else if (baseName.endsWith('a')) {
          suffix = 'Celestial';
        }
        let prep = 'do';
        if (setName.includes(' da ')) {
          prep = 'da';
        } else if (setName.includes(' de ')) {
          prep = 'de';
        }
        name = `${baseName} ${suffix} ${prep} ${cleanSetName}`;
        rarity = 'legendary';
      } else if (isPandemoniumDrop) {
        setName = pandemoniumSetNames[classId] || `Set Pandemoníaco de ${classId}`;
        let cleanSetName = setName;
        if (cleanSetName.startsWith('Set Pandemoníaco do ')) {
          cleanSetName = cleanSetName.replace('Set Pandemoníaco do ', '');
        } else if (cleanSetName.startsWith('Set Pandemoníaco de ')) {
          cleanSetName = cleanSetName.replace('Set Pandemoníaco de ', '');
        } else if (cleanSetName.startsWith('Set Pandemoníaco da ')) {
          cleanSetName = cleanSetName.replace('Set Pandemoníaco da ', '');
        }
        let suffix = 'Pandemoníaco';
        if (baseName.endsWith('as')) {
          suffix = 'Pandemoníacas';
        } else if (baseName.endsWith('a')) {
          suffix = 'Pandemoníaca';
        }
        let prep = 'do';
        if (setName.includes(' da ')) {
          prep = 'da';
        } else if (setName.includes(' de ')) {
          prep = 'de';
        }
        name = `${baseName} ${suffix} ${prep} ${cleanSetName}`;
        rarity = 'legendary';
      } else if (isAncestralDrop) {
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
        rarity = 'legendary';
      } else if (rarity === 'legendary') {
        setName = setNames[classId];
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
      } else {
        name = `${baseName} Rústico`;
      }
      
      const newItem: EquipmentItem = {
        id: `${classId}-${slot}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name,
        slot,
        rarity,
        stats: itemStats,
        setName,
        classId,
        spriteName: `${classId}-${slot}`,
        stage
      };
      
      // Desmonte Automatizado (Oficina de Automação da Forja Nível 5): itens Comuns/Raros "puros" (sem set especial)
      // são convertidos direto em Fragmentos de Forja em background, sem passar pelo inventário
      const isAutoDismantleActive = (char.citadel?.forgeWorkshop.level || 0) >= 5;
      const isPlainDrop = !isCelestialDrop && !isPandemoniumDrop && !isAncestralDrop;
      if (isAutoDismantleActive && isPlainDrop && (rarity === 'common' || rarity === 'rare')) {
        useGameStore.getState().addForgeFragments(1);
        bridge.emit(GameEvent.LOG_EMITTED, {
          message: `⚙️ Desmonte Automatizado: [${newItem.name}] foi convertido em +1 Fragmento de Forja!`
        });
      } else {
        const added = useGameStore.getState().addItemToInventory(newItem);
        if (added) {
          bridge.emit(GameEvent.LOG_EMITTED, {
            message: `Você encontrou: [${newItem.name}] (${rarity.toUpperCase()})!`
          });
        } else {
          bridge.emit(GameEvent.LOG_EMITTED, {
            message: `Um item [${newItem.name}] caiu, mas seu inventário está cheio!`
          });
        }
      }
    }

    if (this.characterData.activeDailyChallenge) {
      if (isBoss) {
        bridge.emit(GameEvent.LOG_EMITTED, { message: `✨ DESAFIO DIÁRIO CONCLUÍDO! Você derrotou o Chefe da Fase Espelho!` });
        useGameStore.getState().completeDailyChallenge();
      } else {
        useGameStore.setState((state) => ({
          character: {
            ...state.character,
            enemiesDefeatedInStage: state.character.enemiesDefeatedInStage + 1
          }
        }));
      }

      this.scene.animateEnemyDeath();
      this.currentState = CombatState.IDLE;
      this.enemyHP = 0;

      const gameSpeed = useGameStore.getState().gameSpeed;
      const speedLimit = gameSpeed > 0 ? gameSpeed : 1;
      if (this.scene && this.scene.sys && this.scene.sys.isActive()) {
        this.scene.time.delayedCall(1500 / speedLimit, () => {
          const nextChar = useGameStore.getState().character;
          this.setupEnemyForLevel(nextChar.currentStage, nextChar.enemiesDefeatedInStage);
          this.scene.respawnEnemyAt(900, this.currentEnemy);

          const enemyName = nextChar.enemiesDefeatedInStage === ENEMIES_PER_STAGE ? `CHEFE ${this.currentEnemy.name}` : this.currentEnemy.name;
          bridge.emit(GameEvent.LOG_EMITTED, { message: `Um ${enemyName} Nível ${nextChar.currentStage} apareceu no horizonte!` });
        });
      }
      return;
    }

    if (isTower) {
      this.currentState = CombatState.TRANSITION;
      this.enemyHP = 0;

      this.scene.animateTowerTransition(() => {
        useTowerStore.getState().advanceTowerFloor();
        const nextFloor = useTowerStore.getState().currentFloor;
        this.setupEnemyForLevel(nextFloor, 0);
        this.scene.respawnEnemyAt(900, this.currentEnemy);

        const isTowerBoss = nextFloor % 5 === 0;
        const enemyName = isTowerBoss ? `CHEFE ${this.currentEnemy.name}` : this.currentEnemy.name;
        bridge.emit(GameEvent.LOG_EMITTED, { 
          message: `Um ${this.isElite ? 'ELITE ' : ''}${enemyName} apareceu no horizonte (Andar ${nextFloor})!` 
        });

        this.currentState = CombatState.IDLE;
      });
      return;
    }

    if (isBoss) {
      useGameStore.getState().advanceStage();
    } else {
      useGameStore.setState((state) => ({
        character: {
          ...state.character,
          enemiesDefeatedInStage: state.character.enemiesDefeatedInStage + 1
        }
      }));
    }

    this.scene.animateEnemyDeath();
    this.currentState = CombatState.IDLE;
    this.enemyHP = 0;

    const gameSpeedCamp = useGameStore.getState().gameSpeed;
    const speedLimitCamp = gameSpeedCamp > 0 ? gameSpeedCamp : 1;
    if (this.scene && this.scene.sys && this.scene.sys.isActive()) {
      this.scene.time.delayedCall(1500 / speedLimitCamp, () => {
        const nextChar = useGameStore.getState().character;
        this.setupEnemyForLevel(nextChar.currentStage, nextChar.enemiesDefeatedInStage);
        this.scene.respawnEnemyAt(900, this.currentEnemy);

        const enemyName = nextChar.enemiesDefeatedInStage === ENEMIES_PER_STAGE ? `CHEFE ${this.currentEnemy.name}` : this.currentEnemy.name;
        bridge.emit(GameEvent.LOG_EMITTED, { message: `Um ${enemyName} Nível ${nextChar.currentStage} apareceu no horizonte!` });
      });
    }
  }

  private handlePlayerDefeat() {
    this.currentState = CombatState.DEAD;
    this.scene.animatePlayerDeath();

    const devocaoLvl = useRelicStore.getState().relics['brasao_devoacao']?.level || 0;
    const gameSpeed = useGameStore.getState().gameSpeed;
    const speedLimit = gameSpeed > 0 ? gameSpeed : 1;

    const isTower = useTowerStore.getState().towerActive;
    if (isTower) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `❌ Você sucumbiu no Andar ${useTowerStore.getState().currentFloor} da Torre!` });
      useTowerStore.getState().exitTower(false);

      if (this.scene && this.scene.sys && this.scene.sys.isActive()) {
        this.scene.time.delayedCall(3000 / speedLimit, () => {
          this.playerHP = devocaoLvl === 5 ? Math.floor(this.playerMaxHP * (this.isRelicOverheated('brasao_devoacao') ? 1.05 : 1.02)) : this.playerMaxHP;
          this.playerMana = this.playerMaxMana;
          this.currentState = CombatState.IDLE;

          const char = useGameStore.getState().character;
          this.setupEnemyForLevel(char.currentStage, char.enemiesDefeatedInStage);

          this.scene.respawnEnemyAt(900, this.currentEnemy);
          this.scene.respawnPlayer();
        });
      }
      return;
    }

    if (this.characterData.activeDailyChallenge) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `❌ Você sucumbiu ao Desafio Diário e retornou à sua jornada normal.` });
      useGameStore.getState().exitDailyChallenge(false);

      if (this.scene && this.scene.sys && this.scene.sys.isActive()) {
        this.scene.time.delayedCall(3000 / speedLimit, () => {
          this.playerHP = devocaoLvl === 5 ? Math.floor(this.playerMaxHP * (this.isRelicOverheated('brasao_devoacao') ? 1.05 : 1.02)) : this.playerMaxHP;
          this.playerMana = this.playerMaxMana;
          this.currentState = CombatState.IDLE;

          const char = useGameStore.getState().character;
          this.setupEnemyForLevel(char.currentStage, char.enemiesDefeatedInStage);

          this.scene.respawnEnemyAt(900, this.currentEnemy);
          this.scene.respawnPlayer();
          bridge.emit(GameEvent.LOG_EMITTED, { message: `Você ressuscitou e retornou à sua Fase ${char.currentStage}!` });
        });
      }
      return;
    }

    bridge.emit(GameEvent.LOG_EMITTED, { message: `Você foi derrotado! Progresso da fase resetado.` });

    useGameStore.getState().resetStageProgress();

    if (this.scene && this.scene.sys && this.scene.sys.isActive()) {
      this.scene.time.delayedCall(3000 / speedLimit, () => {
        this.playerHP = devocaoLvl === 5 ? Math.floor(this.playerMaxHP * (this.isRelicOverheated('brasao_devoacao') ? 1.05 : 1.02)) : this.playerMaxHP;
        this.playerMana = this.playerMaxMana;
        this.currentState = CombatState.IDLE;

        const char = useGameStore.getState().character;
        this.setupEnemyForLevel(char.currentStage, char.enemiesDefeatedInStage);

        this.scene.respawnEnemyAt(900, this.currentEnemy);
        this.scene.respawnPlayer();
        bridge.emit(GameEvent.LOG_EMITTED, { message: `Você ressuscitou e retornou ao início da Fase ${char.currentStage}!` });
      });
    }
  }

  private getDistanceToTarget(): number {
    if (!this.target) return Infinity;
    const pX = this.scene.getPlayerX();
    const pY = this.scene.getPlayerY();
    const eX = this.scene.getEnemyX();
    const eY = this.scene.getEnemyY();
    return Math.sqrt(Math.pow(pX - eX, 2) + Math.pow(pY - eY, 2));
  }

  public triggerSkill(skillId: string): void {
    // Impede o uso de habilidades caso o jogo esteja pausado (velocidade do jogo igual a 0)
    if (useGameStore.getState().gameSpeed === 0) return;

    if (this.currentState === CombatState.DEAD || this.currentState === CombatState.MOVING || this.currentState === CombatState.TRANSITION) return;

    const skill = SKILLS_CATALOG[skillId];
    if (!skill) return;

    // Verifica se possui a habilidade destravada na store
    const skillLvl = this.characterData.skillLevels[skillId] || 0;
    if (skillLvl <= 0) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Habilidade ${skill.name} ainda não foi desbloqueada!` });
      return;
    }

    // Fator de multiplicador de nivel: +15% por nivel adicional
    const levelMultiplier = 1 + (skillLvl - 1) * 0.15;

    // Verifica se a habilidade está em recarga (cooldown)
    const activeCooldown = this.skillCooldowns[skillId] || 0;
    if (activeCooldown > 0) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Habilidade ${skill.name} em recarga! (${Math.ceil(activeCooldown / 1000)}s)` });
      return;
    }

    // Custo de mana dinâmico com base no nível requerido ou custo fixo da Ultimate
    const manaCost = skill.isUltimate ? (skill.manaCost || 50) : (skillId === 'heal' ? 12 : (skillId === 'slash' ? 8 : (skillId === 'fireball' ? 15 : 10 + skill.requiredLevel * 1.5)));
    if (this.playerMana < manaCost) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Mana insuficiente para ${skill.name}! (Requer ${Math.floor(manaCost)})` });
      return;
    }

    this.playerMana -= manaCost;

    // Registra o tempo de recarga (lê cooldown específico da Ultimate se existir)
    let cooldownTime = skill.isUltimate ? (skill.cooldown || 60000) : (skillId === 'heal' ? 10000 : (skill.requiredLevel <= 1 ? 6000 : (skill.requiredLevel <= 3 ? 10000 : (skill.requiredLevel <= 7 ? 16000 : 24000))));
    
    // Capstone de Olho da Sobrevivência (Lvl 5): Reduz o cooldown da habilidade de Cura em 1.5s
    if (skillId === 'heal') {
      const sobrevivenciaLvl = useRelicStore.getState().relics['olho_sobrevivencia']?.level || 0;
      if (sobrevivenciaLvl === 5) {
        const cooldownReduction = this.isRelicOverheated('olho_sobrevivencia') ? 3750 : 1500;
        cooldownTime = Math.max(1000, cooldownTime - cooldownReduction);
      }
    }

    // Foco Temporal: reduz tempo de recarga de todas as habilidades em 3% por nível
    const transUpgrades = this.characterData.transcendenceUpgrades || {};
    const focoTemporalLvl = transUpgrades['foco_temporal'] || 0;
    if (focoTemporalLvl > 0) {
      cooldownTime = Math.max(1000, Math.floor(cooldownTime * (1 - focoTemporalLvl * 0.03)));
    }

    const isEcoterraActive = !useTowerStore.getState().towerActive && this.characterData?.activeEcoterra && (this.characterData?.currentStage || 1) <= 20;
    if (isEcoterraActive) {
      // Sifão de Essência Cósmica da Cidadela: reduz a erosão de recarga de +15% (Nível 0) até 0% (Nível 5, Sincronia Perfeita)
      const siphonLevel = this.characterData?.citadel?.cosmicSiphon?.level || 0;
      const cooldownErosionPct = Math.max(0, 0.15 - siphonLevel * 0.03);
      cooldownTime = Math.floor(cooldownTime * (1 + cooldownErosionPct));
    }

    this.skillCooldowns[skillId] = cooldownTime;
    bridge.emit(GameEvent.COOLDOWNS_CHANGED, { cooldowns: { ...this.skillCooldowns } });

    if (skillId === 'ultimate_necromancer') {
      if (!this.lastCommonEnemyDefeated) {
        bridge.emit(GameEvent.LOG_EMITTED, { message: `💀 Ceifa das Almas Perdidas: Nenhuma alma comum derrotada recentemente para ressuscitar!` });
        this.playerMana += manaCost;
        this.skillCooldowns[skillId] = 0;
        bridge.emit(GameEvent.COOLDOWNS_CHANGED, { cooldowns: { ...this.skillCooldowns } });
        return;
      }

      this.summonedAlly = { ...this.lastCommonEnemyDefeated };
      this.summonedAllyTimer = 10000;
      this.summonedAllyAttackCooldown = 1500;
      this.lastCommonEnemyDefeated = null;

      if (this.scene && typeof this.scene.animateHealEffect === 'function') {
        this.scene.animateHealEffect();
      }
      bridge.emit(GameEvent.LOG_EMITTED, { message: `💀 Você usou Ceifa das Almas Perdidas! O espírito de ${this.summonedAlly.name} foi ressuscitado para lutar ao seu lado por 10s!` });
      return;
    }

    if (skillId === 'heal' || skillId === 'holy_light' || skillId === 'ultimate_cleric') {
      // Restaura 15% do HP máximo, mais 2.5% a cada nível adicional (até 50% no nível 15). A ultimate cura 100% da vida máxima.
      const healAmount = skillId === 'ultimate_cleric' ? this.playerMaxHP : Math.floor(this.playerMaxHP * (0.15 + (skillLvl - 1) * 0.025));
      this.playerHP = Math.min(this.playerMaxHP, this.playerHP + healAmount);
      this.scene.animateHealEffect();
      this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 30, `+${healAmount}`, '#10b981');
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Você usou ${skill.name}! Recuperou ${healAmount} de HP.` });
      
      // A ultimate do clérigo também causa dano de prece celestial, então não retorna!
      if (skillId !== 'ultimate_cleric') {
        return;
      }
    }

    if (skillId === 'prismatic_barrier') {
      const highestStat = Math.max(
        this.playerFinalStats.strength || 0,
        this.playerFinalStats.magic || 0,
        this.playerFinalStats.dexterity || 0,
        this.playerFinalStats.constitution || 0,
        this.playerFinalStats.luck || 0
      );
      const shieldVal = Math.floor(highestStat * 0.30 * levelMultiplier);
      this.playerShield = shieldVal;
      
      this.playerEffects = this.playerEffects.filter(e => e.id !== 'prismatic_barrier');
      this.playerEffects.push({
        id: 'prismatic_barrier',
        name: 'Barreira Prismática',
        duration: 5000,
        tickTimer: 1000,
        value: shieldVal
      });

      this.scene.animateHealEffect();
      this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 30, `🛡️ +${shieldVal}`, '#38bdf8');
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Você usou ${skill.name}! Criou um escudo prismático de ${shieldVal} de absorção por 5s.` });
      return;
    }

    // Se o inimigo já estiver morto, não causa dano
    if (this.enemyHP <= 0) return;

    // Dano das habilidades ativas baseado no atributo principal da própria habilidade (skill.classId)
    const skillClass = skill.classId;
    let primaryStatVal = this.playerFinalStats.strength;
    let damageType = 'físico';

    const isAvatarClass = this.characterData && this.characterData.classId === 'avatar';
    if (isAvatarClass) {
      primaryStatVal = this.getAvatarEffectiveAttribute();
      damageType = 'prismático';
    } else {
      if (skillClass === 'mage' || skillClass === 'cleric') {
        primaryStatVal = this.playerFinalStats.magic;
        damageType = 'mágico';
      } else if (skillClass === 'ranger' || skillClass === 'rogue') {
        primaryStatVal = this.playerFinalStats.dexterity;
        damageType = 'de perfuração';
      } else if (skillClass === 'paladin') {
        primaryStatVal = this.playerFinalStats.constitution;
        damageType = 'sagrado';
      } else if (skillClass === 'warrior') {
        primaryStatVal = this.playerFinalStats.strength;
        damageType = 'físico';
      } else if (skillClass === 'necromancer') {
        primaryStatVal = this.playerFinalStats.magic;
        damageType = 'sombrio';
      }
    }

    const ascensionCount = this.characterData.ascensionCount || 0;
    const bestiaryMult = StatEngine.calculateBestiaryDamageMultiplier(this.characterData.killCount || {});
    const damageBoost = (1 + (ascensionCount * 0.05)) * bestiaryMult; // +5% por ascensão e bônus do bestiário

    // Chance de Crítico global nas Habilidades
    let isCrit = false;
    let critMultiplier = 1.0;
    const relicLvlLuz = useRelicStore.getState().relics['luz_alma']?.level || 0;
    const extraCritMult = relicLvlLuz === 5 ? (this.isRelicOverheated('luz_alma') ? 25 : 10) : 0;
    if (this.isFrenzyActive) {
      isCrit = true;
      critMultiplier = (this.playerFinalStats.critDamage + extraCritMult) / 100;
    } else {
      const roll = Math.random() * 100;
      if (roll < this.playerFinalStats.critChance) {
        isCrit = true;
        critMultiplier = (this.playerFinalStats.critDamage + extraCritMult) / 100;
      }
    }

    // Escalamento baseado em multiplicadores reais das descrições das skills e no nível da habilidade
    let dmg = 0;
    if (skillId === 'smite_paladin') {
      // Dano misto: 250% da média de constituição e força escalado por 3x (3.75x cada)
      dmg = Math.floor((this.playerFinalStats.constitution * 3.75 + this.playerFinalStats.strength * 3.75) * levelMultiplier + Math.random() * 5);
      damageType = 'sagrado';
    } else if (skillId === 'ultimate_avatar') {
      const sumStats = (
        (this.playerFinalStats.strength || 0) +
        (this.playerFinalStats.magic || 0) +
        (this.playerFinalStats.dexterity || 0) +
        (this.playerFinalStats.constitution || 0) +
        (this.playerFinalStats.luck || 0)
      );
      const baseMult = 10.0 * 3.0; // 10.0 base (dano da ultimate dobrado) x 3.0 scale
      dmg = Math.floor(sumStats * baseMult * levelMultiplier + Math.random() * 5);
      damageType = 'prismático';
    } else {
      const baseMult = (SKILL_BASE_MULTIPLIERS[skillId] || 1.0) * 3.0; // Multiplicadores escalados por 3x
      dmg = Math.floor(primaryStatVal * baseMult * levelMultiplier + Math.random() * 5);
    }

    const strengthMult = 1 + (this.playerFinalStats.strength * 0.0005);
    const relicDmgBonus = useRelicStore.getState().getRelicEffectBonus('luz_alma');
    let luckMult = 1.0;
    if (this.characterData && this.characterData.classId === 'necromancer') {
      luckMult = 1 + (this.playerFinalStats.luck * 0.001);
    }
    const gemaVontadeLvl = useRelicStore.getState().relics['gema_vontade']?.level || 0;
    const armorPenMult = gemaVontadeLvl === 5 ? (this.isRelicOverheated('gema_vontade') ? 1.25 : 1.10) : 1.0;
    const setDamageMultiplier = 1 + (this.playerFinalStats.damageMultiplierPct || 0);
    dmg = Math.floor(dmg * damageBoost * critMultiplier * strengthMult * (1 + relicDmgBonus) * luckMult * armorPenMult * setDamageMultiplier);

    // Se o Guerreiro desferir Executar em alvo com < 35% HP, causa 50% extra de dano
    if (skillId === 'execute' && (this.enemyHP / this.enemyMaxHP) < 0.35) {
      dmg = Math.floor(dmg * 1.5);
    }

    // Efeito do status EXPOSTO no dano final das habilidades
    const exposedEffect = this.enemyEffects.find(e => e.id === 'exposed');
    const exposedMultiplier = exposedEffect ? (1 + exposedEffect.value) : 1.0;
    dmg = Math.floor(dmg * exposedMultiplier);
    if (this.characterData.testMode) {
      dmg *= 5;
    }

    if (this.isElite && this.eliteAfix === 'blindado') {
      dmg = Math.floor(dmg * 0.75);
    }

    if (skillId === 'skeleton_army') {
      dmg = 0;
    }

    if (dmg > 0) {
      this.damageEnemy(dmg, true);
    }

    // Cura do Toque da Morte (Necromante)
    if (skillId === 'death_touch') {
      const drainHeal = Math.floor((this.playerMaxHP - this.playerHP) * (0.20 + 0.05 * skillLvl));
      if (drainHeal > 0 && this.playerHP > 0) {
        this.playerHP = Math.min(this.playerMaxHP, this.playerHP + drainHeal);
        if (this.scene && typeof this.scene.spawnDamageText === 'function') {
          this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 60, `+${drainHeal} (Dreno)`, '#10b981');
        }
      }
    }

    // Determina os efeitos visuais e sonoros na cena dependendo da habilidade específica
    if (skillId === 'unified_echo') {
      this.scene.animateSlashEffect();
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `${isCrit ? '⚡' : ''}ECO: ${dmg}!`, '#22d3ee');
    } else if (skillId === 'ultimate_avatar') {
      if (typeof this.scene.animateLightningEffect === 'function') {
        this.scene.animateLightningEffect();
      } else {
        this.scene.animateFireballEffect();
      }
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `${isCrit ? '⚡' : ''}SUPREMO: ${dmg}!`, '#a78bfa');
    } else if (skillId === 'frostbolt') {
      if (typeof this.scene.animateFrostboltEffect === 'function') {
        this.scene.animateFrostboltEffect();
      } else {
        this.scene.animateFireballEffect();
      }
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `${isCrit ? '⚡' : ''}GELO: ${dmg}!`, '#38bdf8');
    } else if (skillId === 'lightning' || skillId === 'wrath_heaven' || skillId === 'divine_judgement') {
      if (typeof this.scene.animateLightningEffect === 'function') {
        this.scene.animateLightningEffect();
      } else {
        this.scene.animateFireballEffect();
      }
      const lightningColor = skillId === 'lightning' ? '#a855f7' : '#fbbf24';
      const lightningLabel = skillId === 'lightning' ? 'RAIO' : 'DIVINO';
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `${isCrit ? '⚡' : ''}${lightningLabel}: ${dmg}!`, lightningColor);
    } else if (skillId === 'meteor') {
      if (typeof this.scene.animateMeteorEffect === 'function') {
        this.scene.animateMeteorEffect();
      } else {
        this.scene.animateFireballEffect();
      }
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `${isCrit ? '⚡' : ''}METEORO: ${dmg}!`, '#ef4444');
    } else if (skillId === 'poison_arrow' || skillId === 'poison_dagger') {
      if (typeof this.scene.animatePoisonArrowEffect === 'function') {
        this.scene.animatePoisonArrowEffect();
      } else {
        this.scene.animateSlashEffect();
      }
      const toxColor = skillId === 'poison_arrow' ? '#22c55e' : '#c084fc';
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `${isCrit ? '⚡' : ''}TOXINA: ${dmg}!`, toxColor);
    } else if (skillId === 'consecration') {
      if (typeof this.scene.animateConsecrationEffect === 'function') {
        this.scene.animateConsecrationEffect();
      } else {
        this.scene.animateSlashEffect();
      }
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `${isCrit ? '⚡' : ''}SANTIFICADO: ${dmg}!`, '#fef08a');
    } else {
      if (skillClass === 'mage' || skillClass === 'cleric') {
        this.scene.animateFireballEffect();
        this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `${isCrit ? '⚡' : ''}${damageType.toUpperCase()}: ${dmg}!`, '#f97316');
      } else {
        this.scene.animateSlashEffect();
        this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `${isCrit ? '⚡' : ''}${damageType.toUpperCase()}: ${dmg}!`, '#f43f5e');
      }
    }

    // Aplicação dos efeitos de status após causar o dano (escalonamento pelo levelMultiplier)
    if (skillId === 'shield_bash') {
      this.enemyEffects.push({
        id: 'stun',
        name: 'Atordoado',
        duration: Math.floor(2000 * levelMultiplier),
        tickTimer: 0,
        value: 0
      });
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 60, '[ATORDADO]', '#facc15');
    } else if (skillId === 'frostbolt') {
      this.enemyEffects.push({
        id: 'slow',
        name: 'Lentidão',
        duration: Math.floor(4000 * levelMultiplier),
        tickTimer: 0,
        value: 0.40
      });
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 60, '[LENTO]', '#93c5fd');
    } else if (skillId === 'fireball') {
      const burnDmg = Math.max(1, Math.floor(this.playerFinalStats.magic * 0.15 * levelMultiplier));
      this.enemyEffects.push({
        id: 'burn',
        name: 'Queimadura',
        duration: 3000,
        tickTimer: 1000,
        value: burnDmg
      });
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 60, '[QUEIMA]', '#f97316');
    } else if (skillId === 'meteor') {
      this.enemyEffects.push({
        id: 'stun',
        name: 'Atordoado',
        duration: Math.floor(1500 * levelMultiplier),
        tickTimer: 0,
        value: 0
      });
      const burnDmg = Math.max(1, Math.floor(this.playerFinalStats.magic * 0.15 * levelMultiplier));
      this.enemyEffects.push({
        id: 'burn',
        name: 'Queimadura',
        duration: 5000,
        tickTimer: 1000,
        value: burnDmg
      });
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 60, '[ATORDADO & QUEIMADO]', '#ef4444');
    } else if (skillId === 'poison_arrow') {
      const poisonDmg = Math.max(1, Math.floor(this.playerFinalStats.dexterity * 0.20 * levelMultiplier));
      this.enemyEffects.push({
        id: 'poison',
        name: 'Envenenado',
        duration: 5000,
        tickTimer: 1000,
        value: poisonDmg
      });
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 60, '[ENVENENADO]', '#22c55e');
    } else if (skillId === 'shield_righteousness') {
      this.enemyEffects.push({
        id: 'weakness',
        name: 'Enfraquecido',
        duration: Math.floor(5000 * levelMultiplier),
        tickTimer: 0,
        value: 0.30
      });
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 60, '[ENFRAQUECIDO]', '#f87171');
    } else if (skillId === 'consecration') {
      const regenVal = Math.max(1, Math.floor(this.playerFinalStats.constitution * 0.15 * levelMultiplier));
      this.playerEffects.push({
        id: 'consecration',
        name: 'Consagração',
        duration: 6000,
        tickTimer: 1000,
        value: regenVal
      });
      this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 60, '[SANTIFICADO]', '#fef08a');
    } else if (skillId === 'wrath_heaven') {
      this.enemyEffects.push({
        id: 'exposed',
        name: 'Exposto',
        duration: Math.floor(5000 * levelMultiplier),
        tickTimer: 0,
        value: 0.20
      });
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 60, '[EXPOSTO]', '#60a5fa');
    } else if (skillId === 'poison_dagger') {
      const poisonDmg = Math.max(1, Math.floor(this.playerFinalStats.dexterity * 0.25 * levelMultiplier));
      this.enemyEffects.push({
        id: 'poison',
        name: 'Envenenado',
        duration: 4000,
        tickTimer: 1000,
        value: poisonDmg
      });
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 60, '[TOXINA]', '#c084fc');
    } else if (skillId === 'bone_shield') {
      this.playerEffects.push({
        id: 'bone_shield',
        name: 'Escudo Ósseo',
        duration: 6000,
        tickTimer: 0,
        value: levelMultiplier
      });
      this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 60, '[ESCUDO ÓSSEO]', '#7c3aed');
    } else if (skillId === 'soul_siphon') {
      this.enemyEffects.push({
        id: 'soul_siphon',
        name: 'Sifão de Almas',
        duration: 3000,
        tickTimer: 0,
        value: 0
      });
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 60, '[SIFÃO DE ALMAS]', '#a855f7');
    } else if (skillId === 'skeleton_army') {
      const skeletonDmg = Math.max(1, Math.floor(this.playerFinalStats.magic * 0.40 * levelMultiplier * 3.0 * (1 + relicDmgBonus) * luckMult));
      this.enemyEffects.push({
        id: 'skeleton_army',
        name: 'Exército de Esqueletos',
        duration: 8000,
        tickTimer: 1000,
        value: skeletonDmg
      });
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 60, '[EXÉRCITO DE ESQUELETOS]', '#7c3aed');
    } else if (skillId === 'execute' && (this.enemyHP / this.enemyMaxHP) < 0.35) {
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 60, '¡MISERICÓRDIA!', '#ef4444');
    }

    if (skillId === 'skeleton_army') {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `💀 Você conjurou ${skill.name}! Invocando servos mortos-vivos para atacar o alvo.` });
    } else {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Você desferiu ${skill.name}! Dano: ${formatNumber(dmg, useGameStore.getState().abbreviateNumbers)}${isCrit ? ' (Crítico!)' : ''}.` });
    }

    if (this.enemyHP <= 0) {
      this.handleEnemyDefeat();
    }
  }

  private runAutoCastAI(): void {
    if (this.currentState === CombatState.DEAD || this.currentState === CombatState.MOVING || this.currentState === CombatState.TRANSITION) return;
    const char = this.characterData;
    const isAutoCastUnlocked = char && ((char.ascensionCount || 0) >= 1 || (char.highestStageReached || 0) > 5 || (char.currentStage || 0) > 5);
    if (!char || !isAutoCastUnlocked || !char.autoCastEnabled) return;

    // Colecionar habilidades desbloqueadas do tipo ativo que não estão desativadas nas configurações
    const disabledSkills = char.autoCastDisabledSkills || [];
    const activeSkills = char.unlockedSkills.filter((id: string) => {
      const sk = SKILLS_CATALOG[id];
      return sk && sk.type === 'active' && !disabledSkills.includes(id);
    });

    if (activeSkills.length === 0) return;

    // Ordenar por requiredLevel decrescente (priorizando habilidades de Tiers maiores)
    activeSkills.sort((a: string, b: string) => {
      const skA = SKILLS_CATALOG[a];
      const skB = SKILLS_CATALOG[b];
      return (skB?.requiredLevel || 0) - (skA?.requiredLevel || 0);
    });

    // Se 'heal' estiver liberado e a vida do jogador estiver abaixo do limite configurado, priorizar cura!
    const healThreshold = char.autoCastHealPercent !== undefined ? char.autoCastHealPercent : 50;
    const hpPercentage = (this.playerHP / this.playerMaxHP) * 100;
    if (hpPercentage < healThreshold) {
      const healSkillId = activeSkills.find((id: string) => id === 'heal');
      if (healSkillId) {
        const cooldown = this.skillCooldowns[healSkillId] || 0;
        const manaCost = 12; // Custo do heal base
        if (cooldown <= 0 && this.playerMana >= manaCost) {
          this.triggerSkill(healSkillId);
          return;
        }
      }
    }

    // Caso contrário, disparar a melhor habilidade de ataque disponível
    for (const skillId of activeSkills) {
      if (skillId === 'heal') continue; // Não usar cura automaticamente se a vida estiver boa

      const skill = SKILLS_CATALOG[skillId];
      if (!skill) continue;

      const cooldown = this.skillCooldowns[skillId] || 0;
      const manaCost = skill.isUltimate ? (skill.manaCost || 50) : (skillId === 'slash' ? 8 : (skillId === 'fireball' ? 15 : 10 + skill.requiredLevel * 1.5));

      if (cooldown <= 0 && this.playerMana >= manaCost) {
        this.triggerSkill(skillId);
        break; // Dispara uma única habilidade por verificação
      }
    }
  }
}
