// v10.2.0 "Os Ecos Afogados" — Fórmulas puras da Cidadela Submersa (6 distritos) e da simulação
// de população dos Ecos Afogados. Módulo compartilhado store ↔ UI ↔ CombatFSM, mesmo padrão de
// `citadelFormulas.ts`/`abyssFormulas.ts`/`runeFormulas.ts`: nada de estado aqui, só funções puras.
//
// Referência: Design principal §6 e Anexo 2 (Ecos Afogados & Leviatã), Parte 1. O Leviatã do Ciclo
// em si fica FORA desta versão (10.4.0) — o Trono Afundado já existe como distrito drenável, mas
// seus bônus de combate (Ecos Guardiões na luta do Leviatã) ficam calculados e prontos, só sem
// consumidor ainda. v10.3.0 "O Coração do Abismo" adiciona aqui o gerador do Set Abissal (fim do
// arquivo) — as Palavras Rúnicas propriamente ditas vivem em `runeFormulas.ts` (mesmo módulo do
// resto do sistema de soquetes/runas).

import type { BaseStats, DistrictId, DrownedEcho, EchoTraitId, EchoVocation, EquipmentItem, SunkenDistrictState } from './types';
import { StatEngine } from './StatEngine';

// ─── Distritos: drenagem e restauração ───────────────────────────────────────

export const DISTRICT_IDS: DistrictId[] = ['dock', 'echoHall', 'forge', 'archive', 'temple', 'throne'];

export const DISTRICT_NAMES: Record<DistrictId, string> = {
  dock: 'Doca Batial',
  echoHall: 'Salão dos Ecos',
  forge: 'Forja Encharcada',
  archive: 'Arquivo Submerso',
  temple: 'Templo da Maré',
  throne: 'Trono Afundado',
};

export const DISTRICT_ICONS: Record<DistrictId, string> = {
  dock: '⚓', echoHall: '🏛️', forge: '⚒️', archive: '📚', temple: '🕍', throne: '👑',
};

// Grade fixa 2×3 (Anexo 2 §1.2) — layout: [dock, echoHall, forge] / [temple, archive, throne].
// Adjacência ORTOGONAL (o que o jogador vê na tela é literalmente a vizinhança).
export const DISTRICT_ADJACENCY: Record<DistrictId, DistrictId[]> = {
  dock: ['echoHall', 'temple'],
  echoHall: ['dock', 'forge', 'archive'],
  forge: ['echoHall', 'throne'],
  temple: ['dock', 'archive'],
  archive: ['echoHall', 'temple', 'throne'],
  throne: ['forge', 'archive'],
};

// Custo/duração da drenagem (Design §6.A) — Coral estimado em metade do valor de Pérolas (o
// documento só tabela Pérolas; a proporção segue o mesmo par Ouro+Carne/Madeira+Pedra já usado
// alhures no jogo para custos duplos de construção).
export const DISTRICT_DRAIN_COST: Record<DistrictId, { pearls: number; coral: number; durationHours: number }> = {
  dock: { pearls: 100, coral: 50, durationHours: 8 },
  echoHall: { pearls: 250, coral: 125, durationHours: 16 },
  forge: { pearls: 400, coral: 200, durationHours: 24 },
  archive: { pearls: 600, coral: 300, durationHours: 36 },
  temple: { pearls: 900, coral: 450, durationHours: 48 },
  throne: { pearls: 1500, coral: 750, durationHours: 72 },
};

// Restauração II/III (Anexo 2 §1.3): ≈50%/100% do custo de drenagem original, SEM timer adicional
// (só a drenagem em si tem tempo real — decisão de escopo desta versão).
export const getRestorationCost = (districtId: DistrictId, targetLevel: 2 | 3): { pearls: number; coral: number } => {
  const base = DISTRICT_DRAIN_COST[districtId];
  const frac = targetLevel === 2 ? 0.5 : 1.0;
  return { pearls: Math.round(base.pearls * frac), coral: Math.round(base.coral * frac) };
};

export const getDistrictSlotCount = (restorationLevel: 0 | 1 | 2 | 3): number =>
  restorationLevel >= 2 ? 2 : restorationLevel >= 1 ? 1 : 0;

