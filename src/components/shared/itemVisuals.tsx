// Módulo compartilhado de visual de itens (raridade, sets, forja, labels de atributos).
// Usado pelo Inventário de Equipamentos (GameUI.tsx) e pelo Depósito da Cidadela (VaultPanel.tsx)
// para garantir que ambos exibam os itens com a mesma fidelidade visual.

export const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'rare':
    case 'raro':
      return '#3b82f6';
    case 'epic':
    case 'épico':
      return '#a855f7';
    case 'legendary':
    case 'lendário':
      return '#f59e0b';
    case 'mystic':
    case 'místico':
    case 'mística':
      return '#d946ef';
    case 'consumable':
      return '#06b6d4';
    default:
      return '#94a3b8';
  }
};

export const getRarityBg = (rarity: string) => {
  switch (rarity) {
    case 'rare':
    case 'raro':
      return 'rgba(59, 130, 246, 0.15)';
    case 'epic':
    case 'épico':
      return 'rgba(168, 85, 247, 0.15)';
    case 'legendary':
    case 'lendário':
      return 'rgba(245, 158, 11, 0.15)';
    case 'mystic':
    case 'místico':
    case 'mística':
      return 'rgba(217, 70, 239, 0.2)';
    case 'consumable':
      return 'rgba(6, 182, 212, 0.15)';
    default:
      return 'rgba(148, 163, 184, 0.1)';
  }
};

export const slotLabels: Record<string, string> = {
  head: 'Cabeça',
  chest: 'Peito',
  legs: 'Pernas',
  gloves: 'Luvas',
  weapon: 'Arma',
  necklace: 'Colar',
  amulet: 'Amuleto',
  ring: 'Anel',
  consumable: 'Consumível',
  activeRelic: 'Relíquia Ativa'
};

export const slotIcons: Record<string, string> = {
  head: '🪖',
  chest: '👕',
  legs: '👖',
  gloves: '🧤',
  weapon: '⚔️',
  necklace: '📿',
  amulet: '🧿',
  ring: '💍',
  consumable: '📦',
  activeRelic: '🔱'
};

export const statLabels: Record<string, string> = {
  strength: 'Força',
  magic: 'Magia',
  dexterity: 'Destreza',
  constitution: 'Constituição',
  luck: 'Sorte',
  touch: 'Poder do Toque',
  critChance: 'Chance de Crítico',
  critDamage: 'Dano Crítico',
  robotClicks: 'Cliques do Robô',
  lifesteal: 'Roubo de Vida',
  touchDamageMult: 'Multiplicador de Toque',
  damageMultiplierPct: 'Bônus de Dano',
  maxHpPct: 'Bônus de HP',
  attackSpeedPct: 'Velocidade de Ataque',
  maxManaPct: 'Bônus de Mana',
  dropChancePct: 'Chance de Drop',
  damageReductionPct: 'Redução de Dano',
  frenzyChancePct: 'Chance de Frenesi',
  // v10.0.0: chaves alimentadas pelas Runas Abissais
  goldBonusPct: 'Bônus de Ouro',
  eliteDamagePct: 'Dano vs. Elite/Chefe'
};

export const isPercentStat = (stat: string) => {
  return [
    'lifesteal',
    'damageReductionPct',
    'frenzyChancePct',
    'dropChancePct',
    'maxHpPct',
    'maxManaPct',
    'attackSpeedPct',
    'damageMultiplierPct',
    'touchDamageMult',
    'critChance',
    'critDamage',
    'goldBonusPct',
    'eliteDamagePct'
  ].includes(stat);
};

export const formatStatValue = (stat: string, val: number) => {
  if (isPercentStat(stat)) {
    const pct = val * 100;
    const rounded = Number(pct.toFixed(2));
    return `+${rounded}%`;
  }
  return `+${val}`;
};

export interface SetVisual {
  isAncestral: boolean;
  isPandemonium: boolean;
  isCelestial: boolean;
  isBloodMoon: boolean;
  isPandemoniumMystic: boolean;
  isPandemoniumBase: boolean;
  border: string;
  shadow: string;
  bg: string;
}

