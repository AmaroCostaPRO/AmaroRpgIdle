import React, { useState } from 'react';
import { AudioManager } from '../../core/AudioManager';
import { useCountdown } from '../../hooks/useCountdown';
import type { DistrictId, SunkenDistrictState } from '../../core/types';
import { DISTRICT_NAMES, DISTRICT_ICONS, DISTRICT_DRAIN_COST } from '../../core/sunkenCitadelFormulas';
import { EvolutionSprite } from '../citadel/EvolutionSprite';
import { SUNKEN_BUILDING_SPRITE_SRC } from '../citadel/sunkenBuildingSprites';

// Grade fixa 2×3 do Anexo 3 §1.4/§2.4 — colunas 18/50/82%, linhas 32/72%. Layout:
// [dock, echoHall, forge] em cima / [temple, archive, throne] embaixo (mesma ordem já documentada
// em `DISTRICT_ADJACENCY`, sunkenCitadelFormulas.ts). Isoladas aqui como constantes — se
// `submersa_background.png` for adicionada depois com um layout de clareiras diferente, só estes
// valores mudam (mesmo princípio já usado por `CitadelSpriteStage.tsx`).
const MARKER_POSITIONS: Record<DistrictId, { top: number; left: number }> = {
  dock: { top: 32, left: 18 },
  echoHall: { top: 32, left: 50 },
  forge: { top: 32, left: 82 },
  temple: { top: 72, left: 18 },
  archive: { top: 72, left: 50 },
  throne: { top: 72, left: 82 },
};

interface DistrictMarkerProps {
  id: DistrictId;
  state: SunkenDistrictState | undefined;
  assignedCount: number;
  slots: number;
  eligibleForAllocation: boolean;
  isModalOpen: boolean;
  onClick: (id: DistrictId) => void;
}

// Componente próprio por marcador: `useCountdown` só pode ser chamado no topo de um componente,
// nunca dentro de um `.map()`.
const DistrictMarker: React.FC<DistrictMarkerProps> = ({ id, state, assignedCount, slots, eligibleForAllocation, isModalOpen, onClick }) => {
  const flooded = !state || state.flooded;
  const draining = !!state?.drainUpgrade;
  const restorationLevel = state?.restorationLevel || 0;
  const drainCountdown = useCountdown(state?.drainUpgrade?.completesAt);
  const [hovered, setHovered] = useState(false);
  const highlighted = hovered || isModalOpen || eligibleForAllocation;

  // Overlay de água: 100% (cobre tudo) enquanto Alagado; desce em tempo real durante a drenagem
  // (proporção do tempo restante contra a duração total conhecida do distrito); 0% quando Restaurado.
  let waterHeightPct = 0;
  if (flooded && !draining) waterHeightPct = 100;
  else if (draining && state?.drainUpgrade) {
    const totalMs = DISTRICT_DRAIN_COST[id].durationHours * 3600000;
    const remainingMs = state.drainUpgrade.completesAt - Date.now();
    waterHeightPct = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
  }

  return (
    <div
      onClick={() => { AudioManager.getInstance().playClick(); onClick(id); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`${DISTRICT_NAMES[id]} — ${flooded && !draining ? 'Alagado' : draining ? `Drenando (${drainCountdown})` : `Restaurado ${restorationLevel === 1 ? 'I' : restorationLevel === 2 ? 'II' : 'III'}`}`}
      style={{ position: 'absolute', top: `${MARKER_POSITIONS[id].top}%`, left: `${MARKER_POSITIONS[id].left}%`, transform: 'translate(-50%, -50%)', textAlign: 'center', cursor: 'pointer' }}
    >
      {eligibleForAllocation && (
        <span style={{
          position: 'absolute', inset: '-8px', borderRadius: '999px', border: '2px solid #4ade80',
          animation: 'submersa-marker-pulse 1.1s ease-out infinite', pointerEvents: 'none',
        }} />
      )}
      <div style={{
        position: 'relative', width: '84px', height: '84px', margin: '0 auto',
        borderRadius: 'var(--radius-lg)',
        background: flooded ? 'linear-gradient(160deg, #0c4a6e, #082f49)' : 'linear-gradient(155deg, var(--surface-3), var(--surface-2))',
        border: `2px solid ${highlighted ? '#22d3ee' : 'rgba(255,255,255,0.15)'}`,
        boxShadow: highlighted ? '0 0 18px rgba(34,211,238,0.5)' : 'none',
        transform: highlighted ? 'scale(1.08)' : 'scale(1)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        overflow: 'hidden',
      }}>
        <EvolutionSprite src={SUNKEN_BUILDING_SPRITE_SRC[id]} level={restorationLevel} maxLevel={3} fallbackIcon={DISTRICT_ICONS[id]} fallbackClassName="submersa-marker-icon" />
        {/* Overlay de água CSS — altura animada, sobre o marcador */}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: `${waterHeightPct}%`,
          background: 'linear-gradient(180deg, rgba(34,211,238,0.15), rgba(8,47,73,0.75))',
          transition: 'height 2s linear', pointerEvents: 'none',
        }} />
        {!flooded && (
          <span style={{
            position: 'absolute', bottom: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#a5f3fc',
            fontSize: '0.55rem', fontFamily: 'var(--font-mono)', padding: '0 3px', borderRadius: '4px',
          }}>
            {assignedCount}/{slots}
          </span>
        )}
      </div>
      <span style={{
        display: 'block', marginTop: '0.3rem', fontSize: '0.62rem', fontWeight: 700,
        color: flooded ? 'rgba(255,255,255,0.5)' : '#fff', whiteSpace: 'nowrap',
      }}>
        {DISTRICT_ICONS[id]} {DISTRICT_NAMES[id]}
      </span>
    </div>
  );
};