export const DEFAULT_DISTRICT_STATE = (): SunkenDistrictState => ({ flooded: true, restorationLevel: 0 });

// ─── Traje de Mergulho (10 níveis, melhorado na Doca Batial — Anexo de Balanceamento §1.7) ───
// Fórmula: Custo(s) = 60 × 1.6^(s-1) Pérolas + 50×s Coral. Pressão/Dreno já respondem a
// `divingSuitLevel` desde a 10.1.0 (getPressureMultiplier/getBreathDrainPerSecond em abyssFormulas.ts).
export const DIVE_SUIT_MAX_LEVEL = 10;
export const getDiveSuitUpgradeCost = (nextLevel: number): { pearls: number; coral: number } => ({
  pearls: Math.round(60 * Math.pow(1.6, nextLevel - 1)),
  coral: 50 * nextLevel,
});

// ─── Ciclo de Marés (relógio determinístico de 6h reais, sem backend) ────────

export type TidePhase = 'low' | 'high';
const TIDE_CYCLE_MS = 6 * 60 * 60 * 1000; // 6h por ciclo completo (3h baixa + 3h alta)

// v10.4.0 "O Leviatã do Ciclo": Maré Viva (sexta-feira) acelera o ciclo de 6h para 1h — checagem
// de dia da semana duplicada localmente (mesmo padrão já usado para Lua de Sangue/Convergência em
// vários módulos do projeto) para não criar import circular com CombatFSM.ts, que já importa DESTE
// arquivo (getVocationPerkTotal etc.).
const getTideCycleMs = (): number => (new Date().getDay() === 5 ? TIDE_CYCLE_MS / 6 : TIDE_CYCLE_MS);

export const getTidePhase = (now: number = Date.now()): TidePhase => {
  const cycleMs = getTideCycleMs();
  return (now % cycleMs) < cycleMs / 2 ? 'low' : 'high';
};

// Timestamp em que a fase ATUAL termina (útil para useCountdown e para expiresAt de Bênçãos).
export const getTidePhaseEndsAt = (now: number = Date.now()): number => {
  const cycleMs = getTideCycleMs();
  const halfMs = cycleMs / 2;
  const posInCycle = now % cycleMs;
  const posInHalf = posInCycle % halfMs;
  return now + (halfMs - posInHalf);
};

export const TIDE_LOW_FISHING_MULT = 1.5;      // Maré Baixa: +50% pesca
export const TIDE_LOW_DRAIN_COST_MULT = 0.8;   // Maré Baixa: −20% custo de drenagem
export const TIDE_LOW_PRESSURE_MULT = 0.9;     // Maré Baixa: −10% Pressão nas Profundezas
export const TIDE_HIGH_FISHING_MULT = 0.75;    // Maré Alta: −25% pesca
export const TIDE_HIGH_CORAL_DROP_MULT = 1.5;  // Maré Alta: +50% Coral de inimigos aquáticos

export interface TideBlessingDef { id: string; name: string; desc: string }
export const TIDE_BLESSINGS: TideBlessingDef[] = [
  { id: 'blessing_damage', name: '+10% Dano', desc: 'Todo dano causado +10% durante a Maré Alta' },
  { id: 'blessing_drop', name: '+10% Chance de Drop', desc: 'Chance de drop de equipamento +10%' },
  { id: 'blessing_production', name: '+15% Produção Submersa', desc: 'Produção dos Ecos alocados +15%' },
];

// ─── Ecos Afogados: vocações, traços e geração determinística ───────────────

export const ECHO_VOCATION_NAMES: Record<EchoVocation, string> = {
  fisher: 'Pescador', diver: 'Mergulhador', scribe: 'Escriba', warden: 'Guardião',
};
export const ECHO_VOCATION_ICONS: Record<EchoVocation, string> = {
  fisher: '🎣', diver: '🤿', scribe: '📖', warden: '🛡️',
};
// Afinidade primária (×1.5) por vocação, e afinidade secundária ×1.25 quando aplicável (Anexo 2 §1.5).
export const VOCATION_PRIMARY_DISTRICT: Record<EchoVocation, DistrictId> = {
  fisher: 'dock', diver: 'forge', scribe: 'archive', warden: 'throne',
};
export const VOCATION_SECONDARY_DISTRICT: Partial<Record<EchoVocation, DistrictId>> = {
  scribe: 'temple', warden: 'temple',
};

