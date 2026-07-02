import { GameEvent, EnemyType, ENEMIES_PER_STAGE, BaseStats, EquipmentItem } from './types';
import { bridge } from '../bridge/GameBridge';
import { useGameStore, SKILLS_CATALOG, SKILL_BASE_MULTIPLIERS } from '../store/useGameStore';
import { StatEngine } from './StatEngine';


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
    yOffset: 0
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
    yOffset: 0
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
    yOffset: 0
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
    yOffset: 0
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
    yOffset: 0
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
    yOffset: 0
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
    yOffset: 0
  },
  {
    id: 'boss_sand_scorpion',
    name: 'Rei Escorpião de Ouro',
    texture: 'enemy_scorpion',
    hpMultiplier: 2.8,
    damageMultiplier: 1.5,
    attackSpeedMultiplier: 0.95,
    xpValue: 150,
    color: '#fbbf24',
    flipX: false,
    yOffset: 0
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
    yOffset: 0
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
    yOffset: 0
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
    yOffset: 0
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
  }
];

export enum CombatState {
  IDLE = 'IDLE',
  MOVING = 'MOVING',
  ATTACKING = 'ATTACKING',
  CASTING = 'CASTING',
  DEAD = 'DEAD'
}

export interface StatusEffect {
  id: 'stun' | 'poison' | 'slow' | 'burn' | 'consecration' | 'weakness' | 'exposed';
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

  public enemyHP: number = 100;
  public enemyMaxHP: number = 100;
  public enemyLevel: number = 1;
  public currentEnemy: EnemyType = ENEMY_TYPES[0];

  private attackCooldown: number = 0;
  private enemyAttackCooldown: number = 0;
  public enemyEffects: StatusEffect[] = [];
  public playerEffects: StatusEffect[] = [];
  private scene: any;
  private skillCooldowns: Record<string, number> = {};
  private cooldownEmitTimer: number = 0;
  private autoCastTimer: number = 0;

  private storeUnsubscribe?: () => void;
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

  // Métodos auxiliares de balanceamento de atributos por classe
  private calculatePlayerMaxHP(constitution: number, hpBoost: number, classId: string): number {
    // Se constituição é o atributo primário (Paladino), escala menos: 8 HP por ponto
    // Se NÃO é o atributo primário (outras classes), escala mais: 18 HP por ponto
    const hpPerCon = (classId === 'paladin') ? 8 : 18;
    return Math.floor(constitution * hpPerCon * hpBoost);
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
    // Se NÃO é o atributo primário (outras classes), escala mais: 0.09 por ponto
    const regenPerMagic = (classId === 'mage' || classId === 'cleric') ? 0.02 : 0.09;
    return magic * regenPerMagic;
  }

  private getSpeedMultiplier(dexterity: number, classId: string, attackSpeedBoost: number): number {
    // Se destreza é o atributo primário (Arqueiro, Ladrão), usa um multiplicador menor baseado na raiz quadrada
    // Se NÃO é o atributo primário (outras classes), o multiplicador de raiz quadrada é maior para compensar a falta de destreza base
    const factor = (classId === 'ranger' || classId === 'rogue') ? 0.15 : 0.40;
    return (1 + Math.sqrt(dexterity) * factor) * attackSpeedBoost;
  }

  constructor(scene: any, initialTarget?: any) {
    this.scene = scene;
    this.target = initialTarget;
    
    const char = useGameStore.getState().character;
    this.setupEnemyForLevel(char.currentStage, char.enemiesDefeatedInStage);
    this.updateStatsFromStore();

    this.storeUnsubscribe = useGameStore.subscribe(() => {
      this.updateStatsFromStore();
    });
  }

