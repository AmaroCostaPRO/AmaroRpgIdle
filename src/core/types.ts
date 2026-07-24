export const ENEMIES_PER_STAGE = 20;

// v10.0.0 "A Cidadela Submersa": imports só de tipos (apagados na compilação — sem ciclo em runtime).
import type { RuneId } from './runeFormulas';
import type { BaitType } from './abyssFormulas';

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
  dodgeChancePct?: number;
  reflectDamagePct?: number;
  // v10.0.0 "A Cidadela Submersa": chaves alimentadas pelas Runas Abissais (passo 4.7 do StatEngine).
  goldBonusPct?: number;   // Sol — bônus de ouro, consumido no cálculo de ouro do CombatFSM
  eliteDamagePct?: number; // Nix — dano vs. Elite/Chefe, consumido em damageEnemy
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
  consumableType?: 'chest_legendary' | 'chest_ancestral' | 'boost_touch' | 'boost_touch_x3' | 'unstable_soul_fragment' | 'relic_chest' | 'tower_key' | 'tower_key_evolved' | 'elixir_transcendental' | 'cristal_forja_eterna' | 'chave_fenda_temporal' | 'potion_damage' | 'potion_regen' | 'potion_speed' | 'potion_manaregen' | 'potion_robotclick';
  stage?: number;
  // v9.0.0 "O Que Espera no Pandemônio": Relíquia equipável ativa (slot `activeRelic`). Diferente do
  // equipamento normal, NÃO passa por fusão mística — a habilidade em si é fixa (`activeRelicId`,
  // ver ACTIVE_RELICS_CATALOG em CombatFSM.ts); só o parâmetro numérico daquela habilidade específica
  // (dano/cura/duração/etc., varia por relíquia) é rolado dentro de um range min/máx por raridade,
  // no mesmo espírito do roll de atributos do colar.
  activeRelicId?: string;
  activeRelicRolledValue?: number;
  // v10.0.0 "A Cidadela Submersa": Sistema de Soquetes. Só slots pesados (head/chest/legs/gloves/
  // weapon/ring) são perfuráveis, na Câmara de Gravação. `socketedRunes` é paralelo a `sockets`
  // (null = soquete vazio). A Fusão Mística preserva max(soquetes A, B) e devolve as runas do
  // Item B ao runeInventory. Campos opcionais — saves antigos não precisam de migração.
  sockets?: number;
  socketedRunes?: (RuneId | null)[];
  // v10.3.0 "O Coração do Abismo": Palavra Rúnica ativa (id de RUNEWORD_CATALOG). Gravada via
  // engraveRuneword — substitui a soma individual das runas engastadas no passo 4.7 do StatEngine
  // enquanto `socketedRunes` continuar batendo com a sequência exata da receita.
  activeRuneword?: string;
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
  materialDrops?: ('wood' | 'stone' | 'meat' | 'coral')[];
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

// v10.2.0 "Os Ecos Afogados": os 6 distritos da Cidadela Submersa (grade fixa 2×3, Anexo 2 §1.2).
export type DistrictId = 'dock' | 'echoHall' | 'forge' | 'archive' | 'temple' | 'throne';

// Cada distrito: Alagado (flooded=true) → Drenando (drainCompletesAt definido) → Drenado
// (flooded=false, restorationLevel 0) → Restaurado I/II/III (restorationLevel 1-3, compras
// instantâneas em Pérolas+Coral — só a drenagem em si tem timer, ver Anexo 2 §1.3).
export interface SunkenDistrictState {
  flooded: boolean;
  drainUpgrade?: { completesAt: number };
  restorationLevel: 0 | 1 | 2 | 3;
}

export type EchoVocation = 'fisher' | 'diver' | 'scribe' | 'warden';

// 12 traços do catálogo (Anexo 2 §1.6) — union fechado, valores/efeitos vivem em sunkenCitadelFormulas.ts.
export type EchoTraitId =
  | 'constant' | 'insomniac' | 'storyteller' | 'shy' | 'lowTideNostalgic' | 'stormChild'
  | 'echoTwin' | 'twoHanded' | 'ironMemory' | 'humanBeacon' | 'choirVoice' | 'brokenHeart';

export interface DrownedEcho {
  id: string;                 // `${rescuedAt}_${rescueIndex}` — a própria seed determinística
  name: string;
  vocation: EchoVocation;
  trait: EchoTraitId;
  assignedDistrict?: DistrictId;
  rescuedAt: number;
  brokenHeartHealsAt?: number; // só para o traço 'brokenHeart' (7 dias reais alocado sem realocar)
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
  claimed: boolean;
}

