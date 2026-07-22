// v10.0.0 "A Cidadela Submersa" — Catálogo de Runas Abissais e regras do Sistema de Soquetes.
// Módulo compartilhado store ↔ UI ↔ StatEngine (mesmo padrão de citadelFormulas.ts): toda a
// itemização de runas vive aqui — valores FIXOS por tier (zero RNG no efeito, o oposto proposital
// do Colar), caps por família, custos de perfuração/fusão/extração e helpers de compatibilidade.
//
// Arquitetura do catálogo (Anexo de Balanceamento, Parte 2):
//   • 9 famílias base (Ur/Kar/Sol/Vin/Mar/Nix/Lum/Dol/Fen), cada uma em Tier I/II/III → ids `familia_tN`.
//   • 9 Runas Primordiais (tier único, fonte fixa, não-fundíveis, 1 por soquete no personagem inteiro).
// Nesta versão (10.0.0) apenas Tier I–II dropam (Litoral + Mergulhos Rasos) e as primordiais
// obteníveis são Thal (Guardião do Recife, prof. 25) e Faro (100 acertos perfeitos na Pesca Ativa).
// Os efeitos SECUNDÁRIOS de T3 e os efeitos condicionais das primordiais ficam CADASTRADOS no
// catálogo (`secondaryDesc`/`secondaryFlag`) mas ainda NÃO são consumidos pelo combate — os
// condicionais entram na 10.1.0+ junto das Profundezas completas. Exceções já numéricas e ativas
// no passo 4.7 do StatEngine: Thal (+12% red. / −8% vel.), Ecoh (+4% atributos primários) e
// Morvo (+1% dano a cada 10 profundidades do recorde, cap +40%).

import type { BaseStats, EquipmentItem } from './types';

// ─── Identidade ──────────────────────────────────────────────────────────────

export type RuneFamilyId = 'ur' | 'kar' | 'sol' | 'vin' | 'mar' | 'nix' | 'lum' | 'dol' | 'fen';
export type RuneTier = 1 | 2 | 3;
export type BaseRuneId = `${RuneFamilyId}_t${RuneTier}`;
export type PrimordialRuneId = 'thal' | 'nereh' | 'vrak' | 'ciss' | 'morvo' | 'ecoh' | 'faro' | 'levh' | 'umbra';
export type RuneId = BaseRuneId | PrimordialRuneId;

export interface RuneDefinition {
  id: RuneId;
  name: string;
  glyph: string;   // glifo Unicode renderizado via CSS (sem arte nesta fase — Anexo 3, §1.6)
  color: string;   // cor da família para o fundo do ícone
  family?: RuneFamilyId;          // ausente nas primordiais
  tier: RuneTier | 'primordial';
  // Efeito primário somado no passo 4.7 do StatEngine (mesmas chaves que Colar/Academia alimentam).
  statKey?: keyof BaseStats;
  value?: number;
  // Primordiais com mais de um stat numérico direto (ex.: Thal) usam extraStats em vez de statKey.
  extraStats?: Partial<BaseStats>;
  secondaryDesc?: string;  // texto do efeito secundário (T3/primordial) exibido na UI
  secondaryFlag?: string;  // flag para consumo futuro pelo CombatFSM (10.1.0+) — NÃO consumida na 10.0.0
  primordialSource?: string;
}

// ─── Famílias base ───────────────────────────────────────────────────────────

interface RuneFamilyDef {
  name: string;
  glyph: string;
  color: string;
  statKey: keyof BaseStats;
  values: [number, number, number]; // Tier I / II / III
  cap: number;                      // cap por família (aplicado ANTES dos caps globais)
  t3SecondaryDesc: string;
  t3SecondaryFlag: string;
}

