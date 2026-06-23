import { GameEvent, EnemyType, ENEMIES_PER_STAGE } from './types';
import { bridge } from '../bridge/GameBridge';
import { useGameStore, SKILLS_CATALOG } from '../store/useGameStore';

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

export class CombatFSM {
  private currentState: CombatState = CombatState.IDLE;
  public characterData: any;
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
    this.enemyLevel = stage;
    const isBoss = defeatedInStage === ENEMIES_PER_STAGE;
    const isNightmare = stage >= 6;
    const hpBoost = isNightmare ? 2.5 : 1.0;
    const theme = ((stage - 1) % 5) + 1;

    // Escala de dificuldade exponencial para tornar fases progressivamente mais difíceis
    const difficultyScale = Math.pow(1.45, stage - 1);

    if (isBoss) {
      let bossId = 'boss_forest_golem';
      if (theme === 2) bossId = 'boss_sand_scorpion';
      else if (theme === 3) bossId = 'boss_frost_dragon';
      else if (theme === 4) bossId = 'boss_necromancer';
      else if (theme === 5) bossId = 'boss_archdemon';

      this.currentEnemy = ENEMY_TYPES.find(e => e.id === bossId) || ENEMY_TYPES[0];
      this.enemyMaxHP = Math.floor((120 + (stage * 40)) * difficultyScale * this.currentEnemy.hpMultiplier * 3.0 * hpBoost);
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
      this.enemyMaxHP = Math.floor((100 + (stage * 25)) * difficultyScale * this.currentEnemy.hpMultiplier * hpBoost);
      this.enemyHP = this.enemyMaxHP;
    }
  }

  private updateStatsFromStore() {
    const char = useGameStore.getState().character;
    this.characterData = char;

    const prevMaxHP = this.playerMaxHP;
    this.playerMaxHP = char.baseStats.constitution * 12;

    if (this.playerMaxHP > prevMaxHP) {
      this.playerHP += (this.playerMaxHP - prevMaxHP);
    }
    this.playerHP = Math.min(this.playerHP, this.playerMaxHP);

    const prevMaxMana = this.playerMaxMana;
    this.playerMaxMana = char.baseStats.magic * 10;
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
    if (this.enemyAttackCooldown > 0) this.enemyAttackCooldown -= delta;

    // Recuperação de HP/Mana baseada em atributos
    this.playerHP = Math.min(this.playerMaxHP, this.playerHP + (this.characterData.baseStats.constitution * 0.05 * (delta / 1000)));
    this.playerMana = Math.min(this.playerMaxMana, this.playerMana + (this.characterData.baseStats.magic * 0.05 * (delta / 1000)));

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

    if (this.attackCooldown <= 0 && this.enemyHP > 0) {
      this.performPlayerAttack();
    }

    if (this.enemyAttackCooldown <= 0 && this.playerHP > 0 && this.enemyHP > 0) {
      this.performEnemyAttack();
    }
  }

  private performPlayerAttack() {
    const speedMultiplier = 1 + (this.characterData.baseStats.dexterity * 0.02);
    this.attackCooldown = Math.max(800, 3000 / speedMultiplier);

    // Escala de Dano baseado no Atributo Principal da Classe ativa
    const classId = this.characterData.classId || 'warrior';
    let primaryStatVal = this.characterData.baseStats.strength;
    let damageType = 'físico';

    if (classId === 'mage' || classId === 'cleric') {
      primaryStatVal = this.characterData.baseStats.magic;
      damageType = 'mágico';
    } else if (classId === 'ranger' || classId === 'rogue') {
      primaryStatVal = this.characterData.baseStats.dexterity;
      damageType = 'de perfuração';
    } else if (classId === 'paladin') {
      primaryStatVal = this.characterData.baseStats.constitution;
      damageType = 'sagrado';
    }

    const damage = Math.floor(primaryStatVal * 1.5 + Math.random() * 3);

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
    const damage = Math.floor((5 + this.enemyLevel * 2.0 + Math.random() * 2) * dmgScale * this.currentEnemy.damageMultiplier * dmgBoost);

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

    if (isBoss) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Chefe ${this.currentEnemy.name} derrotado! Você avançou para a Fase ${char.currentStage + 1} e ganhou +${gainedXp} XP!` });
    } else {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `${this.currentEnemy.name} derrotado! Você ganhou +${gainedXp} XP!` });
    }

    useGameStore.getState().addXp(gainedXp);

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
    const cooldownTime = skillId === 'heal' ? 10000 : (skill.requiredLevel <= 1 ? 3000 : (skill.requiredLevel <= 3 ? 5000 : (skill.requiredLevel <= 7 ? 8000 : 12000)));
    this.skillCooldowns[skillId] = cooldownTime;
    bridge.emit(GameEvent.COOLDOWNS_CHANGED, { cooldowns: { ...this.skillCooldowns } });

    if (skillId === 'heal' || skillId === 'holy_light') {
      const healAmount = Math.floor(this.characterData.baseStats.magic * 3 + 12 * skillLvl);
      this.playerHP = Math.min(this.playerMaxHP, this.playerHP + healAmount);
      this.scene.animateHealEffect();
      this.scene.spawnDamageText(this.scene.getPlayerX(), this.scene.getPlayerY() - 30, `+${healAmount}`, '#10b981');
      bridge.emit(GameEvent.LOG_EMITTED, { message: `Você usou ${skill.name}! Recuperou ${healAmount} de HP.` });
      return;
    }

    // Dano das habilidades ativas baseado no atributo principal
    const classId = this.characterData.classId || 'warrior';
    let primaryStatVal = this.characterData.baseStats.strength;
    let damageType = 'golpe';

    if (classId === 'mage' || classId === 'cleric') {
      primaryStatVal = this.characterData.baseStats.magic;
      damageType = 'mágico';
    } else if (classId === 'ranger' || classId === 'rogue') {
      primaryStatVal = this.characterData.baseStats.dexterity;
      damageType = 'perfurante';
    } else if (classId === 'paladin') {
      primaryStatVal = this.characterData.baseStats.constitution;
      damageType = 'punidor';
    }

    // Escalamento baseado em tier (requiredLevel) e nível da skill
    const damageMultiplier = 1.0 + (skill.requiredLevel * 0.25) + (skillLvl * 0.15);
    const dmg = Math.floor(primaryStatVal * damageMultiplier + Math.random() * 5);

    this.enemyHP = Math.max(0, this.enemyHP - dmg);

    // Determina a animação apropriada
    if (classId === 'mage' || classId === 'cleric') {
      this.scene.animateFireballEffect();
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `${damageType.toUpperCase()}: ${dmg}!`, '#f97316');
    } else {
      this.scene.animateSlashEffect();
      this.scene.spawnDamageText(this.scene.getEnemyX(), this.scene.getEnemyY() - 30, `${damageType.toUpperCase()}: ${dmg}!`, '#f43f5e');
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
