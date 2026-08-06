// Oráculo Rúnico — Catálogo de Runas Astrais e Palavras Rúnicas Astrais, exclusivo do Amuleto.
// Módulo paralelo a `runeFormulas.ts` (mesmo espírito: catálogo compartilhado store ↔ UI ↔
// StatEngine), mas propositalmente INDEPENDENTE dele — o foco temático é suporte/utilidade/
// habilidade, não dano bruto, e a mecânica de reconhecimento é por DETECÇÃO PASSIVA ao "Consultar
// o Oráculo" (não uma ação de gravação que consome as runas, como as Palavras Rúnicas pesadas).
//
// Diferente do sistema de soquetes pesado: uma runa astral solta NUNCA dá bônus sozinha — só vale
// quando fecha uma Palavra Rúnica Astral reconhecida. O amuleto em si não rola stats (ver
// `StatEngine`/`CombatFSM`) — ele é a "chave" que habilita a tela do Oráculo.
//
// Modos de uso dos 6 espaços do amuleto (ver `getActiveAstralRunewords`):
//   • 1 palavra única de 3 a 6 runas (ocupa posições 0..N-1); OU
//   • 2 palavras DIFERENTES de 3 runas cada, uma em cada metade do círculo (0-2 e 3-5), ativas
//     simultaneamente — exige os 6 espaços desbloqueados (Oráculo nível 4+).

import type { BaseStats, EquipmentItem } from './types';

// ─── Identidade ──────────────────────────────────────────────────────────────

export type AstralRuneTier = 1 | 2 | 3;

export type AstralRuneId =
  | 'ecoRegen_t1' | 'passoLeve_t1' | 'olhoAstral_t1'
  | 'marePsiquica_t2' | 'chamaInterior_t2' | 'veuSombrio_t2'
  | 'coroaEstelar_t3' | 'pulsarVazio_t3' | 'graalOraculo_t3';

export interface AstralRuneDefinition {
  id: AstralRuneId;
  name: string;
  glyph: string; // glifo Unicode renderizado via CSS (mesmo padrão de runeFormulas.ts)
  color: string;
  tier: AstralRuneTier;
  desc: string; // descrição temática — a runa solta não dá bônus, só compõe a palavra
}

export const ASTRAL_RUNE_CATALOG: Record<AstralRuneId, AstralRuneDefinition> = {
  ecoRegen_t1:    { id: 'ecoRegen_t1',    name: 'Eco da Regeneração', glyph: '✦', color: '#22c55e', tier: 1, desc: 'Ressoa com vitalidade e renovação.' },
  passoLeve_t1:   { id: 'passoLeve_t1',   name: 'Passo Leve',         glyph: '✧', color: '#38bdf8', tier: 1, desc: 'Ressoa com velocidade e reflexo.' },
  olhoAstral_t1:  { id: 'olhoAstral_t1',  name: 'Olho Astral',        glyph: '✩', color: '#a78bfa', tier: 1, desc: 'Ressoa com percepção e sorte.' },
  marePsiquica_t2:{ id: 'marePsiquica_t2',name: 'Maré Psíquica',      glyph: '✪', color: '#818cf8', tier: 2, desc: 'Ressoa com foco mental e mana.' },
  chamaInterior_t2:{ id: 'chamaInterior_t2', name: 'Chama Interior',  glyph: '✫', color: '#f97316', tier: 2, desc: 'Ressoa com fúria contida e ímpeto.' },
  veuSombrio_t2:  { id: 'veuSombrio_t2',  name: 'Véu Sombrio',        glyph: '✬', color: '#6d28d9', tier: 2, desc: 'Ressoa com evasão e dissimulação.' },
  coroaEstelar_t3:{ id: 'coroaEstelar_t3',name: 'Coroa Estelar',      glyph: '✭', color: '#facc15', tier: 3, desc: 'Ressoa com poder de fim de jogo — Torre 100+.' },
  pulsarVazio_t3: { id: 'pulsarVazio_t3', name: 'Pulsar do Vazio',    glyph: '✮', color: '#e879f9', tier: 3, desc: 'Ressoa com poder de fim de jogo — Pandemônio 50+.' },
  graalOraculo_t3:{ id: 'graalOraculo_t3',name: 'Graal do Oráculo',   glyph: '✯', color: '#fbbf24', tier: 3, desc: 'Ressoa com revelação — o mais raro dos ecos astrais.' },
};