export const RUNE_FAMILIES: Record<RuneFamilyId, RuneFamilyDef> = {
  ur:  { name: 'Ur — Sangue',   glyph: 'ᚢ', color: '#dc2626', statKey: 'lifesteal',           values: [0.02, 0.035, 0.05],  cap: 0.12, t3SecondaryDesc: 'Curas de Lifesteal podem criticar',                              t3SecondaryFlag: 'ur_crit_lifesteal' },
  kar: { name: 'Kar — Fúria',   glyph: 'ᚲ', color: '#ea580c', statKey: 'damageMultiplierPct', values: [0.04, 0.07, 0.11],   cap: 0.30, t3SecondaryDesc: '+3% adicionais enquanto HP > 80%',                              t3SecondaryFlag: 'kar_high_hp_bonus' },
  sol: { name: 'Sol — Fortuna', glyph: 'ᛋ', color: '#eab308', statKey: 'goldBonusPct',        values: [0.03, 0.06, 0.10],   cap: 0.30, t3SecondaryDesc: '+1% de chance de Ouro em dobro',                                t3SecondaryFlag: 'sol_double_gold' },
  vin: { name: 'Vin — Vigor',   glyph: 'ᚹ', color: '#16a34a', statKey: 'maxHpPct',            values: [0.05, 0.09, 0.14],   cap: 0.35, t3SecondaryDesc: '+0.5% do HP máx. de regeneração ao matar um inimigo',           t3SecondaryFlag: 'vin_kill_regen' },
  mar: { name: 'Mar — Maré',    glyph: 'ᛗ', color: '#2563eb', statKey: 'maxManaPct',          values: [0.04, 0.07, 0.11],   cap: 0.30, t3SecondaryDesc: 'Custo de mana −5% relativo',                                    t3SecondaryFlag: 'mar_mana_discount' },
  nix: { name: 'Nix — Vazio',   glyph: 'ᚾ', color: '#9333ea', statKey: 'eliteDamagePct',      values: [0.03, 0.06, 0.10],   cap: 0.25, t3SecondaryDesc: 'Elites morrem soltando +1 Pérola (só nas Profundezas)',         t3SecondaryFlag: 'nix_elite_pearl' },
  lum: { name: 'Lum — Eco',     glyph: 'ᛚ', color: '#e5e7eb', statKey: 'attackSpeedPct',      values: [0.02, 0.035, 0.05],  cap: 0.12, t3SecondaryDesc: 'O 1º ataque de cada combate é sempre crítico',                  t3SecondaryFlag: 'lum_first_crit' },
  dol: { name: 'Dol — Pressão', glyph: 'ᛞ', color: '#374151', statKey: 'damageReductionPct',  values: [0.02, 0.035, 0.05],  cap: 0.12, t3SecondaryDesc: 'Imunidade a [ENCHARCADO]',                                      t3SecondaryFlag: 'dol_soaked_immunity' },
  fen: { name: 'Fen — Caça',    glyph: 'ᚠ', color: '#92400e', statKey: 'dropChancePct',       values: [0.02, 0.04, 0.06],   cap: 0.15, t3SecondaryDesc: '+2% de chance de drop de runa (8%→10%)',                        t3SecondaryFlag: 'fen_rune_drop' },
};

export const RUNE_FAMILY_IDS = Object.keys(RUNE_FAMILIES) as RuneFamilyId[];

// Cap somado por família (fração), aplicado no passo 4.7 ANTES dos caps globais do jogo
// (95% red. de dano, 75% esquiva, 50% drop etc., que continuam sendo a última palavra no CombatFSM).
export const RUNE_FAMILY_CAPS: Record<RuneFamilyId, number> =
  Object.fromEntries(RUNE_FAMILY_IDS.map(f => [f, RUNE_FAMILIES[f].cap])) as Record<RuneFamilyId, number>;

// ─── Catálogo completo (18 ids) ──────────────────────────────────────────────

const buildBaseRunes = (): Record<BaseRuneId, RuneDefinition> => {
  const out = {} as Record<BaseRuneId, RuneDefinition>;
  const tierLabel = ['I', 'II', 'III'];
  for (const family of RUNE_FAMILY_IDS) {
    const def = RUNE_FAMILIES[family];
    for (const tier of [1, 2, 3] as RuneTier[]) {
      const id = `${family}_t${tier}` as BaseRuneId;
      out[id] = {
        id,
        name: `${def.name.split(' — ')[0]} ${tierLabel[tier - 1]}`,
        glyph: def.glyph,
        color: def.color,
        family,
        tier,
        statKey: def.statKey,
        value: def.values[tier - 1],
        ...(tier === 3 ? { secondaryDesc: def.t3SecondaryDesc, secondaryFlag: def.t3SecondaryFlag } : {}),
      };
    }
  }
  return out;
};

