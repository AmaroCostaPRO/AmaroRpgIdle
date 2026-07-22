// v10.0.0 "A Cidadela Submersa" — Fórmulas do Litoral Naufragado (pesca) e dos Mergulhos Rasos.
// v10.1.0 "As Profundezas": estende o mesmo módulo para as 4 zonas completas (Pressão, Fatores
// de Zona, Guardiões 2/3, Runas Tier III). Módulo puro compartilhado store ↔ UI ↔ CombatFSM
// (mesmo padrão de citadelFormulas.ts).
//
// ÂNCORA HÍBRIDA (decisão explícita da 10.1.0, ver Balanceamento §1.1 vs. Design 10.0.0 §3.A):
//   • Enquanto o personagem NÃO alcançou a Fase 50 (`!isFullDepthsUnlocked`), a descida continua
//     usando a âncora DINÂMICA da 10.0.0 (maior fase do jogador) e fica tetada na prof. 25, SEM
//     Pressão — os Mergulhos Rasos originais ficam intocados para quem ainda está subindo.
//   • Ao alcançar highestStageReached >= 50, a MESMA descida passa a usar a âncora FIXA na Fase 50
//     (`FULL_DIVE_ANCHOR_STAGE`), habilita a Pressão e libera as Zonas 2–4 — uma "graduação" de
//     personagem, não um segundo modo paralelo.
//   • O Traje de Mergulho (`divingSuitLevel`) fica em 0 nesta versão (upgrade chega na 10.2.0 com
//     a Doca Batial) — as fórmulas abaixo já recebem o parâmetro para não exigir retrabalho depois.

import type { RuneId } from './runeFormulas';

// ─── Fórmulas de campanha (espelho exato de CombatFSM.setupEnemyForLevel / enemyAttack) ──────────

// Multiplicador de dificuldade por faixa de fase (CombatFSM.ts — hpBoost/dmgBoost):
// Normal 1.0 | Pesadelo(6+) 2.0 | Inferno(11+) 3.0 | Apocalipse(16+) 4.0 | Purgatório(21+) 5.0 | Pandemônio(31+) 6.0
export const getCampaignTierBoost = (stage: number): number =>
  stage >= 31 ? 6.0 : stage >= 21 ? 5.0 : stage >= 16 ? 4.0 : stage >= 11 ? 3.0 : stage >= 6 ? 2.0 : 1.0;

// HP do inimigo comum (hpMultiplier 1.0, sem Lua de Sangue): (150 + fase×50) × 1.30^(fase−1) × tier
export const getCampaignCommonEnemyHP = (stage: number): number =>
  (150 + stage * 50) * Math.pow(1.30, stage - 1) * getCampaignTierBoost(stage);

// Dano por golpe do inimigo comum (determinístico, sem o ruído aleatório de ±2 do FSM):
// (10 + fase×4) × 1.18^(fase−1) × tier
export const getCampaignCommonEnemyDamage = (stage: number): number =>
  (10 + stage * 4.0) * Math.pow(1.18, stage - 1) * getCampaignTierBoost(stage);

// ─── Mergulhos Rasos: estrutura ──────────────────────────────────────────────

export const SHALLOW_DIVE_MAX_DEPTH = 25;   // teto PRÉ-F50 (Mergulhos Rasos, âncora dinâmica)
export const AIR_POCKET_INTERVAL = 5;       // a cada 5 profundidades, um Bolsão de Ar (sem combate)
export const GUARDIAN_DEPTH = 25;           // Aracnídeo do Recife (legado — usar ZONE_GUARDIANS)
export const GUARDIAN_HP_MULT = 6.0;
export const GUARDIAN_DMG_MULT = 1.8;
export const GUARDIAN_SHIELD_PCT = 0.20;    // escudo de 20% do HP máx...
export const GUARDIAN_SHIELD_REBUILD_MS = 15000; // ...que se refaz a cada 15s
export const GUARDIAN_PEARL_REWARD = 25;

// Âncora dinâmica: nunca abaixo da Fase 6 (piso pós-1ª Ascensão). Usada enquanto o personagem
// não alcançou a Fase 50 (ver getEffectiveAnchorStage).
export const getDiveAnchorStage = (highestStageReached: number): number =>
  Math.max(6, highestStageReached || 6);

