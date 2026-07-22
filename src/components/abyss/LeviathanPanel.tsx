import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useLeviathanStore } from '../../store/useLeviathanStore';
import { useTowerStore, getWeeklySeed } from '../../store/useTowerStore';
import { AudioManager } from '../../core/AudioManager';
import {
  getLeviathanAttemptsPerWeek, getLeviathanProgressForWeek, LEVIATHAN_PHASES, LEVIATHAN_PHASE_COUNT,
} from '../../core/leviathanFormulas';
import { sumDistrictEfficacy, calculateEchoEfficacies, getTidePhase } from '../../core/sunkenCitadelFormulas';

/**
 * v10.4.0 "O Leviatã do Ciclo" — card do Trono Afundado: progresso semanal (5 fases, tentativas),
 * bônus dos Ecos Guardiões alocados, e o botão de desafio. Durante a luta, o subtítulo da fase
 * atual aparece no HUD de combate (GameUI.tsx escuta LEVIATHAN_PHASE_CHANGED separadamente).
 */
export const LeviathanPanel: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const leviathanActive = useLeviathanStore((s) => s.leviathanActive);
  const currentPhaseIndex = useLeviathanStore((s) => s.currentPhaseIndex);
  const lastFightSummary = useLeviathanStore((s) => s.lastFightSummary);
  const startLeviathanFight = useLeviathanStore((s) => s.startLeviathanFight);

  const throneLevel = character.sunkenCitadel?.districts.throne?.restorationLevel || 0;
  const weekSeed = getWeeklySeed();
  const progress = getLeviathanProgressForWeek(character.sunkenCitadel?.leviathanWeeklyProgress, weekSeed);
  const maxAttempts = getLeviathanAttemptsPerWeek(throneLevel);
  const echoes = character.sunkenCitadel?.echoes || [];
  const throneEfficacy = sumDistrictEfficacy(calculateEchoEfficacies(echoes, getTidePhase()), 'throne');

  const handleChallenge = () => {
    AudioManager.getInstance().playClick();
    startLeviathanFight();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.4rem' }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 700 }}>🐋 O Leviatã do Ciclo</p>

      {/* Barra de HP segmentada em 5 — fases já vencidas nesta semana esmaecidas */}
      <div style={{ display: 'flex', gap: '3px' }}>
        {LEVIATHAN_PHASES.map((phase) => {
          const cleared = progress.phasesCleared >= phase.index;
          const isCurrent = leviathanActive && currentPhaseIndex === phase.index;
          return (
            <div
              key={phase.index}
              title={`${phase.name}${cleared ? ' (vencida esta semana)' : ''}`}
              style={{
                flex: 1, height: '10px', borderRadius: '3px',
                background: cleared ? 'rgba(255,255,255,0.15)' : (isCurrent ? '#38bdf8' : 'rgba(14, 116, 144, 0.5)'),
                border: isCurrent ? '1px solid #fff' : '1px solid rgba(255,255,255,0.15)',
              }}
            />
          );
        })}
      </div>

      <p style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.55)' }}>
        Tentativas: <strong>{progress.attemptsUsed}/{maxAttempts}</strong> · reinicia domingo
        {progress.phasesCleared > 0 && progress.phasesCleared < LEVIATHAN_PHASE_COUNT && ` · próxima tentativa começa na Fase ${progress.phasesCleared + 1}`}
        {progress.phasesCleared >= LEVIATHAN_PHASE_COUNT && ' · 🏆 derrotado nesta semana'}
      </p>

      {throneEfficacy > 0 && (
        <p style={{ fontSize: '0.65rem', color: '#a5f3fc' }}>
          Ecos Guardiões do Trono: +{(throneEfficacy * 100).toFixed(1)}% dano causado / −{(throneEfficacy * (2 / 3) * 100).toFixed(1)}% dano recebido na luta.
        </p>
      )}

      {lastFightSummary && !leviathanActive && (
        <p style={{ fontSize: '0.68rem', color: '#fde047' }}>{lastFightSummary}</p>
      )}

      <button
        onClick={handleChallenge}
        disabled={leviathanActive || progress.attemptsUsed >= maxAttempts || progress.phasesCleared >= LEVIATHAN_PHASE_COUNT}
        className="btn btn-gold"
        style={{ alignSelf: 'flex-start', fontSize: '0.72rem', opacity: (leviathanActive || progress.attemptsUsed >= maxAttempts || progress.phasesCleared >= LEVIATHAN_PHASE_COUNT) ? 0.5 : 1 }}
      >
        {leviathanActive ? '🐋 Luta em andamento...' : '⚔️ DESAFIAR O LEVIATÃ'}
      </button>
    </div>
  );
};
