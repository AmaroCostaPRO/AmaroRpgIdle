import React, { useEffect, useState } from 'react';
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
// diferente, ajuste `MARKER_POSITIONS`/`DISTRICT_TILE_SIZE` abaixo para acompanhar.
const BACKGROUND_SRC = '/assets/submersa_background.png';

// Centro e tamanho de cada clareira circular medidos diretamente em `submersa_background.png`
// (1024×1024) via flood-fill em canvas a partir das posições aproximadas anteriores — as 6
// clareiras são praticamente idênticas (~19% de largura × ~19% de altura do canvas), por isso um
// único tamanho compartilhado (`DISTRICT_TILE_SIZE`) é suficiente. Como o background é esticado com
// `object-fit: fill`, dimensionar o marcador em % (em vez de px fixo) faz com que ele acompanhe
// exatamente o mesmo esticamento do círculo, virando elipse quando o container não é quadrado.
const DISTRICT_TILE_SIZE = { width: 19, height: 19 };

const MARKER_POSITIONS: Record<DistrictId, { top: number; left: number }> = {
  dock: { top: 28.17, left: 21.39 },
  echoHall: { top: 27.98, left: 49.90 },
  forge: { top: 28.13, left: 78.52 },
  temple: { top: 72.22, left: 21.39 },
  archive: { top: 72.22, left: 50.15 },
  throne: { top: 72.27, left: 78.71 },
};

interface DistrictMarkerProps {
  id: DistrictId;
  state: SunkenDistrictState | undefined;
  assignedCount: number;
  slots: number;
  eligibleForAllocation: boolean;
  pendingAssignment: boolean;
  active: boolean;
  onClick: (id: DistrictId) => void;
}