// Calcula borda/glow/fundo de um item com base no seu conjunto (Ancestral/Pandemoníaco/Celestial/
// Lua de Sangue), com fallback para a cor de raridade padrão quando o item não pertence a nenhum
// conjunto especial.
export const getSetVisual = (item: { setName?: string; rarity: string } | null | undefined): SetVisual => {
  const setName = item?.setName;
  const isAncestral = !!(setName && setName.startsWith('Set Ancestral'));
  const isPandemonium = !!(setName && setName.startsWith('Set Pandemoníaco'));
  const isCelestial = !!(setName && setName.startsWith('Set Celestial'));
  const isBloodMoon = !!(setName && setName.startsWith('Set da Lua de Sangue'));
  const isPandemoniumMystic = isPandemonium && item?.rarity === 'mystic';
  const isPandemoniumBase = isPandemonium && item?.rarity !== 'mystic';

  let border = item ? `2px solid ${getRarityColor(item.rarity)}` : '1px dashed rgba(255,255,255,0.08)';
  let shadow = 'none';
  let bg = item ? getRarityBg(item.rarity) : 'rgba(0,0,0,0.4)';

  if (item) {
    if (isAncestral) {
      border = '2px dashed #a78bfa';
      shadow = '0 0 10px rgba(167, 139, 250, 0.8)';
    } else if (isPandemonium) {
      border = '2px dashed #10b981';
      shadow = '0 0 10px rgba(16, 185, 129, 0.8)';
      if (isPandemoniumBase) {
        bg = 'rgba(16, 185, 129, 0.15)';
      } else if (isPandemoniumMystic) {
        bg = 'rgba(124, 58, 237, 0.2)'; // Violeta escuro
      }
    } else if (isCelestial) {
      border = '2px dashed #38bdf8';
      shadow = '0 0 10px rgba(56, 189, 248, 0.8)';
      bg = 'rgba(56, 189, 248, 0.15)';
    } else if (isBloodMoon) {
      border = '2px dashed #dc2626';
      shadow = '0 0 10px rgba(220, 38, 38, 0.8)';
      bg = 'rgba(220, 38, 38, 0.15)';
    } else if (item.rarity === 'mystic' || item.rarity === 'místico' || item.rarity === 'mística') {
      // Itens místicos (fusão de runas N4, Relíquias exclusivas da Convergência): borda tracejada
      // + fundo rosa, para se destacarem de qualquer raridade normal do mesmo tom (fúcsia/#d946ef).
      border = '2px dashed #e879f9';
      shadow = '0 0 10px rgba(232, 121, 249, 0.7)';
      bg = 'rgba(217, 70, 239, 0.2)';
    }
  }

  return { isAncestral, isPandemonium, isCelestial, isBloodMoon, isPandemoniumMystic, isPandemoniumBase, border, shadow, bg };
};

// ── v10.0.0 "A Cidadela Submersa": visual das Runas Abissais e dos soquetes ──
// Fundo colorido pela família + borda pelo tier (bronze/prata/dourado; primordiais têm borda
// própria), com o glifo Unicode como ícone — e, quando `runes_base.png`/`runes_primordial.png`
// carregam com sucesso, o ícone real do spritesheet 3×3 por cima (glifo vira só o fallback).
import React from 'react';
import { RUNE_CATALOG, RUNE_FAMILY_IDS, RuneId, PrimordialRuneId } from '../../core/runeFormulas';
import type { EquipmentItem } from '../../core/types';
import { IconSprite } from './IconSprite';

export interface RuneVisual {
  glyph: string;
  name: string;
  bg: string;
  border: string;
  shadow: string;
  tierLabel: string;
}

const RUNE_TIER_BORDERS: Record<string, { border: string; shadow: string; label: string }> = {
  '1': { border: '2px solid #b45309', shadow: '0 0 5px rgba(180, 83, 9, 0.6)', label: 'Tier I' },
  '2': { border: '2px solid #cbd5e1', shadow: '0 0 6px rgba(203, 213, 225, 0.6)', label: 'Tier II' },
  '3': { border: '2px solid #fbbf24', shadow: '0 0 8px rgba(251, 191, 36, 0.7)', label: 'Tier III' },
  primordial: { border: '2px double #f0abfc', shadow: '0 0 10px rgba(240, 171, 252, 0.8)', label: 'Primordial' },
};

export const getRuneVisual = (runeId: RuneId): RuneVisual => {
  const def = RUNE_CATALOG[runeId];
  const tierKey = String(def?.tier || '1');
  const tier = RUNE_TIER_BORDERS[tierKey] || RUNE_TIER_BORDERS['1'];
  return {
    glyph: def?.glyph || '?',
    name: def?.name || runeId,
    bg: `${def?.color || '#334155'}33`,
    border: tier.border,
    shadow: tier.shadow,
    tierLabel: tier.label,
  };
};

const RUNE_SHEET_BASE = '/assets/runes_base.png';
const RUNE_SHEET_PRIMORDIAL = '/assets/runes_primordial.png';

