import { create } from 'zustand';
import { bridge } from '../bridge/GameBridge';
import { GameEvent } from '../core/types';
import { useGameStore } from './useGameStore';
import { useTowerStore, getWeeklySeed } from './useTowerStore';
import { useDiveStore } from './useDiveStore';
import { rollRuneOfTier } from '../core/runeFormulas';
import {
  getLeviathanAnchorDepth, getLeviathanAttemptsPerWeek, getLeviathanPearlMultiplier,
  getLeviathanProgressForWeek, LEVIATHAN_PHASE_COUNT, LEVIATHAN_PHASE_REWARDS,
} from '../core/leviathanFormulas';

/**
 * v10.4.0 "O Leviatã do Ciclo" — estado de RUNTIME da luta contra o chefe mundial semanal.
 * Mesmo padrão exato do `useDiveStore` (campanha salva/pausada ao iniciar, CombatFSM ramifica em
 * `leviathanActive`, restauração emite START_COMBAT campaign): a diferença é que aqui não há
 * profundidade/Fôlego — só o avanço de 5 fases dentro de uma tentativa e o progresso semanal
 * persistido em `character.sunkenCitadel.leviathanWeeklyProgress`.
 *
 * As recompensas de MORTE (1ª vez / repetição / full clear) são resolvidas em
 * `useGameStore.killLeviathan()` — chamado daqui quando a 5ª fase cai — porque envolvem runas,
 * Set Abissal, títulos (useTowerStore) e a cutscene, todos já expostos como actions do useGameStore.
 */
export interface LeviathanStoreState {
  leviathanActive: boolean;
  currentPhaseIndex: number; // 1-5
  attemptStartPhase: number; // fase em que ESTA tentativa começou (para o bônus de full clear)
  savedStageBeforeFight: number;
  savedEnemiesDefeatedBeforeFight: number;
  lastFightSummary: string | null;

  startLeviathanFight: () => void;
  // Chamado pelo CombatFSM quando o HP da fase atual chega a 0. Banca a recompensa da fase e
  // avança (ou, na 5ª fase, encerra a luta com as recompensas de morte).
  completePhase: () => void;
  exitLeviathanFight: (reason: 'defeat' | 'voluntary') => void;
}

const restoreCampaign = (savedStage: number, savedEnemies: number) => {
  useGameStore.setState((s) => ({
    character: { ...s.character, currentStage: savedStage, enemiesDefeatedInStage: savedEnemies },
  }));
};