// v9.1.0: preparo de poção do Laboratório de Alquimia agora leva tempo (ver `ALCHEMY_BREW_DURATION_MS`)
// antes de entregar o rendimento no inventário, em vez de entrega instantânea.
export interface AlchemyPendingBrew {
  id: string;
  potionType: 'damage' | 'regen' | 'speed' | 'manaRegen' | 'robotClick';
  completesAt: number;
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
  // (dano/regeneração) — preparo manual sob demanda, com espera de `ALCHEMY_BREW_DURATION_MS`
  // (v9.1.0) antes da entrega automática ao inventário (ver `pendingBrews`).
  alchemyLab: CitadelBuildingState & { pendingBrews: AlchemyPendingBrew[] };
  // v9.0.0 "O Que Espera no Pandemônio": evolução do Bestiário em gerenciamento ativo —
  // contratos de caça rotativos (ver `HuntContract`), gerados de forma determinística por
  // janela de tempo (`getHuntContractRotationId`), iguais para todos os jogadores na mesma janela.
  huntSanctuary: CitadelBuildingState & { activeContracts: HuntContract[]; rotationId: number; bonusClaimedForRotation: boolean };
  // v10.0.0 "A Cidadela Submersa": Câmara de Gravação — ancora o Sistema de Soquetes/Runas.
  // Opcional para retrocompatibilidade de saves (injetada por mergeLoadedCharacter).
  engravingChamber?: CitadelBuildingState;
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
  // Encontro (fase:abates) em que o jogador já FUGIU do world boss da Convergência — mesmo espírito
  // de `resolvedMerchantEncounterKey`: sem essa marca, o sorteio determinístico reproduziria o
  // mesmo boss para sempre nesse slot exato (fugir não incrementa os abates).
  resolvedConvergenceEncounterKey?: string;
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
  speedUnlock3xPurchased?: boolean;
  totalXpEarned?: number; // Contador vitalício de XP bruto ganho, nunca decresce exceto na Ascensão.
  materials?: { wood: number; stone: number; meat: number; studyInsignias: number; coral?: number };
  citadel?: CitadelState;

  // ── v10.0.0 "A Cidadela Submersa" ──────────────────────────────────────────
  // Todos os campos abaixo são opcionais (saves antigos carregam sem migração; defaults injetados
  // por mergeLoadedCharacter). Regras de reset: Ascensão reduz Pérolas/Coral a 50% (retêm mais que
  // os materiais comuns, que caem a 2%, mas ainda cortados pela metade para não acumular sem limite)
  // e PRESERVA runeInventory/chaves/fragmentos/desbloqueios; Transcendência zera
  // runeInventory/Pérolas/Coral/chaves/fragmentos mas PRESERVA desbloqueios, recordes e o
  // contador vitalício de acertos perfeitos (construção de conta).
  pearls?: number;               // Pérola Abissal — a única moeda nova de gasto do update
  diveKeys?: number;             // Chaves de Mergulho (5 Fragmentos de Batisfera = 1 chave)
  batisphereFragments?: number;  // excedente ainda não convertido em chave
  runeInventory?: Partial<Record<RuneId, number>>; // runas soltas empilháveis, FORA do inventário físico
  // v10.3.0 "O Coração do Abismo": ids de RUNEWORD_CATALOG (runeFormulas.ts) já revelados —
  // Arquivo Submerso, marcos de Ecos, ou 1ª obtenção da runa primordial exigida pela receita.
  revealedRunewordIds?: string[];
  // Litoral Naufragado (desbloqueia ao completar a Fase 2)
  coastal?: {
    unlocked: boolean;
    dockLevel: number;           // Doca de Pesca, níveis 0–5 (0 = não construída)
    dockUpgrade?: { targetLevel: number; startedAt: number; completesAt: number };
    equippedBait: BaitType | null;
    baitInventory: { basic: number; glow: number; deep: number };
    passiveBuffer: number;       // capturas acumuladas na rede (coleta manual, padrão Torre de Vigia)
    lastFishTick: number;
    lastActiveFishAt?: number;   // cooldown da Pesca Ativa
    faroPerfectCatches: number;  // contador VITALÍCIO de acertos perfeitos (sobrevive a tudo)
    faroGranted?: boolean;       // Faro já foi concedida ao menos 1 vez (mantido por compatibilidade)
    faroGrantedCount?: number;   // quantas cópias de Faro já foram concedidas (a cada 100 acumulados)
    lifetimeCatches?: number;
    lifetimePearls?: number;
  };
  // Mergulhos Rasos / Profundezas (snapshot persistente; o runtime da descida vive no useDiveStore)
  abyss?: {
    unlocked: boolean;
    currentDepth: number;        // 0 = na superfície; >0 = descida pendente (resolvida no load como "subiu")
    historicalMaxDepth: number;
    breath: number;              // 0–100 (snapshot)
    divingSuitLevel: number;     // 0–10 (sem uso na 10.0.0 — Doca Batial chega na 10.2.0)
    bankedRewards: { pearls: number; coral: number; runes: Partial<Record<RuneId, number>> };
    firstGuardianKillDone?: boolean; // legado — alias de leitura de guardiansDefeated[1] (Thal)
    // v10.1.0 "As Profundezas": 1ª morte de cada Guardião de Zona (25/50/80) — garante a runa
    // primordial da zona (Thal/Vrak/Morvo) e libera o checkpoint de início na profundidade seguinte.
    guardiansDefeated?: Partial<Record<1 | 2 | 3, boolean>>;
    airPocketPearlBonus?: number;    // +25% de Pérolas escolhido em Bolsão (acumulado da descida)
    lifetimePearlsBanked?: number;
  };