interface SubmersaSpriteStageProps {
  districts: Partial<Record<DistrictId, SunkenDistrictState>>;
  assignedCounts: Record<DistrictId, number>;
  slotsByDistrict: Record<DistrictId, number>;
  eligibleForAllocation: DistrictId[];
  activeDistrictId: DistrictId | null;
  onDistrictClick: (id: DistrictId) => void;
}

/**
 * v10.2.0 "Os Ecos Afogados" (revisão de fidelidade ao Anexo 3) — pátio 2×3 da Cidadela Submersa,
 * mesmo esqueleto de `CitadelSpriteStage.tsx`. Sem `submersa_background.png` ainda: fundo em CSS
 * (gradiente aquático) até o asset chegar — `EvolutionSprite` já cai no ícone de fallback sozinho
 * quando os sprites de distrito também não existirem.
 */
export const SubmersaSpriteStage: React.FC<SubmersaSpriteStageProps> = ({
  districts, assignedCounts, slotsByDistrict, eligibleForAllocation, activeDistrictId, onDistrictClick,
}) => {
  const districtIds = Object.keys(MARKER_POSITIONS) as DistrictId[];

  return (
    <div style={{
      position: 'relative', width: '100%', minHeight: '340px', borderRadius: 'var(--radius-md, 8px)',
      background: 'radial-gradient(ellipse at 50% 30%, rgba(8,80,110,0.45), rgba(2,20,34,0.9))',
      border: '1px solid rgba(34, 211, 238, 0.2)', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes submersa-marker-pulse {
          0% { opacity: 0.8; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.25); }
        }
        .submersa-marker-icon { font-size: 2.1rem; }
        @media (max-width: 840px) {
          .submersa-marker-icon { font-size: 1.4rem; }
        }
      `}</style>
      {districtIds.map((id) => (
        <DistrictMarker
          key={id}
          id={id}
          state={districts[id]}
          assignedCount={assignedCounts[id] || 0}
          slots={slotsByDistrict[id] || 0}
          eligibleForAllocation={eligibleForAllocation.includes(id)}
          isModalOpen={activeDistrictId === id}
          onClick={onDistrictClick}
        />
      ))}
    </div>
  );
};