// Primordiais: tier único, 1 por soquete NO PERSONAGEM INTEIRO (não empilham consigo mesmas),
// sem fusão; extração sempre preserva (custo próprio, ver EXTRACT_PRIMORDIAL_COST_PEARLS).
const PRIMORDIAL_RUNES: Record<PrimordialRuneId, RuneDefinition> = {
  thal: {
    id: 'thal', name: 'Thal, a Âncora', glyph: '🜲', color: '#64748b', tier: 'primordial',
    extraStats: { damageReductionPct: 0.12, attackSpeedPct: -0.08 },
    secondaryDesc: '+12% Redução de Dano; −8% Velocidade de Ataque',
    primordialSource: 'Guardião do Recife (prof. 25) — garantida na 1ª morte',
  },
  nereh: {
    id: 'nereh', name: 'Nereh, a Maré Primeira', glyph: '🜄', color: '#0ea5e9', tier: 'primordial',
    secondaryDesc: 'Durante a Maré Alta: habilidades custam 0 de mana. Fora dela: −10% de custo',
    secondaryFlag: 'nereh_tide_mana', primordialSource: 'Comprada no Templo da Maré (Restauração I+, 200 Pérolas)',
  },
  vrak: {
    id: 'vrak', name: 'Vrak, Ossos do Naufrágio', glyph: '🜚', color: '#f59e0b', tier: 'primordial',
    secondaryDesc: '+18% Dano Geral; você sofre recuo de 2% do dano que causa',
    secondaryFlag: 'vrak_recoil', primordialSource: 'Guardião das Algas (prof. 50)',
  },
  ciss: {
    id: 'ciss', name: 'Ciss, o Sal Eterno', glyph: '🝆', color: '#a5f3fc', tier: 'primordial',
    secondaryDesc: 'Imune a [ENCHARCADO]; ataques básicos aplicam [ENCHARCADO] no inimigo',
    secondaryFlag: 'ciss_salt', primordialSource: 'Carpideira do Sal (Zona 3)',
  },
  morvo: {
    id: 'morvo', name: 'Morvo, a Fossa', glyph: '🜃', color: '#365314', tier: 'primordial',
    secondaryDesc: '+1% Dano Geral a cada 10 profundidades do recorde histórico (cap +40%)',
    secondaryFlag: 'morvo_depth_power', primordialSource: 'Guardião das Ruínas (prof. 80)',
  },
  ecoh: {
    id: 'ecoh', name: 'Ecoh, a Voz Afogada', glyph: '🝮', color: '#818cf8', tier: 'primordial',
    secondaryDesc: '+4% em todos os atributos primários',
    primordialSource: 'Resgatar o 12º Eco Afogado',
  },
  faro: {
    id: 'faro', name: 'Faro, Lúmen Abissal', glyph: '🜠', color: '#fde047', tier: 'primordial',
    secondaryDesc: '+10% de chance de um drop subir 1 raridade',
    secondaryFlag: 'faro_rarity_up', primordialSource: '100 acertos perfeitos na Pesca Ativa',
  },
  levh: {
    id: 'levh', name: 'Levh, Coração do Leviatã', glyph: '🝓', color: '#0f766e', tier: 'primordial',
    secondaryDesc: 'A cada 60s de combate, ganha um escudo de 15% do HP máx.',
    secondaryFlag: 'levh_shield', primordialSource: 'O Leviatã do Ciclo',
  },
  umbra: {
    id: 'umbra', name: 'Umbra, o Abismo', glyph: '🜏', color: '#1e1b4b', tier: 'primordial',
    secondaryDesc: 'DoTs causam dano dobrado em alvos acima de 50% de HP',
    secondaryFlag: 'umbra_dot_amp', primordialSource: 'Fossa prof. 100+',
  },
};

export const RUNE_CATALOG: Record<RuneId, RuneDefinition> = { ...buildBaseRunes(), ...PRIMORDIAL_RUNES };

export const isPrimordialRune = (id: RuneId): id is PrimordialRuneId => RUNE_CATALOG[id]?.tier === 'primordial';

