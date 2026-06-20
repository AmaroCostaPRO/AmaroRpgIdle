import { GameEvent, EnemyType } from './types';
import { bridge } from '../bridge/GameBridge';
import { useGameStore, SKILLS_CATALOG } from '../store/useGameStore';

export const ENEMY_TYPES: EnemyType[] = [
  {
    id: 'orc',
    name: 'Guerreiro Orc',
    texture: 'enemy_orc',
    hpMultiplier: 1.0,
    damageMultiplier: 1.0,
    attackSpeedMultiplier: 1.0,
    xpValue: 35,
    color: '#f87171',
    flipX: false,
    yOffset: 0
  },
  {
    id: 'goblin',
    name: 'Goblin Ladino',
    texture: 'enemy_goblin',
    hpMultiplier: 0.75,
    damageMultiplier: 0.85,
    attackSpeedMultiplier: 1.35,
    xpValue: 25,
    color: '#4ade80',
    flipX: true,
    yOffset: 15
  },
  {
    id: 'skeleton',
    name: 'Esqueleto Guerreiro',
    texture: 'enemy_skeleton',
    hpMultiplier: 1.25,
    damageMultiplier: 1.15,
    attackSpeedMultiplier: 0.9,
    xpValue: 45,
    color: '#a1a1aa',
    flipX: false,
    yOffset: 0
  },
  {
    id: 'necromancer',
    name: 'Necromante Sombrio',
    texture: 'enemy_necromancer',
    hpMultiplier: 2.2,
    damageMultiplier: 1.6,
    attackSpeedMultiplier: 0.8,
    xpValue: 90,
    color: '#c084fc',
    flipX: true,
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

  constructor(scene: any, initialTarget?: any) {
    this.scene = scene;
    this.target = initialTarget;
    
    const char = useGameStore.getState().character;
    this.setupEnemyForLevel(char.currentStage, char.enemiesDefeatedInStage);
    this.updateStatsFromStore();

    useGameStore.subscribe(() => {
      this.updateStatsFromStore();
    });
  }

  private setupEnemyForLevel(stage: number, defeatedInStage: number): void {
    this.enemyLevel = stage;
    const isBoss = defeatedInStage === 10;
    const isNightmare = stage >= 6;
    const hpBoost = isNightmare ? 2.5 : 1.0;

    if (isBoss) {
      // 11º Inimigo da fase: BOSS Necromancer
      this.currentEnemy = ENEMY_TYPES.find(e => e.id === 'necromancer') || ENEMY_TYPES[0];
      this.enemyMaxHP = Math.floor((100 + (stage * 35)) * this.currentEnemy.hpMultiplier * 3.0 * hpBoost);
      this.enemyHP = this.enemyMaxHP;
      console.log(`[CombatFSM] BOSS Necromante Spawned. MaxHP: ${this.enemyMaxHP} (Pesadelo: ${isNightmare})`);
    } else {
      // Inimigos comuns 1-10
      const commonEnemies = ENEMY_TYPES.filter(e => e.id !== 'necromancer');
      const randIndex = (stage + defeatedInStage) % commonEnemies.length;
      this.currentEnemy = commonEnemies[randIndex];
      this.enemyMaxHP = Math.floor((100 + (stage * 20)) * this.currentEnemy.hpMultiplier * hpBoost);
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

    this.cooldownEmitTimer += delta;
    if (this.cooldownEmitTimer >= 250) {
      this.cooldownEmitTimer = 0;
      bridge.emit(GameEvent.COOLDOWNS_CHANGED, { cooldowns: { ...this.skillCooldowns } });
    }

    // Executar Auto-Cast
    this.autoCastTimer += delta;
    if (this.autoCastTimer >= 300) {
      this.autoCastTimer = 0;
      this.runAutoCastAI();
    }

    bridge.emit(GameEvent.PLAYER_HP_CHANGED, { current: Math.floor((this.playerHP / this.playerMaxHP) * 100) });
    bridge.emit(GameEvent.PLAYER_MANA_CHANGED, { current: Math.floor((this.playerMana / this.playerMaxMana) * 100) });

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
      if (distance > 300) {
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
    if (distance <= 300) {
      this.currentState = CombatState.ATTACKING;
      this.scene.resetPlayerPosition();
    }
  }

  private handleAttacking(delta: number): void {
    const distance = this.getDistanceToTarget();
    if (distance > 320) {
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
    this.attackCooldown = Math.max(400, 1500 / speedMultiplier);

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
    const baseCooldown = 1800 - (this.enemyLevel * 15);
    this.enemyAttackCooldown = Math.max(500, baseCooldown / this.currentEnemy.attackSpeedMultiplier);

    const isNightmare = this.enemyLevel >= 6;
    const dmgBoost = isNightmare ? 2.5 : 1.0;
    const damage = Math.floor((5 + this.enemyLevel * 1.5 + Math.random() * 2) * this.currentEnemy.damageMultiplier * dmgBoost);

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
    const isBoss = char.enemiesDefeatedInStage === 10;

    const baseGainedXp = this.currentEnemy.xpValue + Math.floor(char.currentStage * 2.0);
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

      const enemyName = nextChar.enemiesDefeatedInStage === 10 ? `CHEFE ${this.currentEnemy.name}` : this.currentEnemy.name;
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
