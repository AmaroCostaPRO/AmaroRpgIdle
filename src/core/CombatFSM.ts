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
    const isNightmare = stage >= 6;
    const hpBoost = isNightmare ? 2.5 : 1.0;
    const theme = ((stage - 1) % 5) + 1;

    // Escala de dificuldade exponencial para tornar fases progressivamente mais difíceis
    const difficultyScale = Math.pow(1.65, stage - 1);

    if (isBoss) {
      let bossId = 'boss_forest_golem';
      if (theme === 2) bossId = 'boss_sand_scorpion';
      else if (theme === 3) bossId = 'boss_frost_dragon';
      else if (theme === 4) bossId = 'boss_necromancer';
      else if (theme === 5) bossId = 'boss_archdemon';

      this.currentEnemy = ENEMY_TYPES.find(e => e.id === bossId) || ENEMY_TYPES[0];
      this.enemyMaxHP = Math.floor((120 + (stage * 35)) * difficultyScale * this.currentEnemy.hpMultiplier * 3.0 * hpBoost);
      this.enemyHP = this.enemyMaxHP;
      console.log(`[CombatFSM] BOSS ${this.currentEnemy.name} Spawned. MaxHP: ${this.enemyMaxHP} (Pesadelo: ${isNightmare})`);
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
      this.enemyMaxHP = Math.floor((120 + (stage * 35)) * difficultyScale * this.currentEnemy.hpMultiplier * hpBoost);
      this.enemyHP = this.enemyMaxHP;
    }
  }

  private updateStatsFromStore() {
    const char = useGameStore.getState().character;
    this.characterData = char;
    this.playerFinalStats = StatEngine.calculateFinalStats(char);

    const ascensionCount = char.ascensionCount || 0;
    const hpBoost = 1 + (ascensionCount * 0.05); // +5% por ascensão
    const manaBoost = 1 + (ascensionCount * 0.05); // +5% por ascensão

    const prevMaxHP = this.playerMaxHP;
    this.playerMaxHP = Math.floor(this.playerFinalStats.constitution * 12 * hpBoost);

    if (this.playerMaxHP > prevMaxHP) {
      this.playerHP += (this.playerMaxHP - prevMaxHP);
    }
    this.playerHP = Math.min(this.playerHP, this.playerMaxHP);

    const prevMaxMana = this.playerMaxMana;
    this.playerMaxMana = Math.floor(this.playerFinalStats.magic * 10 * manaBoost);
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

    if (this.attackCooldown > 0) this.attackCooldown -= delta;
    
    // Lentidão e atordoamento afetam a recarga do ataque do inimigo
    const isEnemyStunned = this.enemyEffects.some(e => e.id === 'stun');
    if (this.enemyAttackCooldown > 0 && !isEnemyStunned) {
      const slowEffect = this.enemyEffects.find(e => e.id === 'slow');
      const slowMultiplier = slowEffect ? (1 - slowEffect.value) : 1.0;
      this.enemyAttackCooldown -= delta * slowMultiplier;
    }

    // Recuperação de HP/Mana baseada em atributos
    this.playerHP = Math.min(this.playerMaxHP, this.playerHP + (this.playerFinalStats.constitution * 0.05 * (delta / 1000)));
    this.playerMana = Math.min(this.playerMaxMana, this.playerMana + (this.playerFinalStats.magic * 0.05 * (delta / 1000)));

    // Processar e atualizar durações de efeitos de status no inimigo
    const wasEnemyStunned = this.enemyEffects.some(e => e.id === 'stun');

    this.enemyEffects = this.enemyEffects.filter(effect => {
      effect.duration -= delta;
      if (effect.duration <= 0) return false;

      effect.tickTimer -= delta;
      if (effect.tickTimer <= 0) {
        effect.tickTimer = 1000;
        if (effect.id === 'poison' || effect.id === 'burn') {
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
    const ascensionCount = this.characterData.ascensionCount || 0;
    const attackSpeedBoost = 1 + (ascensionCount * 0.02); // +2% por ascensão
    const speedMultiplier = (1 + (this.playerFinalStats.dexterity * 0.02)) * attackSpeedBoost;
    this.attackCooldown = Math.max(800, 3000 / speedMultiplier);

    // Escala de Dano baseado no Atributo Principal da Classe ativa
    const classId = this.characterData.classId || 'warrior';
    let primaryStatVal = this.playerFinalStats.strength;
    let damageType = 'físico';

    if (classId === 'mage' || classId === 'cleric') {
      primaryStatVal = this.playerFinalStats.magic;
      damageType = 'mágico';
    } else if (classId === 'ranger' || classId === 'rogue') {
      primaryStatVal = this.playerFinalStats.dexterity;
      damageType = 'de perfuração';
    } else if (classId === 'paladin') {
      primaryStatVal = this.playerFinalStats.constitution;
      damageType = 'sagrado';
    }

    // Inimigo sob status EXPOSTO sofre 20% a mais de dano
    const exposedEffect = this.enemyEffects.find(e => e.id === 'exposed');
    const exposedMultiplier = exposedEffect ? (1 + exposedEffect.value) : 1.0;
    const damageBoost = 1 + (ascensionCount * 0.10); // +10% por ascensão

    const damage = Math.floor((primaryStatVal * 1.0 + Math.random() * 3) * exposedMultiplier * damageBoost);

    this.scene.animatePlayerAttack();
    this.enemyHP = Math.max(0, this.enemyHP - damage);
    this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `-${damage}`, '#f59e0b');

    bridge.emit(GameEvent.LOG_EMITTED, { message: `Você causou ${damage} de dano ${damageType}.` });

    if (this.enemyHP <= 0) {
      this.handleEnemyDefeat();
    }
  }

  private performEnemyAttack() {
    const baseCooldown = 3600 - (this.enemyLevel * 30);
    this.enemyAttackCooldown = Math.max(1000, baseCooldown / this.currentEnemy.attackSpeedMultiplier);

    const isNightmare = this.enemyLevel >= 6;
    const dmgBoost = isNightmare ? 2.5 : 1.0;
    
    // Escala exponencial de dano baseado no estágio
    const dmgScale = Math.pow(1.3, this.enemyLevel - 1);

    // Inimigo sob status ENFRAQUECIDO causa 30% a menos de dano
    const weaknessEffect = this.enemyEffects.find(e => e.id === 'weakness');
    const weaknessMultiplier = weaknessEffect ? (1 - weaknessEffect.value) : 1.0;

    const damage = Math.floor((5 + this.enemyLevel * 2.0 + Math.random() * 2) * dmgScale * this.currentEnemy.damageMultiplier * dmgBoost * weaknessMultiplier);

    this.scene.animateEnemyAttack();
    this.playerHP = Math.max(0, this.playerHP - damage);
    this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 30, `-${damage}`, '#ef4444');

    bridge.emit(GameEvent.LOG_EMITTED, { message: `O ${this.currentEnemy.name} causou ${damage} de dano a você.` });

    if (this.playerHP <= 0) {
      this.handlePlayerDefeat();
    }
  }

  private handleEnemyDefeat() {
    const char = useGameStore.getState().character;
    const isBoss = char.enemiesDefeatedInStage === ENEMIES_PER_STAGE;

    // Registra a morte do monstro no bestiário
    useGameStore.getState().registerEnemyKill(this.currentEnemy.id);

    // Escala acelerada de XP por fase para acompanhar a curva de XP necessária
    const xpScale = Math.pow(1.35, char.currentStage - 1);
    const baseGainedXp = Math.floor((this.currentEnemy.xpValue + Math.floor(char.currentStage * 2.0)) * xpScale);
    const gainedXp = isBoss ? baseGainedXp * 3 : baseGainedXp;

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
      
      let rarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common';
      if (roll < legendaryWeight) {
        rarity = 'legendary';
      } else if (roll < legendaryWeight + rareWeight) {
        rarity = 'rare';
      }
      
      const stage = char.currentStage;
      const mult = rarity === 'legendary' ? 2.5 : (rarity === 'rare' ? 1.5 : 1.0);
      const classId = char.classId;
      
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
      const numAttributes = rarity === 'legendary' ? 3 : (rarity === 'rare' ? 2 : 1);
      
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
      
      if (rarity === 'legendary' || rarity === 'rare') {
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
        spriteName: `${classId}-${slot}`
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
    if (this.currentState === CombatState.DEAD) return;

    const skill = SKILLS_CATALOG[skillId];
    if (!skill) return;

    // Verifica se possui a habilidade destravada na store
    const skillLvl = this.characterData.skillLevels[skillId] || 0;
    if (skillLvl <= 0) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Habilidade ${skill.name} ainda não foi desbloqueada!` });
      return;
    }

    // Verifica se a habilidade está em recarga (cooldown)
    const activeCooldown = this.skillCooldowns[skillId] || 0;
    if (activeCooldown > 0) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Habilidade ${skill.name} em recarga! (${Math.ceil(activeCooldown / 1000)}s)` });
      return;
    }

    // Custo de mana dinâmico com base no nível requerido
    const manaCost = skillId === 'heal' ? 12 : (skillId === 'slash' ? 8 : (skillId === 'fireball' ? 15 : 10 + skill.requiredLevel * 1.5));
    if (this.playerMana < manaCost) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Mana insuficiente para ${skill.name}! (Requer ${Math.floor(manaCost)})` });
      return;
    }

    this.playerMana -= manaCost;

    // Registra o tempo de recarga
    const cooldownTime = skillId === 'heal' ? 10000 : (skill.requiredLevel <= 1 ? 6000 : (skill.requiredLevel <= 3 ? 10000 : (skill.requiredLevel <= 7 ? 16000 : 24000)));
    this.skillCooldowns[skillId] = cooldownTime;
    bridge.emit(GameEvent.COOLDOWNS_CHANGED, { cooldowns: { ...this.skillCooldowns } });

    if (skillId === 'heal' || skillId === 'holy_light') {
      // Restaura 30% do HP máximo, mais 5% a cada nível adicional
      const healAmount = Math.floor(this.playerMaxHP * (0.30 + (skillLvl - 1) * 0.05));
      this.playerHP = Math.min(this.playerMaxHP, this.playerHP + healAmount);
      this.scene.animateHealEffect();
      this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 30, `+${healAmount}`, '#10b981');
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Você usou ${skill.name}! Recuperou ${healAmount} de HP.` });
      return;
    }

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
    const damageBoost = 1 + (ascensionCount * 0.10); // +10% por ascensão

    // Escalamento baseado em multiplicadores reais das descrições das skills e no nível da habilidade
    let dmg = 0;
    if (skillId === 'smite_paladin') {
      // Dano misto: 250% da média de constituição e força (ou seja, 1.25x cada)
      const levelMultiplier = 1 + (skillLvl - 1) * 0.15;
      dmg = Math.floor((this.playerFinalStats.constitution * 1.25 + this.playerFinalStats.strength * 1.25) * levelMultiplier + Math.random() * 5);
      damageType = 'sagrado';
    } else {
      const baseMult = SKILL_BASE_MULTIPLIERS[skillId] || 1.0;
      const levelMultiplier = 1 + (skillLvl - 1) * 0.15;
      dmg = Math.floor(primaryStatVal * baseMult * levelMultiplier + Math.random() * 5);
    }

    dmg = Math.floor(dmg * damageBoost);

    // Se o Guerreiro desferir Executar em alvo com < 35% HP, causa 50% extra de dano
    if (skillId === 'execute' && (this.enemyHP / this.enemyMaxHP) < 0.35) {
      dmg = Math.floor(dmg * 1.5);
    }

    // Efeito do status EXPOSTO no dano final das habilidades
    const exposedEffect = this.enemyEffects.find(e => e.id === 'exposed');
    const exposedMultiplier = exposedEffect ? (1 + exposedEffect.value) : 1.0;
    dmg = Math.floor(dmg * exposedMultiplier);

    this.enemyHP = Math.max(0, this.enemyHP - dmg);

    // Determina os efeitos visuais e sonoros na cena dependendo da habilidade específica
    if (skillId === 'frostbolt') {
      if (typeof this.scene.animateFrostboltEffect === 'function') {
        this.scene.animateFrostboltEffect();
      } else {
        this.scene.animateFireballEffect();
      }
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `GELO: ${dmg}!`, '#38bdf8');
    } else if (skillId === 'lightning' || skillId === 'wrath_heaven' || skillId === 'divine_judgement') {
      if (typeof this.scene.animateLightningEffect === 'function') {
        this.scene.animateLightningEffect();
      } else {
        this.scene.animateFireballEffect();
      }
      const lightningColor = skillId === 'lightning' ? '#a855f7' : '#fbbf24';
      const lightningLabel = skillId === 'lightning' ? 'RAIO' : 'DIVINO';
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `${lightningLabel}: ${dmg}!`, lightningColor);
    } else if (skillId === 'meteor') {
      if (typeof this.scene.animateMeteorEffect === 'function') {
        this.scene.animateMeteorEffect();
      } else {
        this.scene.animateFireballEffect();
      }
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `METEORO: ${dmg}!`, '#ef4444');
    } else if (skillId === 'poison_arrow' || skillId === 'poison_dagger') {
      if (typeof this.scene.animatePoisonArrowEffect === 'function') {
        this.scene.animatePoisonArrowEffect();
      } else {
        this.scene.animateSlashEffect();
      }
      const toxColor = skillId === 'poison_arrow' ? '#22c55e' : '#c084fc';
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `TOXINA: ${dmg}!`, toxColor);
    } else if (skillId === 'consecration') {
      if (typeof this.scene.animateConsecrationEffect === 'function') {
        this.scene.animateConsecrationEffect();
      } else {
        this.scene.animateSlashEffect();
      }
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `SANTIFICADO: ${dmg}!`, '#fef08a');
    } else {
      if (skillClass === 'mage' || skillClass === 'cleric') {
        this.scene.animateFireballEffect();
        this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `${damageType.toUpperCase()}: ${dmg}!`, '#f97316');
      } else {
        this.scene.animateSlashEffect();
        this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `${damageType.toUpperCase()}: ${dmg}!`, '#f43f5e');
      }
    }

    // Aplicação dos efeitos de status após causar o dano
    if (skillId === 'shield_bash') {
      this.enemyEffects.push({
        id: 'stun',
        name: 'Atordoado',
        duration: 2000,
        tickTimer: 0,
        value: 0
      });
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 60, '[ATORDADO]', '#facc15');
    } else if (skillId === 'frostbolt') {
      this.enemyEffects.push({
        id: 'slow',
        name: 'Lentidão',
        duration: 4000,
        tickTimer: 0,
        value: 0.40
      });
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 60, '[LENTO]', '#93c5fd');
    } else if (skillId === 'fireball') {
      const burnDmg = Math.max(1, Math.floor(this.playerFinalStats.magic * 0.15));
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
        duration: 1500,
        tickTimer: 0,
        value: 0
      });
      const burnDmg = Math.max(1, Math.floor(this.playerFinalStats.magic * 0.15));
      this.enemyEffects.push({
        id: 'burn',
        name: 'Queimadura',
        duration: 5000,
        tickTimer: 1000,
        value: burnDmg
      });
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 60, '[ATORDADO & QUEIMADO]', '#ef4444');
    } else if (skillId === 'poison_arrow') {
      const poisonDmg = Math.max(1, Math.floor(this.playerFinalStats.dexterity * 0.20));
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
        duration: 5000,
        tickTimer: 0,
        value: 0.30
      });
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 60, '[ENFRAQUECIDO]', '#f87171');
    } else if (skillId === 'consecration') {
      const regenVal = Math.max(1, Math.floor(this.playerFinalStats.constitution * 0.15));
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
        duration: 5000,
        tickTimer: 0,
        value: 0.20
      });
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 60, '[EXPOSTO]', '#60a5fa');
    } else if (skillId === 'poison_dagger') {
      const poisonDmg = Math.max(1, Math.floor(this.playerFinalStats.dexterity * 0.25));
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

    bridge.emit(GameEvent.LOG_EMITTED, { message: `Você desferiu ${skill.name}! Dano: ${dmg}.` });

    if (this.enemyHP <= 0) {
      this.handleEnemyDefeat();
    }
  }

  private runAutoCastAI(): void {
    if (this.currentState === CombatState.DEAD) return;
    const char = this.characterData;
    if (!char || char.currentStage <= 5 || !char.autoCastEnabled) return;

    // Colecionar habilidades desbloqueadas do tipo ativo
    const activeSkills = char.unlockedSkills.filter((id: string) => {
      const sk = SKILLS_CATALOG[id];
      return sk && sk.type === 'active';
    });

    if (activeSkills.length === 0) return;

    // Ordenar por requiredLevel decrescente (priorizando habilidades de Tiers maiores)
    activeSkills.sort((a: string, b: string) => {
      const skA = SKILLS_CATALOG[a];
      const skB = SKILLS_CATALOG[b];
      return (skB?.requiredLevel || 0) - (skA?.requiredLevel || 0);
    });

    // Se 'heal' estiver liberado e a vida do jogador estiver abaixo de 50%, priorizar cura!
    const hpPercentage = (this.playerHP / this.playerMaxHP) * 100;
    if (hpPercentage < 50) {
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
      const manaCost = skillId === 'slash' ? 8 : (skillId === 'fireball' ? 15 : 10 + skill.requiredLevel * 1.5);

      if (cooldown <= 0 && this.playerMana >= manaCost) {
        this.triggerSkill(skillId);
        break; // Dispara uma única habilidade por verificação
      }
    }
  }
}