// ─── As Profundezas (10.1.0): zonas, âncora híbrida e Pressão ────────────────

export type DiveZone = 1 | 2 | 3 | 4;

// Fase 50 é o mesmo marco/gate da Transcendência (Design §5.A) — ao alcançá-la, a descida
// "gradua" da âncora dinâmica para a âncora fixa e libera Pressão + Zonas 2–4.
export const FULL_DIVE_ANCHOR_STAGE = 50;
export const isFullDepthsUnlocked = (highestStageReached: number): boolean =>
  (highestStageReached || 0) >= FULL_DIVE_ANCHOR_STAGE;

// Âncora efetiva: fixa em F50 pós-graduação, dinâmica antes disso. Esta é a função que
// CombatFSM/useDiveStore devem usar (getDiveAnchorStage fica só para o caso dinâmico puro).
export const getEffectiveAnchorStage = (highestStageReached: number): number =>
  isFullDepthsUnlocked(highestStageReached)
    ? FULL_DIVE_ANCHOR_STAGE
    : getDiveAnchorStage(highestStageReached);

export const getZoneForDepth = (depth: number): DiveZone =>
  depth <= 25 ? 1 : depth <= 50 ? 2 : depth <= 80 ? 3 : 4;

export const ZONE_INFO: Record<DiveZone, { name: string; color: string }> = {
  1: { name: 'Recife Partido', color: '#22d3ee' },
  2: { name: 'Bosque de Algas Negras', color: '#4d7c0f' },
  3: { name: 'Ruínas da Cidadela', color: '#7c3aed' },
  4: { name: 'Fossa do Caco', color: '#0c4a6e' },
};

// Fatores de Zona — análogo direto do Fator Tier da campanha (Balanceamento §1.2).
export const ZONE_FACTORS: Record<DiveZone, { hp: number; dmg: number }> = {
  1: { hp: 1.00, dmg: 1.00 },
  2: { hp: 1.25, dmg: 1.15 },
  3: { hp: 1.60, dmg: 1.35 },
  4: { hp: 2.00, dmg: 1.60 },
};

export const getDiveEnemyHP = (depth: number, anchorStage: number, enemyHpMult: number = 1.0): number =>
  Math.floor(
    getCampaignCommonEnemyHP(anchorStage) * 0.5 * Math.pow(1.14, depth - 1) *
    ZONE_FACTORS[getZoneForDepth(depth)].hp * enemyHpMult
  );

export const getDiveEnemyDamage = (depth: number, anchorStage: number, enemyDmgMult: number = 1.0): number =>
  Math.floor(
    getCampaignCommonEnemyDamage(anchorStage) * 0.6 * Math.pow(1.085, depth - 1) *
    ZONE_FACTORS[getZoneForDepth(depth)].dmg * enemyDmgMult
  );

// Pressão: multiplica o dano RECEBIDO pelo herói, aplicada DEPOIS da redução por Constituição
// (decisão deliberada do Anexo §1.4 — é a única fonte de dano do jogo que atravessa o cap de 95%,
// o que dá ao Traje de Mergulho um nicho que nenhum equipamento invade). Só se aplica pós-F50
// (isFullDepthsUnlocked) — os Mergulhos Rasos pré-F50 continuam sem Pressão.
// `divingSuitLevel` fica em 0 nesta versão (upgrade chega na 10.2.0 com a Doca Batial).
export const getPressureMultiplier = (depth: number, divingSuitLevel: number = 0): number =>
  1 + 0.04 * depth * (1 - 0.06 * divingSuitLevel);

// ─── Guardiões de Zona (25 / 50 / 80) ────────────────────────────────────────

export interface ZoneGuardianDef {
  zone: 1 | 2 | 3;
  depth: number;
  enemyId: string;
  name: string;
  hpMult: number;
  dmgMult: number;
  pearlReward: number;
  primordialRuneId: RuneId; // garantida na 1ª morte (10%+ depois, ver Balanceamento §2.2)
}

