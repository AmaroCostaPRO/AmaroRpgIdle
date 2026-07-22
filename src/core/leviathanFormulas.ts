// v10.4.0 "O Leviatã do Ciclo" — Fórmulas puras do chefe mundial semanal (Trono Afundado
// restaurado). Módulo compartilhado store ↔ UI ↔ CombatFSM, mesmo padrão de `abyssFormulas.ts`/
// `sunkenCitadelFormulas.ts`: nada de estado aqui, só funções puras.
//
// Referência: Anexo 2 (Ecos Afogados & Leviatã), Parte 2. Escalonamento dinâmico (§2.2): o
// Leviatã sempre luta um degrau abaixo do melhor momento do jogador nas Profundezas — cada
// recorde novo "acorda" um Leviatã maior. HP_ab(p)/Dano_ab(p) do Anexo SÃO literalmente
// `getDiveEnemyHP`/`getDiveEnemyDamage` (abyssFormulas.ts) chamados com depth=p_Lev e
// anchorStage=FULL_DIVE_ANCHOR_STAGE (50, fixo) — zero fórmula nova para o HP/dano base.

import { getDiveEnemyHP, getDiveEnemyDamage, FULL_DIVE_ANCHOR_STAGE } from './abyssFormulas';

// p_Lev = max(90, floor(Recorde histórico das Profundezas × 0.9)) — piso 90 mantém o gate de
// endgame (Fase equiv. ~90, conteúdo pós-Transcendência).
export const getLeviathanAnchorDepth = (historicalMaxDepth: number): number =>
  Math.max(90, Math.floor((historicalMaxDepth || 0) * 0.9));

export const LEVIATHAN_HP_MULT = 8.0;      // HP por fase = HP_ab(p_Lev) × 8
export const LEVIATHAN_DMG_MULT = 4.5;     // Dano base = Dano_ab(p_Lev) × 4.5
export const LEVIATHAN_PHASE_COUNT = 5;

export const getLeviathanPhaseHP = (pLev: number): number =>
  getDiveEnemyHP(pLev, FULL_DIVE_ANCHOR_STAGE, LEVIATHAN_HP_MULT);

export const getLeviathanBaseDamage = (pLev: number): number =>
  getDiveEnemyDamage(pLev, FULL_DIVE_ANCHOR_STAGE, LEVIATHAN_DMG_MULT);

// Multiplicador de Pérolas das recompensas: 1 + p_Lev/100.
export const getLeviathanPearlMultiplier = (pLev: number): number => 1 + pLev / 100;

// Pressão FIXA ×2.5 no Traje 0 ("a presença dele pesa"), reduzível pelo Traje normalmente (mesma
// redução de 6%/nível que a Pressão das Profundezas usa em getPressureMultiplier).
export const getLeviathanPressureMultiplier = (divingSuitLevel: number = 0): number =>
  1 + 1.5 * (1 - 0.06 * divingSuitLevel);

// Tentativas por semana: 3, ou 4 com o Trono Restaurado III.
export const getLeviathanAttemptsPerWeek = (throneRestorationLevel: number): number =>
  throneRestorationLevel >= 3 ? 4 : 3;

// ─── As 5 fases (Anexo 2 §2.3) ────────────────────────────────────────────────

export type LeviathanPhaseMechanic = 'vagalhao' | 'prole' | 'inundacao' | 'bioluminescente' | 'furia';

export interface LeviathanPhaseDef {
  index: number;          // 1-5
  name: string;
  subtitle: string;
  attackCooldownMs: number;
  damageMult: number;     // sobre getLeviathanBaseDamage
  speedMult: number;      // sobre a velocidade de ataque padrão (1.0 = neutro)
  mechanic: LeviathanPhaseMechanic;
}

export const LEVIATHAN_PHASES: LeviathanPhaseDef[] = [
  { index: 1, name: 'O DESPERTAR', subtitle: 'A água do poço ferve. Algo antigo abre um olho.', attackCooldownMs: 4000, damageMult: 1.3, speedMult: 1.0, mechanic: 'vagalhao' },
  { index: 2, name: 'A PROLE', subtitle: 'O poço cospe filhotes. Eles não vêm te matar — vêm morrer por ele.', attackCooldownMs: 2800, damageMult: 1.0, speedMult: 1.0, mechanic: 'prole' },
  { index: 3, name: 'A INUNDAÇÃO', subtitle: 'Ele para de lutar contra você. Ele afoga a sala.', attackCooldownMs: 2800, damageMult: 0.7, speedMult: 1.8, mechanic: 'inundacao' },
  { index: 4, name: 'O OLHAR DO ABISMO', subtitle: 'Ele te estuda. E o que ele aprende, ele pune.', attackCooldownMs: 3200, damageMult: 1.15, speedMult: 1.0, mechanic: 'bioluminescente' },
  { index: 5, name: 'O CORAÇÃO DO CICLO', subtitle: 'Sem mecânicas. Sem truques. Só ele, você, e a pergunta de quem acaba primeiro.', attackCooldownMs: 2800, damageMult: 1.0, speedMult: 1.0, mechanic: 'furia' },
];