export const ASTRAL_RUNE_IDS = Object.keys(ASTRAL_RUNE_CATALOG) as AstralRuneId[];

// Spritesheet 1024×1024, grade 3×3 (ordem de leitura em linha), chroma key `#FE0201` — MESMA
// técnica de `runes_base.png`/`runes_primordial.png` (ver `itemVisuals.tsx`/`IconSprite.tsx`),
// removida via `getTransparentImageUrl` (o `<IconSprite stripBackground>` default já cuida disso).
// A ordem das 9 células segue exatamente a ordem de declaração de `ASTRAL_RUNE_CATALOG` acima
// (mesma tabela documentada em `Sprites_Necessarios.md`, seção 3).
export const RUNE_SHEET_ASTRAL = '/assets/runes_astral.png';
export const getAstralRuneSpriteIndex = (runeId: AstralRuneId): number => ASTRAL_RUNE_IDS.indexOf(runeId);

// ─── Regras de espaços (Oráculo Rúnico) ──────────────────────────────────────

export const AMULET_TOTAL_SLOTS = 6;

// N1: 3 espaços | N2: 4 | N3: 5 | N4+: 6 (círculo completo, libera o modo de 2 palavras de 3 runas).
export const getMaxAmuletSlots = (oracleLevel: number): number => {
  if (oracleLevel >= 4) return 6;
  if (oracleLevel === 3) return 5;
  if (oracleLevel === 2) return 4;
  if (oracleLevel >= 1) return 3;
  return 0;
};

// ─── Palavras Rúnicas Astrais ────────────────────────────────────────────────
//
// Mesmo espírito de ActiveRelicParam (CombatFSM.ts) para `grantsActiveAbility` — duplicado aqui em
// vez de importado para não criar um ciclo de import com CombatFSM.ts (mesmo padrão já usado por
// `sunkenCitadelFormulas.ts` ao duplicar tabelas em vez de importar de CombatFSM.ts).
export type AstralAbilityParam = 'damageBonusPct' | 'healPct' | 'cooldownReductionPct' | 'eliteDamageBonusPct' | 'invulnDurationSec' | 'goldBonusPct';

export interface AstralActiveAbility {
  id: string;
  name: string;
  desc: string;
  cooldownMs: number;
  param: AstralAbilityParam;
  paramValue: number;
}

export interface AstralRunewordDefinition {
  id: string;
  name: string;
  sequence: AstralRuneId[]; // comprimento 3 a 6 — ordem exata, índice = posição do espaço
  effectDesc: string;
  minOracleLevel: number;
  statBonuses?: Partial<BaseStats>;
  grantsActiveAbility?: AstralActiveAbility;
}

export const ASTRAL_RUNEWORD_CATALOG: AstralRunewordDefinition[] = [
  // Tier 1 — comprimento 3, disponíveis desde o Oráculo N1.
  {
    id: 'sopro_vitalidade', name: 'SOPRO DA VITALIDADE',
    sequence: ['ecoRegen_t1', 'ecoRegen_t1', 'passoLeve_t1'],
    effectDesc: '+6% de Vida Máxima; regenera 1% do HP máx. a cada 10s fora de combate.',
    minOracleLevel: 1, statBonuses: { maxHpPct: 0.06 },
  },
  {
    id: 'reflexo_estelar', name: 'REFLEXO ESTELAR',
    sequence: ['passoLeve_t1', 'olhoAstral_t1', 'passoLeve_t1'],
    effectDesc: 'Reduz em 10% o cooldown de todas as habilidades de classe.',
    minOracleLevel: 1, statBonuses: {},
  },
  // Tier 2 — comprimento 4-5, Oráculo N2-N3.
  {
    id: 'mare_da_mente', name: 'MARÉ DA MENTE',
    sequence: ['marePsiquica_t2', 'olhoAstral_t1', 'marePsiquica_t2', 'passoLeve_t1'],
    effectDesc: '+12% Mana Máxima; a habilidade de cura (quando existir) restaura +15%.',
    minOracleLevel: 2, statBonuses: { maxManaPct: 0.12 },
  },
  {
    id: 'furia_contida', name: 'FÚRIA CONTIDA',
    sequence: ['chamaInterior_t2', 'chamaInterior_t2', 'passoLeve_t1', 'olhoAstral_t1', 'ecoRegen_t1'],
    effectDesc: 'O ataque básico ganha 15% de chance de aplicar uma explosão em área (dano igual ao golpe).',
    minOracleLevel: 3, statBonuses: { damageMultiplierPct: 0.05 },
  },
  // Tier 3 — comprimento 6, lendárias, exclusivas do Oráculo N5, concedem habilidade ativa nova.
  {
    id: 'coroa_do_vazio', name: 'COROA DO VAZIO',
    sequence: ['coroaEstelar_t3', 'pulsarVazio_t3', 'veuSombrio_t2', 'chamaInterior_t2', 'olhoAstral_t1', 'ecoRegen_t1'],
    effectDesc: 'Concede a habilidade ativa "Colapso Astral": explosão de dano em área ao redor do jogador.',
    minOracleLevel: 5,
    grantsActiveAbility: { id: 'colapso_astral', name: 'Colapso Astral', desc: 'Explosão de dano em área.', cooldownMs: 45_000, param: 'damageBonusPct', paramValue: 0.60 },
  },
  {
    id: 'graal_revelado', name: 'GRAAL REVELADO',
    sequence: ['graalOraculo_t3', 'coroaEstelar_t3', 'pulsarVazio_t3', 'marePsiquica_t2', 'veuSombrio_t2', 'passoLeve_t1'],
    effectDesc: 'Concede a habilidade ativa "Bênção do Oráculo": cura instantânea e reduz cooldowns.',
    minOracleLevel: 5,
    grantsActiveAbility: { id: 'bencao_oraculo', name: 'Bênção do Oráculo', desc: 'Cura instantânea + reduz cooldowns.', cooldownMs: 60_000, param: 'healPct', paramValue: 0.40 },
  },
];