export const ECHO_TRAIT_NAMES: Record<EchoTraitId, string> = {
  constant: 'Constante', insomniac: 'Insone', storyteller: 'Contador de Histórias', shy: 'Tímido',
  lowTideNostalgic: 'Nostálgico da Maré', stormChild: 'Filho da Tempestade', echoTwin: 'Gêmeo de Eco',
  twoHanded: 'Mão Dupla', ironMemory: 'Memória de Ferro', humanBeacon: 'Farol Humano',
  choirVoice: 'Voz do Coro', brokenHeart: 'Coração Partido',
};
export const ECHO_TRAIT_RARITY: Record<EchoTraitId, 'common' | 'uncommon' | 'rare'> = {
  constant: 'common', insomniac: 'common', storyteller: 'common', shy: 'common',
  lowTideNostalgic: 'uncommon', stormChild: 'uncommon', echoTwin: 'uncommon', twoHanded: 'uncommon',
  ironMemory: 'rare', humanBeacon: 'rare', choirVoice: 'rare', brokenHeart: 'rare',
};
const TRAITS_BY_RARITY: Record<'common' | 'uncommon' | 'rare', EchoTraitId[]> = {
  common: ['constant', 'insomniac', 'storyteller', 'shy'],
  uncommon: ['lowTideNostalgic', 'stormChild', 'echoTwin', 'twoHanded'],
  rare: ['ironMemory', 'humanBeacon', 'choirVoice', 'brokenHeart'],
};
export const BROKEN_HEART_HEAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias reais alocado sem realocar

// Perks GLOBAIS de vocação (Anexo 2 §1.5) — somam por Eco ALOCADO (em qualquer distrito), até um
// cap por vocação. Diferente de `calculateEchoEfficacies` (que é por DISTRITO): estes perks valem
// onde quer que o Eco esteja.
export const VOCATION_PERK_PER_ECHO: Record<EchoVocation, number> = { fisher: 0.01, diver: 0.05, scribe: 0.05, warden: 0.01 };
export const VOCATION_PERK_CAP: Record<EchoVocation, number> = { fisher: 0.04, diver: 0.20, scribe: 0.15, warden: 0.04 };

export const getVocationPerkTotal = (echoes: DrownedEcho[], vocation: EchoVocation): number => {
  const count = echoes.filter(e => e.vocation === vocation && e.assignedDistrict).length;
  return Math.min(VOCATION_PERK_CAP[vocation], count * VOCATION_PERK_PER_ECHO[vocation]);
};

// Pesos de sorteio de vocação por fonte de resgate (Anexo 2 §1.5).
export type EchoRescueSource = 'divesZone3' | 'divesZone4' | 'districtDrain';
const VOCATION_WEIGHTS: Record<EchoRescueSource, Record<EchoVocation, number>> = {
  divesZone3: { fisher: 15, diver: 25, scribe: 35, warden: 25 },
  divesZone4: { fisher: 10, diver: 25, scribe: 25, warden: 40 },
  districtDrain: { fisher: 35, diver: 35, scribe: 15, warden: 15 },
};

const seedRandom = (seed: number): number => { const x = Math.sin(seed) * 10000; return x - Math.floor(x); };