  public cleanup(): void {
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = undefined;
    }
  }

  private setupEnemyForLevel(stage: number, defeatedInStage: number): void {
    this.enemyEffects = [];
    this.playerEffects = [];
    this.enemyLevel = stage;
    const isBoss = defeatedInStage === ENEMIES_PER_STAGE;
    const theme = ((stage - 1) % 5) + 1;

    // Multiplicador de HP/Dano por dificuldade:
    // Normal (1-5): 1.0× | Pesadelo (6-10): 2.0× | Inferno (11-15): 3.0× | Apocalipse (16-20): 4.0× | Pandemônio (21+): 5.0×
    const hpBoost = stage >= 21 ? 5.0 : stage >= 16 ? 4.0 : stage >= 11 ? 3.0 : stage >= 6 ? 2.0 : 1.0;

    // Escala de dificuldade exponencial para tornar fases progressivamente mais difíceis (ajustada para 1.50x por fase)
    const difficultyScale = Math.pow(1.50, stage - 1);

    if (stage >= 21) {
      // No Pandemônio, todos os inimigos podem aparecer aleatoriamente
      const randIndex = Math.floor(Math.random() * ENEMY_TYPES.length);
      this.currentEnemy = ENEMY_TYPES[randIndex];
      if (isBoss) {
        this.enemyMaxHP = Math.floor((150 + (stage * 50)) * difficultyScale * this.currentEnemy.hpMultiplier * 3.0 * hpBoost);
        console.log(`[CombatFSM] Pandemônio BOSS ${this.currentEnemy.name} Spawned. MaxHP: ${this.enemyMaxHP}`);
      } else {
        this.enemyMaxHP = Math.floor((150 + (stage * 50)) * difficultyScale * this.currentEnemy.hpMultiplier * hpBoost);
      }
      this.enemyHP = this.enemyMaxHP;
    } else if (isBoss) {
      let bossId = 'boss_forest_golem';
      if (theme === 2) bossId = 'boss_sand_scorpion';
      else if (theme === 3) bossId = 'boss_frost_dragon';
      else if (theme === 4) bossId = 'boss_necromancer';
      else if (theme === 5) bossId = 'boss_archdemon';

      this.currentEnemy = ENEMY_TYPES.find(e => e.id === bossId) || ENEMY_TYPES[0];
      this.enemyMaxHP = Math.floor((150 + (stage * 50)) * difficultyScale * this.currentEnemy.hpMultiplier * 3.0 * hpBoost);
      this.enemyHP = this.enemyMaxHP;
      const diffLabel = stage >= 16 ? 'Apocalipse' : stage >= 11 ? 'Inferno' : stage >= 6 ? 'Pesadelo' : 'Normal';
      console.log(`[CombatFSM] BOSS ${this.currentEnemy.name} Spawned. MaxHP: ${this.enemyMaxHP} (Dificuldade: ${diffLabel})`);
    } else {
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

    // Reinicia ou ajusta inimigo se mudou de fase/prestígio
    const hasPrestigeReset = char.level === 1 && char.xp === 0;
    if (this.enemyLevel !== char.currentStage || hasPrestigeReset) {
      this.enemyLevel = char.currentStage;
      this.setupEnemyForLevel(char.currentStage, char.enemiesDefeatedInStage);
      this.playerHP = this.playerMaxHP;
      this.playerMana = this.playerMaxMana;
      this.currentState = CombatState.IDLE;
      this.skillCooldowns = {};
      
      if (this.scene && this.scene.sys && this.scene.sys.isActive()) {
        this.scene.respawnEnemyAt(900, this.currentEnemy);
        this.scene.respawnPlayer();
      }
    }
  }

  public update(delta: number): void {
    if (this.currentState === CombatState.DEAD) return;

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
    if (this.playerFinalStats.robotClicks > 0 && this.enemyHP > 0) {
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
    this.playerMana = Math.min(this.playerMaxMana, this.playerMana + (this.getManaRegen(this.playerFinalStats.magic, classId) * (delta / 1000)));

    // Processar e atualizar durações de efeitos de status no inimigo
    const wasEnemyStunned = this.enemyEffects.some(e => e.id === 'stun');

    this.enemyEffects = this.enemyEffects.filter(effect => {
      effect.duration -= delta;
      if (effect.duration <= 0) return false;

      effect.tickTimer -= delta;
      if (effect.tickTimer <= 0) {
        effect.tickTimer = 1000;
        if (effect.id === 'poison' || effect.id === 'burn') {
          if (this.enemyHP > 0) {
            const tickDmg = Math.floor(effect.value);
            this.enemyHP = Math.max(0, this.enemyHP - tickDmg);
            const color = effect.id === 'poison' ? '#22c55e' : '#f97316';
            const label = effect.id === 'poison' ? 'Veneno' : 'Queima';
            
            if (this.scene && typeof this.scene.spawnDamageText === 'function') {
              this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `-${tickDmg} (${label})`, color);
            }
            bridge.emit(GameEvent.LOG_EMITTED, { message: `O inimigo sofreu ${tickDmg} de dano por ${label}.` });

            if (this.enemyHP <= 0) {
              this.handleEnemyDefeat();
              return false;
            }
          }
        }
      }
      return true;
    });

    const isEnemyStunnedNow = this.enemyEffects.some(e => e.id === 'stun');
    if (wasEnemyStunned && !isEnemyStunnedNow && this.enemyHP > 0) {
      const baseCooldown = 3600 - (this.enemyLevel * 30);
      this.enemyAttackCooldown = Math.max(1000, baseCooldown / this.currentEnemy.attackSpeedMultiplier);
      bridge.emit(GameEvent.LOG_EMITTED, { message: `O inimigo se recuperou do atordoamento e recomeça a preparar seu ataque!` });
    }

    // Processar e atualizar durações de efeitos de status no jogador
    this.playerEffects = this.playerEffects.filter(effect => {
      effect.duration -= delta;
      if (effect.duration <= 0) return false;

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
    const attackSpeedBoost = 1 + (ascensionCount * 0.01);
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

    if (this.currentState === CombatState.DEAD || this.enemyHP <= 0) return;
    
    // Throttling: limite de 20 cliques por segundo (50ms por clique)
    const now = Date.now();
    if (now - this.lastTapTimestamp < 50) {
      return;
    }
    this.lastTapTimestamp = now;

    if (this.isFrenzyActive) return;

    this.frenzyEnergy = Math.min(100, this.frenzyEnergy + 1);
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

    if (this.currentState === CombatState.DEAD || this.enemyHP <= 0) return;

    const dpsPassivo = this.getPassiveDPS();
    const effectiveTouch = this.playerFinalStats.touch * 0.5;
    const baseTouchDmg = effectiveTouch + (dpsPassivo * (effectiveTouch * 0.0005));

    // Multiplicador de combo só afeta cliques do jogador (não automáticos do robô assistente, mas do frenesi sim)
    const comboMultiplier = 1.0 + Math.min(1.0, this.comboCount * 0.10);

    let isCrit = false;
    let critMultiplier = 1.0;
    if (this.isFrenzyActive) {
      isCrit = true;
      critMultiplier = this.playerFinalStats.touchCritDamage / 100;
    } else {
      const roll = Math.random() * 100;
      if (roll < this.playerFinalStats.touchCritChance) {
        isCrit = true;
        critMultiplier = this.playerFinalStats.touchCritDamage / 100;
      }
    }

    const bestiaryMult = StatEngine.calculateBestiaryDamageMultiplier(this.characterData.killCount || {});
    let finalTouchDmg = Math.floor(baseTouchDmg * comboMultiplier * critMultiplier * bestiaryMult);
    if (this.characterData.testMode) {
      finalTouchDmg *= 5;
    }
    if (finalTouchDmg < 1) finalTouchDmg = 1;

    this.enemyHP = Math.max(0, this.enemyHP - finalTouchDmg);

    if (this.scene && typeof this.scene.spawnTouchEffect === 'function') {
      this.scene.spawnTouchEffect(isCrit, finalTouchDmg, clickX, clickY);
    }

    if (this.enemyHP <= 0) {
      this.handleEnemyDefeat();
    }
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
    const attackSpeedBoost = 1 + (ascensionCount * 0.01); // +1% por ascensão
    const classId = this.characterData.classId || 'warrior';
    const speedMultiplier = Math.min(15, this.getSpeedMultiplier(this.playerFinalStats.dexterity, classId, attackSpeedBoost));
    this.attackCooldown = Math.max(200, 3000 / speedMultiplier);

    // Escala de Dano baseado no Atributo Principal da Classe ativa
    let primaryStatVal = this.playerFinalStats.strength;
    let damageType = 'físico';
    let secondaryBoost = 0; // Bônus secundário de Força para outras classes

    if (classId === 'mage' || classId === 'cleric') {
      primaryStatVal = this.playerFinalStats.magic;
      damageType = 'mágico';
      secondaryBoost = this.playerFinalStats.strength * 0.25; // Força aumenta levemente o dano geral (+0.25 por ponto)
    } else if (classId === 'ranger' || classId === 'rogue') {
      primaryStatVal = this.playerFinalStats.dexterity;
      damageType = 'de perfuração';
      secondaryBoost = this.playerFinalStats.strength * 0.25; // Força aumenta levemente o dano geral (+0.25 por ponto)
    } else if (classId === 'paladin') {
      primaryStatVal = this.playerFinalStats.constitution;
      damageType = 'sagrado';
      secondaryBoost = this.playerFinalStats.strength * 0.25; // Força aumenta levemente o dano geral (+0.25 por ponto)
    }

    // Inimigo sob status EXPOSTO sofre 20% a mais de dano
    const exposedEffect = this.enemyEffects.find(e => e.id === 'exposed');
    const exposedMultiplier = exposedEffect ? (1 + exposedEffect.value) : 1.0;
    const bestiaryMult = StatEngine.calculateBestiaryDamageMultiplier(this.characterData.killCount || {});
    const damageBoost = (1 + (ascensionCount * 0.05)) * bestiaryMult; // +5% por ascensão e bônus do bestiário

    // Chance de Crítico global no Ataque Básico
    let isCrit = false;
    let critMultiplier = 1.0;
    if (this.isFrenzyActive) {
      isCrit = true;
      critMultiplier = this.playerFinalStats.touchCritDamage / 100;
    } else {
      const roll = Math.random() * 100;
      if (roll < this.playerFinalStats.touchCritChance) {
        isCrit = true;
        critMultiplier = this.playerFinalStats.touchCritDamage / 100;
      }
    }

    let damage = Math.floor(((primaryStatVal + secondaryBoost) * 3.0 + Math.random() * 3) * exposedMultiplier * damageBoost * critMultiplier);
    if (this.characterData.testMode) {
      damage *= 5;
    }

    this.scene.animatePlayerAttack();
    this.enemyHP = Math.max(0, this.enemyHP - damage);
    this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `${isCrit ? '⚡' : ''}-${damage}`, isCrit ? '#ef4444' : '#f59e0b');

    bridge.emit(GameEvent.LOG_EMITTED, { message: `Você causou ${damage} de dano ${damageType}${isCrit ? ' (Crítico!)' : ''}.` });

    if (this.enemyHP <= 0) {
      this.handleEnemyDefeat();
    }
  }

  private performEnemyAttack() {
    const baseCooldown = 3600 - (this.enemyLevel * 30);
    this.enemyAttackCooldown = Math.max(1000, baseCooldown / this.currentEnemy.attackSpeedMultiplier);

    // Multiplicador de dano por dificuldade:
    // Normal (1-5): 1.0× | Pesadelo (6-10): 2.0× | Inferno (11-15): 3.0× | Apocalipse (16-20): 4.0× | Pandemônio (21+): 5.0×
    const dmgBoost = this.enemyLevel >= 21 ? 5.0 : this.enemyLevel >= 16 ? 4.0 : this.enemyLevel >= 11 ? 3.0 : this.enemyLevel >= 6 ? 2.0 : 1.0;
    
    // Escala exponencial de dano baseado no estágio (ajustada para 1.25x por fase)
    const dmgScale = Math.pow(1.25, this.enemyLevel - 1);

    // Inimigo sob status ENFRAQUECIDO causa 30% a menos de dano
    const weaknessEffect = this.enemyEffects.find(e => e.id === 'weakness');
    const weaknessMultiplier = weaknessEffect ? (1 - weaknessEffect.value) : 1.0;

    const damage = Math.floor((10 + this.enemyLevel * 4.0 + Math.random() * 2) * dmgScale * this.currentEnemy.damageMultiplier * dmgBoost * weaknessMultiplier);

    this.scene.animateEnemyAttack();

    // Chance de Esquiva: 0.1% por ponto de Destreza (limite de 75% para balanceamento)
    const ascensionCount = this.characterData.ascensionCount || 0;
    const dodgeChance = Math.min(75, this.playerFinalStats.dexterity * 0.1 + (ascensionCount * 0.5));
    const isDodge = Math.random() * 100 < dodgeChance;

    if (isDodge) {
      this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 30, 'Desviou!', '#38bdf8');
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Você se esquivou do ataque do ${this.currentEnemy.name} (Esquiva: ${dodgeChance.toFixed(1)}%).` });
      return;
    }

    this.playerHP = Math.max(0, this.playerHP - damage);
    this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 30, `-${damage}`, '#ef4444');

    bridge.emit(GameEvent.LOG_EMITTED, { message: `O ${this.currentEnemy.name} causou ${damage} de dano a você.` });

    if (this.playerHP <= 0) {
      this.handlePlayerDefeat();
    }
  }

  private handleEnemyDefeat() {
    // Limpa os efeitos do inimigo imediatamente para evitar ticks residuais durante o respawn
    this.enemyEffects = [];

    const char = useGameStore.getState().character;
    const isBoss = char.enemiesDefeatedInStage === ENEMIES_PER_STAGE;

    // Registra a morte do monstro no bestiário
    useGameStore.getState().registerEnemyKill(this.currentEnemy.id);

    // Escala acelerada de XP por fase para acompanhar a curva de XP necessária
    const xpScale = Math.pow(1.35, char.currentStage - 1);
    const baseGainedXp = Math.floor((this.currentEnemy.xpValue + Math.floor(char.currentStage * 2.0)) * xpScale);
    let gainedXp = isBoss ? baseGainedXp * 3 : baseGainedXp;
    if (char.testMode) {
      gainedXp *= 5;
    }

    // Escala de Gold por fase e sorte
    const goldScale = Math.pow(1.25, char.currentStage - 1);
    const baseGainedGold = Math.floor((10 + Math.floor(char.currentStage * 1.5)) * goldScale);
    let gainedGold = isBoss ? baseGainedGold * 3.5 : baseGainedGold;
    const luckBonus = 1 + ((this.playerFinalStats.luck || 0) * 0.01);
    gainedGold = Math.floor(gainedGold * luckBonus);

    if (isBoss) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Chefe ${this.currentEnemy.name} derrotado! Você avançou para a Fase ${char.currentStage + 1}, ganhou +${gainedXp} XP e +${gainedGold} Ouro!` });
    } else {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `${this.currentEnemy.name} derrotado! Você ganhou +${gainedXp} XP e +${gainedGold} Ouro!` });
    }

    useGameStore.getState().addXp(gainedXp);
    useGameStore.getState().addGold(gainedGold);

    // === SISTEMA DE DROP DE EQUIPAMENTOS ===
    const luck = this.playerFinalStats.luck || 0;
    const baseDropChance = 0.05;
    const dropChance = isBoss ? 1.0 : Math.min(0.50, baseDropChance + luck * 0.002);
    
    if (Math.random() < dropChance) {
      const slots = ['head', 'chest', 'legs', 'gloves', 'weapon'] as const;
      const slot = slots[Math.floor(Math.random() * slots.length)];
      
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
      
      const stage = char.currentStage;
      const classId = char.classId;
      const ascensionCount = char.ascensionCount || 0;
      
      // Chance de ser um item do Set Pandemoníaco: apenas no Modo Pandemônio e 15% de chance sobre o drop
      const isPandemoniumDrop = (stage >= 21 || char.activePandemonium) && Math.random() < 0.15;
      
      // Chance de ser um item do Set Ancestral: apenas após a 1ª ascensão e 10% de chance sobre o drop (se não for Pandemônio)
      const isAncestralDrop = !isPandemoniumDrop && ascensionCount >= 1 && Math.random() < 0.10;
      
      // Se for drop do Pandemônio o multiplicador é 7.0; se for Ancestral é 4.5; senão segue o padrão
      const mult = isPandemoniumDrop ? 7.0 : (isAncestralDrop ? 4.5 : (rarity === 'legendary' ? 2.5 : (rarity === 'rare' ? 1.5 : 1.0)));
      
      const possibleStatsMap: Record<string, string[]> = {
        warrior: ['strength', 'constitution', 'luck'],
        mage: ['magic', 'constitution', 'luck'],
        ranger: ['dexterity', 'constitution', 'luck'],
        paladin: ['constitution', 'strength', 'luck'],
        cleric: ['magic', 'constitution', 'luck'],
        rogue: ['dexterity', 'strength', 'luck']
      };
      
      const possibleStats = possibleStatsMap[classId] || ['strength', 'constitution', 'luck'];
      const itemStats: Partial<BaseStats> = {};
      const numAttributes = isPandemoniumDrop || isAncestralDrop || rarity === 'legendary' ? 3 : (rarity === 'rare' ? 2 : 1);
      
      const pickedStats = [...possibleStats].sort(() => 0.5 - Math.random()).slice(0, numAttributes);
      pickedStats.forEach((statKey) => {
        const val = Math.max(1, Math.round(stage * mult * (0.8 + Math.random() * 0.4)));
        itemStats[statKey as keyof BaseStats] = val;
      });
      
      const setNames: Record<string, string> = {
        warrior: 'Set do Senhor da Guerra',
        mage: 'Set do Mestre Arcano',
        ranger: 'Set do Rastreador das Sombras',
        paladin: 'Set do Guardião Divino',
        cleric: 'Set do Sumosacerdote',
        rogue: 'Set do Assassino Fantasma'
      };
      
      const ancestralSetNames: Record<string, string> = {
        warrior: 'Set Ancestral do Conquistador',
        mage: 'Set Ancestral do Arquimago',
        ranger: 'Set Ancestral do Caçador Estelar',
        paladin: 'Set Ancestral do Sentinela Eterno',
        cleric: 'Set Ancestral do Sábio Divino',
        rogue: 'Set Ancestral do Ceifador de Almas'
      };

      const pandemoniumSetNames: Record<string, string> = {
        warrior: 'Set Pandemoníaco do Destruidor',
        mage: 'Set Pandemoníaco do Feiticeiro do Vazio',
        ranger: 'Set Pandemoníaco do Franco-Atirador',
        paladin: 'Set Pandemoníaco do Vingador Sagrado',
        cleric: 'Set Pandemoníaco do Sumo-Inquisidor',
        rogue: 'Set Pandemoníaco do Executor'
      };
      
      const slotNames: Record<string, Record<string, string>> = {
        warrior: { weapon: 'Espada', head: 'Elmo', chest: 'Armadura', legs: 'Perneiras', gloves: 'Manoplas' },
        mage: { weapon: 'Cajado', head: 'Capuz', chest: 'Manto', legs: 'Calças', gloves: 'Luvas' },
        ranger: { weapon: 'Arco', head: 'Máscara', chest: 'Colete', legs: 'Perneiras', gloves: 'Luvas' },
        paladin: { weapon: 'Martelo', head: 'Elmo', chest: 'Armadura', legs: 'Perneiras', gloves: 'Manoplas' },
        cleric: { weapon: 'Maça', head: 'Mitra', chest: 'Túnica', legs: 'Calças', gloves: 'Luvas' },
        rogue: { weapon: 'Adaga', head: 'Capuz', chest: 'Manto', legs: 'Calças', gloves: 'Luvas' }
      };
      
      const baseName = slotNames[classId]?.[slot] || 'Equipamento';
      let name = '';
      let setName: string | undefined = undefined;
      
      if (isPandemoniumDrop) {
        setName = pandemoniumSetNames[classId] || `Set Pandemoníaco de ${classId}`;
        let cleanSetName = setName;
        if (cleanSetName.startsWith('Set Pandemoníaco do ')) {
          cleanSetName = cleanSetName.replace('Set Pandemoníaco do ', '');
        } else if (cleanSetName.startsWith('Set Pandemoníaco de ')) {
          cleanSetName = cleanSetName.replace('Set Pandemoníaco de ', '');
        }
        let suffix = 'Pandemoníaco';
        if (baseName.endsWith('as')) {
          suffix = 'Pandemoníacas';
        } else if (baseName.endsWith('a')) {
          suffix = 'Pandemoníaca';
        }
        name = `${baseName} ${suffix} do ${cleanSetName}`;
        rarity = 'legendary';
      } else if (isAncestralDrop) {
        setName = ancestralSetNames[classId] || `Set Ancestral de ${classId}`;
        const cleanSetName = setName.replace('Set Ancestral do ', '');
        name = `${baseName} Ancestral do ${cleanSetName}`;
        rarity = 'legendary'; // Os itens do set ancestral herdam visual lendário base
      } else if (rarity === 'legendary') {
        setName = setNames[classId];
        const cleanSetName = setName.replace('Set do ', '');
        name = `${baseName} do ${cleanSetName}`;
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

    setTimeout(() => {
      const nextChar = useGameStore.getState().character;
      this.setupEnemyForLevel(nextChar.currentStage, nextChar.enemiesDefeatedInStage);
      this.scene.respawnEnemyAt(900, this.currentEnemy);

      const enemyName = nextChar.enemiesDefeatedInStage === ENEMIES_PER_STAGE ? `CHEFE ${this.currentEnemy.name}` : this.currentEnemy.name;
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Um ${enemyName} Nível ${nextChar.currentStage} apareceu no horizonte!` });
    }, 1500);
  }

  private handlePlayerDefeat() {
    this.currentState = CombatState.DEAD;
    bridge.emit(GameEvent.LOG_EMITTED, { message: `Você foi derrotado! Progresso da fase resetado.` });

    useGameStore.getState().resetStageProgress();
    this.scene.animatePlayerDeath();

    setTimeout(() => {
      this.playerHP = this.playerMaxHP;
      this.playerMana = this.playerMaxMana;
      this.currentState = CombatState.IDLE;

      const char = useGameStore.getState().character;
      this.setupEnemyForLevel(char.currentStage, char.enemiesDefeatedInStage);

      this.scene.respawnEnemyAt(900, this.currentEnemy);
      this.scene.respawnPlayer();
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Você ressuscitou e retornou ao início da Fase ${char.currentStage}!` });
    }, 3000);
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

    if (this.currentState === CombatState.DEAD) return;

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
    const cooldownTime = skill.isUltimate ? (skill.cooldown || 60000) : (skillId === 'heal' ? 10000 : (skill.requiredLevel <= 1 ? 6000 : (skill.requiredLevel <= 3 ? 10000 : (skill.requiredLevel <= 7 ? 16000 : 24000))));
    this.skillCooldowns[skillId] = cooldownTime;
    bridge.emit(GameEvent.COOLDOWNS_CHANGED, { cooldowns: { ...this.skillCooldowns } });

    if (skillId === 'heal' || skillId === 'holy_light' || skillId === 'ultimate_cleric') {
      // Restaura 30% do HP máximo, mais 5% a cada nível adicional. A ultimate cura 100% da vida máxima.
      const healAmount = skillId === 'ultimate_cleric' ? this.playerMaxHP : Math.floor(this.playerMaxHP * (0.30 + (skillLvl - 1) * 0.05));
      this.playerHP = Math.min(this.playerMaxHP, this.playerHP + healAmount);
      this.scene.animateHealEffect();
      this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 30, `+${healAmount}`, '#10b981');
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Você usou ${skill.name}! Recuperou ${healAmount} de HP.` });
      
      // A ultimate do clérigo também causa dano de prece celestial, então não retorna!
      if (skillId !== 'ultimate_cleric') {
        return;
      }
    }

    // Se o inimigo já estiver morto, não causa dano
    if (this.enemyHP <= 0) return;

    // Dano das habilidades ativas baseado no atributo principal da própria habilidade (skill.classId)
    const skillClass = skill.classId;
    let primaryStatVal = this.playerFinalStats.strength;
    let damageType = 'físico';

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
    }

    const ascensionCount = this.characterData.ascensionCount || 0;
    const bestiaryMult = StatEngine.calculateBestiaryDamageMultiplier(this.characterData.killCount || {});
    const damageBoost = (1 + (ascensionCount * 0.05)) * bestiaryMult; // +5% por ascensão e bônus do bestiário

    // Chance de Crítico global nas Habilidades
    let isCrit = false;
    let critMultiplier = 1.0;
    if (this.isFrenzyActive) {
      isCrit = true;
      critMultiplier = this.playerFinalStats.touchCritDamage / 100;
    } else {
      const roll = Math.random() * 100;
      if (roll < this.playerFinalStats.touchCritChance) {
        isCrit = true;
        critMultiplier = this.playerFinalStats.touchCritDamage / 100;
      }
    }

    // Escalamento baseado em multiplicadores reais das descrições das skills e no nível da habilidade
    let dmg = 0;
    if (skillId === 'smite_paladin') {
      // Dano misto: 250% da média de constituição e força escalado por 3x (3.75x cada)
      dmg = Math.floor((this.playerFinalStats.constitution * 3.75 + this.playerFinalStats.strength * 3.75) * levelMultiplier + Math.random() * 5);
      damageType = 'sagrado';
    } else {
      const baseMult = (SKILL_BASE_MULTIPLIERS[skillId] || 1.0) * 3.0; // Multiplicadores escalados por 3x
      dmg = Math.floor(primaryStatVal * baseMult * levelMultiplier + Math.random() * 5);
    }

    dmg = Math.floor(dmg * damageBoost * critMultiplier);

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

    this.enemyHP = Math.max(0, this.enemyHP - dmg);

    // Determina os efeitos visuais e sonoros na cena dependendo da habilidade específica
    if (skillId === 'frostbolt') {
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
    } else if (skillId === 'execute' && (this.enemyHP / this.enemyMaxHP) < 0.35) {
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 60, '¡MISERICÓRDIA!', '#ef4444');
    }

    bridge.emit(GameEvent.LOG_EMITTED, { message: `Você desferiu ${skill.name}! Dano: ${dmg}${isCrit ? ' (Crítico!)' : ''}.` });

    if (this.enemyHP <= 0) {
      this.handleEnemyDefeat();
    }
  }

  private runAutoCastAI(): void {
    if (this.currentState === CombatState.DEAD) return;
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
