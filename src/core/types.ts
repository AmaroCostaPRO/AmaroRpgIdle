export const ENEMIES_PER_STAGE = 20;

export interface BaseStats {
  strength: number;
  magic: number;
  dexterity: number;
  constitution: number;
  luck: number;
  touch: number;
  critChance: number;
  critDamage: number;
  robotClicks: number;
  lifesteal?: number;
  touchDamageMult?: number;
  damageMultiplierPct?: number;
  maxHpPct?: number;
  attackSpeedPct?: number;
  maxManaPct?: number;
  dropChancePct?: number;
  damageReductionPct?: number;
  frenzyChancePct?: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  slot: 'head' | 'chest' | 'legs' | 'gloves' | 'weapon' | 'necklace' | 'amulet' | 'ring' | 'consumable' | 'activeRelic';
  classId: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mystic' | 'consumable';
  stats: Partial<BaseStats>;
  setName?: string;
  spriteName: string;
  mysticLevel?: number;
  consumableType?: 'chest_legendary' | 'chest_ancestral' | 'boost_touch' | 'boost_touch_x3' | 'unstable_soul_fragment' | 'relic_chest' | 'tower_key' | 'tower_key_evolved' | 'elixir_transcendental' | 'cristal_forja_eterna' | 'chave_fenda_temporal' | 'potion_damage' | 'potion_regen';
  stage?: number;
  // v9.0.0 "O Que Espera no Pandemônio": Relíquia equipável ativa (slot `activeRelic`). Diferente do
  // equipamento normal, NÃO passa por fusão mística — a habilidade em si é fixa (`activeRelicId`,
  // ver ACTIVE_RELICS_CATALOG em CombatFSM.ts); só o parâmetro numérico daquela habilidade específica
  // (dano/cura/duração/etc., varia por relíquia) é rolado dentro de um range min/máx por raridade,
  // no mesmo espírito do roll de atributos do colar.
  activeRelicId?: string;
  activeRelicRolledValue?: number;
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
  materialDrops?: ('wood' | 'stone' | 'meat')[];
}

// Companheiro/Pet capturável (v7.0.0 "Ecos que Despertam") — puramente passivo e voador,
// sem lógica de ataque própria. `texture` é placeholder até a arte final ser fornecida.
export interface PetDefinition {
  id: string;
  name: string;
  texture: string;
  bonusType: 'xp' | 'gold';
  bonusPct: number; // ex: 0.05 = +5%
}

export const PET_POOL: PetDefinition[] = [
  { id: 'sprite_lumen', name: 'Sprite Lumen', texture: 'pet_sprite_lumen', bonusType: 'xp', bonusPct: 0.05 },
  { id: 'moeda_alada', name: 'Moeda Alada', texture: 'pet_moeda_alada', bonusType: 'gold', bonusPct: 0.05 }
];

export interface CitadelBuildingState {
  level: number;
  lastTick: number; // Timestamp Unix do último processamento (fundação para produção offline em v5.2+)
  // Upgrade de estrutura em andamento (tempo real, resolvido em tickCitadelProduction, inclusive offline)
  upgradeInProgress?: { targetLevel: number; startedAt: number; completesAt: number };
}

// v9.0.0 "O Que Espera no Pandemônio": contrato rotativo do Santuário de Contratos de Caça —
// "derrote N do inimigo X" com contador próprio, separado do `killCount` vitalício do Bestiário
// (que continua alimentando `StatEngine.calculateBestiaryDamageMultiplier` sem nenhuma mudança).
export interface HuntContract {
  id: string;
  enemyId: string;
  requiredKills: number;
  currentKills: number;
  rewardMaterial: 'wood' | 'stone' | 'meat' | 'studyInsignias';
  rewardAmount: number;
  goldReward: number;
  claimed: boolean;
}