export const getAstralRunewordById = (id: string): AstralRunewordDefinition | undefined =>
  ASTRAL_RUNEWORD_CATALOG.find(w => w.id === id);

// Spritesheet 1024×1024, grade 3×3 (mesmo padrão de RUNE_SHEET_ASTRAL) — só as 6 primeiras
// células são usadas (ordem de declaração de ASTRAL_RUNEWORD_CATALOG acima); as 3 últimas
// ficam vazias. Ver Sprites_Necessarios.md, seção 4.
export const RUNE_WORD_SHEET_ASTRAL = '/assets/runewords_astral.png';
export const getAstralRunewordSpriteIndex = (runewordId: string): number =>
  ASTRAL_RUNEWORD_CATALOG.findIndex(w => w.id === runewordId);

// Compara uma sequência de espaços do amuleto (com `null` nos vazios) contra a receita.
const sequenceMatches = (sockets: (AstralRuneId | null)[], sequence: AstralRuneId[]): boolean =>
  sequence.length === sockets.length && sequence.every((runeId, i) => sockets[i] === runeId);

// Reconhece a(s) Palavra(s) Rúnica(s) Astral(is) formada(s) pelos `amuletSockets` de um item —
// chamada ao "Consultar o Oráculo" (detecção passiva, sem consumir as runas do inventário).
//
// 1) Tenta achar uma palavra de comprimento 4-6 batendo com os espaços 0..N-1 (modo "palavra
//    única", ocupa o círculo inteiro e tem prioridade).
// 2) Se não achar, checa cada metade (0-2 e 3-5) independentemente contra receitas de
//    comprimento 3 — modo "2 palavras simultâneas" (só faz sentido com os 6 espaços desbloqueados).
export const getActiveAstralRunewords = (item: EquipmentItem | null | undefined): AstralRunewordDefinition[] => {
  const sockets = item?.amuletSockets || [];
  if (sockets.length === 0) return [];

  const longWord = ASTRAL_RUNEWORD_CATALOG.find(w =>
    w.sequence.length >= 4 && sequenceMatches(sockets.slice(0, w.sequence.length), w.sequence)
  );
  if (longWord) return [longWord];

  const results: AstralRunewordDefinition[] = [];
  const firstHalf = sockets.slice(0, 3);
  const secondHalf = sockets.slice(3, 6);

  const firstMatch = ASTRAL_RUNEWORD_CATALOG.find(w => w.sequence.length === 3 && sequenceMatches(firstHalf, w.sequence));
  if (firstMatch) results.push(firstMatch);

  const secondMatch = ASTRAL_RUNEWORD_CATALOG.find(w => w.sequence.length === 3 && sequenceMatches(secondHalf, w.sequence));
  if (secondMatch) results.push(secondMatch);

  return results;
};