// v10.4.0: runa base de tier GARANTIDO (família uniforme entre as 9) — usado pelas recompensas de
// fase do Leviatã do Ciclo, que prometem "+1 Runa T2"/"+1 Runa T3" sem depender da distribuição
// por zona de `rollRuneForZone` (abyssFormulas.ts).
export const rollRuneOfTier = (tier: RuneTier, familyRoll: number): BaseRuneId => {
  const idx = Math.min(RUNE_FAMILY_IDS.length - 1, Math.floor(familyRoll * RUNE_FAMILY_IDS.length));
  return `${RUNE_FAMILY_IDS[idx]}_t${tier}` as BaseRuneId;
};

// ─── Regras de soquete ───────────────────────────────────────────────────────

export const MAX_SOCKETS_PER_ITEM = 3;

// Slots "pesados" — os únicos perfuráveis (Colar/Amuleto/Relíquia Ativa preservam suas
// identidades de passivos utilitários / habilidade ativa; ver Design principal, §4.B).
export const HEAVY_SLOTS = ['head', 'chest', 'legs', 'gloves', 'weapon', 'ring'] as const;
export const isHeavySlot = (slot: EquipmentItem['slot']): boolean =>
  (HEAVY_SLOTS as readonly string[]).includes(slot);

// Perfuração: custo por soquete (1º/2º/3º/4º) em Pérolas Abissais + Ouro. O 4º só é alcançável na
// arma com o bônus de 3 peças do Set Abissal (v10.3.0, ver sunkenCitadelFormulas.ts).
export const DRILL_SOCKET_COSTS: { pearls: number; gold: number }[] = [
  { pearls: 10, gold: 100_000 },
  { pearls: 40, gold: 1_000_000 },
  { pearls: 150, gold: 10_000_000 },
  { pearls: 400, gold: 50_000_000 },
];

// Teto de soquetes por slot conforme o nível da Câmara de Gravação:
//   N1: perfurar ARMAS (1 soquete) | N2: peitorais (1) + remoção destrutiva | N3: 2º soquete em
//   armas + perfurar QUALQUER slot pesado | N4: extração intacta + fusão 3→1 | N5: 3º soquete em
//   armas/peitorais/cabeça + Palavras Rúnicas.
// Slots pesados fora de arma/peito/cabeça ficam com teto menor (2 na N5) — nenhuma Palavra Rúnica
// desta versão exige mais que isso em pernas/mãos/anel.
// v10.3.0: `hasAbyssalSet3pc` adiciona +1 soquete na ARMA acima do teto normal (até 4) — bônus de
// 3 peças do Set Abissal (StatEngine.ts, categoria "Set Abissal").
export const getMaxSocketsForSlot = (slot: EquipmentItem['slot'], chamberLevel: number, hasAbyssalSet3pc: boolean = false): number => {
  if (!isHeavySlot(slot)) return 0;
  if (slot === 'weapon') {
    const base = chamberLevel >= 5 ? 3 : chamberLevel >= 3 ? 2 : chamberLevel >= 1 ? 1 : 0;
    return hasAbyssalSet3pc ? Math.min(4, base + 1) : base;
  }
  if (slot === 'chest' || slot === 'head') return chamberLevel >= 5 ? 3 : chamberLevel >= 3 ? 2 : chamberLevel >= 2 ? 1 : 0;
  return chamberLevel >= 5 ? 2 : chamberLevel >= 3 ? 1 : 0;
};

// ─── Fusão / extração (Câmara de Gravação N4) ───────────────────────────────

// Fusão 3→1: três runas idênticas do mesmo tier viram 1 do tier acima (primordiais não fundem).
export const RUNE_FUSE_COST_PEARLS: Record<1 | 2, number> = { 1: 5, 2: 15 };
export const RUNE_FUSE_INPUT_COUNT = 3;

export const EXTRACT_RUNE_COST_PEARLS = 10;            // extração intacta de runa base (N4)
export const EXTRACT_PRIMORDIAL_COST_PEARLS = 25;      // primordiais: extração sempre preserva

export const getFusedRuneId = (id: RuneId): RuneId | null => {
  const def = RUNE_CATALOG[id];
  if (!def || def.tier === 'primordial' || def.tier === 3 || !def.family) return null;
  return `${def.family}_t${(def.tier + 1) as RuneTier}` as RuneId;
};