export const ZONE_GUARDIANS: ZoneGuardianDef[] = [
  { zone: 1, depth: 25, enemyId: 'boss_reef_arachnid', name: 'Aracnídeo do Recife', hpMult: 6.0, dmgMult: 1.8, pearlReward: 25, primordialRuneId: 'thal' },
  { zone: 2, depth: 50, enemyId: 'boss_kelp_thing', name: 'A Coisa Entre as Algas', hpMult: 6.0, dmgMult: 1.8, pearlReward: 50, primordialRuneId: 'vrak' },
  { zone: 3, depth: 80, enemyId: 'boss_drowned_castellan', name: 'O Castelão Afundado', hpMult: 6.0, dmgMult: 1.8, pearlReward: 100, primordialRuneId: 'morvo' },
];

export const getGuardianForDepth = (depth: number): ZoneGuardianDef | undefined =>
  ZONE_GUARDIANS.find(g => g.depth === depth);

export const isGuardianDepth = (depth: number): boolean => !!getGuardianForDepth(depth);

// Checkpoints: vencer um Guardião libera começar a próxima descida na profundidade seguinte
// (26/51/81) por 2 Chaves de Mergulho em vez de 1 (Balanceamento §1.6) — evita recorredor do
// zero a cada tentativa nas zonas mais fundas.
export const CHECKPOINT_START_DEPTHS: number[] = [1, 26, 51, 81];
export const getDiveKeyCost = (startDepth: number): number => (startDepth > 1 ? 2 : 1);

// ─── Besitário das Profundezas (16 monstros, 4 por zona) ────────────────────
// Pools de ids de EnemyType (definidos em CombatFSM.ts, ENEMY_TYPES) sorteados por
// setupDiveEncounter() dentro da zona da profundidade atual (mesmo padrão do sorteio
// determinístico dos spawns alternativos do Litoral). Guardiões ficam FORA do pool comum
// (ver ZONE_GUARDIANS/isGuardianDepth) — são encontros fixos na profundidade exata.
export const DIVE_ZONE_ENEMY_POOL: Record<DiveZone, string[]> = {
  // Zona 1 (10.0.0): 3 nativos das profundezas + 2 aquáticos do Litoral reaproveitados.
  1: ['grudge_puffer', 'reef_shark', 'hungry_anemone', 'drift_jelly', 'slime_moray'],
  2: ['kelp_strangler', 'mirror_octopus', 'gloom_angler'],
  3: ['guardian_echo', 'salt_mourner', 'barnacle_knight'],
  4: ['dark_breather', 'trench_serpent', 'false_light', 'leviathan_spawn'],
};

// Minibosses raros dentro do próprio pool da zona (spawn alternativo de baixa chance, mesmo
// padrão do Eco Afogado no Litoral — 2%). Só a Zona 4 tem um: Prole do Leviatã, 5% de chance.
export const ZONE4_MINIBOSS_CHANCE = 0.05;
export const ZONE4_MINIBOSS_ID = 'leviathan_spawn';

// ─── Mergulhos Rasos: Fôlego e recompensas ───────────────────────────────────

// Dreno de Fôlego em FRAÇÃO/segundo (0.8%/s base, −4%/nível de Traje). NÃO escala com profundidade
// — é um relógio de sessão, não de poder (Design principal §5.B). O consumo DEVE usar o deltaTime
// já multiplicado pela velocidade do jogo (CombatFSM.update) — nunca Date.now() — para que 2x/3x
// alcancem a MESMA profundidade por descida (QA obrigatório do Anexo, §1.8).
export const getBreathDrainPerSecond = (depth: number, divingSuitLevel: number = 0): number =>
  0.008 * (1 - 0.04 * divingSuitLevel);

export const DROWNING_DAMAGE_MULT = 2.0;    // Afogamento (Fôlego 0): dano recebido ×2, regen HP zero

// Pérolas bancadas por profundidade concluída.
export const getPearlsForDepth = (depth: number): number => 1 + Math.floor(depth / 10);

// v10.4.0 "O Leviatã do Ciclo": 6 títulos honoríficos das Profundezas (Design principal §5.D),
// concedidos por recorde histórico de profundidade — mesma infraestrutura de títulos da Torre
// (`useTowerStore.unlockTitle`), chamada de `useDiveStore.completeDepth`.
export const PROFUNDEZAS_TITLE_MILESTONES: Record<number, string> = {
  10: 'Molhado de Coragem',
  25: 'Vencedor do Recife Partido',
  50: 'Sobrevivente das Algas Negras',
  80: 'Andarilho das Ruínas Afundadas',
  120: 'Peregrino da Fossa do Caco',
  200: 'O Que Voltou do Fundo',
};

