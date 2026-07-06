export const ENEMIES_PER_STAGE = 15;

export interface BaseStats {
  strength: number;
  magic: number;
  dexterity: number;
  constitution: number;
  luck: number;
  touch: number;
  touchCritChance: number;
  touchCritDamage: number;
  robotClicks: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  slot: 'head' | 'chest' | 'legs' | 'gloves' | 'weapon' | 'consumable';
  classId: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mystic' | 'consumable';
  stats: Partial<BaseStats>;
  setName?: string;
  spriteName: string;
  mysticLevel?: number;
  consumableType?: 'chest_legendary' | 'chest_ancestral' | 'boost_touch' | 'boost_touch_x3' | 'unstable_soul_fragment' | 'relic_chest' | 'tower_key';
  stage?: number;
}

export interface EnemyType {
  id: string;
  name: string;
  texture: string;
  hpMultiplier: number;
  damageMultiplier: number;
  attackSpeedMultiplier: number;
  xpValue: number;
  color: string;
  flipX?: boolean;
  yOffset?: number;
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  maxLevel: number;
  dependencies: string[];
  type: 'active' | 'passive';
  statBonuses?: Partial<BaseStats>;
  requiredLevel: number; // Nível necessário para liberar
  classId: string; // classe associada ('warrior', 'mage', 'ranger', 'paladin', 'cleric', 'rogue' ou 'common')
  isUltimate?: boolean;
}

export interface PrestigeUpgradeNode {
  id: string;
  name: string;
  description: string;
  cost: number; // custo em pontos de prestígio
  level: number;
  maxLevel: number;
  statBonus: Partial<BaseStats>;
}

export interface Character {
  id: string;
  classId: string;
  level: number;
  xp: number;
  gold: number;
  baseStats: BaseStats;
  growthRates: BaseStats;
  unlockedSkills: string[];
  skillLevels: Record<string, number>;
  prestigePoints: number;
  prestigeUpgrades: Record<string, number>; // upgradeId -> level
  ascensionCount: number;
  attributePoints: number;
  skillPoints: number; // pontos para a árvore de habilidades
  highestStageReached: number;
  currentStage: number; // Fase ativa do combate (ex: Fase 1)
  enemiesDefeatedInStage: number; // Inimigos normais derrotados na fase (0 a 15)
  classLevels: Record<string, number>; // Maior nível alcançado em cada classe
  autoCastEnabled: boolean; // Indica se o auto-ataque de habilidades está ligado
  autoCastHealPercent?: number; // Porcentagem de HP para cura automática
  autoCastDisabledSkills?: string[]; // Habilidades desativadas na conjuração automática
  killCount?: Record<string, number>; // Abates por monstro
  lastSaved?: string; // Data e hora do último salvamento
  equipment: Record<'head' | 'chest' | 'legs' | 'gloves' | 'weapon', EquipmentItem | null>;
  inventory: EquipmentItem[];
  inventorySlots: number;
  pandemoniumUnlocked?: boolean;
  activePandemonium?: boolean;
  testMode?: boolean;
  introLoreShown?: boolean;
  lastCompletedDailyChallenge?: string;
  activeDailyChallenge?: boolean;
  runStartTime?: number;
  purgatoryCompleted?: boolean;
  forgeFragments?: number;
  ascensionNotified?: boolean;
}

export enum GameEvent {
  // Command Events (React -> Phaser)
  ACTION_TRIGGERED = 'ACTION_TRIGGERED',
  EQUIP_SKILL = 'EQUIP_SKILL',
  START_COMBAT = 'START_COMBAT',
  END_COMBAT = 'END_COMBAT',
  TOGGLE_AUTOCAST = 'TOGGLE_AUTOCAST',

  // Feedback Events (Phaser -> React / HUD)
  PLAYER_HP_CHANGED = 'PLAYER_HP_CHANGED',
  PLAYER_MANA_CHANGED = 'PLAYER_MANA_CHANGED',
  LOG_EMITTED = 'LOG_EMITTED',
  ENEMY_DEFEATED = 'ENEMY_DEFEATED',
  STAGE_COMPLETED = 'STAGE_COMPLETED',
  COOLDOWNS_CHANGED = 'COOLDOWNS_CHANGED',
  ARENA_READY = 'ARENA_READY',
  COMBO_STATE_CHANGED = 'COMBO_STATE_CHANGED',
  FRENZY_STATE_CHANGED = 'FRENZY_STATE_CHANGED',
  RECORD_BROKEN = 'RECORD_BROKEN',
  CLASS_UNLOCKED = 'CLASS_UNLOCKED',
  BESTIARY_COMPLETED = 'BESTIARY_COMPLETED',
  ASCENSION_AVAILABLE = 'ASCENSION_AVAILABLE',
  ITEM_DROPPED = 'ITEM_DROPPED'
}

export interface GameEventPayload {
  [key: string]: any;
}