const pickWeighted = <T extends string>(weights: Record<T, number>, roll: number): T => {
  const entries = Object.entries(weights) as [T, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let acc = 0;
  for (const [key, w] of entries) {
    acc += w / total;
    if (roll < acc) return key;
  }
  return entries[entries.length - 1][0];
};

const ECHO_NAME_POOL = [
  'Nereu', 'Iara', 'Salino', 'Corvina', 'Abissa', 'Marejada', 'Caramuru', 'Sirene',
  'Brumal', 'Undina', 'Tridente', 'Pérola', 'Maresia', 'Coralina', 'Tempestade', 'Espuma',
];

// Geração determinística — mesmo padrão de `generateHuntContracts` (citadelFormulas.ts): a mesma
// seed (rescueIndex) sempre produz o mesmo Eco, sem precisar persistir a escolha em si além do
// resultado. `rescueIndex` é o `echoesRescuedLifetime` ANTES do incremento deste resgate.
export const generateEcho = (rescueIndex: number, source: EchoRescueSource, now: number = Date.now()): DrownedEcho => {
  const vocationSeed = rescueIndex * 97 + 11;
  const vocation = pickWeighted(VOCATION_WEIGHTS[source], seedRandom(vocationSeed));

  const rarityRoll = seedRandom(rescueIndex * 97 + 23);
  const rarity = rarityRoll < 0.10 ? 'rare' : rarityRoll < 0.40 ? 'uncommon' : 'common';
  const traitPool = TRAITS_BY_RARITY[rarity];
  const trait = traitPool[Math.floor(seedRandom(rescueIndex * 97 + 37) * traitPool.length)];

  const name = ECHO_NAME_POOL[rescueIndex % ECHO_NAME_POOL.length];

  return {
    id: `echo_${rescueIndex}`,
    name,
    vocation,
    trait,
    rescuedAt: now,
  };
};

export const ECHO_RESCUE_CHANCE_PER_DEPTH = 0.10; // Zona 3+, por profundidade concluída
export const ECHO_RESCUE_MAX_PER_DIVE = 2;
export const ECHO_ROSTER_CAP = 16;
export const ECHO_ALLOCATION_SLOTS_TOTAL = 12; // 6 distritos × 2 (Restauração II)

// Marcos de resgate vitalício (Anexo 2 §1.8) — 16 é o cap do roster, não dispara mecânica extra
// nesta versão (reservado para a cutscene de lore de uma versão futura).
export const ECHO_MILESTONES = [3, 6, 9, 12, 16] as const;

// ─── Eficácia dos Ecos alocados (fórmula única, Anexo 2 §1.1) ────────────────
//
//   Eficácia = Base do Distrito × Afinidade × (1 + Traço próprio) × (1 + Σ Traços vizinhos)
//              × (1 + Bônus do Salão)
//
// Cap de eficácia individual: ×2.5 no produto Afinidade×Traços×Salão (protege contra combos
// degenerados de traços empilhados) — o Base do Distrito nunca é afetado pelo cap.
export const EFFICACY_MULTIPLIER_CAP = 2.5;

// "Base do Distrito" por Eco alocado (Design §6.A / Anexo 2 §1.4) — a unidade natural do efeito
// daquele distrito (ex.: Doca = fração de bônus à Pesca Passiva). Os "Aprimoramentos" de
// Restauração III (ex.: Fragmento a cada 24h em vez de 48h, 3%→8% devolução de runa na Forja) são
// bônus DE DISTRITO (não por Eco) e são aplicados separadamente em useGameStore, não aqui.
export const DISTRICT_BASE_EFFECT: Record<DistrictId, number> = {
  dock: 0.08, echoHall: 0.06, forge: 0.05, archive: 0.10, temple: 0.20, throne: 0.03,
};
export const SALON_BONUS_PER_ECHO = 0.06;
export const SALON_BONUS_PER_CHOIR_VOICE_ECHO = 0.12;
export const SALON_BONUS_CAP = 0.24;

interface TraitContribution { selfPct: number; neighborGiven: number }

interface TraitContext {
  tidePhase: TidePhase;
  isAloneInDistrict: boolean;
  sameTraitNeighborCount: number; // outros Ecos NO MAPA (não só vizinhos) com o mesmo traço 'echoTwin'
  brokenHeartHealed: boolean;
}

const getTraitContribution = (trait: EchoTraitId, ctx: TraitContext): TraitContribution => {
  switch (trait) {
    case 'constant': return { selfPct: 0.10, neighborGiven: 0 };
    case 'insomniac': return { selfPct: 0.20, neighborGiven: -0.10 };
    case 'storyteller': return { selfPct: 0, neighborGiven: 0.08 };
    case 'shy': return { selfPct: ctx.isAloneInDistrict ? 0.15 : -0.05, neighborGiven: 0 };
    case 'lowTideNostalgic': return { selfPct: ctx.tidePhase === 'low' ? 0.25 : -0.10, neighborGiven: 0 };
    case 'stormChild': return { selfPct: ctx.tidePhase === 'high' ? 0.25 : -0.10, neighborGiven: 0 };
    case 'echoTwin': return { selfPct: Math.min(0.36, ctx.sameTraitNeighborCount * 0.12), neighborGiven: 0 };
    case 'twoHanded': return { selfPct: 0, neighborGiven: 0 }; // afeta a Afinidade — ver calculateEchoEfficacies
    case 'ironMemory': return { selfPct: 0.05, neighborGiven: 0 }; // imunidade a penalidades de vizinhos tratada na agregação
    case 'humanBeacon': return { selfPct: 0.15, neighborGiven: 0.05 };
    case 'choirVoice': return { selfPct: 0, neighborGiven: 0 }; // dobra o Bônus do Salão — ver cálculo do Salão
    case 'brokenHeart': return { selfPct: ctx.brokenHeartHealed ? 0.30 : -0.30, neighborGiven: 0 };
    default: return { selfPct: 0, neighborGiven: 0 };
  }
};

export interface EchoEfficacyBreakdown {
  echoId: string;
  district: DistrictId;
  base: number;
  affinity: number;
  selfMult: number;
  neighborMult: number;
  salonMult: number;
  finalEfficacy: number;
}

// Função pura — chamada só quando algo muda (alocação, maré, relógio do Coração Partido), nunca
// por frame (Anexo 2 §1.9). Recebe a lista de Ecos e o mapa de distritos; devolve a eficácia de
// CADA Eco alocado (Ecos "descansando" sem distrito não entram no resultado).
export const calculateEchoEfficacies = (
  echoes: DrownedEcho[],
  tidePhase: TidePhase,
  now: number = Date.now()
): EchoEfficacyBreakdown[] => {
  const allocated = echoes.filter(e => e.assignedDistrict);

  // Bônus do Salão: soma de todos os Ecos alocados no Salão (6% normal, 12% se Voz do Coro), cap 24%.
  const salonEchoes = allocated.filter(e => e.assignedDistrict === 'echoHall');
  const salonBonusRaw = salonEchoes.reduce((sum, e) => sum + (e.trait === 'choirVoice' ? SALON_BONUS_PER_CHOIR_VOICE_ECHO : SALON_BONUS_PER_ECHO), 0);
  const salonBonus = Math.min(SALON_BONUS_CAP, salonBonusRaw);

  // 1ª passada: contribuição própria/vizinha de cada Eco (contexto independente de vizinhança).
  const contributions = new Map<string, TraitContribution>();
  for (const echo of allocated) {
    const districtMates = allocated.filter(o => o.id !== echo.id && o.assignedDistrict === echo.assignedDistrict);
    const sameTraitCount = allocated.filter(o => o.id !== echo.id && o.trait === 'echoTwin' && echo.trait === 'echoTwin').length;
    const healed = echo.trait === 'brokenHeart' && !!echo.brokenHeartHealsAt && now >= echo.brokenHeartHealsAt;
    contributions.set(echo.id, getTraitContribution(echo.trait, {
      tidePhase,
      isAloneInDistrict: districtMates.length === 0,
      sameTraitNeighborCount: sameTraitCount,
      brokenHeartHealed: healed,
    }));
  }

  // 2ª passada: soma os traços vizinhos (Memória de Ferro ignora contribuições negativas recebidas).
  return allocated.map((echo): EchoEfficacyBreakdown => {
    const district = echo.assignedDistrict as DistrictId;
    const base = DISTRICT_BASE_EFFECT[district];

    const isPrimary = VOCATION_PRIMARY_DISTRICT[echo.vocation] === district;
    const isSecondary = VOCATION_SECONDARY_DISTRICT[echo.vocation] === district;
    let affinity = isPrimary ? 1.5 : isSecondary ? 1.25 : 1.0;
    if (echo.trait === 'twoHanded') affinity = isPrimary || isSecondary ? 1.75 : 0.9;

    const own = contributions.get(echo.id)!;
    const selfMult = 1 + own.selfPct;

    const neighborDistricts = DISTRICT_ADJACENCY[district];
    const neighborEchoes = allocated.filter(o => o.id !== echo.id && neighborDistricts.includes(o.assignedDistrict as DistrictId));
    let neighborSum = 0;
    for (const neighbor of neighborEchoes) {
      const given = contributions.get(neighbor.id)!.neighborGiven;
      if (given < 0 && echo.trait === 'ironMemory') continue; // imune a penalidades vindas de vizinhos
      neighborSum += given;
    }
    const neighborMult = 1 + neighborSum;
    const salonMult = 1 + salonBonus;

    const rawMultiplier = affinity * selfMult * neighborMult * salonMult;
    const cappedMultiplier = Math.max(0, Math.min(EFFICACY_MULTIPLIER_CAP, rawMultiplier));

    return {
      echoId: echo.id, district, base, affinity, selfMult, neighborMult, salonMult,
      finalEfficacy: base * cappedMultiplier,
    };
  });
};

// Soma a eficácia de todos os Ecos alocados num distrito específico (helper de consumo — pesca,
// custos de Pérolas, Pérolas bancadas nas Profundezas, redução de dano dos Guardiões).
export const sumDistrictEfficacy = (breakdowns: EchoEfficacyBreakdown[], district: DistrictId): number =>
  breakdowns.filter(b => b.district === district).reduce((s, b) => s + b.finalEfficacy, 0);

// ─── v10.3.0 "O Coração do Abismo": Set Abissal (8.0×, exclusivo da Fossa Z4/Leviatã) ────────
//
// Rolagem SEPARADA da cadeia de exclusividade da campanha (Celestial/Lua de Sangue/Pandemônio/
// Ancestral em CombatFSM.handleEnemyDefeat) — as Profundezas nunca usam aquele pipeline (pureza
// econômica: só moeda, nunca equipamento normal). O Set Abissal é o único equipamento que quebra
// essa regra, então tem seu próprio gerador aqui, chamado só por `useDiveStore.completeDepth`
// quando a Zona é 4. Reaproveita `StatEngine.generateNecklaceStats`/`generateAmuletStats`/
// `pickRandomElements` (mesmas fórmulas de item da campanha); duplica as tabelas de nome por
// classe/slot (mesmo padrão de `HUNT_CONTRACT_ENEMY_POOL`, que já duplica `ENEMY_TYPES` para
// evitar import circular com CombatFSM.ts).
export const ABYSSAL_SET_MULT = 8.0;
export const ABYSSAL_SET_DROP_CHANCE = 0.04; // por abate, só Zona 4 (rolagem separada, padrão Colar)

export const ABYSSAL_SET_NAMES: Record<string, string> = {
  warrior: 'Set Abissal do Afogador',
  mage: 'Set Abissal do Arauto das Profundezas',
  ranger: 'Set Abissal do Batedor do Caco',
  paladin: 'Set Abissal do Guardião Submerso',
  cleric: 'Set Abissal do Sacerdote Afogado',
  rogue: 'Set Abissal do Ladrão de Marés',
  necromancer: 'Set Abissal do Arauto Abissal',
  avatar: 'Set Abissal do Avatar Submerso',
};

const ABYSSAL_SLOT_NAMES: Record<string, Record<string, string>> = {
  warrior: { weapon: 'Espada', head: 'Elmo', chest: 'Armadura', legs: 'Perneiras', gloves: 'Manoplas', necklace: 'Colar', amulet: 'Talismã', ring: 'Anel de Guerra' },
  mage: { weapon: 'Cajado', head: 'Capuz', chest: 'Manto', legs: 'Calças', gloves: 'Luvas', necklace: 'Amulet', amulet: 'Talismã', ring: 'Anel Arcano' },
  ranger: { weapon: 'Arco', head: 'Máscara', chest: 'Colete', legs: 'Perneiras', gloves: 'Luvas', necklace: 'Colar', amulet: 'Talismã', ring: 'Anel do Caçador' },
  paladin: { weapon: 'Martelo', head: 'Elmo', chest: 'Armadura', legs: 'Perneiras', gloves: 'Manoplas', necklace: 'Amulet', amulet: 'Talismã', ring: 'Anel Sagrado' },
  cleric: { weapon: 'Maça', head: 'Mitra', chest: 'Túnica', legs: 'Calças', gloves: 'Luvas', necklace: 'Rosário', amulet: 'Talismã', ring: 'Anel Bento' },
  rogue: { weapon: 'Adaga', head: 'Capuz', chest: 'Manto', legs: 'Calças', gloves: 'Luvas', necklace: 'Colar', amulet: 'Talismã', ring: 'Anel Furtivo' },
  necromancer: { weapon: 'Glaive', head: 'Capuz Sombrio', chest: 'Toga', legs: 'Calças', gloves: 'Manoplas', necklace: 'Amulet', amulet: 'Talismã', ring: 'Anel Sombrio' },
  avatar: { weapon: 'Cetro Estelar', head: 'Coroa da Alma', chest: 'Túnica do Infinito', legs: 'Gamas da Totalidade', gloves: 'Manoplas Cósmicas', necklace: 'Colar', amulet: 'Talismã Estelar', ring: 'Anel Cósmico' },
};

const ABYSSAL_POSSIBLE_STATS: Record<string, (keyof BaseStats)[]> = {
  warrior: ['strength', 'constitution', 'luck'],
  mage: ['magic', 'constitution', 'luck'],
  ranger: ['dexterity', 'constitution', 'luck'],
  paladin: ['constitution', 'strength', 'luck'],
  cleric: ['magic', 'constitution', 'luck'],
  rogue: ['dexterity', 'strength', 'luck'],
  necromancer: ['magic', 'luck', 'constitution'],
  avatar: ['strength', 'magic', 'dexterity', 'constitution', 'luck'],
};

const ABYSSAL_SLOTS: EquipmentItem['slot'][] = ['weapon', 'head', 'chest', 'legs', 'gloves', 'necklace', 'amulet', 'ring'];

// `stage` aqui é `highestStageReached` do personagem (não a fase de campanha corrente — dentro da
// descida os stats do herói ficam congelados e a Profundidade, não a Fase, é o eixo de progressão).
export const rollAbyssalSetDrop = (classId: string, stage: number): EquipmentItem => {
  const slot = ABYSSAL_SLOTS[Math.floor(Math.random() * ABYSSAL_SLOTS.length)];
  const setName = ABYSSAL_SET_NAMES[classId] || `Set Abissal de ${classId}`;
  const baseName = ABYSSAL_SLOT_NAMES[classId]?.[slot] || 'Equipamento';

  let stats: Partial<BaseStats>;
  if (slot === 'necklace') {
    stats = StatEngine.generateNecklaceStats(stage, ABYSSAL_SET_MULT, 'legendary');
  } else if (slot === 'amulet') {
    stats = StatEngine.generateAmuletStats(stage, ABYSSAL_SET_MULT, 'legendary');
  } else {
    stats = {};
    const pool = ABYSSAL_POSSIBLE_STATS[classId] || ['strength', 'constitution', 'luck'];
    const pickedStats = StatEngine.pickRandomElements(pool, 3);
    pickedStats.forEach((statKey) => {
      stats[statKey] = Math.max(1, Math.round(stage * ABYSSAL_SET_MULT * (0.8 + Math.random() * 0.4)));
    });
  }

  let cleanSetName = setName;
  if (cleanSetName.startsWith('Set Abissal do ')) cleanSetName = cleanSetName.replace('Set Abissal do ', '');
  else if (cleanSetName.startsWith('Set Abissal de ')) cleanSetName = cleanSetName.replace('Set Abissal de ', '');
  else if (cleanSetName.startsWith('Set Abissal da ')) cleanSetName = cleanSetName.replace('Set Abissal da ', '');
  let prep = 'do';
  if (setName.includes(' da ')) prep = 'da';
  else if (setName.includes(' de ')) prep = 'de';
  const name = `${baseName} Abissal ${prep} ${cleanSetName}`;

  return {
    id: `${classId}-${slot}-abyssal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name,
    slot,
    rarity: 'legendary',
    stats,
    setName,
    classId,
    spriteName: `${classId}-${slot}`,
    stage,
  };
};