// Runas: 8% fixo por abate, SEM influência de Sorte (padrão da rolagem separada do Colar).
export const DIVE_RUNE_DROP_CHANCE = 0.08;

// Coral por abate: 1 em Z1–Z2, 2 em Z3–Z4 (Balanceamento §1.7).
export const getCoralPerKill = (zone: DiveZone): number => (zone <= 2 ? 1 : 2);
export const DIVE_CORAL_PER_KILL = 1; // legado (Zona 1) — preferir getCoralPerKill(zone)

// Frações mantidas das recompensas não-bancadas ao encerrar a descida.
export const DIVE_SURFACE_KEEP_FRACTION = 1.0;   // subir voluntariamente
export const DIVE_DEATH_KEEP_FRACTION = 0.75;    // morte "limpa" (com Fôlego): −25%
export const DIVE_DROWNED_KEEP_FRACTION = 0.5;   // morte afogada: −50%

// Bolsão de Ar — as três escolhas (estrutura do painel do Mercador Ambulante).
export type AirPocketChoice = 'breath' | 'rune' | 'pearls';
export const AIR_POCKET_BREATH_RESTORE = 0.60;   // +60% de Fôlego (cap 100%)
export const AIR_POCKET_PEARL_BONUS = 0.25;      // +25% de Pérolas na descida (multiplicador ao bancar)

const RUNE_FAMILY_ORDER = ['ur', 'kar', 'sol', 'vin', 'mar', 'nix', 'lum', 'dol', 'fen'] as const;

// Distribuição de tier por zona ao rolar uma runa base (Balanceamento §1.7): [T1, T2, T3].
export const ZONE_RUNE_TIER_WEIGHTS: Record<DiveZone, [number, number, number]> = {
  1: [1.00, 0.00, 0.00],
  2: [0.70, 0.30, 0.00],
  3: [0.50, 0.45, 0.05],
  4: [0.20, 0.55, 0.25],
};

// Runa base aleatória, tier sorteado pela distribuição da zona, família uniforme entre as 9.
export const rollRuneForZone = (zone: DiveZone, tierRoll: number, familyRoll: number): RuneId => {
  const weights = ZONE_RUNE_TIER_WEIGHTS[zone];
  let acc = 0;
  let tier = 1;
  for (let t = 0; t < 3; t++) {
    acc += weights[t];
    if (tierRoll < acc) { tier = t + 1; break; }
  }
  const idx = Math.min(RUNE_FAMILY_ORDER.length - 1, Math.floor(familyRoll * RUNE_FAMILY_ORDER.length));
  return `${RUNE_FAMILY_ORDER[idx]}_t${tier}` as RuneId;
};

// Runa T1 aleatória (legado — Zona 1: 100% Tier I) — sorteio uniforme entre as 9 famílias.
export const rollTier1Rune = (roll: number): RuneId => rollRuneForZone(1, 0, roll);

// ─── Litoral: Pesca Abissal ──────────────────────────────────────────────────

export const COASTAL_UNLOCK_STAGE = 3; // "completar a Fase 2" = highestStageReached >= 3

export type BaitType = 'basic' | 'glow' | 'deep';
export type FishingCatchId = 'lantern_fish' | 'living_coral' | 'abyssal_pearl' | 'soaked_rune_t1' | 'bathysphere_fragment';

export interface BaitDefinition {
  id: BaitType;
  name: string;
  icon: string;
  meatCost: number;   // custo em Carne por LOTE de BAIT_BATCH_SIZE iscas
  bias: string;       // texto do viés de captura para a UI
}

export const BAIT_BATCH_SIZE = 10;

// Nota de economia early-game: Carne só dropa pós-1ª Ascensão, mas o Peixe-Lanterna converte em
// Carne (1:3) — a pesca SEM isca rende só capturas comuns (peixe/coral), fechando o ciclo:
// peixe → Carne → isca → capturas raras. Nenhum jogador trava.
export const BAIT_DEFINITIONS: Record<BaitType, BaitDefinition> = {
  basic: { id: 'basic', name: 'Isca de Carne',   icon: '🪱', meatCost: 50,  bias: 'Equilibrada — abre as capturas raras' },
  glow:  { id: 'glow',  name: 'Isca Luminosa',   icon: '✨', meatCost: 200, bias: 'Atrai Pérolas Abissais e Runas' },
  deep:  { id: 'deep',  name: 'Isca Abissal',    icon: '🪝', meatCost: 500, bias: 'Atrai Fragmentos de Batisfera e Coral' },
};

