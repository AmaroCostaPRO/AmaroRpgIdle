import React, { useState } from 'react';
import { AudioManager } from '../../core/AudioManager';
import { useCountdown } from '../../hooks/useCountdown';
import { useGameStore } from '../../store/useGameStore';
import { bridge } from '../../bridge/GameBridge';
import { GameEvent } from '../../core/types';
import type { DistrictId, SunkenDistrictState } from '../../core/types';
import { DISTRICT_NAMES, DISTRICT_ICONS, DISTRICT_DRAIN_COST, DISTRICT_IDS, getDistrictSlotCount } from '../../core/sunkenCitadelFormulas';
import { EvolutionSprite } from '../citadel/EvolutionSprite';
import { SUNKEN_BUILDING_SPRITE_SRC } from '../citadel/sunkenBuildingSprites';

// Background definitivo do pátio da Cidadela Submersa — mesmo padrão de `CitadelSpriteStage.tsx`
// (imagem quadrada 1024x1024, esticada com `object-fit: fill` para preencher o container sem
// cortes nem barras, já que os marcadores usam as mesmas porcentagens de `top`/`left` e por isso
// acompanham o esticamento perfeitamente). Se a imagem for regerada com um layout de clareiras
// diferente, ajuste `MARKER_POSITIONS` abaixo para acompanhar.
const BACKGROUND_SRC = '/assets/submersa_background.png';

// Grade fixa 2×3 do Anexo 3 §1.4/§2.4 — colunas 21/50/79%, linhas 28/72% (calibradas por análise
// de pixel contra as 6 clareiras circulares reais de `submersa_background.png` após o recorte
// centralizado que aproximou os círculos das bordas). Layout: [dock, echoHall, forge] em cima /
// [temple, archive, throne] embaixo (mesma ordem já documentada em `DISTRICT_ADJACENCY`,
// sunkenCitadelFormulas.ts). Isoladas aqui como constantes — se `submersa_background.png` for
// regerada com um layout de clareiras diferente, só estes valores mudam (mesmo princípio já usado
// por `CitadelSpriteStage.tsx`).
const MARKER_POSITIONS: Record<DistrictId, { top: number; left: number }> = {
  dock: { top: 28, left: 21 },
  echoHall: { top: 28, left: 50 },
  forge: { top: 28, left: 79 },
  temple: { top: 72, left: 21 },
  archive: { top: 72, left: 50 },
  throne: { top: 72, left: 79 },
};

interface DistrictMarkerProps {
  id: DistrictId;
  state: SunkenDistrictState | undefined;
  assignedCount: number;
  slots: number;
  eligibleForAllocation: boolean;
  pendingAssignment: boolean;
  onClick: (id: DistrictId) => void;
}

// Componente próprio por marcador: `useCountdown` só pode ser chamado no topo de um componente,
// nunca dentro de um `.map()`.
const DistrictMarker: React.FC<DistrictMarkerProps> = ({ id, state, assignedCount, slots, eligibleForAllocation, pendingAssignment, onClick }) => {
  const flooded = !state || state.flooded;
  const draining = !!state?.drainUpgrade;
  const restorationLevel = state?.restorationLevel || 0;
  const drainCountdown = useCountdown(state?.drainUpgrade?.completesAt);
  const [hovered, setHovered] = useState(false);
  const highlighted = hovered || pendingAssignment || eligibleForAllocation;

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

/**
 * Overlay da Cidadela Submersa — mesmo esqueleto de `CitadelSpriteStage.tsx`: montado em `App.tsx`
 * dentro de `#game-container`, cobrindo o combate, numa árvore React separada de `GameUI.tsx`. Por
 * isso lê `character.sunkenCitadel` direto da store em vez de receber props do painel de conteúdo.
 *
 * Clicar num distrito sem Eco selecionado só navega (emite `SUNKEN_SUBTAB_REQUESTED`, espelhando o
 * `CITADEL_SUBTAB_REQUESTED` dos marcadores de prédio da Cidadela normal). Com um Eco selecionado
 * (`selectedEchoId` na store, escolhido no painel "Ecos"), tocar um distrito elegível arma a
 * alocação (contorno pulsante) e um 2º toque no mesmo distrito em ~4s confirma — fluxo que só faz
 * sentido tocando o mapa, por isso continua aqui em vez de mover para o painel de conteúdo.
 */
export const SunkenCitadelSpriteStage: React.FC = () => {
  const character = useGameStore((state) => state.character);
  const selectedEchoId = useGameStore((state) => state.selectedEchoId);
  const pendingEchoDistrict = useGameStore((state) => state.pendingEchoDistrict);
  const setPendingEchoDistrict = useGameStore((state) => state.setPendingEchoDistrict);
  const setSelectedEchoId = useGameStore((state) => state.setSelectedEchoId);
  const assignEcho = useGameStore((state) => state.assignEcho);

  const sunken = character.sunkenCitadel;
  const districts = sunken?.districts || {};
  const echoes = sunken?.echoes || [];
  const selectedEcho = selectedEchoId ? echoes.find((e) => e.id === selectedEchoId) : undefined;
  const restoredDistrictIds = DISTRICT_IDS.filter((id) => (districts[id]?.restorationLevel || 0) >= 1);
  const eligibleForAllocation = selectedEcho ? restoredDistrictIds : [];

  const assignedCounts = DISTRICT_IDS.reduce((acc, id) => {
    acc[id] = echoes.filter((e) => e.assignedDistrict === id).length;
    return acc;
  }, {} as Record<DistrictId, number>);
  const slotsByDistrict = DISTRICT_IDS.reduce((acc, id) => {
    acc[id] = getDistrictSlotCount(districts[id]?.restorationLevel || 0);
    return acc;
  }, {} as Record<DistrictId, number>);

  const pendingTimer = React.useRef<number | undefined>(undefined);

  const handleDistrictClick = (id: DistrictId) => {
    const isEligible = selectedEcho && restoredDistrictIds.includes(id);
    if (!isEligible) {
      bridge.emit(GameEvent.SUNKEN_SUBTAB_REQUESTED, { subTab: id });
      return;
    }
    if (pendingEchoDistrict === id) {
      // 2º toque no mesmo distrito — confirma a alocação.
      if (pendingTimer.current) window.clearTimeout(pendingTimer.current);
      setPendingEchoDistrict(null);
      const res = assignEcho(selectedEcho!.id, id);
      if (res.success) {
        AudioManager.getInstance().playUpgrade();
        setSelectedEchoId(null);
      }
    } else {
      // 1º toque — arma a confirmação (some sozinha em 4s se não for confirmada).
      setPendingEchoDistrict(id);
      if (pendingTimer.current) window.clearTimeout(pendingTimer.current);
      pendingTimer.current = window.setTimeout(() => setPendingEchoDistrict(null), 4000);
    }
  };

  const districtIds = Object.keys(MARKER_POSITIONS) as DistrictId[];

  return (
    <div
      className="citadel-sprite-stage"
      style={{ position: 'absolute', inset: 0, zIndex: 25, overflow: 'hidden' }}
    >
      <img
        src={BACKGROUND_SRC}
        alt=""
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }}
      />
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
          pendingAssignment={pendingEchoDistrict === id}
          onClick={handleDistrictClick}
        />
      ))}
    </div>
  );
};