export interface CitadelState {
  unlocked: boolean;
  commandCenter: CitadelBuildingState;
  vault: CitadelBuildingState & { storedItems: EquipmentItem[] };
  expeditions: CitadelBuildingState & { allocatedClasses: { classId: string; slotIndex: number; characterName: string; expiresAt: number }[] };
  academy: CitadelBuildingState & {
    researchDmgLevel: number;
    researchHpLevel: number;
    researchSpeedLevel: number;
    researchTouchDmgLevel: number;
    researchCritDmgLevel: number;
    researchTowerKeyLevel: number;
    researchSoulFragmentLevel: number;
  };
  watchTower: CitadelBuildingState & { storedKeys: number };
  forgeWorkshop: CitadelBuildingState;
  cosmicSiphon: CitadelBuildingState;
  synchronyAltar: CitadelBuildingState;
  relicLab: CitadelBuildingState & { overheatedRelicIds: string[] };
  // v8.0.0 "O Espelho Faminto": destila materiais das Expedições em poções de efeito temporário
  // (dano/regeneração) — preparo manual sob demanda, sem produção automática por tick.
  alchemyLab: CitadelBuildingState;
  // v9.0.0 "O Que Espera no Pandemônio": evolução do Bestiário em gerenciamento ativo —
  // contratos de caça rotativos (ver `HuntContract`), gerados de forma determinística por
  // janela de tempo (`getHuntContractRotationId`), iguais para todos os jogadores na mesma janela.
  huntSanctuary: CitadelBuildingState & { activeContracts: HuntContract[]; rotationId: number; bonusClaimedForRotation: boolean };
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
  name: string;
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
  currentStage: number; // Fase active do combate (ex: Fase 1)
  enemiesDefeatedInStage: number; // Inimigos normais derrotados na fase (0 a 20)
  classLevels: Record<string, number>; // Maior nível alcançado em cada classe
  autoCastEnabled: boolean; // Indica se o auto-ataque de habilidades está ligado
  autoCastHealPercent?: number; // Porcentagem de HP para cura automática
  autoCastDisabledSkills?: string[]; // Habilidades desativadas na conjuração automática
  killCount?: Record<string, number>; // Abates por monstro
  lastSaved?: string; // Data e hora do último salvamento
  saveVersion?: number; // Versão do formato do save, usada para futuras migrações
  equipment: Record<'head' | 'chest' | 'legs' | 'gloves' | 'weapon' | 'necklace' | 'amulet' | 'ring' | 'activeRelic', EquipmentItem | null>;
  inventory: EquipmentItem[];
  inventorySlots: number;
  // v7.0.0 "Ecos que Despertam": Companheiro/Pet capturável — puramente passivo, sem lógica de
  // ataque própria; concede o bônus definido em PET_POOL enquanto ativo. Zerado na Ascensão
  // (conteúdo de early game, não deve persistir além do primeiro reset de progressão).
  activePet?: { id: string; capturedAt: number };
  // v7.0.0 "Ecos que Despertam": chave "fase:abates" do último encontro do Mercador Ambulante já
  // dispensado (fechado pelo jogador) — usada por CombatFSM.setupEnemyForLevel para não sortear o
  // Mercador de novo para o MESMO encontro (o abate não muda ao fechar a loja, então sem essa marca
  // persistida o sorteio determinístico de Elite/Mercador reproduziria o mesmo resultado para sempre,
  // travando o jogador num loop da loja do Mercador).
  resolvedMerchantEncounterKey?: string;
  // v9.0.0 "O Que Espera no Pandemônio": última semana (`getWeeklySeed()`, useTowerStore.ts) em
  // que o world boss da Convergência já se manifestou — impede que ele apareça mais de uma vez na
  // mesma quarta-feira, já que a seed semanal só muda no próximo reset (mesmo espírito de
  // `resolvedMerchantEncounterKey` acima, mas por semana em vez de por encontro).
  resolvedConvergenceWeekSeed?: number;
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
  transcendencePoints?: number;
  transcendenceUpgrades?: Record<string, number>;
  lifetimePrestigePointsAccumulated?: number;
  transcendenceCount?: number;
  transcendenceLoreShown?: boolean;
  activeEcoterra?: boolean;
  transcendenceEssence?: number;
  totalXpEarned?: number; // Contador vitalício de XP bruto ganho, nunca decresce exceto na Ascensão.
  materials?: { wood: number; stone: number; meat: number; studyInsignias: number };
  citadel?: CitadelState;

  // Estatísticas completas: recordes de combate (nunca decrescem)
  bestDamageDealt?: number;
  bestMaxHP?: number;
  bestCritChance?: number;
  bestDropChancePct?: number;
  bestDamageReductionPct?: number;
  bestAttackSpeedMultiplier?: number;
  bestDodgeChance?: number;

  // Estatísticas completas: acumuladores vitalícios de progressão
  totalEnemiesKilledLifetime?: number;
  totalEquipmentDropped?: number;
  totalFragmentsDropped?: number;
  totalTowerKeysDropped?: number;
  fastestAscensionSeconds?: number; // undefined = nenhuma ascensão completa ainda

  // Estatísticas completas: economia e cidadela
  totalForgeFragmentsSpent?: number;
  totalGoldSpentInForge?: number;
  totalGoldEarnedLifetime?: number;
  totalXpEarnedLifetime?: number; // Diferente de totalXpEarned: nunca reseta na Ascensão
  totalMaterialsFarmedByCitadel?: { wood: number; stone: number; meat: number; studyInsignias: number };
}

export enum GameEvent {
  // Command Events (React -> Phaser)
  ACTION_TRIGGERED = 'ACTION_TRIGGERED',
  EQUIP_SKILL = 'EQUIP_SKILL',
  TRIGGER_ACTIVE_RELIC = 'TRIGGER_ACTIVE_RELIC',
  ACTIVE_BUFFS_CHANGED = 'ACTIVE_BUFFS_CHANGED',
  START_COMBAT = 'START_COMBAT',
  END_COMBAT = 'END_COMBAT',
  TOGGLE_AUTOCAST = 'TOGGLE_AUTOCAST',
  MERCHANT_DISMISSED = 'MERCHANT_DISMISSED',

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
  CITADEL_BUILDING_UPGRADED = 'CITADEL_BUILDING_UPGRADED',
  ITEM_DROPPED = 'ITEM_DROPPED',
  TAB_CHANGED = 'TAB_CHANGED',
  CITADEL_SUBTAB_REQUESTED = 'CITADEL_SUBTAB_REQUESTED',
  CITADEL_SUBTAB_CHANGED = 'CITADEL_SUBTAB_CHANGED',
  SHOW_WELCOME_GUIDE = 'SHOW_WELCOME_GUIDE',
  MERCHANT_ENCOUNTERED = 'MERCHANT_ENCOUNTERED',
  PET_CAPTURED = 'PET_CAPTURED',
  ELIXIR_ACTIVATED = 'ELIXIR_ACTIVATED',
  ALCHEMY_POTION_ACTIVATED = 'ALCHEMY_POTION_ACTIVATED'
}

export interface GameEventPayload {
  [key: string]: any;
}