// Componente próprio por marcador: `useCountdown` só pode ser chamado no topo de um componente,
// nunca dentro de um `.map()`.
const DistrictMarker: React.FC<DistrictMarkerProps> = ({ id, state, assignedCount, slots, eligibleForAllocation, pendingAssignment, active, onClick }) => {
  const flooded = !state || state.flooded;
  const draining = !!state?.drainUpgrade;
  const restorationLevel = state?.restorationLevel || 0;
  const drainCountdown = useCountdown(state?.drainUpgrade?.completesAt);
  const [hovered, setHovered] = useState(false);
  const [hasArt, setHasArt] = useState(false);
  // Mesmo efeito de "aumentar" do hover da Cidadela normal (`BuildingMarker`), mas mantido fixo
  // enquanto essa construção for a sub-aba atualmente aberta — deixa claro qual distrito
  // corresponde ao painel visível abaixo da barra de abas.
  const highlighted = hovered || pendingAssignment || eligibleForAllocation || active;

  // Overlay de água: 100% (cobre toda a clareira) enquanto Alagado; desce em tempo real durante a
  // drenagem (proporção do tempo restante contra a duração total conhecida do distrito); 0% quando
  // Restaurado. Aplicado ao `sunken-marker-tile` — a elipse que ocupa exatamente o círculo do
  // background, por trás do sprite da construção — em vez de tingir o próprio sprite.
  let waterHeightPct = 0;
  if (flooded && !draining) waterHeightPct = 100;
  else if (draining && state?.drainUpgrade) {
    const totalMs = DISTRICT_DRAIN_COST[id].durationHours * 3600000;
    const remainingMs = state.drainUpgrade.completesAt - Date.now();
    waterHeightPct = Math.max(0, Math.min(100, (remainingMs / totalMs) * 100));
  }

  const pos = MARKER_POSITIONS[id];

  return (
    <div
      onClick={() => { AudioManager.getInstance().playClick(); onClick(id); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`${DISTRICT_NAMES[id]} — ${flooded && !draining ? 'Alagado' : draining ? `Drenando (${drainCountdown})` : `Restaurado ${restorationLevel === 1 ? 'I' : restorationLevel === 2 ? 'II' : 'III'}`}`}
      className="sunken-marker-wrap"
      style={{
        position: 'absolute', top: `${pos.top}%`, left: `${pos.left}%`,
        width: `${DISTRICT_TILE_SIZE.width}%`, height: `${DISTRICT_TILE_SIZE.height}%`,
        transform: 'translate(-50%, -50%)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Quadrado (não elíptico como o wrap) baseado na menor dimensão dele — o corte de
          `EvolutionSprite` assume uma área quadrada (mesmo grid 2x2 da spritesheet); num box
          esticado, a arte fica espremida e a parte de cima de estruturas altas acaba cortada
          pelo `overflow: hidden`. `height: 78%` (do wrap) + `aspect-ratio: 1` mantém o quadrado
          mesmo com o wrap virando elipse em telas de proporções diferentes. */}
      <div className="sunken-marker-icon-box" style={{
        position: 'relative', zIndex: 0, height: '78%', aspectRatio: '1', width: 'auto',
        borderRadius: 'var(--radius-lg)',
        background: hasArt ? 'transparent' : 'linear-gradient(155deg, var(--surface-3), var(--surface-2))',
        border: hasArt ? 'none' : '2px solid rgba(255,255,255,0.15)',
        transform: highlighted ? 'scale(1.08)' : 'scale(1)',
        transition: 'transform 0.15s ease',
        overflow: 'hidden',
      }}>
        <EvolutionSprite
          src={SUNKEN_BUILDING_SPRITE_SRC[id]}
          level={restorationLevel}
          maxLevel={3}
          fallbackIcon={DISTRICT_ICONS[id]}
          fallbackClassName="sunken-marker-icon"
          onResolvedChange={setHasArt}
        />
        {!flooded && (
          <span style={{
            position: 'absolute', bottom: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#a5f3fc',
            fontSize: '0.55rem', fontFamily: 'var(--font-mono)', padding: '0 3px', borderRadius: '4px',
          }}>
            {assignedCount}/{slots}
          </span>
        )}
      </div>

      {/* Alagamento — elipse que preenche o wrap inteiro (mesma % do container que o círculo do
          background esticado), então acompanha exatamente a clareira, com transparência para o
          fundo continuar visível por baixo. Fica NA FRENTE do sprite (zIndex acima do
          sunken-marker-icon-box) para cobrir visualmente a parte de baixo da estrutura quando
          alagado — sem isso, o sprite sempre aparecia por cima da água. */}
      <div
        className="sunken-marker-tile"
        style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}
      >
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: `${waterHeightPct}%`,
          background: 'linear-gradient(180deg, rgba(6,38,58,0.72), rgba(2,14,22,0.88))',
          transition: 'height 2s linear',
        }} />
      </div>

      {/* Anel suave e pulsante indicando o distrito da sub-aba atualmente aberta — mesmo papel do
          `.citadel-marker-ring` (âmbar) da Cidadela normal, só que azul, mais discreto que o
          contorno sólido usado antes aqui. */}
      {active && (
        <span style={{
          position: 'absolute', inset: '-6px', borderRadius: '999px', border: '1px solid rgba(34,211,238,0.45)',
          animation: 'sunken-marker-active-pulse 2.4s ease-out infinite', pointerEvents: 'none', zIndex: 2,
        }} />
      )}

      {eligibleForAllocation && (
        <span style={{
          position: 'absolute', inset: '-8px', borderRadius: '999px', border: '2px solid #4ade80',
          animation: 'submersa-marker-pulse 1.1s ease-out infinite', pointerEvents: 'none', zIndex: 2,
        }} />
      )}

      {/* Fora do fluxo do wrap (não afeta a centralização acima) e com z-index bem maior que o
          tile, para o nome nunca ficar escondido atrás do efeito de alagamento. */}
      <span
        className="sunken-marker-label"
        style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', zIndex: 5, color: flooded ? 'rgba(255,255,255,0.7)' : '#fff' }}
      >
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

  // Espelha a sub-aba ativa da Cidadela Submersa (estado vive em GameUI.tsx, fora desta árvore de
  // componentes) para destacar visualmente o distrito correspondente ao painel aberto — mesmo
  // padrão de `CitadelSpriteStage.tsx` com `CITADEL_SUBTAB_CHANGED`.
  const [activeSubTab, setActiveSubTab] = useState<DistrictId | 'echoes'>('dock');
  useEffect(() => {
    const unsubscribe = bridge.subscribe(GameEvent.SUNKEN_SUBTAB_CHANGED, (payload: any) => {
      if (payload?.subTab) setActiveSubTab(payload.subTab);
    });
    return () => unsubscribe();
  }, []);

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
        /* Anel do distrito ativo — mesma curva/duração do anel de prédio construído (âmbar) da
           Cidadela normal, só que azul: mais lento e discreto que o pulso de elegibilidade acima. */
        @keyframes sunken-marker-active-pulse {
          0% { opacity: 0.7; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.18); }
        }
        .sunken-marker-icon { font-size: 2.1rem; }
        .sunken-marker-label {
          display: inline-block; margin-top: 0.4rem; padding: 0.15rem 0.5rem;
          border-radius: var(--radius-pill, 999px); background: rgba(0,0,0,0.6);
          border: 1px solid var(--border-subtle, rgba(255,255,255,0.15));
          font-family: var(--font-mono); font-size: 0.62rem; font-weight: 700; white-space: nowrap;
        }
        @media (max-width: 840px) {
          .sunken-marker-icon { font-size: 1.3rem; }
          .sunken-marker-label { font-size: 0.5rem; padding: 0.08rem 0.35rem; margin-top: 0.25rem; }
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
          active={id === activeSubTab}
          onClick={handleDistrictClick}
        />
      ))}
    </div>
  );
};