export const useLeviathanStore = create<LeviathanStoreState>((set, get) => ({
  leviathanActive: false,
  currentPhaseIndex: 1,
  attemptStartPhase: 1,
  savedStageBeforeFight: 1,
  savedEnemiesDefeatedBeforeFight: 0,
  lastFightSummary: null,

  startLeviathanFight: () => {
    const gameStore = useGameStore.getState();
    const char = gameStore.character;

    if (get().leviathanActive) return;
    if (useTowerStore.getState().towerActive) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: '⚠️ Saia da Torre Infinita antes de desafiar o Leviatã.' });
      return;
    }
    if (useDiveStore.getState().diveActive) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: '⚠️ Suba à superfície antes de desafiar o Leviatã.' });
      return;
    }
    if (char.activeDailyChallenge) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: '⚠️ Saia do Desafio Diário antes de desafiar o Leviatã.' });
      return;
    }
    const throneLevel = char.sunkenCitadel?.districts.throne?.restorationLevel || 0;
    if (throneLevel < 1) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: '🔒 O Trono Afundado precisa estar drenado e restaurado para desafiar o Leviatã.' });
      return;
    }

    const weekSeed = getWeeklySeed();
    const progress = getLeviathanProgressForWeek(char.sunkenCitadel?.leviathanWeeklyProgress, weekSeed);
    if (progress.phasesCleared >= LEVIATHAN_PHASE_COUNT) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: '🏆 Você já derrotou o Leviatã nesta semana — o Coro descansa até domingo.' });
      return;
    }
    const maxAttempts = getLeviathanAttemptsPerWeek(throneLevel);
    if (progress.attemptsUsed >= maxAttempts) {
      bridge.emit(GameEvent.LOG_EMITTED, { message: `❌ Sem tentativas restantes nesta semana (${maxAttempts}/${maxAttempts}). Reinicia no domingo.` });
      return;
    }

    const newProgress = { ...progress, attemptsUsed: progress.attemptsUsed + 1 };
    useGameStore.setState((s) => ({
      character: {
        ...s.character,
        sunkenCitadel: { ...(s.character.sunkenCitadel!), leviathanWeeklyProgress: newProgress },
      },
    }));

    const startPhase = progress.phasesCleared + 1;
    set({
      leviathanActive: true,
      currentPhaseIndex: startPhase,
      attemptStartPhase: startPhase,
      savedStageBeforeFight: char.currentStage,
      savedEnemiesDefeatedBeforeFight: char.enemiesDefeatedInStage,
      lastFightSummary: null,
    });

    bridge.emit(GameEvent.LOG_EMITTED, { message: `🐋 O poço do Trono Afundado ferve... O LEVIATÃ DO CICLO desperta (Fase ${startPhase}/${LEVIATHAN_PHASE_COUNT}).` });
    bridge.emit(GameEvent.START_COMBAT, { mode: 'leviathan' });
  },

  completePhase: () => {
    const state = get();
    if (!state.leviathanActive) return;
    const char = useGameStore.getState().character;
    const pLev = getLeviathanAnchorDepth(char.abyss?.historicalMaxDepth || 0);
    const pearlMult = getLeviathanPearlMultiplier(pLev);
    const phase = state.currentPhaseIndex;

    // Banca a recompensa da fase concluída (1x por fase por semana — protegido por phasesCleared).
    const progress = char.sunkenCitadel?.leviathanWeeklyProgress;
    if (progress && progress.phasesCleared < phase) {
      const reward = LEVIATHAN_PHASE_REWARDS[phase];
      if (reward) {
        const pearls = Math.round(reward.pearls * pearlMult);
        useGameStore.getState().addPearls(pearls);
        let runeMsg = '';
        if (reward.runeTier) {
          const runeId = rollRuneOfTier(reward.runeTier, Math.random());
          useGameStore.getState().addRunes({ [runeId]: 1 });
          runeMsg = ` + 1 Runa T${reward.runeTier}`;
        }
        bridge.emit(GameEvent.LOG_EMITTED, { message: `👑 Fase ${phase} do Leviatã derrotada! +${pearls} Pérolas${runeMsg}.` });
      }
      useGameStore.setState((s) => ({
        character: {
          ...s.character,
          sunkenCitadel: { ...(s.character.sunkenCitadel!), leviathanWeeklyProgress: { ...progress, phasesCleared: phase } },
        },
      }));
    }

    if (phase >= LEVIATHAN_PHASE_COUNT) {
      // Full clear em 1 tentativa: esta tentativa começou na fase 1 (viu as 5 fases sem morrer).
      const fullClearThisAttempt = state.attemptStartPhase === 1;
      useGameStore.getState().killLeviathan(pLev, pearlMult, fullClearThisAttempt);
      restoreCampaign(state.savedStageBeforeFight, state.savedEnemiesDefeatedBeforeFight);
      set({ leviathanActive: false, lastFightSummary: '🏆 O LEVIATÃ DO CICLO foi derrotado!' });
      bridge.emit(GameEvent.START_COMBAT, { mode: 'campaign' });
      return;
    }

    bridge.emit(GameEvent.LEVIATHAN_PHASE_CHANGED, { phase: phase + 1 });
    set({ currentPhaseIndex: phase + 1 });
  },

  exitLeviathanFight: (reason) => {
    const state = get();
    if (!state.leviathanActive) return;
    restoreCampaign(state.savedStageBeforeFight, state.savedEnemiesDefeatedBeforeFight);
    const summary = reason === 'defeat'
      ? `💀 Derrotado pelo Leviatã na Fase ${state.currentPhaseIndex}. As fases já vencidas nesta semana permanecem — a próxima tentativa começa aqui.`
      : '⬆️ Você recuou da luta contra o Leviatã.';
    set({ leviathanActive: false, lastFightSummary: summary });
    bridge.emit(GameEvent.LOG_EMITTED, { message: summary });
    bridge.emit(GameEvent.START_COMBAT, { mode: 'campaign' });
  },
}));