// ─── Helpers de leitura ──────────────────────────────────────────────────────

// Todas as runas engastadas em um conjunto de itens (para o "1 primordial por personagem").
export const listSocketedRunes = (items: (EquipmentItem | null | undefined)[]): RuneId[] => {
  const out: RuneId[] = [];
  for (const item of items) {
    if (!item?.socketedRunes) continue;
    for (const rune of item.socketedRunes) if (rune) out.push(rune);
  }
  return out;
};

export const itemHasSocketedRunes = (item: EquipmentItem | null | undefined): boolean =>
  !!item?.socketedRunes && item.socketedRunes.some(r => r !== null && r !== undefined);

// v10.1.0: checagem genérica de secondaryFlag em qualquer item equipado (usado fora do CombatFSM,
// ex.: útil para checagens de sistemas que não têm acesso à instância do FSM, como useDiveStore).
export const hasEquippedRuneFlag = (
  equipment: Record<string, EquipmentItem | null | undefined> | undefined,
  flag: string
): boolean => {
  if (!equipment) return false;
  return listSocketedRunes(Object.values(equipment)).some(runeId => RUNE_CATALOG[runeId]?.secondaryFlag === flag);
};

// ─── v10.3.0 "O Coração do Abismo": Palavras Rúnicas ─────────────────────────
//
// Engastar uma SEQUÊNCIA EXATA de runas (ordem importa) transforma os bônus individuais num
// efeito único nomeado. Diferente de soquetes normais: gravar é uma AÇÃO explícita
// (`engraveRuneword` em useGameStore.ts) que consome as runas exatas do `runeInventory` — não
// detecção passiva de coincidência. `statBonuses` são somados no passo 4.7 do StatEngine (em vez
// da soma individual das runas); `secondaryFlag` é consumido no CombatFSM, mesmo padrão dos
// efeitos condicionais de runas T3/primordiais. CORAÇÃO DO LEVIATÃ (v10.4.0) exige a arma do Set
// Abissal com 4 soquetes — a receita só revela na 1ª morte do Leviatã (`useGameStore.killLeviathan`).
export interface RunewordDefinition {
  id: string;
  name: string;
  sequence: RuneId[];               // ordem exata, índice = posição do soquete
  requiredSlot: EquipmentItem['slot'] | 'any';
  effectDesc: string;
  statBonuses?: Partial<BaseStats>; // parte fixa somada no passo 4.7 (opcional)
  secondaryFlag?: string;           // efeito condicional consumido no CombatFSM
  requiresAbyssalWeapon4Sockets?: boolean; // v10.4.0: CORAÇÃO DO LEVIATÃ
  fixedEngraveCost?: number;               // sobrescreve o custo padrão de 50/150 Pérolas
}

