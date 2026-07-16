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
  consumable: 'Consumível'
};

export const slotIcons: Record<string, string> = {
  head: '🪖',
  chest: '👕',
  legs: '👖',
  gloves: '🧤',
  weapon: '⚔️',
  necklace: '📿',
  amulet: '🧿',
  consumable: '📦'
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
  frenzyChancePct: 'Chance de Frenesi'
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
    'critDamage'
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
  isPandemoniumMystic: boolean;
  isPandemoniumBase: boolean;
  border: string;
  shadow: string;
  bg: string;
}

// Calcula borda/glow/fundo de um item com base no seu conjunto (Ancestral/Pandemoníaco/Celestial),
// com fallback para a cor de raridade padrão quando o item não pertence a nenhum conjunto especial.
export const getSetVisual = (item: { setName?: string; rarity: string } | null | undefined): SetVisual => {
  const setName = item?.setName;
  const isAncestral = !!(setName && setName.startsWith('Set Ancestral'));
  const isPandemonium = !!(setName && setName.startsWith('Set Pandemoníaco'));
  const isCelestial = !!(setName && setName.startsWith('Set Celestial'));
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
    }
  }

  return { isAncestral, isPandemonium, isCelestial, isPandemoniumMystic, isPandemoniumBase, border, shadow, bg };
};

// Cor/prefixo de destaque para a linha de texto "Conjunto: ..." nos modais de detalhe do item.
export const getSetPrefixAndColor = (setName: string) => {
  const setAncestral = setName.startsWith('Set Ancestral');
  const setPandemonium = setName.startsWith('Set Pandemoníaco');
  const setCelestial = setName.startsWith('Set Celestial');
  const setTextColor = setPandemonium ? '#10b981' : (setAncestral ? '#c084fc' : (setCelestial ? '#38bdf8' : 'var(--gold-400)'));
  const setShadow = setPandemonium ? '0 0 4px rgba(16, 185, 129, 0.4)' : (setAncestral ? '0 0 4px rgba(192, 132, 252, 0.4)' : (setCelestial ? '0 0 4px rgba(56, 189, 248, 0.4)' : 'none'));
  const prefix = setPandemonium ? '🔥 Conjunto Pandemoníaco: ' : (setAncestral ? '✨ Conjunto Ancestral: ' : (setCelestial ? '🌌 Conjunto Celestial: ' : 'Conjunto: '));
  return { setTextColor, setShadow, prefix };
};