export const getLeviathanPhase = (index: number): LeviathanPhaseDef =>
  LEVIATHAN_PHASES[Math.min(LEVIATHAN_PHASES.length - 1, Math.max(0, index - 1))];

// Escudo de Prole (Fase 2): 25% do HP da fase, refaz a cada 15s sem escudo — mesmo padrão do
// Guardião das Profundezas (enemyShield/enemyShieldTimer).
export const LEVIATHAN_PROLE_SHIELD_PCT = 0.25;
export const LEVIATHAN_PROLE_SHIELD_REBUILD_MS = 15000;

// Vagalhão (Fases 1 e 5): canaliza, dano ×4 se completar. Fase 1 interrompível por Atordoamento;
// Fase 5 NÃO (tint vermelho sinaliza a diferença).
export const LEVIATHAN_VAGALHAO_INTERVAL_MS = { phase1: 20000, phase5: 15000 };
export const LEVIATHAN_VAGALHAO_CHANNEL_MS = 3000;
export const LEVIATHAN_VAGALHAO_DAMAGE_MULT = 4.0;

// Fase 5 (Vagalhão NÃO-interrompível): 30% de chance de atordoar o jogador por 2s ao completar —
// o único stun do jogo aplicado ao jogador, alvo real da imunidade da Palavra Rúnica ÂNCORA DO
// MUNDO (antes uma flag catalogada sem nenhum consumidor).
export const LEVIATHAN_PHASE5_STUN_CHANCE = 0.3;
export const LEVIATHAN_PHASE5_STUN_DURATION_MS = 2000;

// Correnteza (Fase 3): [LENTO] a cada 12s por 4s (−40% velocidade de ataque do herói).
export const LEVIATHAN_CORRENTEZA_INTERVAL_MS = 12000;
export const LEVIATHAN_CORRENTEZA_DURATION_MS = 4000;

// Ciclo Bioluminescente (Fase 4): janelas de 6s, "Aceso" +50%/"Apagado" −70% + reflete 15% do
// dano absorvido nessa janela (variação do afixo padrão, que é ±40% sem reflexo).
export const LEVIATHAN_BIOLUM_WINDOW_MS = 6000;
export const LEVIATHAN_BIOLUM_LIT_MULT = 1.5;
export const LEVIATHAN_BIOLUM_DARK_MULT = 0.3;
export const LEVIATHAN_BIOLUM_DARK_REFLECT_PCT = 0.15;

// Canto Abissal (Fase 4): canaliza 5s a cada 30s; se completar, cura 3% do HP da fase. Interrompível.
export const LEVIATHAN_CANTO_INTERVAL_MS = 30000;
export const LEVIATHAN_CANTO_CHANNEL_MS = 5000;
export const LEVIATHAN_CANTO_HEAL_PCT = 0.03;

// Fúria do Ciclo (Fase 5): +2% de dano/velocidade a cada 10s decorridos de fase, cap técnico +200%.
export const LEVIATHAN_FURIA_TICK_MS = 10000;
export const LEVIATHAN_FURIA_PCT_PER_TICK = 0.02;
export const LEVIATHAN_FURIA_CAP = 2.0;

// ─── Recompensas por fase (Anexo 2 §2.4) ──────────────────────────────────────

export interface LeviathanPhaseReward { pearls: number; runeTier?: 2 | 3 }
export const LEVIATHAN_PHASE_REWARDS: Record<number, LeviathanPhaseReward> = {
  1: { pearls: 50 },
  2: { pearls: 75, runeTier: 2 },
  3: { pearls: 100, runeTier: 3 },
  4: { pearls: 150, runeTier: 3 },
};
export const LEVIATHAN_KILL_REPEAT_PEARLS = 50;
export const LEVIATHAN_KILL_REPEAT_2ND_PIECE_CHANCE = 0.10;
export const LEVIATHAN_FULL_CLEAR_BONUS_PEARLS = 100;

// ─── Reset semanal (mesmo padrão de checkWeeklyReset em useTowerStore.ts) ────

export interface LeviathanWeeklyProgress { weekSeed: number; phasesCleared: number; attemptsUsed: number }

export const DEFAULT_LEVIATHAN_WEEKLY_PROGRESS = (weekSeed: number): LeviathanWeeklyProgress =>
  ({ weekSeed, phasesCleared: 0, attemptsUsed: 0 });

// Função pura: se a semana virou desde o último progresso salvo, devolve um progresso zerado;
// senão devolve o mesmo objeto (referência estável, evita re-renders/saves desnecessários).
export const getLeviathanProgressForWeek = (
  progress: LeviathanWeeklyProgress | undefined,
  currentWeekSeed: number
): LeviathanWeeklyProgress =>
  (!progress || progress.weekSeed !== currentWeekSeed)
    ? DEFAULT_LEVIATHAN_WEEKLY_PROGRESS(currentWeekSeed)
    : progress;
