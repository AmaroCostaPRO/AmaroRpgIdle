// v11.5.0 "Títulos com Propósito": os 3 pools de títulos honoríficos do jogo (Torre Normal,
// Ramificação de Maldições, Profundezas do Abismo) passam a conceder um bônus de stat diferente
// cada um, escalando com o NÍVEL do título (posição na lista, 1º = nível 1). Como `equippedTitle`
// (`useTowerStore.ts`) é um campo único compartilhado entre as 3 listas, só o bônus do título
// atualmente equipado vale — nunca cumulativo entre listas, transformando a escolha de título numa
// decisão estratégica. Módulo isolado (sem import de stores) para não criar ciclo com StatEngine.ts,
// que já é importado por `useTowerStore.ts` (`pickRandomElements`) — `NORMAL_TITLE_MILESTONES`,
// `CURSE_TITLE_MILESTONES` e `PROFUNDEZAS_TITLE_MILESTONES` viveram antes em `useTowerStore.ts` e
// `abyssFormulas.ts`, que agora só as re-exportam daqui.
export const NORMAL_TITLE_MILESTONES: Record<number, string> = {
  5: 'Iniciante da Torre',
  10: 'Desbravador da Torre',
  20: 'Conquistador das Alturas',
  30: 'Guardião da Torre',
  50: 'Mestre do Infinito',
  100: 'Lenda Eterna',
};
export const CURSE_TITLE_MILESTONES: Record<number, string> = {
  5: 'Tocado pela Sombra',
  10: 'Andarilho do Espelho Faminto',
  20: 'Herdeiro da Maldição',
  30: 'Senhor das Cicatrizes',
  50: 'Devorador de Bênçãos',
  100: 'Avatar do Vazio Eterno',
};
export const PROFUNDEZAS_TITLE_MILESTONES: Record<number, string> = {
  10: 'Molhado de Coragem',
  25: 'Vencedor do Recife Partido',
  50: 'Sobrevivente das Algas Negras',
  80: 'Andarilho das Ruínas Afundadas',
  120: 'Peregrino da Fossa do Caco',
  200: 'O Que Voltou do Fundo',
};

export const TITLE_HP_PCT_PER_LEVEL = 0.02;
export const TITLE_DAMAGE_PCT_PER_LEVEL = 0.02;
export const TITLE_CRIT_DAMAGE_PER_LEVEL = 5;

// Nível do título = posição (1-based) na lista ordenada pelo marco de desbloqueio. 0 se o título
// não pertence a essa lista (nome vazio/desequipado incluso).
export const getTitleTier = (milestones: Record<number, string>, title: string): number => {
  if (!title) return 0;
  const sortedFloors = Object.keys(milestones).map(Number).sort((a, b) => a - b);
  const idx = sortedFloors.findIndex((floor) => milestones[floor] === title);
  return idx === -1 ? 0 : idx + 1;
};

export interface EquippedTitleBonus {
  maxHpPct: number;
  damageMultiplierPct: number;
  critDamage: number;
}

// Testa o título equipado contra as 3 listas em ordem (Normal → Maldições → Profundezas) — um
// título só pertence a uma delas, então o primeiro match já resolve. Retorna tudo zerado se
// desequipado ou (por segurança) se o nome não bater com nenhum pool conhecido.
export const getEquippedTitleBonus = (equippedTitle: string): EquippedTitleBonus => {
  const normalTier = getTitleTier(NORMAL_TITLE_MILESTONES, equippedTitle);
  if (normalTier > 0) {
    return { maxHpPct: normalTier * TITLE_HP_PCT_PER_LEVEL, damageMultiplierPct: 0, critDamage: 0 };
  }
  const curseTier = getTitleTier(CURSE_TITLE_MILESTONES, equippedTitle);
  if (curseTier > 0) {
    return { maxHpPct: 0, damageMultiplierPct: curseTier * TITLE_DAMAGE_PCT_PER_LEVEL, critDamage: 0 };
  }
  const abyssTier = getTitleTier(PROFUNDEZAS_TITLE_MILESTONES, equippedTitle);
  if (abyssTier > 0) {
    return { maxHpPct: 0, damageMultiplierPct: 0, critDamage: abyssTier * TITLE_CRIT_DAMAGE_PER_LEVEL };
  }
  return { maxHpPct: 0, damageMultiplierPct: 0, critDamage: 0 };
};

// Rótulo pronto pra UI (galeria de títulos, caixa de título equipado). Retorna string vazia se
// desequipado ou sem bônus reconhecido.
export const getTitleBonusLabel = (equippedTitle: string): string => {
  const bonus = getEquippedTitleBonus(equippedTitle);
  if (bonus.maxHpPct > 0) return `+${Math.round(bonus.maxHpPct * 100)}% Vida Máxima`;
  if (bonus.damageMultiplierPct > 0) return `+${Math.round(bonus.damageMultiplierPct * 100)}% Dano Geral`;
  if (bonus.critDamage > 0) return `+${bonus.critDamage}% Dano Crítico`;
  return '';
};