// Ordem de leitura em linha da spritesheet `runes_primordial.png` — confirmada visualmente
// contra a arte gerada, e igual à ordem em que os glifos alquímicos já aparecem no Anexo 3
// (`🜲 🜄 🜚 🝆 🜃 🝮 🜠 🝓 🜏`) e em `PRIMORDIAL_RUNES` (runeFormulas.ts).
const PRIMORDIAL_RUNE_ORDER: PrimordialRuneId[] =
  ['thal', 'nereh', 'vrak', 'ciss', 'morvo', 'ecoh', 'faro', 'levh', 'umbra'];

// Runas base usam a mesma célula (índice da família em `RUNE_FAMILY_IDS`) nos 3 tiers — o tier
// já é diferenciado pela borda (`RUNE_TIER_BORDERS`), então a arte definitiva não precisa de
// uma célula por tier.
export const getRuneSpriteInfo = (runeId: RuneId): { src: string; index: number } | null => {
  const def = RUNE_CATALOG[runeId];
  if (!def) return null;
  if (def.family) return { src: RUNE_SHEET_BASE, index: RUNE_FAMILY_IDS.indexOf(def.family) };
  const idx = PRIMORDIAL_RUNE_ORDER.indexOf(runeId as PrimordialRuneId);
  return idx >= 0 ? { src: RUNE_SHEET_PRIMORDIAL, index: idx } : null;
};

// Ícone de runa compartilhado (cofre, soquetes, picker da Câmara de Gravação, modais de item) —
// mesmo box colorido/bordado de sempre, com o sprite real por cima do glifo quando disponível.
export const RuneChip: React.FC<{ runeId: RuneId; qty?: number; size?: number; title?: string }> = ({ runeId, qty, size = 34, title }) => {
  const visual = getRuneVisual(runeId);
  const sprite = getRuneSpriteInfo(runeId);
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: `${size}px`, height: `${size}px`, borderRadius: '6px',
        background: visual.bg, border: visual.border, boxShadow: visual.shadow,
        fontSize: `${size * 0.31}rem`, position: 'relative', flexShrink: 0,
      }}
      title={title ?? `${visual.name} (${visual.tierLabel})`}
    >
      {sprite
        ? <IconSprite src={sprite.src} index={sprite.index} fallbackIcon={visual.glyph} />
        : visual.glyph}
      {qty !== undefined && qty > 1 && (
        <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', fontSize: '0.6rem', background: '#0f172a', borderRadius: '4px', padding: '0 3px' }}>
          {qty}
        </span>
      )}
    </span>
  );
};

// Linha de soquetes de um item: ● engastado / ○ vazio / (nada se o item não tem soquetes).
// Compartilhada entre Inventário, Depósito e Câmara de Gravação para nunca divergirem.
export const getSocketDots = (item: Pick<EquipmentItem, 'sockets' | 'socketedRunes'> | null | undefined): string => {
  const sockets = item?.sockets || 0;
  if (sockets <= 0) return '';
  return Array.from({ length: sockets }, (_, i) => (item?.socketedRunes?.[i] ? '●' : '○')).join(' ');
};

// Cor/prefixo de destaque para a linha de texto "Conjunto: ..." nos modais de detalhe do item.
export const getSetPrefixAndColor = (setName: string) => {
  const setAncestral = setName.startsWith('Set Ancestral');
  const setPandemonium = setName.startsWith('Set Pandemoníaco');
  const setCelestial = setName.startsWith('Set Celestial');
  const setBloodMoon = setName.startsWith('Set da Lua de Sangue');
  const setTextColor = setPandemonium ? '#10b981' : (setAncestral ? '#c084fc' : (setCelestial ? '#38bdf8' : (setBloodMoon ? '#f87171' : 'var(--gold-400)')));
  const setShadow = setPandemonium ? '0 0 4px rgba(16, 185, 129, 0.4)' : (setAncestral ? '0 0 4px rgba(192, 132, 252, 0.4)' : (setCelestial ? '0 0 4px rgba(56, 189, 248, 0.4)' : (setBloodMoon ? '0 0 4px rgba(220, 38, 38, 0.4)' : 'none')));
  const prefix = setPandemonium ? '🔥 Conjunto Pandemoníaco: ' : (setAncestral ? '✨ Conjunto Ancestral: ' : (setCelestial ? '🌌 Conjunto Celestial: ' : (setBloodMoon ? '🌕 Conjunto da Lua de Sangue: ' : 'Conjunto: ')));
  return { setTextColor, setShadow, prefix };
};