export const RUNEWORD_CATALOG: RunewordDefinition[] = [
  {
    id: 'mare_viva', name: 'MARÉ VIVA', sequence: ['mar_t1', 'vin_t1', 'mar_t1'], requiredSlot: 'any',
    effectDesc: 'Ao usar uma habilidade, 15% de chance de resetar o cooldown da Cura.',
    secondaryFlag: 'rw_mare_viva',
  },
  {
    id: 'fome_abismo', name: 'FOME DO ABISMO', sequence: ['ur_t1', 'kar_t1', 'ur_t1'], requiredSlot: 'weapon',
    effectDesc: 'Lifesteal 8%; abaixo de 30% de HP, dobra para 16%.',
    statBonuses: { lifesteal: 0.08 }, secondaryFlag: 'rw_fome_abismo',
  },
  {
    id: 'olho_naufragio', name: 'OLHO DO NAUFRÁGIO', sequence: ['fen_t1', 'sol_t1', 'nix_t1'], requiredSlot: 'head',
    effectDesc: 'Chefes têm +25% de chance de drop e sempre dropam ao menos Raro.',
    secondaryFlag: 'rw_olho_naufragio',
  },
  {
    id: 'pulmao_ferro', name: 'PULMÃO DE FERRO', sequence: ['dol_t1', 'dol_t1', 'vin_t1'], requiredSlot: 'chest',
    effectDesc: 'Nas Profundezas: dreno de Fôlego −30%. Fora: +8% Redução de Dano.',
    secondaryFlag: 'rw_pulmao_ferro',
  },
  {
    id: 'coro_submerso', name: 'CORO SUBMERSO', sequence: ['lum_t1', 'mar_t1', 'kar_t1'], requiredSlot: 'weapon',
    effectDesc: 'A cada 5 ataques básicos, o próximo ecoa 2× (2ª instância com 50% do dano).',
    secondaryFlag: 'rw_coro_submerso',
  },
  {
    id: 'ancora_mundo', name: 'ÂNCORA DO MUNDO', sequence: ['thal', 'dol_t1', 'vin_t1'], requiredSlot: 'chest',
    effectDesc: 'Imune a Atordoamento; reflete 10% do dano recebido (cap conjunto de 55% com Retribuição).',
    statBonuses: { reflectDamagePct: 10 }, secondaryFlag: 'rw_ancora_mundo',
  },
  {
    id: 'cancao_carpideira', name: 'CANÇÃO DA CARPIDEIRA', sequence: ['ciss', 'mar_t1', 'lum_t1'], requiredSlot: 'weapon',
    effectDesc: 'Ataques aplicam [ENCHARCADO]; seu dano contra encharcados +35% (substitui o bônus base de +20%).',
    secondaryFlag: 'rw_cancao_carpideira',
  },
  {
    id: 'olhar_vazio', name: 'OLHAR DO VAZIO', sequence: ['umbra', 'nix_t1', 'kar_t1'], requiredSlot: 'head',
    effectDesc: 'Inimigos abaixo de 15% de HP recebem +100% de dano ("execute").',
    secondaryFlag: 'rw_olhar_vazio',
  },
  {
    id: 'coracao_leviata', name: 'CORAÇÃO DO LEVIATÃ', sequence: ['vin_t1', 'ur_t1', 'dol_t1', 'kar_t1'], requiredSlot: 'weapon',
    effectDesc: '+20% Vida Máx.; ao cair abaixo de 25% de HP (1×/combate), emerge um escudo de 40% do HP máx.',
    statBonuses: { maxHpPct: 0.20 }, secondaryFlag: 'rw_coracao_leviata',
    requiresAbyssalWeapon4Sockets: true, fixedEngraveCost: 400,
  },
];

export const getRunewordById = (id: string): RunewordDefinition | undefined => RUNEWORD_CATALOG.find(w => w.id === id);

// Custo de gravação (Anexo §2.3): 50 Pérolas para receitas só de runas base; 150 se a sequência
// inclui uma runa primordial (Thal/Ciss/Umbra); CORAÇÃO DO LEVIATÃ tem custo fixo de 400.
export const getRunewordEngraveCost = (runeword: RunewordDefinition): number =>
  runeword.fixedEngraveCost ?? (runeword.sequence.some(id => isPrimordialRune(id)) ? 150 : 50);

// Palavra ativa num item — só válida se `socketedRunes` ainda bate com a sequência exata da
// receita (protege contra dessincronia, ex.: extração manual de uma runa fora do fluxo de undo).
export const getActiveRuneword = (item: EquipmentItem | null | undefined): RunewordDefinition | undefined => {
  if (!item?.activeRuneword) return undefined;
  const runeword = getRunewordById(item.activeRuneword);
  if (!runeword) return undefined;
  const sockets = item.socketedRunes || [];
  const matches = runeword.sequence.length === sockets.length &&
    runeword.sequence.every((runeId, i) => sockets[i] === runeId);
  return matches ? runeword : undefined;
};

// v10.3.0: checagem genérica de Palavra Rúnica ativa (com uma dada secondaryFlag) em qualquer
// item equipado — mesmo padrão de `hasEquippedRuneFlag`, mas para Palavras em vez de runas soltas.
export const hasActiveRunewordFlag = (
  equipment: Record<string, EquipmentItem | null | undefined> | undefined,
  flag: string
): boolean => {
  if (!equipment) return false;
  return Object.values(equipment).some(item => getActiveRuneword(item)?.secondaryFlag === flag);
};