  // v10.2.0 "Os Ecos Afogados": restauração da Cidadela Submersa (6 distritos) + simulação de
  // população (Ecos Afogados). Visível ao alcançar a Fase 50 (isFullDepthsUnlocked).
  // Sobrevive a Ascensão E Transcendência (construção de conta, como `citadel`) — só `tideBlessing`
  // zera na Transcendência (é "poder do ciclo", não infraestrutura).
  sunkenCitadel?: {
    districts: Partial<Record<DistrictId, SunkenDistrictState>>;
    echoes: DrownedEcho[];             // roster atual (cap 16; excedentes "descansam" sem produzir)
    echoesRescuedLifetime: number;     // contador vitalício (nunca decresce) — dispara marcos
    tideBlessing?: { id: string; expiresAt: number }; // escolhida no Templo da Maré durante Maré Alta
    // Restauração III do Templo: 2ª Bênção simultânea (pode repetir a mesma id do 1º slot, a 50%
    // de força — ver CombatFSM.getTideBlessingPower/useGameStore.tickSunkenCitadelProduction).
    secondTideBlessing?: { id: string; expiresAt: number };
    lastProductionTick?: number;       // relógio da produção periódica (Fragmentos da Doca/Pérolas do Arquivo)
    // v10.4.0 "O Leviatã do Ciclo": progresso semanal do chefe mundial (Trono Afundado restaurado).
    // Reset preguiçoso comparando `weekSeed` contra `getWeeklySeed()` (useTowerStore.ts) — mesmo
    // padrão de `checkWeeklyReset` da Torre.
    leviathanWeeklyProgress?: { weekSeed: number; phasesCleared: number; attemptsUsed: number };
  };
  leviathanKillCountLifetime?: number; // vitalício — determina recompensa de 1ª morte vs. repetição

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
  // v10.4.0 "O Leviatã do Ciclo"
  leviathanFastestFullClear?: number; // recorde: 1 (marca que já ocorreu numa única tentativa)
  leviathanCutsceneSeen?: boolean;    // dispara "O Coro e o Caco" só na 1ª morte do Leviatã

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
  SUNKEN_SUBTAB_REQUESTED = 'SUNKEN_SUBTAB_REQUESTED',
  SUNKEN_SUBTAB_CHANGED = 'SUNKEN_SUBTAB_CHANGED',
  SHOW_WELCOME_GUIDE = 'SHOW_WELCOME_GUIDE',
  MERCHANT_ENCOUNTERED = 'MERCHANT_ENCOUNTERED',
  // World boss da Convergência (quarta-feira): mesmo padrão do Mercador — pausa o combate e pede
  // uma decisão explícita do jogador via modal (Enfrentar/Fugir) em vez de entrar em luta direto.
  CONVERGENCE_ENCOUNTERED = 'CONVERGENCE_ENCOUNTERED',
  CONVERGENCE_ENGAGED = 'CONVERGENCE_ENGAGED',
  CONVERGENCE_DISMISSED = 'CONVERGENCE_DISMISSED',
  PET_CAPTURED = 'PET_CAPTURED',
  ELIXIR_ACTIVATED = 'ELIXIR_ACTIVATED',
  ALCHEMY_POTION_ACTIVATED = 'ALCHEMY_POTION_ACTIVATED',

  // v10.0.0 "A Cidadela Submersa": eventos dos Mergulhos Rasos (Phaser ↔ React)
  DIVE_STARTED = 'DIVE_STARTED',
  DIVE_ENDED = 'DIVE_ENDED',
  DEPTH_CHANGED = 'DEPTH_CHANGED',
  BREATH_CHANGED = 'BREATH_CHANGED',
  AIR_POCKET_OPENED = 'AIR_POCKET_OPENED',
  AIR_POCKET_RESOLVED = 'AIR_POCKET_RESOLVED',
  TIDE_CHANGED = 'TIDE_CHANGED',
  ECHO_RESCUED = 'ECHO_RESCUED',

  // v10.4.0 "O Leviatã do Ciclo": chefe mundial semanal (Trono Afundado)
  LEVIATHAN_PHASE_CHANGED = 'LEVIATHAN_PHASE_CHANGED',
  LEVIATHAN_CHANNEL_STARTED = 'LEVIATHAN_CHANNEL_STARTED',
  LEVIATHAN_CHANNEL_INTERRUPTED = 'LEVIATHAN_CHANNEL_INTERRUPTED',
  CUTSCENE_TRIGGERED = 'CUTSCENE_TRIGGERED',
  RUNEWORD_COMPLETED = 'RUNEWORD_COMPLETED'
}

export interface GameEventPayload {
  [key: string]: any;
}