export interface FishingTableEntry { id: FishingCatchId; weight: number }

// Pesos de captura por isca (null = sem isca: só comuns).
export const getFishingTable = (bait: BaitType | null): FishingTableEntry[] => {
  switch (bait) {
    case 'basic': return [
      { id: 'lantern_fish', weight: 50 }, { id: 'living_coral', weight: 34 },
      { id: 'abyssal_pearl', weight: 9 }, { id: 'soaked_rune_t1', weight: 5 },
      { id: 'bathysphere_fragment', weight: 2 },
    ];
    case 'glow': return [
      { id: 'lantern_fish', weight: 38 }, { id: 'living_coral', weight: 28 },
      { id: 'abyssal_pearl', weight: 18 }, { id: 'soaked_rune_t1', weight: 12 },
      { id: 'bathysphere_fragment', weight: 4 },
    ];
    case 'deep': return [
      { id: 'lantern_fish', weight: 40 }, { id: 'living_coral', weight: 38 },
      { id: 'abyssal_pearl', weight: 8 }, { id: 'soaked_rune_t1', weight: 6 },
      { id: 'bathysphere_fragment', weight: 8 },
    ];
    default: return [
      { id: 'lantern_fish', weight: 70 }, { id: 'living_coral', weight: 30 },
    ];
  }
};

export const LANTERN_FISH_MEAT_YIELD = 3;      // Peixe-Lanterna → Carne (conversão 1:3)
export const BATHYSPHERE_FRAGMENTS_PER_KEY = 5; // 5 Fragmentos = 1 Chave de Mergulho

// Rendimento passivo: Capturas/hora = (2 + ⌊FaseMáx × 0.1⌋) × (1 + NívelDoca × 0.15)
export const getPassiveCatchesPerHour = (highestStageReached: number, dockLevel: number): number =>
  (2 + Math.floor((highestStageReached || 1) * 0.1)) * (1 + (dockLevel || 0) * 0.15);

// Buffer da rede (padrão da Torre de Vigia: produção pausa com o buffer cheio; coleta manual).
export const getFishingBufferCap = (dockLevel: number): number => 10 + (dockLevel || 0) * 8;

// ─── Litoral: Doca de Pesca (construção, níveis 1–5) ─────────────────────────
// Custos em Ouro + Carne (deliberado: madeira/pedra são pós-Ascensão e a Doca é early game).

export const COASTAL_DOCK_MAX_LEVEL = 5;

export const getCoastalDockUpgradeCost = (nextLevel: number): { gold: number; meat: number } => ({
  gold: Math.round(2500 * Math.pow(2.2, nextLevel - 1)),
  meat: Math.round(40 * Math.pow(1.6, nextLevel - 1)),
});

// Duração da melhoria: nextLevel horas (mesmo padrão de getStructureUpgradeDurationMs da Cidadela).
export const getCoastalDockUpgradeDurationMs = (nextLevel: number): number =>
  nextLevel * 60 * 60 * 1000;

// ─── Litoral: Pesca Ativa ────────────────────────────────────────────────────

export type ActiveFishingQuality = 'miss' | 'hit' | 'perfect';
export const ACTIVE_FISHING_COOLDOWN_MS = 15000;  // intervalo entre puxadas ativas (base)
// v10.4.0 "O Leviatã do Ciclo": Maré Viva (sexta-feira) deixa a pesca ativa 2× mais frequente —
// checagem de dia da semana local (mesmo padrão de `getTideCycleMs` em sunkenCitadelFormulas.ts).
export const getActiveFishingCooldownMs = (): number =>
  new Date().getDay() === 5 ? ACTIVE_FISHING_COOLDOWN_MS / 2 : ACTIVE_FISHING_COOLDOWN_MS;
export const FARO_PERFECT_CATCHES_REQUIRED = 100; // acertos perfeitos p/ a Runa Primordial Faro
